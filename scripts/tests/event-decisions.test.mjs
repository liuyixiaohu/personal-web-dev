import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pruneDecisions } from '../../src/components/events/eventUtils.ts';

const NOW = Date.parse('2026-11-15T20:00:00.000Z');
const MARKED_LONG_AGO = '2026-11-03T09:57:09.183Z';

function decision(apiId, startAt, at = MARKED_LONG_AGO) {
  return {
    status: 'ignored',
    at,
    event: {
      api_id: apiId,
      name: 'Builder Night',
      start_at: startAt,
    },
  };
}

test('a handled event stays handled until its Pacific start day passes', () => {
  const kept = pruneDecisions(
    { 'evt-future': decision('evt-future', '2026-11-18T01:00:00.000Z') },
    NOW,
  );
  assert.equal('evt-future' in kept, true);
});

test('a handled event is dropped once its Pacific start day is past', () => {
  const kept = pruneDecisions(
    { 'evt-past': decision('evt-past', '2026-11-15T07:00:00.000Z') },
    NOW,
  );
  assert.deepEqual(kept, {});
});

test('a moved event stays handled when the live catalog date is still ahead', () => {
  const saved = decision('evt-moved', '2026-11-15T07:00:00.000Z');
  const kept = pruneDecisions({ 'evt-moved': saved }, NOW, [
    { api_id: 'evt-moved', start_at: '2026-11-20T01:00:00.000Z' },
  ]);
  assert.equal(kept['evt-moved'], saved);
});

test('a past event is dropped when the live catalog no longer lists it', () => {
  const kept = pruneDecisions(
    { 'evt-past': decision('evt-past', '2026-11-15T07:00:00.000Z') },
    NOW,
    [{ api_id: 'evt-other', start_at: '2026-11-20T01:00:00.000Z' }],
  );
  assert.deepEqual(kept, {});
});
