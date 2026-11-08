"""Build public/data/events.json from today's Luma fetch + persistent state.

Reads:
  - data/luma_events.json  (today's raw fetch — in-CI intermediate, gitignored)
  - data/seen_events.json  (committed state: api_id -> first_seen_at / end_at)
  - public/data/events.json  (yesterday's output and cached summaries)

Writes:
  - public/data/events.json  (the full current Luma catalog, not only net-new)
  - data/seen_events.json  (updated state; past events pruned weekly)

The fetch is already the live catalog. Publishing that catalog is enough:
events Luma no longer returns are omitted, rather than kept as history.
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
    "geo",
    "is_free", "price_cents", "price_currency", "categories",
    "first_seen_at",
    "host_names",
    "summary", "summary_source_hash", "summary_checked_at",
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

    # previous_updated_at is carried forward so a later run can still tell
    # which events were first seen on the previous check.
    old_map, prev_updated_at = load_old_events(OUTPUT_FILE)

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

    for aid, event in merged.items():
        prior = seen_map.get(aid, {})
        first_seen = event.get("first_seen_at") or prior.get("first_seen_at") or now_iso
        event["first_seen_at"] = first_seen
        seen_map[aid] = {
            "first_seen_at": first_seen,
            "end_at": event.get("end_at"),
        }
        previous = old_map.get(aid, {})
        for field in ("summary", "summary_source_hash", "summary_checked_at"):
            if field in previous:
                event[field] = previous[field]

    catalog = sorted(merged.values(), key=lambda e: e.get("start_at", ""))
    trimmed = [{k: v for k, v in e.items() if k in FRONTEND_FIELDS} for e in catalog]

    print(f"Output: {len(trimmed)} current events ({len(new_ids)} new)")

    # An empty catalog over a non-empty file is a failed fetch, not a real
    # "Luma listed nothing" day. Keep yesterday's file and do not touch seen state.
    if not save_events(
        OUTPUT_FILE,
        trimmed,
        prev_updated_at,
        now_iso,
        new_ids,
    ):
        raise RuntimeError(
            "Refusing to replace the current catalog with an empty fetch"
        )

    if _should_prune(last_pruned_at, now):
        pruned = prune_past_events(seen_map, now, keep=set(merged.keys()))
        print(f"  Weekly prune: dropped {pruned} past events from state")
        last_pruned_at = now_iso

    save_seen_events(SEEN_FILE, seen_map, last_pruned_at)


if __name__ == "__main__":
    main()
