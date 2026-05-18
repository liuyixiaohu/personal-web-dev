# Analytics Audit — kunli.co

**Date:** 2026-05-18
**Window:** 2026-02-17 → 2026-05-18 (last 90 days)
**Source:** GSC `sc-domain:kunli.co`, GA4 `Personal Site` (523732390 / G-KFH5JNT2RC), GTM `GTM-PNCRCQBM` v7

---

## TL;DR

- **GSC reports 0 clicks across all 90 days against ~400 impressions.** The site appears in search but no one clicks. Two compounding causes: a structural canonical/redirect issue that has 4 of your 5 live pages classified by Google as "Page with redirect" (NEUTRAL, not properly indexed), and weak titles/meta descriptions for the impressions you do get.
- **GA4 is polluted with your own dev + private-app traffic.** Localhost referrals (~58 sessions) bypass your GTM block trigger, and the Cloudflare-protected `/console/` workbench is being counted as public traffic (~460 pageviews from 3 users — basically you).
- **/events is the SEO breadwinner — but Google can't fetch it cleanly.** It accounts for 84% of all GSC impressions at avg position 4.6, yet the URL inspection returns `REDIRECT_ERROR` (last crawl 2026-03-29, almost two months stale).
- **One clear keyword cluster is winning awareness but not clicks:** people search "touch fish in Chinese", "mō yú", "touch fish meaning chinese" → land on `/touch-fish` at position 11–29. If meta + content are tightened, this is the cluster most likely to break onto page 1.
- **Tracking foundation is otherwise solid.** GTM v7 has thoughtful custom events, scroll depth, virtual page views; 12 data-layer variables; 7 versions of incremental improvement.

---

## GSC — Search Console

### 1. Canonical / trailing-slash mismatch (CRITICAL)

The sitemap submits URLs without trailing slash, but the site redirects to URLs *with* trailing slash. Google flags 4 of 5 live pages as `Page with redirect` (NEUTRAL verdict — not properly indexed against the URL you submitted), and `/events` further escalates to `Redirect error`.

| URL submitted | Verdict | Coverage | Google's canonical |
|---|---|---|---|
| `https://kunli.co/` | PASS | Submitted and indexed | `/` |
| `https://kunli.co/events` | NEUTRAL | **Redirect error** | (none) |
| `https://kunli.co/life-journey` | NEUTRAL | Page with redirect | `/life-journey/` |
| `https://kunli.co/sift` | NEUTRAL | Page with redirect | `/sift/` |
| `https://kunli.co/touch-fish` | NEUTRAL | Page with redirect | `/touch-fish/` |

Fix paths:
1. Decide one canonical form (trailing slash is the safer choice — that's what your server is already serving). Update `dist/sitemap-0.xml` (and Astro config) so the sitemap matches. The current dist sitemap lists `https://kunli.co/events` etc. without the slash.
2. Investigate why `/events` specifically returns `REDIRECT_ERROR` rather than the milder `Page with redirect`. May be a 5xx, redirect loop, or 302 (Google wants 301 for permanent moves). Cloudflare logs would tell you.
3. After fixing, re-submit the sitemap in GSC and use URL Inspection's "Request indexing" on each.

### 2. CTR is 0.0% — not a ranking problem, a clickability problem

398 impressions, 0 clicks. Even pages at position 4–6 (top of page 1) get no clicks. Likely causes: weak `<title>` / meta descriptions, or the SERP snippet looks like a personal-portfolio result when users were looking for something specific. A quick win is to rewrite titles + descriptions for `/events`, `/touch-fish`, and `/sift` to be query-aligned rather than identity-aligned.

### 3. /events is doing 84% of the impression work alone

Of 398 total impressions over 90 days, **335 are on `/events`** at avg position 4.6 (USA-heavy, near top of page 1). If you only fix one thing, fix this page's redirect error.

### 4. "Touch fish in Chinese" keyword cluster — your highest-intent search audience

The 5 query rows you have for `/touch-fish/`:

| Query | Imps | Avg position |
|---|---|---|
| touch fish | 6 | 17.8 |
| touching fish | 1 | 68.0 |
| touch fish in chinese | 1 | 11.0 |
| touch fish meaning chinese | 1 | 13.0 |
| touching fish chinese | 1 | 25.0 |
| mō yú | 1 | 22.0 |

These are real users asking "what does 摸鱼 mean?". Your page exists for this exact intent but isn't ranking well enough to convert impressions to clicks. Add a clear `<h1>` like *"摸鱼 (mō yú) — 'Touch Fish' in Chinese, Explained"*, a meta description that answers in the SERP, and the first 100 words of body content should answer the question directly. Internal links from `/` and `/events` would also boost it.

### 5. Stale URLs Google is still tracking

GSC `byPage` shows historical paths Google hasn't dropped yet:

- `http://kunli.co/` (4 imps) — the insecure-HTTP version. Make sure your `Strict-Transport-Security` header is set and that 301s from HTTP→HTTPS are clean.
- `/ingrain`, `/professional/quant-insights/`, `/special-thanks/`, `/visual-design/sprint-cadence/` — these pages do exist in GA4's pageview log too. Whether they should be in the sitemap is a content-strategy call (they're not currently).

The `/brand` 404 is expected — you removed that page deliberately in commit `1a1f5dd`. Google will drop it after enough 404s. Two cleanup items unrelated to GSC but stemming from this: `scripts/gsc-diagnose.mjs` line 22 still hardcodes `/brand` in its inspection list, and `docs/brand-guidelines.md` line 4 still links to the dead URL.

### 6. Geo / device split

Of 398 impressions, 350 (88%) are from the USA — essentially a USA-only site in Google search right now. India (7) and Canada (9) are distant 2nd/3rd.

Desktop dominates at 96% of search impressions (382 vs 16 mobile) — unusual; suggests your indexed queries skew professional/research-intent rather than casual mobile browsing.

---

## GA4 — `Personal Site` (G-KFH5JNT2RC)

90-day totals: **175 users · 574 sessions · 5,362 pageviews · 70.9% engagement · 14.4 min avg session.** Strong engagement, modest volume. Daily pageviews jumped from <20/day in Feb–Apr to 100–200/day in mid-May.

### 1. Localhost traffic is leaking into prod GA4 (FIX)

Top GA4 referrers include `http://localhost:4321/` (58 sessions) and `127.0.0.1:4321 / referral` (1 session). You have a GTM trigger named **`Block - Localhost`** (id 22) intended to exclude this, but it's *not* wired as a `blockingTriggerId` on any of the 4 firing tags. So it has no effect — all four tags fire unconditionally.

Fix in GTM: open each of the 4 tags (GA4 - kunli.co, GA4 Event - Custom Events, GA4 Event - Scroll Depth, GA4 Event - Virtual Page View) → Advanced Settings → Triggering → Add Exception → select `Block - Localhost`. Publish a v8.

### 2. Your private /console/ workbench is being counted (FIX)

| Path | Pageviews | Users |
|---|---|---|
| `/console/` | 460 | 3 |
| `/console/jobs/` | 289 | 2 |
| `/joblens/`, `/tools/excel`, `/workbench` | smaller | few |

`bySourceMedium` confirms: `kli339.cloudflareaccess.com / referral` drives 114 sessions, ~96.5% engagement — that's you behind the Cloudflare Access auth wall. These are real *you*-sessions, not real-public sessions, inflating page-view counts on private routes.

Fix options, in order of cleanliness:
1. Add a GTM trigger filter that blocks tag firing when `{{Page Path}}` matches `/console|/joblens|/workbench` regex.
2. Or in GA4 Admin → Data Streams → Web → Configure tag settings → Define internal traffic, mark Cloudflare Access referrer as internal. Then set up an Internal Traffic filter in Data Settings.

### 3. The configured "key event" is `purchase` — replace it

GA4 has one key event configured: `purchase` (created 2026-02-09). You don't sell anything — this is the default suggestion from GA4 setup that was never removed.

Replace with events that match what conversion actually means here. Candidates from your existing event stream:

- `nav_click` (110 events, 9 users) — navigation engagement
- `filter_use` (64 events, 4 users) — sift filter interaction
- `map_pin_click` (54 events, 4 users) — life-journey engagement
- `language_toggle` (22 events, 4 users) — proves bilingual UX is used
- `form_submit` (2 events) — currently too rare to be a meaningful KPI but the right shape
- `workbench_run` (4 events) — private-app metric, exclude if you do the /console fix above

Right click in Admin → Events → toggle "Mark as key event" on the 2–3 you actually want to drive.

### 4. Duplicate page paths — `/events` vs `/events/`

GA4 reports both forms as separate pages despite the comment in `src/layouts/BaseLayout.astro:88` ("Strip trailing slash so GA4 reports /events and /events/ as one page"):

| Path | Pageviews |
|---|---|
| `/events/` | 560 |
| `/events` | 272 |
| `/life-journey/` | 199 |
| `/life-journey` | 184 |
| `/brand/` | 64 |
| `/brand` | 92 |
| `/sift/` | 82 |
| `/sift` | (smaller) |

The View Transition handler that pushes virtual_page_view is presumably firing with the un-normalized URL on the first leg of the redirect. Trace what `page_location` parameter the tag actually sends — easiest way is GA4 DebugView with `?gtm_debug=true`.

### 5. Double-counting page_views

`page_view` events: 5,362. `virtual_page_view` events: 751. The Google Tag (`googtag` type) auto-collects dataLayer `virtual_page_view` pushes as standard page_views — your separate `GA4 Event - Virtual Page View` tag then fires *again* on the same event. The 751 figure is GTM's view of the custom-event side; in GA4 you'll likely find the second leg is also being recorded as page_view, inflating numbers.

Choose one: either disable the auto-collection in the Google Tag config, or pause the `GA4 Event - Virtual Page View` GTM tag.

### 6. `(not set)` landing page — 83 sessions, 80.7% bounce

This is a meaningful chunk (14% of all sessions) with no landing page recorded. Likely a mix of:

- Bot/scraper traffic that hits before `page_view` parameters are populated
- Sessions where session_start fires but the user navigates away before page_view
- Astro View Transition edge case on first paint

If you set up a custom dimension on `page_location` from `gtag('event', 'page_view', { page_location })`, you can often catch what's actually there.

### 7. No custom dimensions configured

`customDimensions: 0`, `customMetrics: 0`. You're already pushing rich data-layer variables (pin_city, language, filter_type, filter_value, platform, craft_area, tool_name, destination, path, pin_id) and sending them as event parameters — but without registering them as custom dimensions in GA4 Admin you can't *report* on them. Right now they're being captured and discarded.

Top candidates to register as event-scoped custom dimensions: `language`, `platform`, `filter_type`, `pin_city`, `craft_area`.

### 8. Channel mix is mostly direct + your own referrers

| Channel | Sessions | Notes |
|---|---|---|
| Direct | 345 | 60% — mostly you and people you share the URL with |
| Referral | 128 | Cloudflare Access + LinkedIn |
| Organic Social | 82 | All LinkedIn |
| Organic Search | 13 | Underwhelming given 398 GSC impressions |

`linkedin.com / referral` is the highest-quality non-direct source: **82 sessions, 1,360s avg duration, 87.8% engagement.** Your LinkedIn posts are landing well. Worth doubling down on that channel.

### 9. Mobile UX gap

| Device | Users | Engagement | Bounce |
|---|---|---|---|
| Desktop | 110 | 76.3% | 23.7% |
| Mobile | 64 | 33.8% | 66.2% |
| Tablet | 1 | 100% | 0% |

Mobile bounce is **2.8× desktop**. Either the mobile experience has a real problem, or mobile users come from less-targeted sources. Worth opening the site on mobile and testing the top 3 landing pages (`/`, `/touch-fish`, `/events`) for layout, font, tap-target, and load-time issues.

### 10. Berkeley dominates — your network, not the public

Top city: **Berkeley, US — 48 users, 401 sessions (8.4 sessions/user).** That's you and friends. The "public" GA4 numbers minus Berkeley + Cloudflare Access internal traffic is closer to ~80 users / ~150 sessions / 90 days, which sets a more realistic baseline.

---

## GTM — `GTM-PNCRCQBM` v7

Container is in good shape. 4 tags, 4 triggers, 12 data-layer variables, 8 built-in variables enabled. Version history shows 7 iterations including a critical fix in v7 (the measurement ID was previously pointing to a wrong GA4 property `G-HKNZ4QGXL6` — well done catching that).

### Findings / suggestions

1. **The localhost block trigger isn't wired up** — covered in GA4 §1. Highest-priority fix.
2. **No tag for outbound link clicks** — built-in variables don't enable `Click URL` / `Click Element` / `Click Classes`. If you care about which external links (LinkedIn, GitHub, Chrome Web Store) users click on your site, enable those built-ins and add a `GA4 Event - Outbound Click` tag.
3. **No 404 tag** — you have a `404_not_found` event in GA4 (7 instances), which means something is pushing it via dataLayer somewhere. But no corresponding GTM tag is sending it — so it's an "auto-collected" GA4 event. Worth confirming: the auto-collection might miss path / referrer context that a dedicated tag could capture.
4. **Workspace count is healthy (1)** — no unmerged changes.
5. **Recent versions look intentional** — v2 GA4 setup, v3 custom events + scroll, v4 virtual page view, v5 expanded custom events, v6 localhost filter (added — but, again, not wired), v7 measurement ID fix.

---

## Prioritized action list

Suggested order (top three are the only ones that materially change next month's data):

1. **Fix the trailing-slash mismatch in sitemap** so `/events`, `/sift`, `/touch-fish`, `/life-journey` are submitted with their canonical (trailing-slash) form. Re-submit the sitemap. Diagnose and fix the `/events` REDIRECT_ERROR specifically. (GSC §1, §3)
2. **Wire the GTM `Block - Localhost` trigger as a blocking exception on all 4 tags, and add a path filter to exclude `/console`, `/joblens`, `/workbench`.** Publish v8. (GTM §1, GA4 §1, §2)
3. **Replace the `purchase` key event with 2–3 events that mean something here** — likely `nav_click`, `filter_use`, `language_toggle`. (GA4 §3)
4. Rewrite `<title>` + `<meta name="description">` for `/events`, `/touch-fish`, `/sift` to fix the 0% CTR. (GSC §2)
5. Tighten the `/touch-fish/` page for the "touch fish in Chinese" keyword cluster — `<h1>`, first 100 words, meta description. (GSC §4)
6. Register `language`, `platform`, `filter_type`, `pin_city`, `craft_area` as event-scoped custom dimensions in GA4. (GA4 §7)
7. Resolve the duplicate `page_view` / `virtual_page_view` firing. (GA4 §5)
8. Diagnose mobile UX on the 3 most-landed pages. (GA4 §9)
9. Lean into LinkedIn — it's already your best non-direct source. (GA4 §8)
10. Housekeeping: remove `/brand` from `scripts/gsc-diagnose.mjs` line 22 and the dead link in `docs/brand-guidelines.md` line 4.

---

## Raw data

Full JSON dump: `tmp/audit-output.json` (162 KB).
Re-run anytime: `node scripts/audit.mjs`.
