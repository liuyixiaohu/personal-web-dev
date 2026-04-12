/**
 * Google Search Console diagnostic script.
 * Authenticates via service account, checks sitemap status,
 * runs URL Inspection on all sitemap URLs, and queries search analytics.
 *
 * Usage: node scripts/gsc-diagnose.mjs
 *
 * Requires:
 *   - Service account added as user in GSC for the target site
 *   - Search Console API enabled in the GCP project
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { google } from 'googleapis';

// GSC property can be either URL-prefix ('https://kunli.co') or Domain ('sc-domain:kunli.co').
// Try domain property first, fall back to URL-prefix.
const SITE_URL = process.env.GSC_SITE_URL || 'sc-domain:kunli.co';
const SITEMAP_URLS = [
  'https://kunli.co/',
  'https://kunli.co/brand',
  'https://kunli.co/events',
  'https://kunli.co/ingrain',
  'https://kunli.co/life-journey',
  'https://kunli.co/sift',
  'https://kunli.co/touch-fish',
];

// Resolve service account key file
const KEY_PATHS = [
  resolve(import.meta.dirname, '../.claude/gcp-service-account.json'),
  resolve(process.env.HOME, '.config/gcloud/kunli-analytics.json'),
];
const keyPath = KEY_PATHS.find(p => {
  try { readFileSync(p); return true; } catch { return false; }
});
if (!keyPath) {
  console.error('Service account key not found. Checked:', KEY_PATHS);
  process.exit(1);
}

const key = JSON.parse(readFileSync(keyPath, 'utf-8'));

// Auth
const auth = new google.auth.GoogleAuth({
  credentials: key,
  scopes: ['https://www.googleapis.com/auth/webmasters'],
});
const authClient = await auth.getClient();
google.options({ auth: authClient });

const searchconsole = google.searchconsole('v1');
const webmasters = google.webmasters('v3');

// ── 1. Sitemap status ──────────────────────────────────────────────
console.log('\n=== Sitemap Status ===\n');
try {
  const { data } = await webmasters.sitemaps.list({ siteUrl: SITE_URL });
  if (data.sitemap?.length) {
    for (const sm of data.sitemap) {
      console.log(`  ${sm.path}`);
      console.log(`    type:       ${sm.type}`);
      console.log(`    submitted:  ${sm.lastSubmitted}`);
      console.log(`    downloaded: ${sm.lastDownloaded}`);
      console.log(`    pending:    ${sm.isPending}`);
      console.log(`    warnings:   ${sm.warnings}`);
      console.log(`    errors:     ${sm.errors}`);
      if (sm.contents) {
        for (const c of sm.contents) {
          console.log(`    ${c.type}: ${c.submitted} submitted, ${c.indexed} indexed`);
        }
      }
    }
  } else {
    console.log('  No sitemaps found.');
  }
} catch (err) {
  console.error('  Sitemap check failed:', err.message);
}

// ── 2. URL Inspection ──────────────────────────────────────────────
console.log('\n=== URL Inspection ===\n');
const inspectionResults = [];

for (const url of SITEMAP_URLS) {
  try {
    const { data } = await searchconsole.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: url,
        siteUrl: SITE_URL,
      },
    });

    const idx = data.inspectionResult?.indexStatusResult || {};
    const result = {
      url,
      verdict: idx.verdict,
      coverageState: idx.coverageState,
      robotsTxtState: idx.robotsTxtState,
      indexingState: idx.indexingState,
      pageFetchState: idx.pageFetchState,
      crawledAs: idx.crawledAs,
      lastCrawlTime: idx.lastCrawlTime,
      referringUrls: idx.referringUrls,
      sitemap: idx.sitemap,
    };
    inspectionResults.push(result);

    const status = idx.verdict === 'PASS' ? 'OK' : idx.verdict;
    console.log(`  ${url}`);
    console.log(`    verdict:    ${status}`);
    console.log(`    coverage:   ${idx.coverageState || '-'}`);
    console.log(`    robots.txt: ${idx.robotsTxtState || '-'}`);
    console.log(`    fetch:      ${idx.pageFetchState || '-'}`);
    console.log(`    crawled as: ${idx.crawledAs || '-'}`);
    console.log(`    last crawl: ${idx.lastCrawlTime || '-'}`);
    console.log('');
  } catch (err) {
    console.error(`  ${url} -- inspection failed: ${err.message}`);
    inspectionResults.push({ url, error: err.message });
  }
}

// ── 3. Search Analytics (last 28 days) ─────────────────────────────
console.log('\n=== Search Analytics (last 28 days) ===\n');
try {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0];

  const { data } = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 25,
    },
  });

  if (data.rows?.length) {
    console.log('  Page                              Clicks  Impressions  CTR      Position');
    for (const row of data.rows) {
      const page = row.keys[0].replace(SITE_URL, '') || '/';
      console.log(
        `  ${page.padEnd(35)} ${String(row.clicks).padStart(6)}  ${String(row.impressions).padStart(11)}  ${(row.ctr * 100).toFixed(1).padStart(5)}%  ${row.position.toFixed(1).padStart(8)}`
      );
    }
  } else {
    console.log('  No search analytics data (site may not be indexed yet).');
  }
} catch (err) {
  console.error('  Search analytics failed:', err.message);
}

// ── 4. HTTP header check (X-Robots-Tag) ────────────────────────────
console.log('\n=== Production Header Check (X-Robots-Tag) ===\n');
const PROD_ORIGIN = 'https://kunli.co';
for (const url of [PROD_ORIGIN, `${PROD_ORIGIN}/sift`, `${PROD_ORIGIN}/events`]) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const xRobots = res.headers.get('x-robots-tag');
    console.log(`  ${url}  -->  ${xRobots ? `X-Robots-Tag: ${xRobots}` : 'no X-Robots-Tag (good)'}`);
  } catch (err) {
    console.error(`  ${url}  -->  fetch error: ${err.message}`);
  }
}

// ── Summary ────────────────────────────────────────────────────────
console.log('\n=== Summary ===\n');
const indexed = inspectionResults.filter(r => r.verdict === 'PASS').length;
const failed = inspectionResults.filter(r => r.verdict && r.verdict !== 'PASS').length;
const errors = inspectionResults.filter(r => r.error).length;
console.log(`  Total URLs checked: ${inspectionResults.length}`);
console.log(`  Indexed (PASS):     ${indexed}`);
console.log(`  Not indexed:        ${failed}`);
console.log(`  API errors:         ${errors}`);
console.log('');
