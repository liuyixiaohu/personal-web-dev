<script lang="ts">
  import { onMount } from 'svelte';
  import {
    type LumaEvent, type EventData,
    DATA_URL, STALE_THRESHOLD_MS, BLOCKED_CALENDARS, BLOCKED_NAME_KEYWORDS,
    loadPref, matchesPrice, enrichEvents,
    buildLocationIndex, buildPriceCounts,
    eventDateKey, formatUpdatedAt, formatDateGroup,
  } from './eventUtils';
  import EventFilters from './EventFilters.svelte';
  import EventCard from './EventCard.svelte';
  import { VERSION, CHANGELOG } from './changelog';
  import Popup from './Popup.svelte';
  import FeedbackForm from './FeedbackForm.svelte';
  import { track } from '../../utils/analytics';

  // --- State ---
  let events = $state<LumaEvent[]>([]);
  let updatedAt = $state('');
  let loading = $state(true);
  let error = $state(false);
  let isStale = $state(false);

  // --- Filter & Sort State (persisted via localStorage) ---
  const PFX = 'events';
  let selectedLocations = $state<Set<string>>(new Set(loadPref<string[]>(`${PFX}.locations`, [])));
  let selectedPrice = $state<string | null>(loadPref(`${PFX}.price`, null));
  let selectedDays = $state<Set<number>>(new Set(loadPref<number[]>(`${PFX}.days`, [])));
  let selectedTimeStart = $state<string>(loadPref(`${PFX}.timeStart`, ''));
  let selectedTimeEnd = $state<string>(loadPref(`${PFX}.timeEnd`, ''));
  let sortBy = $state<string>(loadPref(`${PFX}.sort`, 'time-asc'));
  let searchQuery = $state<string>('');
  let excludeKeywords = $state<string[]>(loadPref<string[]>(`${PFX}.exclude`, []));

  let changelogOpen = $state(false);
  let whyOpen = $state(false);
  let feedbackOpen = $state(false);
  let feedbackFormRef: FeedbackForm | undefined = $state();

  // --- Persist filter/sort to localStorage ---
  $effect(() => {
    localStorage.setItem(`${PFX}.price`, JSON.stringify(selectedPrice));
    localStorage.setItem(`${PFX}.sort`, JSON.stringify(sortBy));
    localStorage.setItem(`${PFX}.locations`, JSON.stringify([...selectedLocations]));
    localStorage.setItem(`${PFX}.days`, JSON.stringify([...selectedDays]));
    localStorage.setItem(`${PFX}.timeStart`, JSON.stringify(selectedTimeStart));
    localStorage.setItem(`${PFX}.timeEnd`, JSON.stringify(selectedTimeEnd));
    localStorage.setItem(`${PFX}.exclude`, JSON.stringify(excludeKeywords));
  });

  // --- Data fetching ---
  // The cron now only ingests Bay Area Tech + AI categories, so the JSON is
  // already scoped — no client-side bucket filter needed. We only show events
  // that are NEW since the last fetch (per first_seen_at), starting from
  // tomorrow (today is mostly stale by the time the daily cron lands).
  onMount(async () => {
    try {
      const resp = await fetch(DATA_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: EventData = await resp.json();

      const cutoff = new Date();
      cutoff.setHours(0, 0, 0, 0);
      cutoff.setDate(cutoff.getDate() + 1);
      const cutoffMs = cutoff.getTime();
      const isFuture = (e: LumaEvent) => new Date(e.start_at).getTime() >= cutoffMs;

      const notBlocked = (e: LumaEvent) =>
        !BLOCKED_CALENDARS.has(e.calendar_name) &&
        !BLOCKED_NAME_KEYWORDS.some(kw => e.name.includes(kw));

      const prevCheck = data.previous_updated_at
        ? new Date(data.previous_updated_at).getTime()
        : 0;
      const isNew = (e: LumaEvent) =>
        prevCheck > 0 && e.first_seen_at
          ? new Date(e.first_seen_at).getTime() > prevCheck
          : false;
      const filtered = prevCheck > 0
        ? data.events.filter(e => notBlocked(e) && isNew(e) && isFuture(e))
        : data.events.filter(e => notBlocked(e) && isFuture(e));

      enrichEvents(filtered);
      events = filtered;
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

  // --- Derived filter options (single-pass) ---
  let locationIndex = $derived(buildLocationIndex(events));
  let allLocations = $derived(locationIndex.sorted);
  let locationCounts = $derived(locationIndex.counts);
  let priceCounts = $derived(buildPriceCounts(events));

  // --- Filtering & Sorting ---
  let filteredEvents = $derived.by(() => {
    const q = searchQuery.toLowerCase().trim();

    let result = events.filter(e => {
      if (selectedLocations.size > 0 && !selectedLocations.has(e._strippedLocation!)) return false;
      if (!matchesPrice(e, selectedPrice)) return false;
      if (selectedDays.size > 0 && !selectedDays.has(e._dayOfWeek!)) return false;
      if (selectedTimeStart || selectedTimeEnd) {
        const mins = e._timeMinutes!;
        if (selectedTimeStart) {
          const [sh, sm] = selectedTimeStart.split(':').map(Number);
          if (mins < sh * 60 + sm) return false;
        }
        if (selectedTimeEnd) {
          const [eh, em] = selectedTimeEnd.split(':').map(Number);
          if (mins > eh * 60 + em) return false;
        }
      }
      const hostNames = e.host_names ?? [];
      if (q && !e.name.toLowerCase().includes(q) && !hostNames.some(h => h.toLowerCase().includes(q))) return false;
      if (excludeKeywords.length > 0) {
        const nameLower = e.name.toLowerCase();
        const hostsLower = hostNames.map(h => h.toLowerCase());
        if (excludeKeywords.some(kw => nameLower.includes(kw) || hostsLower.some(h => h.includes(kw)))) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'alpha-asc': return a.name.localeCompare(b.name);
        case 'alpha-desc': return b.name.localeCompare(a.name);
        case 'time-asc': return a._startMs! - b._startMs!;
        case 'time-desc': return b._startMs! - a._startMs!;
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
  function pushFilter(filter_type: string, filter_value?: string | number | null) {
    track('filter_use', { filter_type, filter_value: filter_value ?? undefined });
  }

  let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;

  function toggleLocation(loc: string) {
    const next = new Set(selectedLocations);
    if (next.has(loc)) next.delete(loc); else next.add(loc);
    selectedLocations = next;
    pushFilter('location', loc);
  }

  function toggleDay(day: number) {
    const next = new Set(selectedDays);
    if (next.has(day)) next.delete(day); else next.add(day);
    selectedDays = next;
    pushFilter('day', day);
  }

  function clearFilters() {
    selectedLocations = new Set();
    selectedPrice = null;
    selectedDays = new Set();
    selectedTimeStart = '';
    selectedTimeEnd = '';
    searchQuery = '';
    excludeKeywords = [];
    pushFilter('clear');
  }
</script>

<div class="event-list">
  <header class="event-header">
    <div class="event-title-row">
      <h2 class="event-title">Today's New Tech Events @Bay Area</h2>
      <div class="version-wrap">
        <button class="version-btn" onclick={() => changelogOpen = !changelogOpen}>
          {VERSION}
        </button>
        <Popup open={changelogOpen} title="Changelog" onClose={() => changelogOpen = false}>
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
        </Popup>
      </div>
      <span class="feedback-wrap">
        <button class="why-btn" onclick={() => { feedbackOpen = !feedbackOpen; feedbackFormRef?.reset(); }}>
          Feedback
        </button>
        <Popup open={feedbackOpen} title="Any Suggestion? Pls!!!" onClose={() => feedbackOpen = false} width="18rem">
          <FeedbackForm bind:this={feedbackFormRef} />
        </Popup>
      </span>
    </div>

    <p class="event-subtitle">
      Bay Area Tech & AI events from Luma, showing <span class="newly-highlight">only what's new since the last daily check</span>.
      <span class="why-wrap">
        <button class="why-btn" onclick={() => whyOpen = !whyOpen}>Why?</button>
        <Popup open={whyOpen} title="Why show only newly added events?" onClose={() => whyOpen = false}>
          <p class="why-point">This page pulls from Luma's Bay Area Tech and AI categories once a day. It only shows events that appeared since the last check — not the full catalog. If you're looking for a specific event or topic outside Tech/AI, search directly on the platform.</p>
          <p class="why-point">This page is intentionally designed to balance convenience and long-term availability. The data comes from an undisclosed endpoint. Keeping the feature restrained and differentiated, rather than building a full-featured alternative, helps reduce the risk of the data source being noticed and shut down.</p>
        </Popup>
      </span>
    </p>
  </header>

  {#if loading}
    <p class="event-status">Loading events...</p>

  {:else if error}
    <p class="event-status event-status--error">Unable to load events right now. Please try again later.</p>

  {:else if events.length === 0}
    <div class="event-empty">
      <p>No new events discovered today. Check back tomorrow!</p>
      {#if updatedAt}
        <p class="event-meta">Last checked: {formatUpdatedAt(updatedAt)} (Refreshes daily ~7 PM PT)</p>
      {/if}
    </div>

  {:else}
    {#if updatedAt}
      <div class="event-meta-bar">
        <span class="event-updated">Last checked: {formatUpdatedAt(updatedAt)} (Refreshes daily ~7 PM PT)</span>
      </div>
    {/if}

    <!-- Filter & Sort Controls -->
    <EventFilters
      {allLocations}
      {locationCounts}
      {priceCounts}
      {selectedLocations}
      {selectedPrice}
      {selectedDays}
      {selectedTimeStart}
      {selectedTimeEnd}
      {sortBy}
      {searchQuery}
      {excludeKeywords}
      onLocationToggle={toggleLocation}
      onPriceChange={(p) => { selectedPrice = p; pushFilter('price', p); }}
      onDayToggle={toggleDay}
      onTimeStartChange={(v) => { selectedTimeStart = v; pushFilter('time_start', v); }}
      onTimeEndChange={(v) => { selectedTimeEnd = v; pushFilter('time_end', v); }}
      onSortChange={(s) => { sortBy = s; pushFilter('sort', s); }}
      onSearchChange={(q) => { searchQuery = q; clearTimeout(searchDebounceTimer); if (q.trim()) searchDebounceTimer = setTimeout(() => pushFilter('search', q), 800); }}
      onAddExclude={(kw) => { excludeKeywords = [...excludeKeywords, kw.toLowerCase().trim()]; pushFilter('exclude', kw); }}
      onRemoveExclude={(kw) => { excludeKeywords = excludeKeywords.filter(k => k !== kw); pushFilter('remove_exclude', kw); }}
      onClear={clearFilters}
    />

    {#if isStale}
      <p class="event-stale">Data may be stale. Last update was over 48 hours ago.</p>
    {/if}

    <div class="event-count">
      {#if filteredEvents.length !== events.length}
        {filteredEvents.length} / {events.length} events found
      {:else}
        {filteredEvents.length} events found
      {/if}
    </div>

    {#if filteredEvents.length === 0}
      <p class="event-status">No events match filters</p>
    {/if}

    {#each groupedEvents as group}
      <h3 class="date-group-header">{formatDateGroup(group.date)}</h3>
      <ul class="event-cards">
        {#each group.events as event (event.api_id)}
          <EventCard {event} />
        {/each}
      </ul>
    {/each}

    <section class="privacy-section">
      <h2 class="privacy-heading">Privacy</h2>
      <p class="privacy-desc">This page runs entirely in your browser. Event data is fetched from a public source and displayed directly. No personal data is collected, transmitted, or stored.</p>
      <a href="/events/privacy" class="privacy-link">Full privacy policy →</a>
    </section>

  {/if}
</div>

<style>
  .event-list {
    /* container managed by parent page */
  }

  .event-header {
    margin-bottom: var(--space-sm);
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
    border-radius: var(--radius-sm);
    padding: 0.1em 0.4em;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
    white-space: nowrap;
  }

  .version-btn:hover {
    border-color: rgba(0, 0, 0, 0.25);
    color: var(--text);
  }

  .feedback-wrap {
    position: relative;
    display: inline-block;
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
    border-radius: var(--radius-sm);
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

  .why-point {
    font-size: var(--fs-xs);
    color: var(--text-light);
    line-height: 1.5;
    margin: 0 0 0.5rem;
  }

  .why-point:last-child {
    margin-bottom: 0;
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

  .event-stale {
    font-size: var(--fs-xs);
    color: var(--color-pm);
    font-style: italic;
    margin-bottom: var(--space-sm);
    padding: var(--space-xs) var(--space-sm);
    background: rgba(240, 215, 215, 0.2);
    border-radius: var(--radius-sm);
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
    0% { background: rgba(90, 138, 110, 0.15); }
    100% { background: transparent; }
  }

  /* Mobile */
  @media (max-width: 480px) {
    .event-meta-bar {
      flex-direction: column;
      gap: 0.2rem;
    }
  }

  .privacy-section {
    border-top: 1px solid var(--border);
    padding-top: var(--space-lg);
    margin-top: var(--space-xl);
  }

  .privacy-heading {
    font-size: var(--fs-lg);
    font-weight: 500;
    margin-bottom: var(--space-sm);
  }

  .privacy-desc {
    color: var(--text-light);
    line-height: 1.6;
    margin-bottom: var(--space-xs);
  }

  .privacy-link {
    color: var(--color-rose);
    text-decoration: none;
    font-weight: 500;
    font-size: var(--fs-xs);
  }

  .privacy-link:hover {
    opacity: 0.7;
  }
</style>
