<script lang="ts">
  import { onMount } from 'svelte';
  import { subscribe, initLang, getLang, t } from '../../i18n/langStore';
  import type { Lang } from '../../i18n/translations';
  import {
    type LumaEvent, type EventData,
    DATA_URL, STALE_THRESHOLD_MS,
    loadPref, stripState, matchesPrice,
    toLocalSlotKey, eventDateKey, formatUpdatedAt, formatDateGroup,
  } from './eventUtils';
  import EventFilters from './EventFilters.svelte';
  import EventCalendar from './EventCalendar.svelte';
  import EventCard from './EventCard.svelte';

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
  let selectedLocations = $state<Set<string>>(new Set(loadPref<string[]>('events.locations', [])));
  let selectedPrice = $state<string | null>(loadPref('events.price', null));
  let sortBy = $state<string>(loadPref('events.sort', 'time-asc'));
  let searchQuery = $state<string>('');

  // --- Changelog ---
  const VERSION = 'v0.9';
  const CHANGELOG = [
    { version: 'v0.9',
      why: 'Visual polish: better icons, tighter headings, cleaner layout.',
      changes: [
        'Replaced emoji icons with crisp inline SVGs (calendar, pin, users)',
        'Calendar columns now have visible day separators',
        'Tighter line-height on headings for better visual hierarchy',
      ]},
    { version: 'v0.8',
      why: 'Too many font sizes doing the same job. Time for spring cleaning.',
      changes: [
        'Simplified font sizes from 6 levels to 5 (less is more)',
        'Price filter: removed "All" button, just click again to deselect',
        'Calendar switched to 24-hour time across all languages',
        'Search placeholder now shows example keywords',
      ]},
    { version: 'v0.7',
      why: 'The location list was getting out of hand with 25+ cities showing at once.',
      changes: [
        'Location pills now collapse to 2 rows, click "More" to see the rest',
        'Most popular cities show first',
        'Cleaner calendar time labels (just the number, no ":00")',
        'Calendar only shows 8 AM – 10 PM (nobody\'s going to events at 3 AM… right?)',
        'Added this version changelog popup',
      ]},
    { version: 'v0.6',
      why: 'Some text was too faint to read comfortably. Accessibility matters.',
      changes: [
        'Made all text easier to read with better contrast',
        'Set a minimum text size so nothing is too tiny',
        'Consistent text styling across the whole page',
      ]},
    { version: 'v0.5',
      why: 'Hard to tell which days are busiest just by scrolling through a list.',
      changes: [
        'Added a calendar heatmap (darker = more events)',
        'Scroll sideways to see the whole week',
        'Click a time slot to jump straight to those events',
      ]},
    { version: 'v0.4',
      why: '200+ events in a flat list was… a lot.',
      changes: [
        'Events grouped by day with date headers',
        'Shows total event count at the top',
        'Cleaned up location names (bye bye ", California")',
      ]},
    { version: 'v0.3',
      why: 'Scrolling through hundreds of events to find one? No thanks.',
      changes: [
        'Search bar to find events by name or host instantly',
        'Filter pills show how many events match each option',
        'Your filter preferences are remembered between visits',
      ]},
    { version: 'v0.2',
      why: 'A raw list of events isn\'t very useful without ways to filter and sort.',
      changes: [
        'Filter by price: Free or Paid',
        'Filter by location, pick one or several cities',
        'Sort by time, name, or guest count',
      ]},
    { version: 'v0.1',
      why: 'Bay Area tech events were scattered across the internet. Why not put them in one place?',
      changes: [
        'Event listing page pulling from Luma automatically',
        'Each event shows title, date, location, price, and guest count',
        'New events fetched daily',
        'Available in English and Chinese',
      ]},
  ];
  let changelogOpen = $state(false);
  let whyOpen = $state(false);

  // --- Calendar (read-only) ---
  let filterHeight = $state(0);

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

      const newSet = new Set(data.new_event_ids ?? []);
      events = newSet.size > 0
        ? data.events.filter(e => newSet.has(e.api_id))
        : data.events;
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

  // --- Derived filter options ---
  let allLocations = $derived(
    [...new Set(events.map(e => stripState(e.location)).filter(l => l && l.trim()))]
      .sort((a, b) => {
        const countA = events.filter(e => stripState(e.location) === a).length;
        const countB = events.filter(e => stripState(e.location) === b).length;
        return countB - countA;
      })
  );

  // --- Calendar grid data ---
  let calendarDays = $derived.by(() => {
    const days = new Set<string>();
    for (const e of events) {
      const key = toLocalSlotKey(e.start_at);
      days.add(key.split('T')[0]);
      const endKey = toLocalSlotKey(e.end_at);
      days.add(endKey.split('T')[0]);
    }
    return [...days].sort();
  });

  let timeSlots = $derived.by(() => {
    if (events.length === 0) return [];
    let minH = 24, maxH = 0;
    for (const e of events) {
      const sKey = toLocalSlotKey(e.start_at);
      const eKey = toLocalSlotKey(e.end_at);
      const sH = parseInt(sKey.split('T')[1].split(':')[0]);
      const eH = parseInt(eKey.split('T')[1].split(':')[0]);
      const eMin = parseInt(eKey.split('T')[1].split(':')[1]);
      minH = Math.min(minH, sH);
      maxH = Math.max(maxH, eMin > 0 ? eH + 1 : eH);
    }
    minH = Math.max(8, minH);
    maxH = Math.min(23, maxH);
    const slots: string[] = [];
    for (let h = minH; h < maxH; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
  });

  // --- Filtering & Sorting ---
  let filteredEvents = $derived.by(() => {
    void _tick;

    const q = searchQuery.toLowerCase().trim();

    let result = events.filter(e => {
      if (selectedLocations.size > 0 && !selectedLocations.has(stripState(e.location))) return false;
      if (!matchesPrice(e, selectedPrice)) return false;
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

  // --- Date grouping ---
  let groupedEvents = $derived.by(() => {
    const groups: { date: string; events: LumaEvent[] }[] = [];
    let currentDate = '';
    for (const e of filteredEvents) {
      const dk = eventDateKey(e);
      if (dk !== currentDate) {
        currentDate = dk;
        groups.push({ date: dk, events: [e] });
      } else {
        groups[groups.length - 1].events.push(e);
      }
    }
    return groups;
  });

  // --- Filter callbacks ---
  function toggleLocation(loc: string) {
    const next = new Set(selectedLocations);
    if (next.has(loc)) next.delete(loc); else next.add(loc);
    selectedLocations = next;
  }

  function clearFilters() {
    selectedLocations = new Set();
    selectedPrice = null;
    searchQuery = '';
  }
</script>

{#key _tick}
<div class="event-list">
  <header class="event-header">
    <div class="event-title-row">
      <h2 class="event-title">{t('events.title')}</h2>
      <div class="version-wrap">
        <button class="version-btn" onclick={() => changelogOpen = !changelogOpen}>
          {VERSION}
        </button>
        {#if changelogOpen}
          <div class="changelog-backdrop" onclick={() => changelogOpen = false} role="presentation"></div>
          <div class="changelog-popup">
            <div class="changelog-header">
              <span class="changelog-title">Changelog</span>
              <button class="changelog-close" onclick={() => changelogOpen = false}>&times;</button>
            </div>
            {#each CHANGELOG as release}
              <div class="changelog-release">
                <div class="changelog-version">{release.version}</div>
                <p class="changelog-why">{release.why}</p>
                <ul class="changelog-list">
                  {#each release.changes as change}
                    <li>{change}</li>
                  {/each}
                </ul>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <p class="event-subtitle">
      {t('events.subtitlePre')}<span class="newly-highlight">{t('events.subtitleHighlight')}</span>{t('events.subtitlePost')}
      <span class="why-wrap">
        <button class="why-btn" onclick={() => whyOpen = !whyOpen}>Why?</button>
        {#if whyOpen}
          <div class="why-backdrop" onclick={() => whyOpen = false} role="presentation"></div>
          <div class="why-popup">
            <div class="changelog-header">
              <span class="changelog-title">{t('events.whyTitle')}</span>
              <button class="changelog-close" onclick={() => whyOpen = false}>&times;</button>
            </div>
            <p class="why-point">{t('events.whyPoint1')}</p>
            <p class="why-point">{t('events.whyPoint2')}</p>
          </div>
        {/if}
      </span>
    </p>
  </header>

  {#if loading}
    <p class="event-status">{t('events.loading')}</p>

  {:else if error}
    <p class="event-status event-status--error">{t('events.fetchError')}</p>

  {:else if events.length === 0}
    <div class="event-empty">
      <p>{t('events.noEvents')}</p>
      {#if updatedAt}
        <p class="event-meta">{t('events.lastUpdated')}: {formatUpdatedAt(updatedAt, lang)}</p>
      {/if}
    </div>

  {:else}
    {#if updatedAt}
      <div class="event-meta-bar">
        <span class="event-updated">{t('events.lastUpdated')}: {formatUpdatedAt(updatedAt, lang)}</span>
      </div>
    {/if}

    <!-- Filter & Sort Controls + Calendar -->
    <div class="filter-layout">
      <div class="filter-controls-wrap" bind:clientHeight={filterHeight}>
        <EventFilters
          {events}
          {allLocations}
          {selectedLocations}
          {selectedPrice}
          {sortBy}
          {searchQuery}
          {lang}
          onLocationToggle={toggleLocation}
          onPriceChange={(p) => selectedPrice = p}
          onSortChange={(s) => sortBy = s}
          onSearchChange={(q) => searchQuery = q}
          onClear={clearFilters}
        />
      </div>

      <EventCalendar
        {filteredEvents}
        {calendarDays}
        {timeSlots}
        maxHeight={filterHeight}
        {lang}
      />
    </div>

    {#if isStale}
      <p class="event-stale">{t('events.staleWarning')}</p>
    {/if}

    <div class="event-count">{filteredEvents.length} {t('events.eventCount')}</div>

    {#if filteredEvents.length === 0}
      <p class="event-status">{t('events.noMatch')}</p>
    {/if}

    {#each groupedEvents as group}
      <h3 class="date-group-header">{formatDateGroup(group.date, lang)}</h3>
      <ul class="event-cards">
        {#each group.events as event (event.api_id)}
          <EventCard {event} {lang} />
        {/each}
      </ul>
    {/each}
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

  .event-title-row {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .version-wrap {
    position: relative;
  }

  .version-btn {
    font-family: inherit;
    font-size: var(--fs-xs);
    color: var(--text-light);
    background: none;
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 0.1em 0.4em;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
    white-space: nowrap;
  }

  .version-btn:hover {
    border-color: rgba(0, 0, 0, 0.25);
    color: var(--text);
  }

  .changelog-backdrop {
    position: fixed;
    inset: 0;
    z-index: 99;
  }

  .changelog-popup {
    position: absolute;
    top: calc(100% + 0.4rem);
    right: 0;
    z-index: 100;
    width: min(22rem, calc(100vw - 2rem));
    max-height: 28rem;
    overflow-y: auto;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    padding: 0.75rem;
  }

  @media (max-width: 480px) {
    .changelog-popup {
      position: fixed;
      top: auto;
      right: 1rem;
      bottom: 1rem;
      left: 1rem;
      width: auto;
      max-height: 70vh;
    }
  }

  .changelog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .changelog-title {
    font-size: var(--fs-xs);
    font-weight: 600;
    color: var(--text);
  }

  .changelog-close {
    font-family: inherit;
    font-size: 1.1rem;
    color: var(--text-light);
    background: none;
    border: none;
    cursor: pointer;
    line-height: 1;
    padding: 0 0.15rem;
  }

  .changelog-close:hover {
    color: var(--text);
  }

  .changelog-release {
    margin-bottom: 0.6rem;
  }

  .changelog-release:last-child {
    margin-bottom: 0;
  }

  .changelog-version {
    font-size: var(--fs-xs);
    font-weight: 600;
    color: var(--text);
  }

  .changelog-why {
    font-size: var(--fs-xs);
    color: var(--text-light);
    font-style: italic;
    margin: 0.15rem 0 0.2rem;
    line-height: 1.4;
  }

  .changelog-list {
    margin: 0.2rem 0 0 1rem;
    padding: 0;
    font-size: var(--fs-xs);
    color: var(--text-light);
    line-height: 1.5;
  }

  .changelog-list li {
    margin-bottom: 0.1rem;
  }

  .event-title {
    font-size: var(--fs-lg);
    font-weight: 500;
    color: var(--text);
    margin-bottom: var(--space-xs);
  }

  .event-subtitle {
    font-size: var(--fs-xs);
    color: var(--text-light);
    margin: 0 0 var(--space-xs);
    line-height: 1.5;
  }

  .newly-highlight {
    color: var(--color-pm);
    font-weight: 500;
  }

  .why-wrap {
    position: relative;
    display: inline-block;
  }

  .why-btn {
    font-family: inherit;
    font-size: var(--fs-xs);
    color: var(--text-light);
    background: none;
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 0.1em 0.4em;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
    white-space: nowrap;
    margin-left: 0.3em;
  }

  .why-btn:hover {
    border-color: rgba(0, 0, 0, 0.25);
    color: var(--text);
  }

  .why-backdrop {
    position: fixed;
    inset: 0;
    z-index: 99;
  }

  .why-popup {
    position: absolute;
    top: calc(100% + 0.4rem);
    left: 0;
    z-index: 100;
    width: min(22rem, calc(100vw - 2rem));
    max-height: 28rem;
    overflow-y: auto;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    padding: 0.75rem;
    text-align: left;
  }

  .why-point {
    font-size: var(--fs-xs);
    color: var(--text-light);
    line-height: 1.5;
    margin: 0 0 0.5rem;
  }

  .why-point:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 480px) {
    .why-popup {
      position: fixed;
      top: auto;
      right: 1rem;
      bottom: 1rem;
      left: 1rem;
      width: auto;
      max-height: 70vh;
    }
  }

  .event-meta-bar {
    font-size: var(--fs-xs);
    color: var(--text-light);
    margin-bottom: var(--space-sm);
  }

  .event-count {
    font-size: var(--fs-xs);
    color: var(--text);
    font-weight: 500;
    margin-top: var(--space-sm);
    margin-bottom: var(--space-xs);
    padding-bottom: var(--space-xs);
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .date-group-header {
    font-size: var(--fs-xs);
    font-weight: 500;
    color: var(--text-light);
    margin: var(--space-sm) 0 0.2rem;
    padding-bottom: 0.2rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  .event-status {
    font-size: var(--fs-xs);
    color: var(--text-light);
    font-style: italic;
    text-align: center;
    padding: var(--space-xl) 0;
  }

  .event-status--error {
    color: var(--color-pm);
  }

  .event-empty {
    text-align: center;
    padding: var(--space-xl) 0;
  }

  .event-empty p {
    font-size: var(--fs-xs);
    color: var(--text-light);
    font-style: italic;
  }

  .event-meta {
    font-size: var(--fs-xs);
    color: var(--text-light);
    margin-top: var(--space-xs);
  }

  /* --- Filter Layout (side-by-side) --- */
  .filter-layout {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: var(--space-sm);
  }

  .filter-controls-wrap {
    flex: 1;
    min-width: 0;
  }

  .event-stale {
    font-size: var(--fs-xs);
    color: var(--color-pm);
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

  :global(.event-card--highlight) {
    animation: highlight-fade 1.5s ease-out;
  }

  @keyframes highlight-fade {
    0% { background: rgba(90, 160, 120, 0.15); }
    100% { background: transparent; }
  }

  /* Chinese font overrides */
  :global(html[data-lang="zh"]) .event-title {
    font-family: var(--font-zh);
  }

  /* Tablet: stack layout */
  @media (max-width: 768px) {
    .filter-layout {
      flex-direction: column;
    }
  }

  /* Mobile */
  @media (max-width: 480px) {
    .event-meta-bar {
      flex-direction: column;
      gap: 0.2rem;
    }
  }
</style>
