<script lang="ts">
  import type { Lang } from '../../i18n/translations';
  import { t } from '../../i18n/langStore';
  import { formatEventRange, formatPrice, locationDisplay, type LumaEvent } from './eventUtils';
  import { track } from '../../utils/analytics';

  interface Props {
    event: LumaEvent;
    lang: Lang;
  }

  let { event, lang }: Props = $props();
</script>

<li class="event-card" id="event-{event.api_id}">
  <div class="event-card-header">
    <a href={event.url} target="_blank" rel="noopener noreferrer" class="event-name"
       onclick={() => track('event_card_click', { event_name: event.name, event_url: event.url })}>
      {event.name}
    </a>
    <span class="event-price" class:event-price--free={event.is_free} class:event-price--eventbrite={event.source === 'eventbrite' && event.price_cents == null} class:event-price--approval={event.source !== 'eventbrite' && !event.is_free && event.price_cents == null} class:event-price--paid={!event.is_free && event.price_cents != null}>
      {formatPrice(event)}
    </span>
  </div>

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
    border-radius: 3px;
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

  .event-price--eventbrite {
    color: #D9797B;
    background: rgba(240, 215, 215, 0.3);
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
