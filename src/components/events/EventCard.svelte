<script lang="ts">
  import type { Lang } from '../../i18n/translations';
  import { t } from '../../i18n/langStore';
  import { formatEventRange, formatPrice, locationDisplay, type LumaEvent } from './eventUtils';
  import { eventBuckets, BUCKET_LABEL_KEYS, type CategoryBucket } from '../../utils/events/categories';

  interface Props {
    event: LumaEvent;
    lang: Lang;
    /** Show category badges: 'never' (default), 'multi' (only if event spans >1 bucket), 'always'. */
    badgeMode?: 'never' | 'multi' | 'always';
  }

  let { event, lang, badgeMode = 'never' }: Props = $props();

  let buckets = $derived(eventBuckets(event));
  let showBadges = $derived(
    badgeMode === 'always' || (badgeMode === 'multi' && buckets.length > 1)
  );
</script>

<li class="event-card" id="event-{event.api_id}">
  <div class="event-card-header">
    <a href={event.url || '#'} target="_blank" rel="noopener noreferrer" class="event-name"
      >
      {event.name}
    </a>
    <span class="event-price" class:event-price--free={event.is_free} class:event-price--approval={!event.is_free && event.price_cents == null} class:event-price--paid={!event.is_free && event.price_cents != null}>
      {formatPrice(event)}
    </span>
  </div>

  {#if showBadges}
    <div class="event-badges">
      {#each buckets as bucket (bucket)}
        <span class="event-badge event-badge--{bucket}">{t(BUCKET_LABEL_KEYS[bucket])}</span>
      {/each}
    </div>
  {/if}

  <div class="event-card-details">
    <span class="event-date"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>{formatEventRange(event.start_at, event.end_at, event.timezone, lang)}</span>

    {#if locationDisplay(event)}
      <span class="event-location"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>{locationDisplay(event)}</span>
    {/if}

    {#if event.guest_count > 0}
      <span class="event-guests"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>{event.guest_count} {t('events.guests')}</span>
    {/if}
  </div>
</li>

<style>
  .event-card {
    padding: var(--space-sm) 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  }

  .event-card:last-child {
    border-bottom: none;
  }

  .event-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-sm);
    margin-bottom: 0.3rem;
  }

  .event-name {
    font-size: var(--fs-base);
    font-weight: 500;
    color: var(--text);
    text-decoration: none;
    line-height: 1.4;
  }

  .event-name:hover {
    opacity: 0.6;
  }

  .event-price {
    font-size: var(--fs-xs);
    color: var(--text-light);
    white-space: nowrap;
    flex-shrink: 0;
    padding: 0.15em 0.5em;
    border-radius: var(--radius-sm);
    background: rgba(0, 0, 0, 0.03);
  }

  .event-price--free {
    color: var(--color-visual);
    background: rgba(221, 238, 231, 0.3);
  }

  .event-price--approval {
    color: var(--color-journey);
    background: rgba(127, 182, 221, 0.1);
  }

  .event-price--paid {
    color: var(--color-pm);
    background: rgba(154, 104, 104, 0.08);
  }

  .event-card-details {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 1rem;
    font-size: var(--fs-xs);
    color: var(--text-light);
    line-height: 1.5;
  }

  .event-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin: 0 0 0.3rem;
  }

  .event-badge {
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    padding: 0.1em 0.5em;
    border-radius: var(--radius-sm);
    border: 1px solid currentColor;
    line-height: 1.5;
    white-space: nowrap;
  }

  .event-badge--tech-ai  { color: var(--color-ds);     background: rgba(90, 122, 148, 0.06); }
  .event-badge--food     { color: var(--color-pm);     background: rgba(154, 104, 104, 0.06); }
  .event-badge--arts     { color: var(--color-rose);   background: rgba(217, 121, 123, 0.06); }
  .event-badge--fitness  { color: var(--color-visual); background: rgba(90, 138, 110, 0.06); }
  .event-badge--wellness { color: var(--color-ds-mid); background: rgba(122, 154, 180, 0.06); }

  .event-date,
  .event-location,
  .event-guests {
    display: inline-flex;
    align-items: center;
  }

  .icon {
    width: 0.9em;
    height: 0.9em;
    margin-right: 0.25em;
    flex-shrink: 0;
  }

  /* Chinese font overrides */
  :global(html[data-lang="zh"]) .event-name,
  :global(html[data-lang="zh"]) .event-card-details {
    font-family: var(--font-zh);
    font-style: normal;
  }

  /* Mobile */
  @media (max-width: 480px) {
    .event-card-header {
      flex-direction: column;
      gap: 0.3rem;
    }

    .event-price {
      align-self: flex-start;
    }
  }
</style>
