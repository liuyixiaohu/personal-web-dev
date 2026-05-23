/**
 * Full GA4 + GTM + GSC audit for kunli.co — last 90 days.
 *
 * Usage:  node scripts/audit.mjs
 * Output: human-readable summary to stdout
 *         full JSON dump to tmp/audit-output.json (for downstream analysis)
 *
 * Auth: service account at .claude/gcp-service-account.json
 * Required scopes / API access:
 *   - Search Console API   (scope: webmasters)
 *   - Analytics Data API   (scope: analytics.readonly)
 *   - Analytics Admin API  (scope: analytics.readonly)
 *   - Tag Manager API      (scope: tagmanager.readonly)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import { google } from 'googleapis';

const ROOT = resolve(import.meta.dirname, '..');
const KEY_PATH = resolve(ROOT, '.claude/gcp-service-account.json');
const OUT_DIR = resolve(ROOT, 'tmp');
const OUT_PATH = resolve(OUT_DIR, 'audit-output.json');

// ── Time window ────────────────────────────────────────────────────
const endDate = new Date();
const startDate = new Date(Date.now() - 90 * 86400000);
const fmt = d => d.toISOString().split('T')[0];
const START = fmt(startDate);
const END = fmt(endDate);

// ── Auth ───────────────────────────────────────────────────────────
const key = JSON.parse(readFileSync(KEY_PATH, 'utf-8'));
const auth = new google.auth.GoogleAuth({
  credentials: key,
  scopes: [
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/tagmanager.readonly',
  ],
});
const authClient = await auth.getClient();
google.options({ auth: authClient });

const out = {
  meta: { start: START, end: END, runAt: new Date().toISOString(), key: key.client_email },
  gsc: {},
  ga4: {},
  gtm: {},
  errors: {},
};

const ok = (label, data) => { console.log(`  ✓ ${label}`); return data; };
const fail = (bucket, label, err) => {
  console.log(`  ✗ ${label}: ${err.message}`);
  out.errors[`${bucket}:${label}`] = err.message;
  return null;
};

// ── 1. GSC ─────────────────────────────────────────────────────────
console.log(`\n=== GSC (sc-domain:kunli.co, ${START} → ${END}) ===\n`);
const webmasters = google.webmasters('v3');
const searchconsole = google.searchconsole('v1');
const SITE = 'sc-domain:kunli.co';

async function gscQuery(dimensions, rowLimit = 50, extra = {}) {
  const { data } = await webmasters.searchanalytics.query({
    siteUrl: SITE,
    requestBody: { startDate: START, endDate: END, dimensions, rowLimit, ...extra },
  });
  return data.rows || [];
}

try { out.gsc.byQuery = ok('queries (top 50 by impressions)', await gscQuery(['query'])); }
catch (e) { fail('gsc', 'byQuery', e); }

try { out.gsc.byPage = ok('pages (top 50)', await gscQuery(['page'])); }
catch (e) { fail('gsc', 'byPage', e); }

try { out.gsc.byQueryPage = ok('query↔page pairs (top 100)', await gscQuery(['query', 'page'], 100)); }
catch (e) { fail('gsc', 'byQueryPage', e); }

try { out.gsc.byCountry = ok('countries', await gscQuery(['country'], 25)); }
catch (e) { fail('gsc', 'byCountry', e); }

try { out.gsc.byDevice = ok('device split', await gscQuery(['device'], 10)); }
catch (e) { fail('gsc', 'byDevice', e); }

try { out.gsc.byDate = ok('daily series', await gscQuery(['date'], 1000)); }
catch (e) { fail('gsc', 'byDate', e); }

try {
  const { data } = await webmasters.sitemaps.list({ siteUrl: SITE });
  out.gsc.sitemaps = ok('sitemaps', data.sitemap || []);
} catch (e) { fail('gsc', 'sitemaps', e); }

// URL inspection for the 5 live pages
const LIVE_URLS = [
  'https://kunli.co/',
  'https://kunli.co/events',
  'https://kunli.co/life-journey',
  'https://kunli.co/sift',
  'https://kunli.co/touch-fish',
];
out.gsc.inspection = [];
for (const url of LIVE_URLS) {
  try {
    const { data } = await searchconsole.urlInspection.index.inspect({
      requestBody: { inspectionUrl: url, siteUrl: SITE },
    });
    const idx = data.inspectionResult?.indexStatusResult || {};
    out.gsc.inspection.push({
      url,
      verdict: idx.verdict,
      coverageState: idx.coverageState,
      robotsTxt: idx.robotsTxtState,
      pageFetch: idx.pageFetchState,
      crawledAs: idx.crawledAs,
      lastCrawlTime: idx.lastCrawlTime,
      indexingState: idx.indexingState,
      googleCanonical: idx.googleCanonical,
      userCanonical: idx.userCanonical,
      referringUrls: idx.referringUrls,
      sitemap: idx.sitemap,
    });
    console.log(`  ✓ inspect ${url} — ${idx.verdict}`);
  } catch (e) {
    out.gsc.inspection.push({ url, error: e.message });
    console.log(`  ✗ inspect ${url}: ${e.message}`);
  }
}

// ── 2. GA4 ─────────────────────────────────────────────────────────
console.log(`\n=== GA4 (auto-discover property, ${START} → ${END}) ===\n`);
const analyticsAdmin = google.analyticsadmin('v1beta');
const analyticsData = google.analyticsdata('v1beta');

let propertyId = null;
let propertyName = null;
try {
  const { data } = await analyticsAdmin.accountSummaries.list({ pageSize: 50 });
  out.ga4.accountSummaries = data.accountSummaries || [];
  for (const acct of data.accountSummaries || []) {
    for (const prop of acct.propertySummaries || []) {
      // first property we can see
      if (!propertyId) {
        propertyId = prop.property.split('/')[1];
        propertyName = prop.displayName;
      }
    }
  }
  console.log(`  ✓ property discovered: ${propertyName} (id ${propertyId})`);
} catch (e) {
  fail('ga4', 'accountSummaries', e);
}

if (propertyId) {
  const PROP = `properties/${propertyId}`;
  out.ga4.propertyId = propertyId;
  out.ga4.propertyName = propertyName;

  async function runReport(name, body) {
    try {
      const { data } = await analyticsData.properties.runReport({
        property: PROP,
        requestBody: { dateRanges: [{ startDate: START, endDate: END }], ...body },
      });
      console.log(`  ✓ ${name} (${data.rows?.length || 0} rows)`);
      return data;
    } catch (e) {
      console.log(`  ✗ ${name}: ${e.message}`);
      out.errors[`ga4:${name}`] = e.message;
      return null;
    }
  }

  out.ga4.totals = await runReport('totals', {
    metrics: [
      'totalUsers','newUsers','sessions','engagedSessions','engagementRate',
      'averageSessionDuration','screenPageViews','screenPageViewsPerSession',
      'eventCount','bounceRate',
    ].map(name => ({ name })),
  });

  out.ga4.byDate = await runReport('byDate', {
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
    limit: 1000,
  });

  out.ga4.byPage = await runReport('byPage', {
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' }, { name: 'sessions' }, { name: 'totalUsers' },
      { name: 'engagementRate' }, { name: 'averageSessionDuration' },
      { name: 'bounceRate' },
    ],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 40,
  });

  out.ga4.byLanding = await runReport('byLanding', {
    dimensions: [{ name: 'landingPage' }],
    metrics: [
      { name: 'sessions' }, { name: 'engagedSessions' }, { name: 'engagementRate' },
      { name: 'bounceRate' }, { name: 'averageSessionDuration' },
    ],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 30,
  });

  out.ga4.bySourceMedium = await runReport('bySourceMedium', {
    dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
    metrics: [
      { name: 'sessions' }, { name: 'totalUsers' }, { name: 'engagementRate' },
      { name: 'averageSessionDuration' },
    ],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 30,
  });

  out.ga4.byChannel = await runReport('byChannel', {
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'engagementRate' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
  });

  out.ga4.byEvent = await runReport('byEvent', {
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 50,
  });

  out.ga4.byCountry = await runReport('byCountry', {
    dimensions: [{ name: 'country' }],
    metrics: [{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'engagementRate' }],
    orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
    limit: 25,
  });

  out.ga4.byCity = await runReport('byCity', {
    dimensions: [{ name: 'city' }, { name: 'country' }],
    metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
    limit: 25,
  });

  out.ga4.byDevice = await runReport('byDevice', {
    dimensions: [{ name: 'deviceCategory' }],
    metrics: [{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'engagementRate' }, { name: 'bounceRate' }],
  });

  out.ga4.byBrowser = await runReport('byBrowser', {
    dimensions: [{ name: 'browser' }],
    metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
    limit: 15,
  });

  out.ga4.byHour = await runReport('byHour', {
    dimensions: [{ name: 'hour' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    orderBys: [{ dimension: { dimensionName: 'hour' } }],
  });

  out.ga4.byReferrer = await runReport('byReferrer', {
    dimensions: [{ name: 'pageReferrer' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 25,
  });

  // List conversion events (configured key events)
  try {
    const { data } = await analyticsAdmin.properties.keyEvents.list({ parent: PROP });
    out.ga4.keyEvents = data.keyEvents || [];
    console.log(`  ✓ keyEvents (${out.ga4.keyEvents.length})`);
  } catch (e) {
    fail('ga4', 'keyEvents', e);
  }

  // List custom dimensions / metrics
  try {
    const { data } = await analyticsAdmin.properties.customDimensions.list({ parent: PROP });
    out.ga4.customDimensions = data.customDimensions || [];
    console.log(`  ✓ customDimensions (${out.ga4.customDimensions.length})`);
  } catch (e) { fail('ga4', 'customDimensions', e); }

  try {
    const { data } = await analyticsAdmin.properties.customMetrics.list({ parent: PROP });
    out.ga4.customMetrics = data.customMetrics || [];
    console.log(`  ✓ customMetrics (${out.ga4.customMetrics.length})`);
  } catch (e) { fail('ga4', 'customMetrics', e); }

  // Data streams (to confirm GA4 is receiving from the right domain)
  try {
    const { data } = await analyticsAdmin.properties.dataStreams.list({ parent: PROP });
    out.ga4.dataStreams = data.dataStreams || [];
    console.log(`  ✓ dataStreams (${out.ga4.dataStreams.length})`);
  } catch (e) { fail('ga4', 'dataStreams', e); }
}

// ── 3. GTM ─────────────────────────────────────────────────────────
console.log(`\n=== GTM ===\n`);
const tagmanager = google.tagmanager('v2');

try {
  const { data } = await tagmanager.accounts.list();
  out.gtm.accounts = data.account || [];
  console.log(`  ✓ accounts (${out.gtm.accounts.length})`);

  for (const acct of out.gtm.accounts) {
    const { data: ctrData } = await tagmanager.accounts.containers.list({ parent: acct.path });
    const ctrs = ctrData.container || [];
    for (const ctr of ctrs) {
      const isTarget = ctr.publicId === 'GTM-PNCRCQBM';
      console.log(`  ✓ container ${ctr.publicId}${isTarget ? '  (target)' : ''} — ${ctr.name}`);
      if (!isTarget) continue;

      out.gtm.container = ctr;

      // Live version
      try {
        const { data: liveData } = await Promise.resolve(
          tagmanager.accounts.containers.versions.live({ parent: ctr.path })
        );
        out.gtm.liveVersion = {
          name: liveData.name,
          versionId: liveData.containerVersionId,
          fingerprint: liveData.fingerprint,
          description: liveData.description,
          tagCount: liveData.tag?.length || 0,
          triggerCount: liveData.trigger?.length || 0,
          variableCount: liveData.variable?.length || 0,
          builtInVariableCount: liveData.builtInVariable?.length || 0,
          tags: (liveData.tag || []).map(t => ({
            name: t.name, type: t.type, paused: t.paused,
            firingTriggerId: t.firingTriggerId,
            blockingTriggerId: t.blockingTriggerId,
            tagFiringOption: t.tagFiringOption,
            fingerprint: t.fingerprint,
            parameter: t.parameter,
          })),
          triggers: (liveData.trigger || []).map(t => ({
            name: t.name, type: t.type, triggerId: t.triggerId,
            filter: t.filter, customEventFilter: t.customEventFilter,
            autoEventFilter: t.autoEventFilter,
          })),
          variables: (liveData.variable || []).map(v => ({
            name: v.name, type: v.type, variableId: v.variableId,
            parameter: v.parameter,
          })),
          builtInVariables: (liveData.builtInVariable || []).map(b => b.type),
        };
        console.log(`    → live v${liveData.containerVersionId}: ${out.gtm.liveVersion.tagCount} tags, ${out.gtm.liveVersion.triggerCount} triggers, ${out.gtm.liveVersion.variableCount} variables`);
      } catch (e) { fail('gtm', 'liveVersion', e); }

      // Workspaces (count != 1 means unmerged changes)
      try {
        const { data: wsData } = await Promise.resolve(
          tagmanager.accounts.containers.workspaces.list({ parent: ctr.path })
        );
        out.gtm.workspaces = (wsData.workspace || []).map(w => ({
          name: w.name, description: w.description, workspaceId: w.workspaceId,
        }));
        console.log(`    → workspaces: ${out.gtm.workspaces.length}`);
      } catch (e) { fail('gtm', 'workspaces', e); }

      // Recent versions (header only)
      try {
        const { data: vh } = await Promise.resolve(
          tagmanager.accounts.containers.version_headers.list({ parent: ctr.path })
        );
        out.gtm.versionHeaders = (vh.containerVersionHeader || []).slice(0, 15).map(h => ({
          name: h.name, versionId: h.containerVersionId,
          deleted: h.deleted, numTags: h.numTags, numTriggers: h.numTriggers,
          numVariables: h.numVariables,
        }));
        console.log(`    → version history: ${vh.containerVersionHeader?.length || 0} versions`);
      } catch (e) { fail('gtm', 'versionHeaders', e); }
    }
  }
} catch (e) {
  fail('gtm', 'accounts', e);
}

// ── Write JSON dump ────────────────────────────────────────────────
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));

console.log(`\n=== Done ===\n`);
console.log(`  Window:    ${START} → ${END}`);
console.log(`  Errors:    ${Object.keys(out.errors).length}`);
console.log(`  JSON dump: ${OUT_PATH}`);
console.log(`             (${Math.round(JSON.stringify(out).length / 1024)} KB)`);
if (Object.keys(out.errors).length) {
  console.log('\n  Error details:');
  for (const [k, v] of Object.entries(out.errors)) console.log(`    ${k}: ${v}`);
}
