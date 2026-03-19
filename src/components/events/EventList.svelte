<script lang="ts">
  import { onMount } from 'svelte';
  import { subscribe, initLang, getLang, t } from '../../i18n/langStore';
  import type { Lang } from '../../i18n/translations';
  import {
    type LumaEvent, type EventData,
    DATA_URL, STALE_THRESHOLD_MS, BLOCKED_CALENDARS,
    loadPref, matchesPrice, enrichEvents,
    buildLocationIndex, buildPriceCounts,
    eventDateKey, formatUpdatedAt, formatDateGroup,
  } from './eventUtils';
  import EventFilters from './EventFilters.svelte';
  import EventCard from './EventCard.svelte';
  import { VERSION, CHANGELOG } from './changelog';

  // --- State ---
  let lang = $state<Lang>('en');
  let events = $state<LumaEvent[]>([]);
  let updatedAt = $state('');
  let loading = $state(true);
  let error = $state(false);
  let isStale = $state(false);

  // --- Filter & Sort State (persisted via localStorage) ---
  let selectedLocations = $state<Set<string>>(new Set(loadPref<string[]>('events.locations', [])));
  let selectedPrice = $state<string | null>(loadPref('events.price', null));
  let selectedDays = $state<Set<number>>(new Set(loadPref<number[]>('events.days', [])));
  let selectedTimeStart = $state<string>(loadPref('events.timeStart', ''));
  let selectedTimeEnd = $state<string>(loadPref('events.timeEnd', ''));
  let sortBy = $state<string>(loadPref('events.sort', 'time-asc'));
  let searchQuery = $state<string>('');
  let excludeKeywords = $state<string[]>(loadPref<string[]>('events.exclude', []));

  let changelogOpen = $state(false);
  let whyOpen = $state(false);
  let feedbackOpen = $state(false);
  let feedbackSending = $state(false);
  let feedbackSent = $state(false);
  let feedbackError = $state(false);

  async function handleFeedback(e: Event) {
    e.preventDefault();
    feedbackSending = true;
    feedbackError = false;
    const form = e.target as HTMLFormElement;
    try {
      const res = await fetch('https://formspree.io/f/xbdzgjpr', {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error();
      feedbackSent = true;
    } catch {
      feedbackError = true;
    } finally {
      feedbackSending = false;
    }
  }


  // --- Language ---
  initLang();
  lang = getLang();

  $effect(() => {
    const unsub = subscribe((newLang) => { lang = newLang; });
    return unsub;
  });

  // --- Persist filter/sort to localStorage ---
  $effect(() => {
    localStorage.setItem('events.price', JSON.stringify(selectedPrice));
    localStorage.setItem('events.sort', JSON.stringify(sortBy));
    localStorage.setItem('events.locations', JSON.stringify([...selectedLocations]));
    localStorage.setItem('events.days', JSON.stringify([...selectedDays]));
    localStorage.setItem('events.timeStart', JSON.stringify(selectedTimeStart));
    localStorage.setItem('events.timeEnd', JSON.stringify(selectedTimeEnd));
    localStorage.setItem('events.exclude', JSON.stringify(excludeKeywords));
  });

  // --- Data fetching ---
  onMount(async () => {
    try {
      const resp = await fetch(DATA_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: EventData = await resp.json();

      // Only show events starting tomorrow or later (user's local midnight)
      const tomorrow = new Date();
      tomorrow.setHours(0, 0, 0, 0);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowMs = tomorrow.getTime();
      const isFuture = (e: LumaEvent) => new Date(e.start_at).getTime() >= tomorrowMs;

      // Use first_seen_at timestamps (survives back-to-back runs)
      // instead of new_event_ids (gets reset to [] on consecutive runs)
      const prevCheck = data.previous_updated_at
        ? new Date(data.previous_updated_at).getTime()
        : 0;
      const isNew = (e: LumaEvent) =>
        prevCheck > 0 && e.first_seen_at
          ? new Date(e.first_seen_at).getTime() > prevCheck
          : false;

      const notBlocked = (e: LumaEvent) => !BLOCKED_CALENDARS.has(e.calendar_name);
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
      if (q && !e.name.toLowerCase().includes(q) && !e.host_names.some(h => h.toLowerCase().includes(q))) return false;
      if (excludeKeywords.length > 0) {
        const nameLower = e.name.toLowerCase();
        const hostsLower = e.host_names.map(h => h.toLowerCase());
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
    (window as any).dataLayer?.push({ event: 'filter_use', filter_type, filter_value: filter_value ?? undefined });
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

{#key lang}
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
      <span class="feedback-wrap">
        <button class="why-btn" onclick={() => { feedbackOpen = !feedbackOpen; feedbackSent = false; feedbackError = false; }}>
          {t('events.feedback')}
        </button>
        {#if feedbackOpen}
          <div class="changelog-backdrop" onclick={() => feedbackOpen = false} role="presentation"></div>
          <div class="feedback-popup">
            <div class="changelog-header">
              <span class="changelog-title">{t('events.feedbackTitle')}</span>
              <button class="changelog-close" onclick={() => feedbackOpen = false}>&times;</button>
            </div>
            {#if feedbackSent}
              <p class="feedback-success">{t('events.feedbackSent')}</p>
            {:else}
              <form onsubmit={handleFeedback}>
                <textarea name="message" required placeholder={t('events.feedbackPlaceholder')} rows="4" class="feedback-textarea"></textarea>
                <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off" />
                <button type="submit" class="feedback-submit" disabled={feedbackSending}>
                  {feedbackSending ? '...' : t('events.feedbackSend')}
                </button>
              </form>
              {#if feedbackError}
                <p class="feedback-error-msg">{t('events.feedbackError')}</p>
              {/if}
            {/if}
          </div>
        {/if}
      </span>
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
        <p class="event-meta">{t('events.lastUpdated')}: {formatUpdatedAt(updatedAt, lang)} {t('events.refreshNote')}</p>
      {/if}
    </div>

  {:else}
    {#if updatedAt}
      <div class="event-meta-bar">
        <span class="event-updated">{t('events.lastUpdated')}: {formatUpdatedAt(updatedAt, lang)} {t('events.refreshNote')}</span>
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

    <section class="privacy-section">
      <h2 class="privacy-heading">{t('events.privacyTitle')}</h2>
      <p class="privacy-desc">{t('events.privacyDesc')}</p>
      <a href="/events/privacy" class="privacy-link">{t('events.privacyLink')}</a>
    </section>

  {/if}
</div>
{/key}

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

  .feedback-wrap {
    position: relative;
    display: inline-block;
  }

  .feedback-popup {
    position: absolute;
    top: calc(100% + 0.4rem);
    right: 0;
    z-index: 100;
    width: min(18rem, calc(100vw - 2rem));
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    padding: 0.75rem;
  }

  @media (max-width: 480px) {
    .feedback-popup {
      position: fixed;
      top: auto;
      right: 1rem;
      bottom: 1rem;
      left: 1rem;
      width: auto;
    }
  }

  .feedback-textarea {
    width: 100%;
    font-family: inherit;
    font-size: var(--fs-xs);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 0.5rem;
    resize: vertical;
    background: var(--bg);
    color: var(--text);
    box-sizing: border-box;
  }

  .feedback-textarea:focus {
    outline: none;
    border-color: var(--text-light);
  }

  .feedback-submit {
    margin-top: 0.5rem;
    font-family: inherit;
    font-size: var(--fs-xs);
    color: var(--text);
    background: none;
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 0.3em 0.8em;
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .feedback-submit:hover {
    border-color: rgba(0, 0, 0, 0.25);
  }

  .feedback-submit:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .feedback-success {
    color: var(--color-ds-mid);
    font-size: var(--fs-xs);
    margin: 0.5rem 0 0;
  }

  .feedback-error-msg {
    color: var(--color-pm);
    font-size: var(--fs-xs);
    margin: 0.4rem 0 0;
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
    0% { background: rgba(90, 138, 110, 0.15); }
    100% { background: transparent; }
  }

  /* Chinese font overrides */
  :global(html[data-lang="zh"]) .event-title {
    font-family: var(--font-zh);
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
