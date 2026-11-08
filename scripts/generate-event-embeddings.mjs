// Publish normalized summary vectors for browser-side intent matching.
// Only changed summaries are embedded; vectors are keyed by event API ID.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { pipeline } from '@huggingface/transformers';

const eventsPath = new URL('../public/data/events.json', import.meta.url);
const outputPath = new URL('../public/data/event-embeddings.json', import.meta.url);
const model = 'Xenova/all-MiniLM-L6-v2';
const revision = '751bff37182d3f1213fa05d7196b954e230abad9';
const dimension = 384;
const catalog = JSON.parse(await readFile(eventsPath, 'utf8'));
let previous = { items: {} };
try {
  previous = JSON.parse(await readFile(outputPath, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const compatible = previous.model === model && previous.revision === revision;
const items = {};
const pending = [];
for (const event of catalog.events) {
  if (!event.summary) continue;
  const hash = createHash('sha256').update(event.summary).digest('hex');
  const cached = compatible && previous.items?.[event.api_id];
  if (cached?.hash === hash && cached.vector?.length === dimension) {
    items[event.api_id] = cached;
  } else {
    pending.push({ id: event.api_id, summary: event.summary, hash });
  }
}

if (pending.length) {
  const extractor = await pipeline('feature-extraction', model, {
    dtype: 'q8',
    revision,
  });
  for (const [index, event] of pending.entries()) {
    const output = await extractor(event.summary, { pooling: 'mean', normalize: true });
    const vector = Array.from(output.data);
    if (vector.length !== dimension || vector.some((value) => !Number.isFinite(value))) {
      throw new Error(`Invalid embedding for ${event.id}`);
    }
    items[event.id] = { hash: event.hash, vector: vector.map((value) => +value.toFixed(6)) };
    if ((index + 1) % 25 === 0) console.log(`Embedded ${index + 1}/${pending.length}`);
  }
}

const result = { model, revision, dimension, items };
await writeFile(outputPath, `${JSON.stringify(result)}\n`);
console.log(`Published ${Object.keys(items).length} vectors (${pending.length} new or changed)`);
