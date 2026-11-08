import type { LumaEvent } from './eventUtils';

export const EMBEDDINGS_URL = '/data/event-embeddings.json';
export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
export const EMBEDDING_REVISION = '751bff37182d3f1213fa05d7196b954e230abad9';

export interface EmbeddingCatalog {
  model: string;
  revision: string;
  dimension: number;
  items: Record<string, { hash: string; vector: number[] }>;
}

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'at',
  'for',
  'in',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
  'i',
  'im',
  'me',
  'my',
  'want',
  'would',
  'like',
  'event',
  'events',
]);

function terms(text: string): string[] {
  return [...new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? [])].filter(
    (term) => term.length > 1 && !STOP_WORDS.has(term),
  );
}

function coverage(queryTerms: string[], text: string): number {
  if (!queryTerms.length || !text) return 0;
  const words = new Set(terms(text));
  return queryTerms.filter((term) => words.has(term)).length / queryTerms.length;
}

function dot(left: number[], right: number[]): number {
  if (left.length !== right.length) return 0;
  let sum = 0;
  for (let i = 0; i < left.length; i++) sum += left[i] * right[i];
  return Math.max(0, sum);
}

/** Factual summary drives relevance. Title can only provide a small exact-word boost. */
export function intentScore(
  event: LumaEvent,
  queryTerms: string[],
  queryVector?: number[],
  catalog?: EmbeddingCatalog,
): number {
  const stored = catalog?.items[event.api_id]?.vector;
  const semantic = event.summary && queryVector && stored ? dot(queryVector, stored) : 0;
  return (
    0.75 * semantic +
    0.2 * coverage(queryTerms, event.summary ?? '') +
    0.05 * coverage(queryTerms, event.name)
  );
}

/** Input is already in start-time order; sorting never crosses a date boundary. */
export function rankWithinDay(
  events: LumaEvent[],
  intent: string,
  queryVector?: number[],
  catalog?: EmbeddingCatalog,
): LumaEvent[] {
  const queryTerms = terms(intent);
  if (!queryTerms.length && !queryVector) return events;
  return [...events].sort((left, right) => {
    const difference =
      intentScore(right, queryTerms, queryVector, catalog) -
      intentScore(left, queryTerms, queryVector, catalog);
    return difference || left._startMs! - right._startMs!;
  });
}
