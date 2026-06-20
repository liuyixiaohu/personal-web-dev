import { readFileSync } from 'node:fs';

import { validateEventData } from './lib/event-data-validation.mjs';

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.error(`${path} could not be parsed: ${error.message}`);
    process.exit(1);
  }
}

const publicData = readJson('public/data/events.json');
const seenData = readJson('data/seen_events.json');
const errors = validateEventData(publicData, seenData);

if (errors.length > 0) {
  console.error('Event-data verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Event-data verification passed.');
