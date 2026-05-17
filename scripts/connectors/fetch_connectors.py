#!/usr/bin/env python3
"""Snapshot the Claude Code connector directory and update connectors.json.

Reads `public/data/connectors.json` (if present), pulls the canonical
connector list from claude.com/sitemap.xml, diffs against the stored
snapshot, and writes back an updated file with `first_seen`, `last_seen`,
and `new_connector_ids` fields.

Run from repo root:

    python scripts/connectors/fetch_connectors.py

Style mirrors scripts/luma/fetch_events.py.
"""

from __future__ import annotations

import datetime as dt
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

import requests

SITEMAP_URL = "https://claude.com/sitemap.xml"
DATA_FILE = Path("public/data/connectors.json")
CONNECTOR_PATH_RE = re.compile(r"^https://claude\.com/connectors/([a-z0-9-]+)$")


def derive_name(slug: str) -> str:
    """Turn "adobe-experience-manager" into "Adobe Experience Manager".

    Baseline rule: title-case each hyphen-separated part, except a small
    set of joining words. Known edge cases (acronyms like "aws" → "Aws"
    rather than "AWS") are accepted in v1 — see the TODO below for the
    enrichment path that fixes them at the cost of N+1 requests.
    """
    SMALL = {"for", "and", "of", "to"}
    parts = slug.split("-")
    return " ".join(p if p in SMALL else p[:1].upper() + p[1:] for p in parts)


# --------------- LEARNING-MODE TODO -----------------------------------------
# Right now display names come from slug title-casing (see derive_name above).
# That's fine for "linear" → "Linear" but mangles acronyms ("aws" → "Aws")
# and product casing ("zoominfo" → "Zoominfo" instead of "ZoomInfo").
#
# If you want pretty names + real descriptions, write a function:
#
#     def enrich(slug: str) -> tuple[str, str]:
#         """Fetch https://claude.com/connectors/<slug> and return
#         (display_name, description). Pull from <title> and
#         <meta name="description"> respectively."""
#
# Then call it inside `merge()` only when the entry is brand-new (so old
# entries don't get re-fetched every cron tick — that'd be ~300 requests
# per run instead of just the handful of new ones).
#
# Trade-off:
#   * Skip enrichment  → 1 HTTP request, ~1s total, slug-derived names.
#   * Enrich on add    → +1 request per NEW connector (usually 0-5), pretty
#                         names + descriptions on the /console/connectors
#                         page. Recommended once you've seen v1 ship.
# ----------------------------------------------------------------------------


def fetch_slugs() -> list[str]:
    """Pull connector slugs from the sitemap. Returns sorted unique slugs."""
    resp = requests.get(
        SITEMAP_URL,
        headers={"User-Agent": "personal-web-dev/fetch-connectors"},
        timeout=30,
    )
    resp.raise_for_status()
    root = ET.fromstring(resp.text)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    slugs: set[str] = set()
    for url_elem in root.findall("sm:url", ns):
        loc = url_elem.findtext("sm:loc", default="", namespaces=ns)
        m = CONNECTOR_PATH_RE.match(loc)
        if m:
            slugs.add(m.group(1))
    return sorted(slugs)


def load_existing(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {
            "updated_at": None,
            "previous_updated_at": None,
            "new_connector_ids": [],
            "connectors": [],
        }
    return json.loads(path.read_text())


def merge(old: dict[str, Any], slugs: list[str], now: dt.datetime) -> dict[str, Any]:
    today = now.strftime("%Y-%m-%d")
    old_by_id: dict[str, dict[str, Any]] = {c["id"]: c for c in old.get("connectors", [])}

    merged: list[dict[str, Any]] = []
    new_ids: list[str] = []

    for slug in slugs:
        prev = old_by_id.pop(slug, None)
        if prev:
            merged.append({**prev, "last_seen": today})
        else:
            merged.append({
                "id": slug,
                "name": derive_name(slug),
                "url": f"https://claude.com/connectors/{slug}",
                "description": "",
                "first_seen": today,
                "last_seen": today,
            })
            new_ids.append(slug)

    # Connectors that disappeared upstream — keep them so historical date
    # groups don't mutate. last_seen is whatever it was previously.
    for stale in old_by_id.values():
        merged.append(stale)

    return {
        "updated_at": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "previous_updated_at": old.get("updated_at"),
        "new_connector_ids": new_ids,
        "connectors": merged,
    }


def main() -> int:
    print(f"Fetching {SITEMAP_URL}...", flush=True)
    slugs = fetch_slugs()
    print(f"Found {len(slugs)} connector entries.", flush=True)

    if not slugs:
        print("ERROR: sitemap returned zero connectors — refusing to write.", file=sys.stderr)
        return 1

    old = load_existing(DATA_FILE)
    prior_count = len(old.get("connectors", []))
    if prior_count > 50 and len(slugs) < prior_count // 2:
        print(
            f"ERROR: sitemap returned {len(slugs)} but prior snapshot had "
            f"{prior_count} — refusing to write a likely-broken update.",
            file=sys.stderr,
        )
        return 1

    now = dt.datetime.now(dt.timezone.utc)
    merged = merge(old, slugs, now)

    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(json.dumps(merged, indent=2, ensure_ascii=False) + "\n")
    print(
        f"Wrote {DATA_FILE}: {len(merged['new_connector_ids'])} new this run, "
        f"{len(merged['connectors'])} total.",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
