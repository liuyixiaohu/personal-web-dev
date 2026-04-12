/**
 * Resubmit sitemap and check indexing status for all pages.
 *
 * Usage: node scripts/gsc-reindex.mjs
 *
 * Note: The Google Indexing API only supports JobPosting/BroadcastEvent types.
 * For general pages, we can only resubmit the sitemap and check status.
 * Manual "Request Indexing" in GSC UI is needed for individual URLs.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { google } from 'googleapis';

const SITE_URL = process.env.GSC_SITE_URL || 'sc-domain:kunli.co';
const SITEMAP_URL = 'https://kunli.co/sitemap-index.xml';
const SITEMAP_URLS = [
  'https://kunli.co/',
  'https://kunli.co/brand',
  'https://kunli.co/events',
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

const auth = new google.auth.GoogleAuth({
  credentials: key,
  scopes: ['https://www.googleapis.com/auth/webmasters'],
});
const authClient = await auth.getClient();
google.options({ auth: authClient });

const searchconsole = google.searchconsole('v1');
const webmasters = google.webmasters('v3');

// ── 1. Resubmit sitemap ────────────────────────────────────────────
console.log('\n=== Resubmitting Sitemap ===\n');
try {
  await webmasters.sitemaps.submit({
    siteUrl: SITE_URL,
    feedpath: SITEMAP_URL,
  });
  console.log(`  Submitted: ${SITEMAP_URL}`);
} catch (err) {
  console.error(`  Sitemap submission failed: ${err.message}`);
}

// ── 2. URL Inspection ──────────────────────────────────────────────
console.log('\n=== URL Inspection Results ===\n');
const needsManualRequest = [];

for (const url of SITEMAP_URLS) {
  try {
    const { data } = await searchconsole.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: url,
        siteUrl: SITE_URL,
      },
    });

    const idx = data.inspectionResult?.indexStatusResult || {};
    const isIndexed = idx.verdict === 'PASS';
    const icon = isIndexed ? 'OK' : 'NEEDS ATTENTION';

    console.log(`  [${icon}] ${url}`);
    console.log(`         coverage: ${idx.coverageState || '-'}`);

    if (!isIndexed) {
      needsManualRequest.push({ url, reason: idx.coverageState });
    }
  } catch (err) {
    console.error(`  [ERROR] ${url} -- ${err.message}`);
    needsManualRequest.push({ url, reason: `API error: ${err.message}` });
  }
}

// ── 3. Checklist ───────────────────────────────────────────────────
if (needsManualRequest.length > 0) {
  console.log('\n=== Manual "Request Indexing" Needed ===\n');
  console.log('  Open each URL in GSC URL Inspection tool and click "Request Indexing":\n');
  for (const { url, reason } of needsManualRequest) {
    console.log(`  [ ] ${url}`);
    console.log(`      reason: ${reason}`);
  }
  console.log(`\n  Total: ${needsManualRequest.length} URLs need manual re-indexing request.`);
} else {
  console.log('\n  All URLs are indexed! No action needed.');
}
console.log('');
