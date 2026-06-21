import assert from 'node:assert/strict';
import test from 'node:test';

import { validateEventData } from '../lib/event-data-validation.mjs';

const event = {
  api_id: 'evt-123',
  name: 'Example event',
  url: 'https://lu.ma/example',
  start_at: '2026-06-21T17:00:00.000Z',
  end_at: '2026-06-21T18:00:00.000Z',
  timezone: 'America/Los_Angeles',
  location: 'San Francisco, CA',
  location_type: 'offline',
  calendar_name: 'Example',
  host_names: ['Kun'],
  guest_count: 10,
  is_free: true,
  price_cents: null,
  price_currency: null,
  categories: ['Tech Events (Bay Area)'],
  first_seen_at: '2026-06-20T06:47:10.490Z',
};

const validPublic = {
  updated_at: '2026-06-20T06:47:10.490Z',
  previous_updated_at: '2026-06-19T06:47:10.490Z',
  new_event_ids: ['evt-123'],
  events: [event],
};

const validSeen = {
  last_pruned_at: '2026-06-18T06:47:10.490Z',
  events: {
    'evt-123': {
      first_seen_at: '2026-06-20T06:47:10.490Z',
      end_at: '2026-06-21T18:00:00.000Z',
    },
  },
};

test('valid event output and seen state pass', () => {
  assert.deepEqual(validateEventData(validPublic, validSeen), []);
});

test('duplicate event ids fail', () => {
  const errors = validateEventData({ ...validPublic, events: [event, event] }, validSeen);

  assert.ok(errors.some((error) => error.includes('duplicate api_id')));
});

test('new_event_ids must exactly match event api ids', () => {
  const errors = validateEventData({ ...validPublic, new_event_ids: [] }, validSeen);

  assert.ok(errors.some((error) => error.includes('new_event_ids')));
});

test('each public event must exist in seen state', () => {
  const errors = validateEventData(validPublic, { last_pruned_at: null, events: {} });

  assert.ok(errors.some((error) => error.includes('seen state')));
});

test('invalid timestamps and missing required fields fail', () => {
  const invalid = {
    ...event,
    name: '',
    start_at: 'not-a-date',
  };
  const errors = validateEventData({ ...validPublic, events: [invalid] }, validSeen);

  assert.ok(errors.some((error) => error.includes('name')));
  assert.ok(errors.some((error) => error.includes('start_at')));
});
