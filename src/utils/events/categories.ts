/**
 * Category bucket mapping for Luma events.
 *
 * Events fetched from multiple Luma category API calls accumulate labels in
 * `event.categories[]` (one entry per source the event was returned under).
 * We group these source labels into 5 user-facing buckets — "tech-ai" combines
 * Tech and AI since they overlap heavily in the data.
 */

export type CategoryBucket = 'tech-ai' | 'food' | 'arts' | 'fitness' | 'wellness';

/** Map from user-facing bucket → Luma source labels (as stored in event.categories) */
export const BUCKET_TO_LABELS: Record<CategoryBucket, string[]> = {
  'tech-ai':  ['Tech Events (Bay Area)', 'AI Events (Bay Area)'],
  'food':     ['Food & Drink Events (Bay Area)'],
  'arts':     ['Arts & Culture Events (Bay Area)'],
  'fitness':  ['Fitness Events (Bay Area)'],
  'wellness': ['Wellness Events (Bay Area)'],
};

export const ALL_BUCKETS: CategoryBucket[] = ['tech-ai', 'food', 'arts', 'fitness', 'wellness'];

/** The 4 new buckets (i.e. not tech-ai) — used by the "Today's New (Lifestyle)" tile */
export const NEW_BUCKETS: CategoryBucket[] = ['food', 'arts', 'fitness', 'wellness'];

/** Buckets this event belongs to, derived from its `categories[]` field. */
export function eventBuckets(event: { categories?: string[] }): CategoryBucket[] {
  const cats = event.categories ?? [];
  return ALL_BUCKETS.filter((b) =>
    BUCKET_TO_LABELS[b].some((label) => cats.includes(label))
  );
}

/** Display label for each bucket. */
export const BUCKET_LABELS: Record<CategoryBucket, string> = {
  'tech-ai':  'Tech & AI',
  'food':     'Food & Drink',
  'arts':     'Arts & Culture',
  'fitness':  'Fitness',
  'wellness': 'Wellness',
};
