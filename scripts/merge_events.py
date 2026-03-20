"""Merge Luma and Eventbrite events into a single events.json.

Run after both fetch scripts have executed:
  python scripts/luma/fetch_events.py
  python scripts/eventbrite/fetch_events.py
  python scripts/merge_events.py
"""

import json
import re
from datetime import datetime, timezone
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "public" / "data"
LUMA_FILE = DATA_DIR / "luma_events.json"
EB_FILE = DATA_DIR / "eventbrite_events.json"
OUTPUT_FILE = DATA_DIR / "events.json"

def load_events(path: Path) -> dict:
    if not path.exists():
        return {"events": [], "updated_at": "", "previous_updated_at": "", "new_event_ids": []}
    with open(path) as f:
        return json.load(f)

def main():
    # Load both sources
    luma_data = load_events(LUMA_FILE)
    eb_data = load_events(EB_FILE)

    # Read existing merged output for diff tracking
    # We need to know what was in the PREVIOUS merged output
    # to compute new_event_ids correctly
    old_merged = load_events(OUTPUT_FILE)
    old_ids = {e["api_id"] for e in old_merged.get("events", []) if e.get("api_id")}
    old_updated_at = old_merged.get("updated_at", "")

    # Merge events, dedup by api_id (Luma first, then Eventbrite)
    merged = {}
    for event in luma_data.get("events", []):
        merged[event["api_id"]] = event
    for event in eb_data.get("events", []):
        merged[event["api_id"]] = event

    # Cross-platform dedup: if same event name + same date exists on both
    # Luma and Eventbrite, keep the Luma version (richer data).
    _dedup_key = lambda e: (
        re.sub(r"[^a-z0-9]", "", e.get("name", "").lower()),
        e.get("start_at", "")[:10],  # compare date only
    )
    seen_keys = {}
    drop_ids = set()
    for aid, event in merged.items():
        key = _dedup_key(event)
        if key[0] and key in seen_keys:
            prev_aid = seen_keys[key]
            prev = merged[prev_aid]
            # Keep Luma, drop Eventbrite
            if event.get("source") == "eventbrite" and prev.get("source") == "luma":
                drop_ids.add(aid)
            elif event.get("source") == "luma" and prev.get("source") == "eventbrite":
                drop_ids.add(prev_aid)
                seen_keys[key] = aid
        else:
            seen_keys[key] = aid

    for aid in drop_ids:
        del merged[aid]
    if drop_ids:
        print(f"Cross-platform dedup: removed {len(drop_ids)} duplicate Eventbrite events")

    # Compute new events
    current_ids = set(merged.keys())
    new_ids = sorted(current_ids - old_ids)

    now_iso = datetime.now(timezone.utc).isoformat()
    all_events = sorted(merged.values(), key=lambda e: e.get("start_at", ""))

    output = {
        "updated_at": now_iso,
        "previous_updated_at": old_updated_at,
        "new_event_ids": new_ids,
        "events": all_events,
    }

    with open(OUTPUT_FILE, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    luma_count = sum(1 for e in all_events if e.get("source") == "luma")
    eb_count = sum(1 for e in all_events if e.get("source") == "eventbrite")
    print(f"Merged: {len(all_events)} events ({luma_count} Luma + {eb_count} Eventbrite), {len(new_ids)} new")

if __name__ == "__main__":
    main()
