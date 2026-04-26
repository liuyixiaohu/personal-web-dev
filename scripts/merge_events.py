"""Merge Luma events into a single events.json for the frontend.

Reads data/luma_events.json, preserves previous_updated_at / first_seen_at
timestamps for "new today" filtering, and writes public/data/events.json.

Run after the fetch script:
  python scripts/luma/fetch_events.py
  python scripts/merge_events.py
"""

import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from common import load_old_events, save_events

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SOURCE_FILE = DATA_DIR / "luma_events.json"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "data"
OUTPUT_FILE = OUTPUT_DIR / "events.json"


def _load_source(path: Path) -> list[dict]:
    """Load events from the Luma source file."""
    if not path.exists():
        return []
    try:
        with open(path) as f:
            return json.load(f).get("events", [])
    except (json.JSONDecodeError, KeyError) as e:
        print(f"  Warning: could not read {path.name}: {e}")
        return []


def main():
    now_iso = datetime.now(timezone.utc).isoformat()

    # Load previous merged output for diff tracking
    old_map, old_updated_at = load_old_events(OUTPUT_FILE)
    old_ids = set(old_map.keys())

    # Load Luma events
    events = _load_source(SOURCE_FILE)
    print(f"  {SOURCE_FILE.name}: {len(events)} events")

    # Dedup by api_id
    merged: dict[str, dict] = {}
    for event in events:
        aid = event.get("api_id")
        if aid:
            merged[aid] = event

    # Compute new events
    new_ids = sorted(set(merged.keys()) - old_ids)
    all_events = sorted(merged.values(), key=lambda e: e.get("start_at", ""))

    # Strip fields not needed by the frontend to reduce file size
    FRONTEND_FIELDS = {
        "api_id", "name", "url", "start_at", "end_at", "timezone",
        "location", "location_type", "calendar_name", "guest_count",
        "is_free", "price_cents", "price_currency", "categories",
        "first_seen_at",
        "host_names",  # used by search + exclude filters in EventList.svelte
    }
    trimmed = [{k: v for k, v in e.items() if k in FRONTEND_FIELDS} for e in all_events]

    print(f"Merged: {len(trimmed)} events, {len(new_ids)} new")

    save_events(OUTPUT_FILE, trimmed, old_updated_at, now_iso, new_ids)


if __name__ == "__main__":
    main()
