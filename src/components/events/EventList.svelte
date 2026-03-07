<script lang="ts">
  import { onMount } from 'svelte';
  import { subscribe, initLang, getLang, t } from '../../i18n/langStore';
  import type { Lang } from '../../i18n/translations';

  // --- Types ---
  interface LumaEvent {
    api_id: string;
    name: string;
    url: string;
    start_at: string;
    end_at: string;
    timezone: string;
    location: string;
    location_type: string;
    calendar_name: string;
    host_names: string[];
    guest_count: number;
    is_free: boolean;
    price_cents: number | null;
    price_currency: string | null;
    categories: string[];
  }

  interface EventData {
    updated_at: string;
    events: LumaEvent[];
  }

  // --- Constants ---
  const DATA_URL =
    'https://raw.githubusercontent.com/liuyixiaohu/luma-event-monitor/main/data/new_events.json';
  const STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours

  // --- State ---
  let lang = $state<Lang>('en');
  let events = $state<LumaEvent[]>([]);
  let updatedAt = $state('');
  let loading = $state(true);
  let error = $state(false);
  let isStale = $state(false);

  // force re-render on language change
  let _tick = $state(0);

  // --- Language ---
  initLang();
  lang = getLang();

  $effect(() => {
    const unsub = subscribe((newLang) => {
      lang = newLang;
      _tick += 1;
    });
    return unsub;
  });

  // --- Data fetching ---
  onMount(async () => {
    try {
      const resp = await fetch(DATA_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: EventData = await resp.json();

      events = data.events;
      updatedAt = data.updated_at;

      const updatedTime = new Date(data.updated_at).getTime();
      isStale = Date.now() - updatedTime > STALE_THRESHOLD_MS;
    } catch (e) {
      error = true;
      console.error('Failed to fetch events:', e);
    } finally {
      loading = false;
    }
  });

  // --- Formatting helpers ---
  function formatEventDate(isoStr: string, tz: string): string {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: tz || 'America/Los_Angeles',
      });
    } catch {
      return isoStr;
    }
  }

  function formatUpdatedAt(isoStr: string): string {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  }

  function formatPrice(event: LumaEvent): string {
    if (event.is_free) return t('events.free');
    if (event.price_cents != null) {
      const dollars = event.price_cents / 100;
      const currency = (event.price_currency || 'usd').toUpperCase();
      if (currency === 'USD') return `$${dollars.toFixed(0)}`;
      return `${dollars.toFixed(0)} ${currency}`;
    }
    return t('events.approval');
  }

  function locationDisplay(event: LumaEvent): string {
    if (event.location_type === 'online') return t('events.online');
    return event.location || '';
  }
</script>

{#key _tick}
<div class="event-list">
  <header class="event-header">
    <h2 class="event-title">{t('events.title')}</h2>
    <p class="event-subtitle">{t('events.subtitle')}</p>
  </header>

  {#if loading}
    <p class="event-status">{t('events.loading')}</p>

  {:else if error}
    <p class="event-status event-status--error">{t('events.fetchError')}</p>

  {:else if events.length === 0}
    <div class="event-empty">
      <p>{t('events.noEvents')}</p>
      {#if updatedAt}
        <p class="event-meta">{t('events.lastUpdated')}: {formatUpdatedAt(updatedAt)}</p>
      {/if}
    </div>

  {:else}
    <div class="event-meta-bar">
      <span class="event-count">{events.length} {t('events.eventCount')}</span>
      {#if updatedAt}
        <span class="event-updated">{t('events.lastUpdated')}: {formatUpdatedAt(updatedAt)}</span>
      {/if}
    </div>

    {#if isStale}
      <p class="event-stale">{t('events.staleWarning')}</p>
    {/if}

    <ul class="event-cards">
      {#each events as event (event.api_id)}
        <li class="event-card">
          <div class="event-card-header">
            <a href={event.url} target="_blank" rel="noopener noreferrer" class="event-name">
              {event.name}
            </a>
            <span class="event-price" class:event-price--free={event.is_free}>
              {formatPrice(event)}
            </span>
          </div>

          <div class="event-card-details">
            <span class="event-date">{formatEventDate(event.start_at, event.timezone)}</span>

            {#if locationDisplay(event)}
              <span class="event-location">{locationDisplay(event)}</span>
            {/if}

            {#if event.host_names.length > 0}
              <span class="event-host">{t('events.hostedBy')} {event.host_names.join(', ')}</span>
            {/if}

            {#if event.guest_count > 0}
              <span class="event-guests">{event.guest_count} {t('events.guests')}</span>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>
{/key}

<style>
  .event-list {
    /* container managed by parent page */
  }

  .event-header {
    margin-bottom: var(--space-lg);
  }

  .event-title {
    font-size: var(--fs-lg);
    font-weight: 500;
    color: var(--text);
    margin-bottom: var(--space-xs);
  }

  .event-subtitle {
    font-size: var(--fs-sm);
    color: var(--text-light);
    font-style: italic;
  }

  .event-meta-bar {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 0.75rem;
    color: var(--text-light);
    opacity: 0.6;
    margin-bottom: var(--space-sm);
  }

  .event-status {
    font-size: var(--fs-sm);
    color: var(--text-light);
    font-style: italic;
    text-align: center;
    padding: var(--space-xl) 0;
  }

  .event-status--error {
    color: #9a6868;
  }

  .event-empty {
    text-align: center;
    padding: var(--space-xl) 0;
  }

  .event-empty p {
    font-size: var(--fs-sm);
    color: var(--text-light);
    font-style: italic;
  }

  .event-meta {
    font-size: 0.75rem;
    color: var(--text-light);
    opacity: 0.5;
    margin-top: var(--space-xs);
  }

  .event-stale {
    font-size: 0.78rem;
    color: #9a6868;
    font-style: italic;
    margin-bottom: var(--space-sm);
    padding: var(--space-xs) var(--space-sm);
    background: rgba(240, 215, 215, 0.2);
    border-radius: 4px;
  }

  .event-cards {
    list-style: none;
    padding: 0;
    margin: 0;
  }

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
    font-size: clamp(0.95rem, 0.88rem + 0.3vw, 1.08rem);
    font-weight: 500;
    color: var(--text);
    text-decoration: none;
    line-height: 1.4;
  }

  .event-name:hover {
    opacity: 0.6;
  }

  .event-price {
    font-size: 0.75rem;
    color: var(--text-light);
    white-space: nowrap;
    flex-shrink: 0;
    padding: 0.15em 0.5em;
    border-radius: 3px;
    background: rgba(0, 0, 0, 0.03);
  }

  .event-price--free {
    color: #5a8a6e;
    background: rgba(221, 238, 231, 0.3);
  }

  .event-card-details {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 1rem;
    font-size: clamp(0.75rem, 0.7rem + 0.2vw, 0.82rem);
    color: var(--text-light);
    line-height: 1.5;
  }

  .event-date::before   { content: '\01F4C5 '; }
  .event-location::before { content: '\01F4CD '; }
  .event-host::before   { content: '\01F464 '; }
  .event-guests::before { content: '\01F465 '; }

  /* Chinese font overrides */
  :global(html[data-lang="zh"]) .event-title {
    font-family: var(--font-zh);
  }

  :global(html[data-lang="zh"]) .event-subtitle,
  :global(html[data-lang="zh"]) .event-name,
  :global(html[data-lang="zh"]) .event-card-details {
    font-family: var(--font-zh);
    font-style: normal;
  }

  /* Mobile */
  @media (max-width: 480px) {
    .event-meta-bar {
      flex-direction: column;
      gap: 0.2rem;
    }

    .event-card-header {
      flex-direction: column;
      gap: 0.3rem;
    }

    .event-price {
      align-self: flex-start;
    }
  }
</style>
