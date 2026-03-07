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

  // --- Filter & Sort State (persisted via localStorage) ---
  function loadPref<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(key);
      return v != null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  }

  let selectedLocations = $state<Set<string>>(new Set(loadPref<string[]>('events.locations', [])));
  let selectedPrice = $state<string>(loadPref('events.price', 'all'));
  let sortBy = $state<string>(loadPref('events.sort', 'time-asc'));
  let searchQuery = $state<string>('');

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

  // --- Persist filter/sort to localStorage ---
  $effect(() => { localStorage.setItem('events.price', JSON.stringify(selectedPrice)); });
  $effect(() => { localStorage.setItem('events.sort', JSON.stringify(sortBy)); });
  $effect(() => { localStorage.setItem('events.locations', JSON.stringify([...selectedLocations])); });

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
    return stripState(event.location || '');
  }

  // --- Derived filter options ---
  function stripState(loc: string): string {
    return loc.replace(/, California$/, '');
  }

  let allLocations = $derived(
    [...new Set(events.map(e => stripState(e.location)).filter(l => l && l.trim()))].sort()
  );

  // --- Filtering & Sorting ---
  function matchesPrice(event: LumaEvent): boolean {
    if (selectedPrice === 'all') return true;
    if (selectedPrice === 'free-approval') return event.is_free || event.price_cents == null;
    if (selectedPrice === 'paid') return !event.is_free && event.price_cents != null;
    return true;
  }

  let filteredEvents = $derived.by(() => {
    void _tick;

    const q = searchQuery.toLowerCase().trim();

    let result = events.filter(e => {
      if (selectedLocations.size > 0 && !selectedLocations.has(stripState(e.location))) return false;
      if (!matchesPrice(e)) return false;
      if (q && !e.name.toLowerCase().includes(q) && !e.host_names.some(h => h.toLowerCase().includes(q))) return false;
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'alpha-asc': return a.name.localeCompare(b.name);
        case 'alpha-desc': return b.name.localeCompare(a.name);
        case 'time-asc': return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
        case 'time-desc': return new Date(b.start_at).getTime() - new Date(a.start_at).getTime();
        case 'guests-asc': {
          if (a.guest_count === 0 && b.guest_count !== 0) return 1;
          if (b.guest_count === 0 && a.guest_count !== 0) return -1;
          return a.guest_count - b.guest_count;
        }
        case 'guests-desc': {
          if (a.guest_count === 0 && b.guest_count !== 0) return 1;
          if (b.guest_count === 0 && a.guest_count !== 0) return -1;
          return b.guest_count - a.guest_count;
        }
        default: return 0;
      }
    });

    return result;
  });

  let hasActiveFilters = $derived(
    selectedLocations.size > 0 || selectedPrice !== 'all' || searchQuery.trim() !== ''
  );

  function toggleLocation(loc: string) {
    const next = new Set(selectedLocations);
    if (next.has(loc)) next.delete(loc); else next.add(loc);
    selectedLocations = next;
  }

  function clearFilters() {
    selectedLocations = new Set();
    selectedPrice = 'all';
    searchQuery = '';
  }

  // --- Event counts per filter option ---
  function priceCount(opt: string): number {
    return events.filter(e => {
      if (opt === 'all') return true;
      if (opt === 'free-approval') return e.is_free || e.price_cents == null;
      if (opt === 'paid') return !e.is_free && e.price_cents != null;
      return true;
    }).length;
  }

  function locationCount(loc: string): number {
    return events.filter(e => stripState(e.location) === loc).length;
  }
</script>

{#key _tick}
<div class="event-list">
  <header class="event-header">
    <h2 class="event-title">{t('events.title')}</h2>
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
    {#if updatedAt}
      <div class="event-meta-bar">
        <span class="event-updated">{t('events.lastUpdated')}: {formatUpdatedAt(updatedAt)}</span>
      </div>
    {/if}

    <!-- Filter & Sort Controls -->
    <div class="filter-controls">
      <!-- Price filter (single-select pills) -->
      <div class="filter-row filter-row--stacked">
        <span class="filter-label">{t('events.filterPrice')}</span>
        <div class="filter-pills">
          {#each ['all', 'free-approval', 'paid'] as priceOpt}
            <button
              class="pill"
              class:pill--active={selectedPrice === priceOpt}
              onclick={() => selectedPrice = priceOpt}
            >
              {priceOpt === 'all' ? t('events.filterAll') :
               priceOpt === 'free-approval' ? t('events.filterFreeApproval') :
               t('events.filterPaid')} <span class="pill-count">({priceCount(priceOpt)})</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Location filter (multi-select, always visible) -->
      {#if allLocations.length > 0}
        <div class="filter-row">
          <span class="filter-label">{t('events.filterLocation')}</span>
          <div class="filter-pills filter-pills--wrap">
            {#each allLocations as loc}
              <button
                class="pill"
                class:pill--active={selectedLocations.has(loc)}
                onclick={() => toggleLocation(loc)}
              >{loc} <span class="pill-count">({locationCount(loc)})</span></button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Sort (pills) -->
      <div class="filter-row filter-row--stacked">
        <span class="filter-label">{t('events.sortBy')} <span class="sort-note">{t('events.sortNote')}</span></span>
        <div class="filter-pills">
          {#each [
            ['time-asc', t('events.sortTimeAsc')],
            ['time-desc', t('events.sortTimeDesc')],
            ['alpha-asc', t('events.sortAlphaAsc')],
            ['alpha-desc', t('events.sortAlphaDesc')],
            ['guests-desc', t('events.sortGuestsDesc')],
            ['guests-asc', t('events.sortGuestsAsc')],
          ] as [val, label]}
            <button
              class="pill"
              class:pill--active={sortBy === val}
              onclick={() => sortBy = val}
            >{label}</button>
          {/each}
        </div>
      </div>

      <!-- Clear filters -->
      {#if hasActiveFilters}
        <button class="clear-filters" onclick={clearFilters}>{t('events.clearFilters')}</button>
      {/if}
    </div>

    <input
      class="search-input"
      type="text"
      placeholder={t('events.searchPlaceholder')}
      bind:value={searchQuery}
    />

    <div class="event-count">{filteredEvents.length} {t('events.eventCount')}</div>

    {#if isStale}
      <p class="event-stale">{t('events.staleWarning')}</p>
    {/if}

    {#if filteredEvents.length === 0}
      <p class="event-status">{t('events.noMatch')}</p>
    {/if}

    <ul class="event-cards">
      {#each filteredEvents as event (event.api_id)}
        <li class="event-card">
          <div class="event-card-header">
            <a href={event.url} target="_blank" rel="noopener noreferrer" class="event-name">
              {event.name}
            </a>
            <span class="event-price" class:event-price--free={event.is_free} class:event-price--approval={!event.is_free && event.price_cents == null} class:event-price--paid={!event.is_free && event.price_cents != null}>
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

            <span class="event-guests">
              {#if event.guest_count > 0}
                {event.guest_count} {t('events.guests')}
              {:else}
                {t('events.guestsNotDisclosed')}
              {/if}
            </span>
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

  .event-meta-bar {
    font-size: 0.75rem;
    color: var(--text-light);
    opacity: 0.6;
    margin-bottom: var(--space-sm);
  }

  .event-count {
    font-size: 0.75rem;
    color: var(--text-light);
    opacity: 0.6;
    margin-bottom: var(--space-sm);
  }

  .search-input {
    font-family: inherit;
    font-size: 0.78rem;
    padding: 0.35em 0.6em;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 3px;
    background: transparent;
    color: var(--text);
    width: 100%;
    max-width: 20rem;
    margin-bottom: var(--space-xs);
    outline: none;
    transition: border-color 0.12s;
  }

  .search-input:focus {
    border-color: rgba(0, 0, 0, 0.25);
  }

  .search-input::placeholder {
    color: var(--text-light);
    opacity: 0.5;
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

  /* --- Filter & Sort Controls --- */
  .filter-controls {
    margin-bottom: var(--space-sm);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.78rem;
  }

  .filter-row {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .filter-row--stacked {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-label {
    color: var(--text-light);
    font-size: 0.75rem;
    min-width: 3rem;
    flex-shrink: 0;
  }

  .filter-pills {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
  }

  .pill {
    font-family: inherit;
    font-size: 0.72rem;
    padding: 0.2em 0.55em;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 3px;
    background: transparent;
    color: var(--text-light);
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
    line-height: 1.4;
  }

  .pill:hover {
    border-color: rgba(0, 0, 0, 0.2);
  }

  .pill--active {
    background: rgba(0, 0, 0, 0.06);
    color: var(--text);
    border-color: rgba(0, 0, 0, 0.18);
  }

  .pill-count {
    opacity: 0.5;
    font-size: 0.65rem;
  }

  .sort-note {
    font-size: 0.68rem;
    color: var(--text-light);
    opacity: 0.5;
    font-style: italic;
  }

  .clear-filters {
    font-family: inherit;
    font-size: 0.7rem;
    color: var(--text-light);
    opacity: 0.6;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
    align-self: flex-start;
  }

  .clear-filters:hover {
    opacity: 1;
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

  .event-price--approval {
    color: #7FB6DD;
    background: rgba(127, 182, 221, 0.1);
  }

  .event-price--paid {
    color: #09797B;
    background: rgba(9, 121, 123, 0.08);
  }

  .event-card-details {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 1rem;
    font-size: clamp(0.75rem, 0.7rem + 0.2vw, 0.82rem);
    color: var(--text-light);
    line-height: 1.5;
  }

  .event-date::before,
  .event-location::before,
  .event-host::before,
  .event-guests::before {
    margin-right: 0.3em;
  }
  .event-date::before   { content: '\01F4C5'; }
  .event-location::before { content: '\01F4CD'; }
  .event-host::before   { content: '\01F464'; }
  .event-guests::before { content: '\01F465'; }

  /* Chinese font overrides */
  :global(html[data-lang="zh"]) .event-title {
    font-family: var(--font-zh);
  }

  :global(html[data-lang="zh"]) .event-name,
  :global(html[data-lang="zh"]) .event-card-details,
  :global(html[data-lang="zh"]) .filter-controls {
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
