"""Fetch Bay Area tech/AI events from Luma API and save for the website.

Tracks which events are new since the last fetch by reading the existing
events.json before overwriting it. Each event gets a `first_seen_at`
timestamp, and the output includes a `new_event_ids` array listing events
that did not exist in the previous run.
"""

import json
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

# --- Configuration ---
SOURCES = [
    {
        "category": "cat-tech",
        "label": "Tech Events (Bay Area)",
        "geo_latitude": 37.7749,
        "geo_longitude": -122.4194,
        "pagination_limit": 50,
    },
    {
        "category": "cat-ai",
        "label": "AI Events (Bay Area)",
        "geo_latitude": 37.7749,
        "geo_longitude": -122.4194,
        "pagination_limit": 50,
    },
]
MAX_PAGES = 5
REQUEST_DELAY = 1.0
DATA_FILE = Path(__file__).resolve().parent.parent.parent / "public" / "data" / "events.json"

BASE_URL = "https://api.lu.ma"
MAX_RETRIES = 1
RETRY_BACKOFF = 2.0


# --- HTTP helpers ---


def _request_with_retry(url: str, params: dict, page: int) -> dict:
    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = requests.get(url, params=params, timeout=30)
            resp.raise_for_status()
            return resp.json()
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
    return {}


# --- Fetch & normalize ---


def fetch_category_events(source: dict) -> list[dict]:
    all_entries: list[dict] = []
    cursor = None

    for page in range(MAX_PAGES):
        params = {
            "category_api_id": source["category"],
            "pagination_limit": source["pagination_limit"],
            "geo_latitude": source["geo_latitude"],
            "geo_longitude": source["geo_longitude"],
        }
        if cursor:
            params["pagination_cursor"] = cursor

        data = _request_with_retry(
            f"{BASE_URL}/discover/get-paginated-events", params, page
        )

        entries = data.get("entries", [])
        all_entries.extend(entries)

        if not data.get("has_more", False):
            break
        cursor = data.get("next_cursor")
        if not cursor:
            break

        time.sleep(REQUEST_DELAY)

    return all_entries


def normalize_event(raw_entry: dict) -> dict:
    event = raw_entry.get("event", {})
    calendar = raw_entry.get("calendar", {})
    hosts = raw_entry.get("hosts", [])
    geo = event.get("geo_address_info") or {}
    ticket_info = raw_entry.get("ticket_info") or {}
    price = ticket_info.get("price")

    return {
        "api_id": event.get("api_id", raw_entry.get("api_id", "")),
        "name": event.get("name", ""),
        "url": f"https://lu.ma/{event['url']}" if event.get("url") else "",
        "start_at": event.get("start_at", ""),
        "end_at": event.get("end_at", ""),
        "timezone": event.get("timezone", ""),
        "location": geo.get("city_state", geo.get("city", "")),
        "location_type": event.get("location_type", ""),
        "calendar_name": calendar.get("name", ""),
        "host_names": [h.get("name", "") for h in hosts if h.get("name")],
        "guest_count": raw_entry.get("guest_count", 0),
        "is_free": ticket_info.get("is_free", True),
        "price_cents": price.get("cents") if price else None,
        "price_currency": price.get("currency", "usd") if price else None,
    }


# --- Pipeline ---


def _load_old_events() -> tuple[dict[str, dict], str]:
    """Read existing events.json and return (old_map, old_updated_at).

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
        print(f"  Warning: could not read old events.json: {e}")
        return {}, ""


def main() -> None:
    now_iso = datetime.now(timezone.utc).isoformat()

    # --- Load previous data for diff ---
    old_map, old_updated_at = _load_old_events()
    old_ids = set(old_map.keys())
    print(f"Previous run: {len(old_ids)} events (updated {old_updated_at or 'never'})")

    # --- Fetch current events ---
    merged: dict[str, dict] = {}

    for source in SOURCES:
        print(f"Fetching: {source['label']} (category={source['category']})")
        try:
            raw_entries = fetch_category_events(source)
            events = [normalize_event(e) for e in raw_entries]
            events = [e for e in events if e["api_id"]]

            for event in events:
                aid = event["api_id"]
                if aid in merged:
                    cats = merged[aid].get("categories", [])
                    if source["label"] not in cats:
                        cats.append(source["label"])
                        merged[aid]["categories"] = cats
                else:
                    event["categories"] = [source["label"]]
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
