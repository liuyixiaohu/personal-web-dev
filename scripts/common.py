"""Shared utilities for event fetch/merge scripts."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


def load_old_events(data_file: Path) -> tuple[dict[str, dict], str]:
    """Read an existing events JSON file and return (old_map, old_updated_at).

    old_map is keyed by api_id so callers can preserve first_seen_at timestamps.
    Returns empty dict and empty string if the file doesn't exist or is invalid.
    """
    if not data_file.exists():
        return {}, ""
    try:
        with open(data_file) as f:
            data = json.load(f)
        old_updated_at = data.get("updated_at", "")
        old_map = {e["api_id"]: e for e in data.get("events", []) if e.get("api_id")}
        return old_map, old_updated_at
    except (json.JSONDecodeError, KeyError) as e:
        print(f"  Warning: could not read {data_file.name}: {e}")
        return {}, ""


def stamp_first_seen(
    merged: dict[str, dict],
    old_map: dict[str, dict],
    now_iso: str,
) -> None:
    """Copy first_seen_at from old data or set it to now_iso for new events."""
    for aid, event in merged.items():
        old_entry = old_map.get(aid)
        if old_entry and old_entry.get("first_seen_at"):
            event["first_seen_at"] = old_entry["first_seen_at"]
        else:
            event["first_seen_at"] = now_iso


def save_events(
    data_file: Path,
    all_events: list[dict],
    old_updated_at: str,
    now_iso: str,
    new_ids: list[str],
    *,
    min_events: int = 1,
) -> None:
    """Write events JSON with a zero-event safety check.

    Refuses to overwrite a non-empty file with 0 events, which would
    indicate a fetch failure rather than a genuine empty result.
    """
    if len(all_events) < min_events and data_file.exists():
        old_count = 0
        try:
            with open(data_file) as f:
                old_count = len(json.load(f).get("events", []))
        except Exception:
            pass
        if old_count > 0:
            print(
                f"  Safety: refusing to overwrite {data_file.name} "
                f"({old_count} events) with {len(all_events)} events. "
                f"This looks like a fetch failure."
            )
            return

    output = {
        "updated_at": now_iso,
        "previous_updated_at": old_updated_at,
        "new_event_ids": new_ids,
        "events": all_events,
    }

    data_file.parent.mkdir(parents=True, exist_ok=True)
    with open(data_file, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Saved {len(all_events)} events to {data_file}")
    if new_ids:
        print(f"New events: {', '.join(new_ids[:10])}{'...' if len(new_ids) > 10 else ''}")
