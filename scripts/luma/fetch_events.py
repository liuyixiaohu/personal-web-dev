"""Fetch Bay Area tech/AI events from Luma API.

Writes data/luma_events.json as an in-CI intermediate (gitignored).
The companion script scripts/merge_events.py reads it together with
data/seen_events.json — the persistent "what we've already seen" state —
and produces public/data/events.json with only today's net-new events.
"""

import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from common import load_seen_events, stamp_first_seen, save_events, request_with_retry, merge_into
from event_geography import bay_area_rejection_reason, extract_geo

# --- Configuration ---
# Bay Area Luma categories. The Luma API filters by the `slug` query param,
# NOT by `category_api_id` (which is silently ignored — verified by probing
# 4 different cat-ids and getting identical results). Slugs come from the
# luma.com/{slug} URL pattern (e.g. luma.com/food → slug "food").
GEO_SF = {"geo_latitude": 37.7749, "geo_longitude": -122.4194}
SF_DISCOVER_PLACE_API_ID = "discplace-BDj7GNbGlsF7Cka"
SOURCES = [
    {"slug": "tech",     "label": "Tech Events (Bay Area)",          "pagination_limit": 50, **GEO_SF},
    {"slug": "ai",       "label": "AI Events (Bay Area)",            "pagination_limit": 50, **GEO_SF},
]
MAX_PAGES = 50  # effectively unlimited; stops when API returns has_more=false
REQUEST_DELAY = 1.0
EMPTY_RESPONSE_RETRIES = 2
EMPTY_RESPONSE_RETRY_DELAY = 2.0
DATA_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "luma_events.json"
SEEN_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "seen_events.json"

BASE_URL = os.environ.get("LUMA_API_URL", "")


# --- Fetch & normalize ---


def fetch_category_events(source: dict) -> list[dict]:
    all_entries: list[dict] = []
    cursor = None

    for page in range(MAX_PAGES):
        params = {
            "slug": source["slug"],
            "pagination_limit": source["pagination_limit"],
            "geo_latitude": source["geo_latitude"],
            "geo_longitude": source["geo_longitude"],
        }
        if cursor:
            params["pagination_cursor"] = cursor

        data = None
        entries = []
        for empty_attempt in range(EMPTY_RESPONSE_RETRIES + 1):
            resp = request_with_retry(
                f"{BASE_URL}/discover/get-paginated-events", params=params, page=page
            )
            data = resp.json()
            entries = data.get("entries", [])
            if not isinstance(entries, list):
                raise RuntimeError(f"{source['label']} returned a malformed entries payload")
            if entries or page > 0:
                break
            if empty_attempt < EMPTY_RESPONSE_RETRIES:
                print(
                    f"  Retry {source['label']} after empty first page "
                    f"({empty_attempt + 1}/{EMPTY_RESPONSE_RETRIES})"
                )
                time.sleep(EMPTY_RESPONSE_RETRY_DELAY)

        if page == 0 and not entries:
            raise RuntimeError(
                f"{source['label']} returned no events after "
                f"{EMPTY_RESPONSE_RETRIES + 1} attempts"
            )

        all_entries.extend(entries)

        assert data is not None
        if not data.get("has_more", False):
            break
        cursor = data.get("next_cursor")
        if not cursor:
            break

        time.sleep(REQUEST_DELAY)

    return all_entries


def verify_discover_place() -> None:
    """Fail closed if Luma no longer recognizes the configured SF place."""
    resp = request_with_retry(
        f"{BASE_URL}/discover/get-paginated-events",
        params={
            "discover_place_api_id": SF_DISCOVER_PLACE_API_ID,
            "pagination_limit": 1,
        },
    )
    entries = resp.json().get("entries", [])
    if not entries:
        raise RuntimeError(
            f"San Francisco discover place {SF_DISCOVER_PLACE_API_ID} returned no events"
        )
    geo = extract_geo(entries[0].get("event", {}))
    reason = bay_area_rejection_reason(geo)
    if reason:
        raise RuntimeError(
            f"San Francisco discover place {SF_DISCOVER_PLACE_API_ID} failed validation: {reason}"
        )


def normalize_event(raw_entry: dict) -> dict:
    event = raw_entry.get("event", {})
    calendar = raw_entry.get("calendar", {})
    hosts = raw_entry.get("hosts", [])
    geo = event.get("geo_address_info") or {}
    ticket_info = raw_entry.get("ticket_info") or {}
    price = ticket_info.get("price")
    structured_geo = extract_geo(event)

    return {
        "api_id": event.get("api_id", raw_entry.get("api_id", "")),
        "name": event.get("name", ""),
        "url": f"https://lu.ma/{event['url']}" if event.get("url") else "",
        "start_at": event.get("start_at", ""),
        "end_at": event.get("end_at", ""),
        "timezone": event.get("timezone", ""),
        "location": geo.get("city_state", geo.get("city", "")),
        "geo": structured_geo,
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

    # --- Load persistent seen-events state for first_seen_at preservation ---
    seen_map, _ = load_seen_events(SEEN_FILE)
    print(f"Previous state: {len(seen_map)} seen events")

    # Luma ignores category filters when discover_place_api_id is combined
    # with them, so verify the canonical SF place separately. Category feeds
    # keep their slug and geo bias, then the local validator enforces the
    # actual nine-county boundary before any event is merged or written.
    print(f"Verifying San Francisco discover place: {SF_DISCOVER_PLACE_API_ID}")
    verify_discover_place()

    # --- Fetch current events ---
    merged: dict[str, dict] = {}
    failures: list[str] = []

    for source in SOURCES:
        print(f"Fetching: {source['label']} (slug={source['slug']})")
        try:
            raw_entries = fetch_category_events(source)
            events = [normalize_event(e) for e in raw_entries]
            events = [e for e in events if e["api_id"]]
            accepted: list[dict] = []
            for event in events:
                reason = bay_area_rejection_reason(event["geo"])
                if reason:
                    print(
                        f"  Excluded {event['api_id']} ({event['location'] or 'unknown'}): {reason}"
                    )
                else:
                    accepted.append(event)
            print(f"  Geography: accepted {len(accepted)}, excluded {len(events) - len(accepted)}")
            if not accepted:
                raise RuntimeError(
                    f"{source['label']} returned {len(events)} events but none passed "
                    "Bay Area validation"
                )
            merge_into(merged, accepted, source["label"])
        except Exception as e:
            print(f"  ERROR: {e}")
            failures.append(f"{source['slug']}: {e}")

    if failures:
        raise RuntimeError("One or more Luma category fetches failed: " + "; ".join(failures))

    # --- Stamp first_seen_at (preserve from seen state for known events) ---
    stamp_first_seen(merged, seen_map, now_iso)

    current_ids = set(merged.keys())
    new_ids = sorted(current_ids - set(seen_map.keys()))

    all_events = sorted(merged.values(), key=lambda e: e.get("start_at", ""))
    print(f"Total: {len(all_events)} unique events ({len(new_ids)} new)")

    save_events(DATA_FILE, all_events, "", now_iso, new_ids)


if __name__ == "__main__":
    main()
