"""Fetch Bay Area tech events from Eventbrite search pages.

Scrapes Eventbrite's search result pages, parses the embedded
window.__SERVER_DATA__ JSON, and normalizes events to match the Luma
format used by events.json.  Tracks new/returning events via
first_seen_at timestamps and outputs a diff-friendly JSON file.
"""

from __future__ import annotations

import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from common import load_old_events, stamp_first_seen, save_events, request_with_retry, merge_into

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


# --- HTTP helpers ---


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
        "is_free": False,
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

        resp = request_with_retry(
            url, headers={"User-Agent": USER_AGENT}, page=page
        )
        html = resp.text
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


def main() -> None:
    now_iso = datetime.now(timezone.utc).isoformat()

    # --- Load previous data for diff ---
    old_map, old_updated_at = load_old_events(DATA_FILE)
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
            merge_into(merged, events, city["label"])
        except Exception as e:
            print(f"  ERROR: {e}")
            continue

    # --- Stamp first_seen_at & compute diff ---
    stamp_first_seen(merged, old_map, now_iso)

    current_ids = set(merged.keys())
    new_ids = sorted(current_ids - old_ids)

    all_events = sorted(merged.values(), key=lambda e: e.get("start_at", ""))
    print(f"Total: {len(all_events)} unique events ({len(new_ids)} new)")

    save_events(DATA_FILE, all_events, old_updated_at, now_iso, new_ids)


if __name__ == "__main__":
    main()
