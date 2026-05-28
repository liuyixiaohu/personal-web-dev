"""Build public/data/events.json from today's Luma fetch + persistent state.

Reads:
  - data/luma_events.json  (today's raw fetch — in-CI intermediate, gitignored)
  - data/seen_events.json  (committed state: api_id -> first_seen_at / end_at)
  - public/data/events.json  (yesterday's output, only to carry previous_updated_at)

Writes:
  - public/data/events.json  (only today's net-new events)
  - data/seen_events.json  (updated state; past events pruned weekly)
"""

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (
    load_old_events,
    load_seen_events,
    save_events,
    save_seen_events,
    prune_past_events,
)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SOURCE_FILE = DATA_DIR / "luma_events.json"
SEEN_FILE = DATA_DIR / "seen_events.json"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "data"
OUTPUT_FILE = OUTPUT_DIR / "events.json"

PRUNE_INTERVAL = timedelta(days=7)

FRONTEND_FIELDS = {
    "api_id", "name", "url", "start_at", "end_at", "timezone",
    "location", "location_type", "calendar_name", "guest_count",
    "is_free", "price_cents", "price_currency", "categories",
    "first_seen_at",
    "host_names",
}


def _load_source(path: Path) -> list[dict]:
    if not path.exists():
        return []
    try:
        with open(path) as f:
            return json.load(f).get("events", [])
    except (json.JSONDecodeError, KeyError) as e:
        print(f"  Warning: could not read {path.name}: {e}")
        return []


def _should_prune(last_pruned_at: str, now: datetime) -> bool:
    if not last_pruned_at:
        return True
    try:
        last_dt = datetime.fromisoformat(last_pruned_at.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return True
    return now - last_dt >= PRUNE_INTERVAL


def main():
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    # previous_updated_at is the only thing we need from yesterday's output —
    # the frontend uses it to filter "first_seen_at > previous_updated_at".
    _, prev_updated_at = load_old_events(OUTPUT_FILE)

    seen_map, last_pruned_at = load_seen_events(SEEN_FILE)
    seen_ids = set(seen_map.keys())

    raw_events = _load_source(SOURCE_FILE)
    print(f"  {SOURCE_FILE.name}: {len(raw_events)} events")

    merged: dict[str, dict] = {}
    for event in raw_events:
        aid = event.get("api_id")
        if aid:
            merged[aid] = event

    new_ids = sorted(set(merged.keys()) - seen_ids)
    new_events = sorted(
        (merged[aid] for aid in new_ids),
        key=lambda e: e.get("start_at", ""),
    )
    trimmed_new = [{k: v for k, v in e.items() if k in FRONTEND_FIELDS} for e in new_events]

    print(f"Output: {len(trimmed_new)} new events (out of {len(merged)} fetched)")

    save_events(
        OUTPUT_FILE,
        trimmed_new,
        prev_updated_at,
        now_iso,
        new_ids,
        min_events=0,
    )

    for aid in new_ids:
        seen_map[aid] = {
            "first_seen_at": now_iso,
            "end_at": merged[aid].get("end_at"),
        }

    if _should_prune(last_pruned_at, now):
        pruned = prune_past_events(seen_map, now)
        print(f"  Weekly prune: dropped {pruned} past events from state")
        last_pruned_at = now_iso

    save_seen_events(SEEN_FILE, seen_map, last_pruned_at)


if __name__ == "__main__":
    main()
