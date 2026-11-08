import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rankWithinDay } from '../../src/components/events/intentRanking.ts';

const earlier = {
  api_id: 'flashy',
  name: 'AI Agents and Startups',
  summary: 'Founders give talks about fundraising.',
  _startMs: 1,
};
const later = {
  api_id: 'workshop',
  name: 'Build Together',
  summary: 'A hands-on workshop where beginners build and test AI agents.',
  _startMs: 2,
};

test('blank intent preserves the existing start-time order', () => {
  assert.deepEqual(rankWithinDay([earlier, later], ''), [earlier, later]);
});

test('factual summary outweighs a flashy title in keyword fallback', () => {
  const ranked = rankWithinDay([earlier, later], 'hands-on AI agents workshop');
  assert.deepEqual(
    ranked.map((event) => event.api_id),
    ['workshop', 'flashy'],
  );
});

test('semantic vector ranks by summary with a small title boost', () => {
  const catalog = {
    model: 'test',
    revision: 'test',
    dimension: 2,
    items: {
      flashy: { hash: '', vector: [0, 1] },
      workshop: { hash: '', vector: [1, 0] },
    },
  };
  const ranked = rankWithinDay([earlier, later], 'AI agents', [1, 0], catalog);
  assert.deepEqual(
    ranked.map((event) => event.api_id),
    ['workshop', 'flashy'],
  );
});
