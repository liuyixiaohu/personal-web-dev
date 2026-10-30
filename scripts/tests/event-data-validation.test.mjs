import assert from 'node:assert/strict';
import test from 'node:test';

import { validateBayAreaGeo, validateEventData } from '../lib/event-data-validation.mjs';

const event = {
  api_id: 'evt-123',
  name: 'Example event',
  url: 'https://lu.ma/example',
  start_at: '2026-06-21T17:00:00.000Z',
  end_at: '2026-06-21T18:00:00.000Z',
  timezone: 'America/Los_Angeles',
  location: 'San Francisco, CA',
  geo: {
    city: 'San Francisco',
    region: 'California',
    region_short: 'CA',
    country_code: 'US',
    latitude: 37.7749,
    longitude: -122.4194,
  },
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

test('representative nine-county Bay Area cities pass', () => {
  const cities = [
    ['Berkeley', 37.8715, -122.273],
    ['Oakland', 37.8044, -122.2712],
    ['Palo Alto', 37.4419, -122.143],
    ['Mountain View', 37.3861, -122.0839],
    ['Sunnyvale', 37.3688, -122.0363],
    ['San Jose', 37.3382, -121.8863],
  ];

  for (const [city, latitude, longitude] of cities) {
    assert.equal(
      validateBayAreaGeo({
        city,
        region: 'California',
        region_short: 'CA',
        country_code: 'US',
        latitude,
        longitude,
      }),
      null,
    );
  }
});

test('DC, Virginia, and New York events fail', () => {
  const outside = [
    ['Washington', 'District of Columbia', 'DC', 38.9072, -77.0369],
    ['Arlington', 'Virginia', 'VA', 38.8816, -77.091],
    ['New York', 'New York', 'NY', 40.7128, -74.006],
  ];

  for (const [city, region, regionShort, latitude, longitude] of outside) {
    assert.match(
      validateBayAreaGeo({
        city,
        region,
        region_short: regionShort,
        country_code: 'US',
        latitude,
        longitude,
      }),
      /region must be California/,
    );
  }
});

test('missing structured location is rejected conservatively', () => {
  assert.match(validateBayAreaGeo({ city: 'San Francisco' }), /structured city/);
});

test('same-named city outside California is rejected', () => {
  assert.match(
    validateBayAreaGeo({
      city: 'Richmond',
      region: 'Virginia',
      region_short: 'VA',
      country_code: 'US',
      latitude: 37.5407,
      longitude: -77.436,
    }),
    /region must be California/,
  );
});

test('Bay Area city text with non-Bay coordinates is rejected', () => {
  assert.match(
    validateBayAreaGeo({
      city: 'San Francisco',
      region: 'California',
      region_short: 'CA',
      country_code: 'US',
      latitude: 34.0522,
      longitude: -118.2437,
    }),
    /coordinates.*outside/,
  );
});

test('display location must agree with structured city', () => {
  const errors = validateEventData(
    {
      ...validPublic,
      events: [{ ...event, location: 'Arlington, VA' }],
    },
    validSeen,
  );

  assert.ok(errors.some((error) => error.includes('location must agree')));
});
