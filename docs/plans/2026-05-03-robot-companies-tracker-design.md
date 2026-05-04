# Robot Companies Tracker Expansion Design

**Date:** 2026-05-03
**Topic:** Expand the `/console/jobs` tracker to monitor a vetted list of robotics companies, including adding Rippling ATS support.

## Context

The console jobs page consumes `public/console/data/jobs.json`, which is populated by `scripts/fetch_jobs.py` running on a daily GitHub Actions cron. The actual job scraping happens in a separate repo: `liuyixiaohu/new-position-monitor`, which scrapes ATS providers (Greenhouse, Ashby, Lever, Workday, SmartRecruiters, Phenom, iCIMS, Workable, Recruitee, Mobileye) and writes per-company snapshots to `data/<slug>/latest.json`.

User provided a list of 38 well-funded robotics companies and asked to add them to the tracker, with explicit emphasis on identity verification ("avoid monitoring the wrong companies' webpages"). After cross-referencing each company against Caixin, official sites, LinkedIn, and ATS endpoints:

- 4 already tracked: Zipline (#2), Apptronik (#3), Machina Labs (#24), Skydio (#27)
- 11 trackable on existing supported ATS, all verified by hitting the API
- 3 trackable only if Rippling ATS support is added: Mytra (#25), Advanced Navigation (#26), Overland AI (#34)
- 19 Chinese companies that use custom career pages or Boss直聘/牛客/Liepin/Feishu — not addable without writing per-company scrapers
- 1 ambiguous identity: "FAIR" (#31) — could be Fourier Intelligence (傅利叶) or INSPIRE-Robots (因时机器人) or another. User to confirm.

## Decisions

1. **Scope**: add 14 companies (11 ATS-supported + 3 Rippling). Skip 19 Chinese + 1 ambiguous.
2. **Add Rippling support**: write `fetch_rippling()` in monitor repo. Approach: parse `<script id="__NEXT_DATA__">` JSON from the Next.js HTML (no public REST API). Walk to `props.pageProps.dehydratedState.queries[]` and find the query whose `queryKey` contains `'job-posts'`.
3. **Multi-location handling**: prefer US locations when available, fall back to first location otherwise. This optimizes for the existing `companies.yaml` location filter (US-only). Other ATS fetchers do not have this logic because their location field is already a single string.
4. **Identity disambiguation already verified**:
   - Skild AI (Pittsburgh, robot foundation models) ≠ Skydio (San Mateo, drones)
   - Mind Robotics is RJ Scaringe's Rivian spinout (Nov 2025), not "Mind Foundry"
   - Sunday Robotics is Tony Z. Zhao's home humanoid Memo company, not Sunday.com
   - All 8 Ashby slugs verified via GraphQL API returning real job counts
5. **Workflow ordering**: open PR to monitor repo first; wait for merge + first daily run; then commit `fetch_jobs.py` change here. Avoids "no data found" log noise. Both changes are independent enough that swapping the order would still work but produce one day of dirty logs.
6. **Filters left untouched**: monitor repo's `companies.yaml` filter (intern + US) is global. We are not changing it. Companies with no current US-based intern openings (Sereact, Harmattan, RobCo, Vention, Advanced Navigation) will still be tracked but may surface zero results until they post matching roles.

## Architecture

### Changes in `liuyixiaohu/new-position-monitor` (new PR)

```
src/
└── fetchers.py        [modify]  add fetch_rippling() ~35 lines + dispatcher entry
companies.yaml         [modify]  add 14 entries grouped by ATS
```

`fetch_rippling(slug)` flow:
1. GET `https://ats.rippling.com/<slug>/jobs?pageSize=100&page=N` with browser User-Agent
2. Regex-extract `<script id="__NEXT_DATA__">{...}</script>`
3. Parse JSON; walk `props.pageProps.dehydratedState.queries[]`
4. Find query with `'job-posts'` in `queryKey`
5. Read `state.data.items[]`, normalize each to `Job` TypedDict
6. Loop through pages if `state.data.totalPages > 1`

Location strategy (per option C decided with user):
```python
us_loc = next(
    (l["name"] for l in locs if l.get("countryCode") == "US"),
    None,
)
location = us_loc or (locs[0].get("name", "") if locs else "")
```

### Changes in `personal-web-dev/scripts/fetch_jobs.py`

Add 14 tuples to `NPM_COMPANIES` ([line 26](../../scripts/fetch_jobs.py)):
- 2 Greenhouse (Skild AI, RoboForce)
- 8 Ashby (Mind Robotics, Rhoda AI, Bedrock Robotics, Sunday, Lightwheel, Sereact, RobCo, Harmattan AI)
- 1 SmartRecruiters (Vention)
- 3 Rippling (Mytra, Advanced Navigation, Overland AI) — new section

## Verified job counts at design time

| Company | ATS | Slug | Job count (2026-05-03) |
|---------|-----|------|------------------------|
| Skild AI | Greenhouse | `skildai-careers` | 46 |
| RoboForce | Greenhouse | `roboforce` | 15 |
| Mind Robotics | Ashby | `mindrobotics` | 12 |
| Rhoda AI | Ashby | `rhoda-ai` | 21 |
| Bedrock Robotics | Ashby | `bedrock-robotics` | 23 |
| Sunday Robotics | Ashby | `sunday` | 28 |
| Lightwheel | Ashby | `lightwheel` | 5 |
| Sereact | Ashby | `sereact` | 26 |
| RobCo | Ashby | `robco` | 35 |
| Harmattan AI | Ashby | `harmattan-ai` | 92 |
| Vention | SmartRecruiters | `Vention` | 49 |
| Mytra | Rippling | `mytra` | 28 |
| Advanced Navigation | Rippling | `advanced-navigation` | 18 |
| Overland AI | Rippling | `overland-ai` | 25 |

Total: 423 jobs across 14 new companies (subject to the intern+US filter downstream).

## Out of scope

- Chinese companies (19): would require per-company custom scrapers and likely WeChat-mediated workflows. Captured for later in a separate task.
- Filter expansion (full-time vs intern): the existing tracker is intern-focused. Changing the filter would affect all 60+ currently-tracked companies and is a larger product decision.
- "FAIR" (#31): identity unclear. User to confirm whether this is Fourier Intelligence, INSPIRE-Robots, or another entity before adding.

## Testing approach

- For Rippling fetcher: run `fetch_rippling("mytra")` locally and check it returns >0 jobs with all required fields populated.
- For each new ATS slug: already verified at design time (counts in table above). Re-verify before opening PR if more than 24 hours pass.
- After PR merges to monitor repo, the daily cron will produce `data/<slug>/latest.json`. Spot-check 2-3 of the new files before commenting fetch_jobs.py here.
