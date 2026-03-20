"""Fetch Bay Area tech events from Eventbrite search pages.

Scrapes Eventbrite's search result pages, parses the embedded
window.__SERVER_DATA__ JSON, and normalizes events to match the Luma
format used by events.json.  Tracks new/returning events via
first_seen_at timestamps and outputs a diff-friendly JSON file.
"""

from __future__ import annotations

import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import requests

# --- Configuration ---
CITIES = [
    {"slug": "ca--san-francisco", "label": "San Francisco"},
    {"slug": "ca--san-jose", "label": "San Jose"},
    {"slug": "ca--oakland", "label": "Oakland"},
]
CATEGORY = "tech--events"
URL_TEMPLATE = "https://www.eventbrite.com/d/{city}/{category}/?page={page}"
MAX_PAGES = 50  # effectively unlimited; stops when no more results
REQUEST_DELAY = 2.0
DATA_FILE = (
    Path(__file__).resolve().parent.parent.parent / "public" / "data" / "eventbrite_events.json"
)

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
SERVER_DATA_RE = re.compile(r"window\.__SERVER_DATA__\s*=\s*({.+?});\s*$", re.DOTALL | re.MULTILINE)

MAX_RETRIES = 1
RETRY_BACKOFF = 2.0


# --- HTTP helpers ---


def _request_with_retry(url: str, page: int) -> str:
    """Fetch a page's HTML, retrying once on transient/server errors."""
    headers = {"User-Agent": USER_AGENT}
    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = requests.get(url, headers=headers, timeout=30)
            resp.raise_for_status()
            return resp.text
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
            if attempt < MAX_RETRIES:
                print(f"  Retry page {page} after transient error: {e}")
                time.sleep(RETRY_BACKOFF)
            else:
                raise
        except requests.exceptions.HTTPError as e:
            status = e.response.status_code if e.response is not None else 0
            if status >= 500 and attempt < MAX_RETRIES:
                print(f"  Retry page {page} after server error {status}")
                time.sleep(RETRY_BACKOFF)
            else:
                raise
    return ""


def _parse_server_data(html: str) -> dict | None:
    """Extract and parse window.__SERVER_DATA__ from the HTML."""
    match = SERVER_DATA_RE.search(html)
    if not match:
        return None
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError:
        return None


# --- Fetch & normalize ---


def _to_iso(date_str: str, time_str: str, tz_name: str) -> str:
    """Combine date, time, and timezone into an ISO 8601 datetime string.

    Example: ("2026-04-02", "19:00", "America/Los_Angeles")
             -> "2026-04-02T19:00:00-07:00"
    """
    if not date_str or not time_str:
        return ""
    try:
        tz = ZoneInfo(tz_name) if tz_name else ZoneInfo("UTC")
        naive = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        aware = naive.replace(tzinfo=tz)
        return aware.isoformat()
    except (ValueError, KeyError):
        return f"{date_str}T{time_str}:00"


def normalize_event(event: dict) -> dict:
    """Map an Eventbrite search result event to the common format."""
    venue = event.get("primary_venue") or {}
    address = venue.get("address") or {}
    tz = event.get("timezone", "America/Los_Angeles")

    return {
        "api_id": f"eb-{event['eid']}",
        "name": event.get("name", ""),
        "url": event.get("url", ""),
        "start_at": _to_iso(event.get("start_date", ""), event.get("start_time", ""), tz),
        "end_at": _to_iso(event.get("end_date", ""), event.get("end_time", ""), tz),
        "timezone": tz,
        "location": address.get("localized_area_display", ""),
        "location_type": "online" if event.get("is_online_event") else "offline",
        "calendar_name": "Eventbrite",
        "host_names": ["Eventbrite"],
        "guest_count": 0,
        "is_free": None,
        "price_cents": None,
        "price_currency": None,
        "categories": [],
        "source": "eventbrite",
    }


def fetch_city_events(city: dict) -> list[dict]:
    """Fetch all tech event pages for a single city."""
    all_events: list[dict] = []

    for page in range(1, MAX_PAGES + 1):
        url = URL_TEMPLATE.format(city=city["slug"], category=CATEGORY, page=page)
        print(f"  Page {page}: {url}")

        html = _request_with_retry(url, page)
        server_data = _parse_server_data(html)

        if server_data is None:
            print(f"  Warning: no __SERVER_DATA__ found on page {page}, skipping")
            break

        try:
            search_data = server_data["search_data"]
            results = search_data["events"]["results"]
            pagination = search_data["events"]["pagination"]
        except KeyError as e:
            print(f"  Warning: unexpected data structure on page {page}: {e}")
            break

        all_events.extend(results)

        page_count = pagination.get("page_count", 1)
        page_number = pagination.get("page_number", 1)

        if page_number >= page_count:
            break

        time.sleep(REQUEST_DELAY)

    return all_events


# --- Pipeline ---


def _load_old_events() -> tuple[dict[str, dict], str]:
    """Read existing eventbrite_events.json and return (old_map, old_updated_at).

    old_map is keyed by api_id so we can preserve first_seen_at timestamps.
    Returns empty dict and empty string if the file doesn't exist or is invalid.
    """
    if not DATA_FILE.exists():
        return {}, ""
    try:
        with open(DATA_FILE) as f:
            data = json.load(f)
        old_updated_at = data.get("updated_at", "")
        old_map = {e["api_id"]: e for e in data.get("events", []) if e.get("api_id")}
        return old_map, old_updated_at
    except (json.JSONDecodeError, KeyError) as e:
        print(f"  Warning: could not read old eventbrite_events.json: {e}")
        return {}, ""


def main() -> None:
    now_iso = datetime.now(timezone.utc).isoformat()

    # --- Load previous data for diff ---
    old_map, old_updated_at = _load_old_events()
    old_ids = set(old_map.keys())
    print(f"Previous run: {len(old_ids)} events (updated {old_updated_at or 'never'})")

    # --- Fetch current events ---
    merged: dict[str, dict] = {}

    for city in CITIES:
        print(f"Fetching: {city['label']} ({city['slug']})")
        try:
            raw_events = fetch_city_events(city)
            events = [normalize_event(e) for e in raw_events]
            events = [e for e in events if e["api_id"]]

            for event in events:
                aid = event["api_id"]
                if aid in merged:
                    cats = merged[aid].get("categories", [])
                    if city["label"] not in cats:
                        cats.append(city["label"])
                        merged[aid]["categories"] = cats
                else:
                    event["categories"] = [city["label"]]
                    merged[aid] = event

            print(f"  {len(events)} events fetched")
        except Exception as e:
            print(f"  ERROR: {e}")
            continue

    # --- Stamp first_seen_at & compute diff ---
    for aid, event in merged.items():
        old_entry = old_map.get(aid)
        if old_entry and old_entry.get("first_seen_at"):
            event["first_seen_at"] = old_entry["first_seen_at"]
        else:
            event["first_seen_at"] = now_iso

    current_ids = set(merged.keys())
    new_ids = sorted(current_ids - old_ids)

    all_events = sorted(merged.values(), key=lambda e: e.get("start_at", ""))
    print(f"Total: {len(all_events)} unique events ({len(new_ids)} new)")

    output = {
        "updated_at": now_iso,
        "previous_updated_at": old_updated_at,
        "new_event_ids": new_ids,
        "events": all_events,
    }

    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Saved {len(all_events)} events to {DATA_FILE}")
    if new_ids:
        print(f"New events: {', '.join(new_ids[:10])}{'...' if len(new_ids) > 10 else ''}")


if __name__ == "__main__":
    main()
