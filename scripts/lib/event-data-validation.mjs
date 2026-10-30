import { readFileSync } from 'node:fs';

const bayAreaConfig = JSON.parse(
  readFileSync(new URL('./bay-area-locations.json', import.meta.url), 'utf8'),
);

function normalizePlace(value) {
  return String(value ?? '')
    .toLocaleLowerCase('en-US')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const allowedCities = new Set(bayAreaConfig.cities.map(normalizePlace));
const allowedRegions = new Set(bayAreaConfig.regions.map(normalizePlace));
const allowedCountryCodes = new Set(bayAreaConfig.country_codes.map(normalizePlace));

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validateBayAreaGeo(geo) {
  if (!isRecord(geo)) return 'must be an object';

  const city = normalizePlace(geo.city);
  const region = normalizePlace(geo.region);
  const regionShort = normalizePlace(geo.region_short);
  const countryCode = normalizePlace(geo.country_code);
  const latitude = geo.latitude;
  const longitude = geo.longitude;

  if (!city || (!region && !regionShort) || !countryCode) {
    return 'must include structured city, region, and country';
  }
  if (!allowedCountryCodes.has(countryCode)) return 'country must be US';
  if (!allowedRegions.has(region) && !allowedRegions.has(regionShort)) {
    return 'region must be California';
  }
  if (!allowedCities.has(city)) return `${geo.city} is not in the configured nine-county Bay Area`;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return 'must include numeric coordinates';
  }

  const bounds = bayAreaConfig.coordinate_bounds;
  if (
    latitude < bounds.min_latitude ||
    latitude > bounds.max_latitude ||
    longitude < bounds.min_longitude ||
    longitude > bounds.max_longitude
  ) {
    return `coordinates ${latitude}, ${longitude} are outside the Bay Area`;
  }
  return null;
}

function isIsoTimestamp(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function requireTimestamp(errors, path, value, { optional = false } = {}) {
  if (optional && (value === null || value === undefined || value === '')) return;
  if (!isIsoTimestamp(value)) errors.push(`${path} must be an ISO timestamp`);
}

function requireNonEmptyString(errors, path, value) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

export function validateEventData(publicData, seenData) {
  const errors = [];

  if (!isRecord(publicData)) return ['public data root must be an object'];
  if (!isRecord(seenData)) return ['seen state root must be an object'];

  requireTimestamp(errors, 'updated_at', publicData.updated_at);
  requireTimestamp(errors, 'previous_updated_at', publicData.previous_updated_at, {
    optional: true,
  });
  requireTimestamp(errors, 'last_pruned_at', seenData.last_pruned_at, { optional: true });

  if (!Array.isArray(publicData.events)) errors.push('public events must be an array');
  if (!Array.isArray(publicData.new_event_ids)) errors.push('new_event_ids must be an array');
  if (!isRecord(seenData.events)) errors.push('seen state events must be an object');
  if (errors.length > 0) return errors;

  const ids = [];
  const seenIds = new Set();

  for (const [index, event] of publicData.events.entries()) {
    const path = `events[${index}]`;
    if (!isRecord(event)) {
      errors.push(`${path} must be an object`);
      continue;
    }

    for (const field of ['api_id', 'name', 'url', 'start_at', 'first_seen_at']) {
      requireNonEmptyString(errors, `${path}.${field}`, event[field]);
    }
    requireTimestamp(errors, `${path}.start_at`, event.start_at);
    requireTimestamp(errors, `${path}.end_at`, event.end_at, { optional: true });
    requireTimestamp(errors, `${path}.first_seen_at`, event.first_seen_at);

    const geoError = validateBayAreaGeo(event.geo);
    if (geoError) errors.push(`${path}.geo ${geoError}`);
    if (
      isRecord(event.geo) &&
      typeof event.location === 'string' &&
      !normalizePlace(event.location).startsWith(normalizePlace(event.geo.city))
    ) {
      errors.push(`${path}.location must agree with structured city ${event.geo.city}`);
    }

    if (typeof event.api_id !== 'string' || event.api_id.trim() === '') continue;
    ids.push(event.api_id);
    if (seenIds.has(event.api_id)) errors.push(`${path} has duplicate api_id ${event.api_id}`);
    seenIds.add(event.api_id);

    if (!(event.api_id in seenData.events)) {
      errors.push(`${path}.api_id ${event.api_id} is missing from seen state`);
    }
  }

  const declaredIds = publicData.new_event_ids.filter((value) => typeof value === 'string');
  if (
    declaredIds.length !== publicData.new_event_ids.length ||
    JSON.stringify([...declaredIds].sort()) !== JSON.stringify([...ids].sort())
  ) {
    errors.push('new_event_ids must exactly match public event api_id values');
  }

  for (const [id, state] of Object.entries(seenData.events)) {
    if (!isRecord(state)) {
      errors.push(`seen state ${id} must be an object`);
      continue;
    }
    requireTimestamp(errors, `seen state ${id}.first_seen_at`, state.first_seen_at);
    requireTimestamp(errors, `seen state ${id}.end_at`, state.end_at, { optional: true });
  }

  return errors;
}
