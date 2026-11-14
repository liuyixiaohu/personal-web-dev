import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

import { triggerNotification, waitForDeployment } from '../notify-subscribers.mjs';

async function loadSubscriptionsModule() {
  const source = await readFile('src/server/subscriptions.ts', 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
}

test('update email is determined by updated_at and new_event_ids count', async () => {
  const { buildUpdateEmail } = await loadSubscriptionsModule();
  const email = buildUpdateEmail(
    '2026-11-12T10:10:36.883321+00:00',
    2,
    'https://kunli.co/events/',
    'https://kunli.co/api/subscriptions/unsubscribe?token=test',
  );
  assert.match(email.subject, /^2 new/);
  assert.match(email.text, /November 12, 2026/);
  assert.match(email.text, /https:\/\/kunli\.co\/events\//);
  assert.match(email.html, /Unsubscribe with one click/);
});

test('batch idempotency keys are stable per update and batch', async () => {
  const { batchIdempotencyKey } = await loadSubscriptionsModule();
  const first = await batchIdempotencyKey('2026-11-12T10:10:36.883321+00:00', 0);
  const replay = await batchIdempotencyKey('2026-11-12T10:10:36.883321+00:00', 0);
  const nextBatch = await batchIdempotencyKey('2026-11-12T10:10:36.883321+00:00', 1);
  assert.equal(first, replay);
  assert.notEqual(first, nextBatch);
  assert.ok(first.length <= 256);
});

test('deployment waiter ignores stale production data', async () => {
  let calls = 0;
  const expected = { updated_at: '2026-11-12T10:10:36.883321+00:00', new_event_ids: ['new'] };
  const deployed = await waitForDeployment({
    expected,
    timeoutMs: 100,
    pollMs: 0,
    fetchImpl: async () => {
      calls += 1;
      return Response.json(
        calls === 1
          ? { updated_at: '2026-11-11T09:47:16.448554+00:00', new_event_ids: [] }
          : expected,
      );
    },
  });
  assert.equal(calls, 2);
  assert.equal(deployed.updated_at, expected.updated_at);
});

test('notification trigger sends the secret only in the authorization header', async () => {
  let captured;
  const eventData = { updated_at: '2026-11-12T10:10:36.883321+00:00', new_event_ids: ['a'] };
  await triggerNotification({
    eventData,
    secret: 'test-secret-value',
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return Response.json({ status: 'completed' });
    },
  });
  assert.equal(captured.init.headers.Authorization, 'Bearer test-secret-value');
  assert.doesNotMatch(captured.url, /test-secret-value/);
  assert.doesNotMatch(captured.init.body, /test-secret-value/);
});

test('migration defines idempotent runs and one delivery per subscriber per run', async () => {
  const migration = await readFile('migrations/0001_email_subscriptions.sql', 'utf8');
  assert.match(migration, /updated_at TEXT PRIMARY KEY/);
  assert.match(migration, /UNIQUE \(run_updated_at, subscriber_id\)/);
  assert.match(migration, /unsubscribe_token TEXT NOT NULL UNIQUE/);
});

test('confirmation cooldown is enforced by the atomic subscriber upsert', async () => {
  const source = await readFile('src/server/subscriptions.ts', 'utf8');
  assert.match(source, /WHERE subscribers\.status != 'confirmed'/);
  assert.match(source, /subscribers\.last_confirmation_sent_at < \?/);
  assert.match(source, /if \(!stored\.meta\.changes\)/);
});
