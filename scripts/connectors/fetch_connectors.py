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
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup

SITEMAP_URL = "https://claude.com/sitemap.xml"
CONNECTOR_BASE = "https://claude.com/connectors"
DATA_FILE = Path("public/data/connectors.json")
CONNECTOR_PATH_RE = re.compile(r"^https://claude\.com/connectors/([a-z0-9-]+)$")
USER_AGENT = "personal-web-dev/fetch-connectors"
ENRICH_WORKERS = 5
ENRICH_TIMEOUT = 10


def derive_name(slug: str) -> str:
    """Fallback name derivation when the connector page can't be fetched.

    Turns "adobe-experience-manager" into "Adobe Experience Manager" by
    title-casing each hyphen-separated part. Acronyms ("aws" → "Aws") get
    mangled — that's why `enrich` (below) is the primary path; this is the
    last-resort fallback.
    """
    SMALL = {"for", "and", "of", "to"}
    parts = slug.split("-")
    return " ".join(p if p in SMALL else p[:1].upper() + p[1:] for p in parts)


def enrich(slug: str) -> tuple[str, str] | None:
    """Fetch the connector's own page and return (display_name, description).

    Pulls the name from <h1> (cleanest source — "ZoomInfo", "AWS Marketplace")
    and the description from <meta name="description">. Returns None on any
    network or parse failure; the caller should fall back to derive_name.
    """
    try:
        resp = requests.get(
            f"{CONNECTOR_BASE}/{slug}",
            headers={"User-Agent": USER_AGENT},
            timeout=ENRICH_TIMEOUT,
        )
        resp.raise_for_status()
    except requests.RequestException:
        return None
    soup = BeautifulSoup(resp.text, "html.parser")
    h1 = soup.find("h1")
    md = soup.find("meta", attrs={"name": "description"})
    name = h1.get_text(strip=True) if h1 else ""
    desc = md.get("content", "").strip() if md else ""
    if not name:
        return None
    return name, desc


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


def enrich_missing(connectors: list[dict[str, Any]]) -> int:
    """Enrich any connector whose description is empty.

    Once an entry has a description, it's never re-fetched — so this is
    cheap on steady-state runs (only new connectors need it) and only
    expensive on the initial seed. Returns the number of entries enriched.
    """
    targets = [c for c in connectors if not c.get("description")]
    if not targets:
        return 0
    print(f"Enriching {len(targets)} connector(s)...", flush=True)
    enriched = 0
    with ThreadPoolExecutor(max_workers=ENRICH_WORKERS) as pool:
        futures = {pool.submit(enrich, c["id"]): c for c in targets}
        for fut in as_completed(futures):
            entry = futures[fut]
            result = fut.result()
            if result is None:
                continue
            entry["name"], entry["description"] = result
            enriched += 1
    print(f"Enriched {enriched}/{len(targets)}.", flush=True)
    return enriched


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
    enrich_missing(merged["connectors"])

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
