import { readFile } from 'node:fs/promises';

const DEFAULT_SITE_URL = 'https://kunli.co';
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;
const DEFAULT_POLL_MS = 15 * 1000;

function validateEventData(value, source) {
  if (!value || typeof value !== 'object') throw new Error(`${source} is not an object`);
  if (typeof value.updated_at !== 'string' || Number.isNaN(Date.parse(value.updated_at))) {
    throw new Error(`${source} has an invalid updated_at`);
  }
  if (
    !Array.isArray(value.new_event_ids) ||
    !value.new_event_ids.every((id) => typeof id === 'string')
  ) {
    throw new Error(`${source} has invalid new_event_ids`);
  }
  return value;
}

export async function waitForDeployment({
  expected,
  siteUrl = DEFAULT_SITE_URL,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  pollMs = DEFAULT_POLL_MS,
  fetchImpl = fetch,
}) {
  const deadline = Date.now() + timeoutMs;
  const url = `${siteUrl.replace(/\/$/, '')}/data/events.json`;
  while (Date.now() < deadline) {
    const response = await fetchImpl(`${url}?notification_check=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (response.ok) {
      const deployed = validateEventData(await response.json(), 'deployed events.json');
      if (deployed.updated_at === expected.updated_at) return deployed;
    }
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
  throw new Error(`Timed out waiting for deployed events.json updated_at ${expected.updated_at}`);
}

export async function triggerNotification({
  eventData,
  secret,
  siteUrl = DEFAULT_SITE_URL,
  fetchImpl = fetch,
}) {
  if (!secret) throw new Error('EVENT_NOTIFY_SECRET is required');
  const response = await fetchImpl(`${siteUrl.replace(/\/$/, '')}/api/subscriptions/notify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      updated_at: eventData.updated_at,
      new_event_ids: eventData.new_event_ids,
    }),
  });
  if (!response.ok) throw new Error(`Notification endpoint returned HTTP ${response.status}`);
  return response.json();
}

async function main() {
  const local = validateEventData(
    JSON.parse(await readFile(new URL('../public/data/events.json', import.meta.url), 'utf8')),
    'local events.json',
  );
  const siteUrl = process.env.SITE_URL || DEFAULT_SITE_URL;
  console.log(`Waiting for deployed events version ${local.updated_at}`);
  await waitForDeployment({ expected: local, siteUrl });
  const result = await triggerNotification({
    eventData: local,
    secret: process.env.EVENT_NOTIFY_SECRET,
    siteUrl,
  });
  console.log(`Notification run status: ${String(result.status || 'accepted')}`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
