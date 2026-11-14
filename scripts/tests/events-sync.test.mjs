import assert from 'node:assert/strict';
import { test } from 'node:test';
import { onRequestPost } from '../../functions/api/sync/[action].ts';
import { compactSettings } from '../../src/components/events/syncPayload.ts';

function fixture() {
  const values = new Map();
  const env = {
    EVENTS_SYNC: {
      get: async (key) => values.get(key) ?? null,
      put: async (key, value) => values.set(key, value),
      delete: async (key) => values.delete(key),
    },
  };
  async function post(action, body) {
    const request = new Request(`https://example.com/api/sync/${action}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const response = await onRequestPost({ request, env, params: { action } });
    return { status: response.status, data: await response.json() };
  }
  return { values, post };
}

function settings() {
  return {
    excludeKeywords: [],
    selectedLocations: [],
    selectedDays: [],
    newOnly: false,
    decisions: {},
  };
}

test('sync payload omits unused event fields and retains handled-card fallbacks', () => {
  const input = settings();
  input.decisions.evt1 = {
    status: 'ignored',
    at: '2026-11-11T00:00:00.000Z',
    event: {
      api_id: 'evt1',
      name: 'Example event',
      url: 'https://example.com/e',
      start_at: '2026-11-12T00:00:00.000Z',
      end_at: '2026-11-12T01:00:00.000Z',
      timezone: 'America/Los_Angeles',
      location: 'San Francisco',
      location_type: 'physical',
      calendar_name: 'Example calendar',
      host_names: ['Host'],
      guest_count: 7,
      is_free: true,
      price_cents: null,
      price_currency: null,
      categories: ['AI'],
      first_seen_at: '2026-11-10T00:00:00.000Z',
      summary: 'A useful local summary',
    },
  };
  const compact = compactSettings(input);
  const event = compact.decisions.evt1.event;
  assert.equal(event.name, 'Example event');
  assert.equal(event.url, 'https://example.com/e');
  assert.equal(event.first_seen_at, '2026-11-10T00:00:00.000Z');
  assert.equal('summary' in event, false);
  assert.equal('categories' in event, false);
  assert.equal(input.decisions.evt1.event.summary, 'A useful local summary');
});

test('a valid sync request larger than the former 256 KiB limit succeeds', async () => {
  const { post, values } = fixture();
  const input = settings();
  input.excludeKeywords = Array.from({ length: 500 }, () => 'a'.repeat(300));
  input.selectedLocations = Array.from({ length: 500 }, () => 'b'.repeat(300));
  assert.ok(Buffer.byteLength(JSON.stringify({ settings: input })) > 256 * 1024);

  const created = await post('create', { settings: input });
  assert.equal(created.status, 200);
  assert.equal(values.size, 1);
  const pulled = await post('pull', { code: created.data.code });
  assert.equal(pulled.status, 200);
  assert.deepEqual(pulled.data.settings.excludeKeywords, input.excludeKeywords);
});

test('the 4 MiB byte limit rejects oversized requests before storage', async () => {
  const { post, values } = fixture();
  const oversized = await post('create', { settings: settings(), padding: '中'.repeat(1_400_000) });
  assert.equal(oversized.status, 413);
  assert.equal(oversized.data.error, 'Request is too large');
  assert.equal(values.size, 0);
});

test('old decision snapshots remain readable after the storage field change', async () => {
  const { post, values } = fixture();
  const created = await post('create', { settings: settings() });
  const [key] = values.keys();
  const stored = JSON.parse(values.get(key));
  stored.settings.decisions.evt1 = {
    status: 'ignored',
    at: new Date().toISOString(),
    event: { api_id: 'evt1', name: 'Legacy event', categories: ['AI'] },
  };
  values.set(key, JSON.stringify(stored));

  const pulled = await post('pull', { code: created.data.code });
  assert.equal(pulled.status, 200);
  assert.equal(pulled.data.settings.decisions.evt1.event.name, 'Legacy event');

  const pushed = await post('push', { code: created.data.code, settings: pulled.data.settings });
  assert.equal(pushed.status, 200);
  const updated = JSON.parse(values.get(key));
  assert.deepEqual(updated.settings.decisions.evt1.event, {
    api_id: 'evt1',
    name: 'Legacy event',
  });
});
