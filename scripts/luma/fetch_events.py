"""Fetch Bay Area tech/AI events from Luma API and save for the website.

Tracks which events are new since the last fetch by reading the existing
events.json before overwriting it. Each event gets a `first_seen_at`
timestamp, and the output includes a `new_event_ids` array listing events
that did not exist in the previous run.
"""

import sys
import time
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from common import load_old_events, stamp_first_seen, save_events, request_with_retry, merge_into

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
MAX_PAGES = 50  # effectively unlimited; stops when API returns has_more=false
REQUEST_DELAY = 1.0
DATA_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "luma_events.json"

BASE_URL = "https://api.lu.ma"


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

        resp = request_with_retry(
            f"{BASE_URL}/discover/get-paginated-events", params=params, page=page
        )
        data = resp.json()

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
        "source": "luma",
    }


# --- Pipeline ---


def main() -> None:
    now_iso = datetime.now(timezone.utc).isoformat()

    # --- Load previous data for diff ---
    old_map, old_updated_at = load_old_events(DATA_FILE)
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
            merge_into(merged, events, source["label"])
        except Exception as e:
            print(f"  ERROR: {e}")
            continue

    # --- Stamp first_seen_at & compute diff ---
    stamp_first_seen(merged, old_map, now_iso)
    # Preserve source from old data (in case it was manually corrected)
    for aid, event in merged.items():
        old_entry = old_map.get(aid)
        if old_entry and old_entry.get("source"):
            event["source"] = old_entry["source"]

    current_ids = set(merged.keys())
    new_ids = sorted(current_ids - old_ids)

    all_events = sorted(merged.values(), key=lambda e: e.get("start_at", ""))
    print(f"Total: {len(all_events)} unique events ({len(new_ids)} new)")

    save_events(DATA_FILE, all_events, old_updated_at, now_iso, new_ids)


if __name__ == "__main__":
    main()
