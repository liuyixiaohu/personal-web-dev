"""Shared utilities for event fetch/merge scripts."""

from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path

import requests


def request_with_retry(
    url: str,
    params: dict | None = None,
    headers: dict | None = None,
    page: int = 0,
    max_retries: int = 1,
    backoff: float = 2.0,
) -> requests.Response:
    """GET *url* with retry on transient and 5xx errors.

    Returns the raw ``requests.Response`` so callers can use ``.json()``
    or ``.text`` as needed.
    """
    for attempt in range(max_retries + 1):
        try:
            resp = requests.get(url, params=params, headers=headers, timeout=30)
            resp.raise_for_status()
            return resp
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
            if attempt < max_retries:
                print(f"  Retry page {page} after transient error: {e}")
                time.sleep(backoff)
            else:
                raise
        except requests.exceptions.HTTPError as e:
            status = e.response.status_code if e.response is not None else 0
            if status >= 500 and attempt < max_retries:
                print(f"  Retry page {page} after server error {status}")
                time.sleep(backoff)
            else:
                raise
    # Unreachable in practice (the last attempt either returns or raises),
    # but keeps mypy happy.
    raise RuntimeError("request_with_retry: exhausted retries without result")


def merge_into(merged: dict[str, dict], events: list[dict], label: str) -> None:
    """Merge *events* into *merged* (keyed by api_id), deduplicating categories.

    For each event, if the api_id already exists the *label* is appended to its
    categories list (unless already present).  Otherwise the event is inserted
    with ``categories=[label]``.

    Prints the number of events merged.
    """
    new_count = 0
    updated_count = 0
    for event in events:
        aid = event["api_id"]
        if aid in merged:
            cats = merged[aid].get("categories", [])
            if label not in cats:
                cats.append(label)
                merged[aid]["categories"] = cats
            updated_count += 1
        else:
            event["categories"] = [label]
            merged[aid] = event
            new_count += 1
    print(f"  {len(events)} events fetched ({new_count} new to merge, {updated_count} duplicates)")


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
