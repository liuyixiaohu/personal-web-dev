<script lang="ts">
  import {
    formatEventRange,
    formatPrice,
    formatUpdatedAt,
    hostDisplay,
    locationDisplay,
    presenterDisplay,
    type EventDecision,
    type LumaEvent,
  } from './eventUtils';

  interface Props {
    event: LumaEvent;
    /** Set when this card is in Handled. Absent on the upcoming list. */
    decision?: EventDecision;
    /** First listed on the same Pacific day as the latest check. */
    isNew?: boolean;
    onApplied: () => void;
    onIgnore: () => void;
    onRestore: () => void;
  }

  let { event, decision, isNew = false, onApplied, onIgnore, onRestore }: Props = $props();
  let decisionLabel = $derived(
    decision?.status === 'applied' ? 'Applied' : decision ? 'Ignored' : '',
  );
  let decisionWhen = $derived(decision ? formatUpdatedAt(decision.at) : '');
  // "Presented by" is the calendar Luma shows, which reads better than the long
  // host list. Fall back to hosts when there is no real calendar (e.g. Personal).
  let presenter = $derived(presenterDisplay(event));
  let hosts = $derived(presenter ? '' : hostDisplay(event));
</script>

<li class="event-card list-row" id="event-{event.api_id}">
  <div class="event-actions">
    {#if decision}
      <span class="event-decision">
        {decisionLabel}{#if decisionWhen}&nbsp;· {decisionWhen}{/if}
      </span>
      <button type="button" class="event-action" onclick={onRestore}>Restore</button>
    {:else}
      <button
        type="button"
        class="event-action"
        onclick={onApplied}
        title="Mark as applied and hide it from the list"
      >
        Applied
      </button>
      <button
        type="button"
        class="event-action"
        onclick={onIgnore}
        title="Ignore this event and hide it from the list"
      >
        Ignore
      </button>
    {/if}
  </div>

  <div class="event-card-header">
    <div class="event-name-row">
      {#if isNew}
        <span class="event-new">New</span>
      {/if}
      <a href={event.url || '#'} target="_blank" rel="noopener noreferrer" class="event-name">
        {event.name}
      </a>
    </div>
    <span
      class="event-price"
      class:event-price--free={event.is_free}
      class:event-price--approval={!event.is_free && event.price_cents == null}
      class:event-price--paid={!event.is_free && event.price_cents != null}
    >
      {formatPrice(event)}
    </span>
  </div>

  {#if event.summary}
    <p class="event-summary">{event.summary}</p>
  {/if}

  <div class="event-card-details">
    <span class="event-date"
      ><svg
        class="icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><path d="M8 2v4" /><path d="M16 2v4" /><rect
          width="18"
          height="18"
          x="3"
          y="4"
          rx="2"
        /><path d="M3 10h18" /></svg
      >{formatEventRange(event.start_at, event.end_at, event.timezone)}</span
    >

    {#if locationDisplay(event)}
      <span class="event-location"
        ><svg
          class="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path
            d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
          /><circle cx="12" cy="10" r="3" /></svg
        >{locationDisplay(event)}</span
      >
    {/if}

    {#if presenter}
      <span class="event-hosts"
        ><svg
          class="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle
            cx="12"
            cy="7"
            r="4"
          /></svg
        >{presenter}</span
      >
    {:else if hosts}
      <span class="event-hosts"
        ><svg
          class="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle
            cx="12"
            cy="7"
            r="4"
          /></svg
        >{hosts}</span
      >
    {/if}

    {#if event.guest_count > 0}
      <span class="event-guests"
        ><svg
          class="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path
            d="M16 3.128a4 4 0 0 1 0 7.744"
          /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><circle cx="9" cy="7" r="4" /></svg
        >{event.guest_count} guests</span
      >
    {/if}
  </div>
</li>

<style>
  .event-summary {
    margin: 0 0 var(--space-xs);
    color: var(--text);
    line-height: 1.5;
  }

  .event-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-sm);
    margin-bottom: 0.3rem;
  }

  .event-name-row {
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
    min-width: 0;
  }

  .event-new {
    flex-shrink: 0;
    font-size: var(--fs-xs);
    font-weight: 600;
    line-height: 1.4;
    color: var(--color-visual);
    border: 1px solid var(--color-visual);
    border-radius: var(--radius-sm);
    padding: 0 0.3em;
  }

  .event-name {
    font-size: var(--fs-md);
    font-weight: 600;
    color: var(--text);
    text-decoration: none;
    line-height: 1.4;
  }

  .event-name:hover {
    opacity: 0.6;
  }

  .event-price {
    font-size: var(--fs-xs);
    line-height: 1.5;
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

  .event-date,
  .event-location,
  .event-hosts,
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

  .event-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.45rem;
  }

  .event-action {
    font-family: inherit;
    font-size: var(--fs-xs);
    color: var(--text);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0.28em 0.7em;
    cursor: pointer;
    line-height: 1.4;
  }

  .event-action:hover {
    border-color: var(--text-light);
  }

  .event-decision {
    font-size: var(--fs-xs);
    color: var(--text-light);
    line-height: 1.4;
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
