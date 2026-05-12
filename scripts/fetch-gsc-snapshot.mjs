// Fetch a daily Google Search Console snapshot for the Console SEO page.
//
// Auth: reads service-account JSON from $GCP_SA_KEY (the literal JSON
// string, used in GitHub Actions) or falls back to the local key file
// used by scripts/gsc-diagnose.mjs.
//
// Writes a snapshot to public/console/data/gsc-snapshot.json containing:
//   - 7-day and 30-day totals (clicks, impressions, ctr, position)
//   - Top 10 queries and top 10 pages (last 7 days for queries, 30 for pages)
//   - Top 10 biggest position movers (last 7d vs prior 7d, min 10 impressions)
//
// GSC data has a ~3-day lag, so all windows end LAG_DAYS days before today.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { google } from 'googleapis';

const SITE_URL = process.env.GSC_SITE_URL || 'sc-domain:kunli.co';
const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(ROOT, 'public/console/data/gsc-snapshot.json');
const LAG_DAYS = 3;
const TOP_LIMIT = 10;
const MOVERS_MIN_IMPRESSIONS = 10;
const MOVERS_MIN_POSITION_DELTA = 0.5;

function loadKey() {
  if (process.env.GCP_SA_KEY) return JSON.parse(process.env.GCP_SA_KEY);
  const candidates = [
    resolve(ROOT, '.claude/gcp-service-account.json'),
    resolve(process.env.HOME, '.config/gcloud/kunli-analytics.json'),
  ];
  for (const p of candidates) {
    try {
      return JSON.parse(readFileSync(p, 'utf-8'));
    } catch {}
  }
  throw new Error('No service-account key found. Set $GCP_SA_KEY or place file at .claude/gcp-service-account.json');
}

const auth = new google.auth.GoogleAuth({
  credentials: loadKey(),
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});
google.options({ auth: await auth.getClient() });
const webmasters = google.webmasters('v3');

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function window(daysAgoFromToday, windowDays) {
  const end = new Date(Date.now() - daysAgoFromToday * 86400000);
  const start = new Date(end.getTime() - (windowDays - 1) * 86400000);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}

async function query(opts) {
  const { data } = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: opts,
  });
  return data.rows ?? [];
}

async function totalsFor(win) {
  const rows = await query({ ...win, dimensions: [], rowLimit: 1 });
  const r = rows[0];
  return {
    clicks: r?.clicks ?? 0,
    impressions: r?.impressions ?? 0,
    ctr: r?.ctr ?? 0,
    position: r?.position ?? 0,
  };
}

function round(n, places = 2) {
  return Number(n.toFixed(places));
}

const last7 = window(LAG_DAYS, 7);
const last30 = window(LAG_DAYS, 30);
const prev7 = window(LAG_DAYS + 7, 7);

const [totals7, totals30, queriesNow, queriesPrev, pages] = await Promise.all([
  totalsFor(last7),
  totalsFor(last30),
  query({ ...last7, dimensions: ['query'], rowLimit: 100 }),
  query({ ...prev7, dimensions: ['query'], rowLimit: 100 }),
  query({ ...last30, dimensions: ['page'], rowLimit: TOP_LIMIT }),
]);

const topQueries = queriesNow.slice(0, TOP_LIMIT).map((r) => ({
  query: r.keys[0],
  clicks: r.clicks,
  impressions: r.impressions,
  ctr: round(r.ctr, 4),
  position: round(r.position, 1),
}));

const topPages = pages.map((r) => ({
  page: r.keys[0],
  clicks: r.clicks,
  impressions: r.impressions,
  ctr: round(r.ctr, 4),
  position: round(r.position, 1),
}));

const prevMap = new Map(queriesPrev.map((r) => [r.keys[0], r]));
const movers = [];
for (const r of queriesNow) {
  const prev = prevMap.get(r.keys[0]);
  if (!prev) continue;
  if (r.impressions < MOVERS_MIN_IMPRESSIONS || prev.impressions < MOVERS_MIN_IMPRESSIONS) continue;
  const delta = prev.position - r.position; // positive = improved
  if (Math.abs(delta) < MOVERS_MIN_POSITION_DELTA) continue;
  movers.push({
    query: r.keys[0],
    positionChange: round(delta, 2),
    before: round(prev.position, 1),
    after: round(r.position, 1),
    clicks: r.clicks,
    impressions: r.impressions,
  });
}
movers.sort((a, b) => Math.abs(b.positionChange) - Math.abs(a.positionChange));

const out = {
  generatedAt: new Date().toISOString(),
  site: SITE_URL,
  windows: {
    last7: { ...last7, totals: totals7 },
    last30: { ...last30, totals: totals30 },
    previous7: prev7,
  },
  topQueries,
  topPages,
  biggestMovers: movers.slice(0, TOP_LIMIT),
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`GSC snapshot written to ${OUT.replace(ROOT + '/', '')}`);
console.log(`  7d:  ${totals7.clicks} clicks / ${totals7.impressions} impressions / avg pos ${round(totals7.position, 1)}`);
console.log(`  30d: ${totals30.clicks} clicks / ${totals30.impressions} impressions / avg pos ${round(totals30.position, 1)}`);
console.log(`  top queries: ${topQueries.length}, top pages: ${topPages.length}, movers: ${out.biggestMovers.length}`);
