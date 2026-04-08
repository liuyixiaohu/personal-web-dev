"""Fetch job data from monitor repos and write public/data/jobs.json.

Pulls latest snapshots from:
  - new-position-monitor (17 companies, legacy flat files OR new directory format)
  - tesla_career_monitor (Tesla, directory format with dict-keyed jobs)

Requires GITHUB_TOKEN env var with read access to both repos.
"""

from __future__ import annotations

import base64
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from common import request_with_retry

GITHUB_API = "https://api.github.com"
TOKEN = os.environ.get("GITHUB_TOKEN", "")

# --- Source config ---
NPM_REPO = "liuyixiaohu/new-position-monitor"
NPM_COMPANIES = [
    ("airbnb", "Airbnb", "greenhouse_airbnb.json"),
    ("waymo", "Waymo", "greenhouse_waymo.json"),
    ("nuro", "Nuro", "greenhouse_nuro.json"),
    ("lucidmotors", "Lucid Motors", "greenhouse_lucidmotors.json"),
    ("agilityrobotics", "Agility Robotics", "greenhouse_agilityrobotics.json"),
    ("locusrobotics", "Locus Robotics", "greenhouse_locusrobotics.json"),
    ("fetch", "Fetch Robotics", "greenhouse_fetch.json"),
    ("figure", "Figure AI", "ashby_figure.json"),
    ("amazon", "Amazon", "amazon_amazon.json"),
    ("intel", "Intel", "workday_intel.json"),
    ("bostondynamics", "Boston Dynamics", "workday_bostondynamics.json"),
    ("nvidia", "NVIDIA", "workday_nvidia.json"),
    ("rockwellautomation", "Rockwell Automation", "workday_rockwellautomation.json"),
    ("intuitive", "Intuitive Surgical", "smartrecruiters_intuitive.json"),
    ("adobe", "Adobe", "phenom_adobe.json"),
    ("rivian", "Rivian", "icims_rivian.json"),
]

TESLA_REPO = "liuyixiaohu/tesla_career_monitor"
TESLA_SLUG = "tesla"
TESLA_COMPANY = "Tesla"
TESLA_FILE = "data/tesla/latest.json"

OUTPUT = Path(__file__).resolve().parent.parent / "public" / "console" / "data" / "jobs.json"


def gh_headers() -> dict:
    h = {"Accept": "application/vnd.github.v3+json"}
    if TOKEN:
        h["Authorization"] = f"token {TOKEN}"
    return h


def fetch_file(repo: str, path: str) -> dict | None:
    """Fetch a JSON file from a GitHub repo via the Contents API."""
    url = f"{GITHUB_API}/repos/{repo}/contents/{path}"
    try:
        resp = request_with_retry(url, headers=gh_headers())
        data = resp.json()
        content = base64.b64decode(data["content"])
        return json.loads(content)
    except Exception as e:
        print(f"  Warning: could not fetch {repo}/{path}: {e}")
        return None


def normalize_npm_job(job: dict, slug: str, company: str) -> dict:
    """Normalize a new-position-monitor job to unified format."""
    return {
        "id": f"{slug}_{job['id']}",
        "title": job.get("title", ""),
        "company": company,
        "location": job.get("location", ""),
        "department": job.get("department") or "",
        "url": job.get("url", ""),
        "posted_date": job.get("posted_date") or "",
    }


def normalize_tesla_job(job: dict) -> dict:
    """Normalize a Tesla Monitor job to unified format."""
    return {
        "id": f"{TESLA_SLUG}_{job['id']}",
        "title": job.get("title", "").strip(),
        "company": TESLA_COMPANY,
        "location": job.get("location", ""),
        "department": job.get("department") or "",
        "url": job.get("url", ""),
        "posted_date": job.get("posted_date") or "",
    }


def fetch_npm_jobs() -> list[dict]:
    """Fetch all jobs from new-position-monitor."""
    all_jobs: list[dict] = []
    for slug, company, legacy_file in NPM_COMPANIES:
        # Try new directory format first
        new_path = f"data/{slug}/latest.json"
        data = fetch_file(NPM_REPO, new_path)
        if data and "jobs" in data:
            jobs_raw = data["jobs"]
            if isinstance(jobs_raw, list):
                jobs = [normalize_npm_job(j, slug, company) for j in jobs_raw]
            else:
                # Shouldn't happen for NPM but handle dict format too
                jobs = [normalize_npm_job(j, slug, company) for j in jobs_raw.values()]
            print(f"  {company}: {len(jobs)} jobs (new format)")
            all_jobs.extend(jobs)
            continue

        # Fall back to legacy flat file
        data = fetch_file(NPM_REPO, f"data/{legacy_file}")
        if data and "jobs" in data:
            jobs = [normalize_npm_job(j, slug, company) for j in data["jobs"]]
            print(f"  {company}: {len(jobs)} jobs (legacy format)")
            all_jobs.extend(jobs)
        else:
            print(f"  {company}: no data found")
    return all_jobs


def fetch_tesla_jobs() -> list[dict]:
    """Fetch jobs from Tesla Monitor."""
    data = fetch_file(TESLA_REPO, TESLA_FILE)
    if not data or "jobs" not in data:
        print("  Tesla: no data found")
        return []
    jobs_raw = data["jobs"]
    # Tesla stores jobs as dict keyed by ID
    if isinstance(jobs_raw, dict):
        jobs = [normalize_tesla_job(j) for j in jobs_raw.values()]
    else:
        jobs = [normalize_tesla_job(j) for j in jobs_raw]
    print(f"  Tesla: {len(jobs)} jobs")
    return jobs


def main() -> None:
    if not TOKEN:
        print("Error: GITHUB_TOKEN env var required")
        sys.exit(1)

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Load previous data for first_seen_at tracking
    old_map: dict[str, dict] = {}
    old_updated_at = ""
    if OUTPUT.exists():
        try:
            with open(OUTPUT) as f:
                old_data = json.load(f)
            old_updated_at = old_data.get("updated_at", "")
            old_map = {j["id"]: j for j in old_data.get("jobs", []) if j.get("id")}
        except (json.JSONDecodeError, KeyError) as e:
            print(f"  Warning: could not read {OUTPUT.name}: {e}")

    # Fetch from both sources
    print("Fetching from new-position-monitor...")
    npm_jobs = fetch_npm_jobs()
    print(f"\nFetching from Tesla Monitor...")
    tesla_jobs = fetch_tesla_jobs()

    all_jobs = npm_jobs + tesla_jobs
    print(f"\nTotal: {len(all_jobs)} jobs")

    # Stamp first_seen_at
    new_ids: list[str] = []
    for job in all_jobs:
        jid = job["id"]
        old = old_map.get(jid)
        if old and old.get("first_seen_at"):
            job["first_seen_at"] = old["first_seen_at"]
        else:
            job["first_seen_at"] = now_iso
            new_ids.append(jid)

    # Safety check: don't overwrite non-empty file with 0 jobs
    if len(all_jobs) == 0 and OUTPUT.exists():
        old_count = len(old_map)
        if old_count > 0:
            print(f"Safety: refusing to overwrite {OUTPUT.name} ({old_count} jobs) with 0 jobs.")
            return

    # Sort by company then title
    all_jobs.sort(key=lambda j: (j["company"].lower(), j["title"].lower()))

    output = {
        "updated_at": now_iso,
        "previous_updated_at": old_updated_at,
        "new_job_ids": new_ids,
        "jobs": all_jobs,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nSaved {len(all_jobs)} jobs to {OUTPUT}")
    if new_ids:
        preview = ", ".join(new_ids[:10])
        print(f"New jobs: {preview}{'...' if len(new_ids) > 10 else ''}")


if __name__ == "__main__":
    main()
