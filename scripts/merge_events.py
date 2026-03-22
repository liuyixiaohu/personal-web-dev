"""Merge per-source event files into a single events.json.

Discovers all *_events.json files in data/ automatically,
so adding a new source only requires a new fetch script.

Run after all fetch scripts have executed:
  python scripts/luma/fetch_events.py
  python scripts/eventbrite/fetch_events.py
  python scripts/merge_events.py
"""

import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from common import load_old_events, save_events

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "data"
OUTPUT_FILE = OUTPUT_DIR / "events.json"

# Source priority for cross-platform dedup (lower = preferred)
SOURCE_PRIORITY = {"luma": 0, "eventbrite": 1}


def _discover_source_files() -> list[Path]:
    """Find all *_events.json source files (excluding the merged output)."""
    return sorted(
        p for p in DATA_DIR.glob("*_events.json")
        if p.name != OUTPUT_FILE.name
    )


def _load_source(path: Path) -> list[dict]:
    """Load events from a single source file."""
    if not path.exists():
        return []
    try:
        with open(path) as f:
            return json.load(f).get("events", [])
    except (json.JSONDecodeError, KeyError) as e:
        print(f"  Warning: could not read {path.name}: {e}")
        return []


def _dedup_cross_platform(merged: dict[str, dict]) -> set[str]:
    """Find duplicate events across platforms (same name + date).

    Returns set of api_ids to drop, preferring sources with lower priority.
    """
    dedup_key = lambda e: (
        re.sub(r"[^a-z0-9]", "", e.get("name", "").lower()),
        e.get("start_at", "")[:10],
    )

    seen_keys: dict[tuple, str] = {}
    drop_ids: set[str] = set()

    for aid, event in merged.items():
        key = dedup_key(event)
        if not key[0]:
            continue
        if key in seen_keys:
            prev_aid = seen_keys[key]
            prev = merged[prev_aid]
            cur_pri = SOURCE_PRIORITY.get(event.get("source", ""), 99)
            prev_pri = SOURCE_PRIORITY.get(prev.get("source", ""), 99)
            if cur_pri < prev_pri:
                drop_ids.add(prev_aid)
                seen_keys[key] = aid
            else:
                drop_ids.add(aid)
        else:
            seen_keys[key] = aid

    return drop_ids


def main():
    now_iso = datetime.now(timezone.utc).isoformat()

    # Discover source files
    source_files = _discover_source_files()
    if not source_files:
        print("No *_events.json source files found. Nothing to merge.")
        return
    print(f"Discovered {len(source_files)} source(s): {', '.join(p.name for p in source_files)}")

    # Load previous merged output for diff tracking
    old_map, old_updated_at = load_old_events(OUTPUT_FILE)
    old_ids = set(old_map.keys())

    # Merge all sources, dedup by api_id
    merged: dict[str, dict] = {}
    for path in source_files:
        events = _load_source(path)
        for event in events:
            aid = event.get("api_id")
            if aid:
                merged[aid] = event
        print(f"  {path.name}: {len(events)} events")

    # Cross-platform dedup
    drop_ids = _dedup_cross_platform(merged)
    for aid in drop_ids:
        del merged[aid]
    if drop_ids:
        print(f"Cross-platform dedup: removed {len(drop_ids)} duplicate events")

    # Compute new events
    new_ids = sorted(set(merged.keys()) - old_ids)
    all_events = sorted(merged.values(), key=lambda e: e.get("start_at", ""))

    # Strip fields not needed by the frontend to reduce file size
    FRONTEND_FIELDS = {
        "api_id", "name", "url", "start_at", "end_at", "timezone",
        "location", "location_type", "calendar_name", "guest_count",
        "is_free", "price_cents", "price_currency", "categories",
        "first_seen_at", "source",
    }
    trimmed = [{k: v for k, v in e.items() if k in FRONTEND_FIELDS} for e in all_events]

    # Summary by source
    source_counts = Counter(e.get("source", "unknown") for e in trimmed)
    breakdown = " + ".join(f"{c} {s}" for s, c in source_counts.most_common())
    print(f"Merged: {len(trimmed)} events ({breakdown}), {len(new_ids)} new")

    save_events(OUTPUT_FILE, trimmed, old_updated_at, now_iso, new_ids)


if __name__ == "__main__":
    main()
