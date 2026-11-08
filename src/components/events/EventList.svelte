<script lang="ts">
  import { onMount } from 'svelte';
  import {
    type LumaEvent,
    type EventData,
    type EventDecision,
    type EventDecisionStatus,
    type EventListMode,
    DATA_URL,
    STALE_THRESHOLD_MS,
    BLOCKED_CALENDARS,
    BLOCKED_NAME_KEYWORDS,
    loadPref,
    enrichEvents,
    buildLocationIndex,
    eventDateKey,
    formatUpdatedAt,
    formatDateGroup,
    snapshotEvent,
    parseDecisions,
    pruneDecisions,
    eventMatchText,
    startsOnOrAfterToday,
    isNewlyListed,
  } from './eventUtils';
  import EventFilters from './EventFilters.svelte';
  import EventCard from './EventCard.svelte';
  import EventSync from './EventSync.svelte';
  import {
    EMBEDDINGS_URL,
    EMBEDDING_MODEL,
    EMBEDDING_REVISION,
    rankWithinDay,
    type EmbeddingCatalog,
  } from './intentRanking';
  import {
    SYNC_CODE_KEY,
    SYNC_TIME_KEY,
    SyncError,
    type SyncSettings,
    canonicalJSON,
    createSync,
    mergeOnJoin,
    pullSync,
    pushSync,
    rotateSync,
  } from './syncUtils';
  import Popup from '../Popup.svelte';
  import '../../styles/filters.css';

  // --- State ---
  let events = $state<LumaEvent[]>([]);
  let updatedAt = $state('');
  let loading = $state(true);
  let error = $state(false);
  let isStale = $state(false);

  // --- Filter State (persisted via localStorage) ---
  const PFX = 'events';
  let selectedLocations = $state<Set<string>>(new Set(loadPref<string[]>(`${PFX}.locations`, [])));
  let selectedDays = $state<Set<number>>(new Set(loadPref<number[]>(`${PFX}.days`, [])));
  let searchQuery = $state<string>('');
  let excludeKeywords = $state<string[]>(loadPref<string[]>(`${PFX}.exclude`, []));
  let newOnly = $state(loadPref<boolean>(`${PFX}.newOnly`, false));
  let mode = $state<EventListMode>('upcoming');
  let handledReason = $state<'all' | EventDecisionStatus>('all');
  let decisions = $state<Record<string, EventDecision>>(
    pruneDecisions(parseDecisions(loadPref(`${PFX}.decisions`, {}))),
  );

  let excludePopupOpen = $state(false);
  // Current intent is deliberately absent from localStorage and SyncSettings.
  let currentIntent = $state('');
  let intentStatus = $state<'idle' | 'loading' | 'ready' | 'fallback' | 'no-data'>('idle');
  let queryVector = $state.raw<number[] | undefined>(undefined);
  let embeddingCatalog = $state.raw<EmbeddingCatalog | undefined>(undefined);
  let catalogPromise: Promise<EmbeddingCatalog> | undefined;
  let intentWorker: Worker | undefined;
  let intentTimer: ReturnType<typeof setTimeout> | undefined;
  let intentSequence = 0;

  async function loadEmbeddings(): Promise<EmbeddingCatalog> {
    catalogPromise ??= fetch(`${EMBEDDINGS_URL}?v=${encodeURIComponent(updatedAt)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Embedding data HTTP ${response.status}`);
        const data = (await response.json()) as EmbeddingCatalog;
        if (
          data.model !== EMBEDDING_MODEL ||
          data.revision !== EMBEDDING_REVISION ||
          data.dimension !== 384
        ) {
          throw new Error('Embedding model does not match the published event vectors');
        }
        return data;
      })
      .catch((error) => {
        catalogPromise = undefined;
        throw error;
      });
    return catalogPromise;
  }

  $effect(() => {
    const text = currentIntent.trim();
    const id = ++intentSequence;
    if (intentTimer) clearTimeout(intentTimer);
    queryVector = undefined;
    if (!text) {
      intentStatus = 'idle';
      return;
    }
    intentStatus = 'loading';
    intentTimer = setTimeout(async () => {
      try {
        const catalog = await loadEmbeddings();
        if (id !== intentSequence) return;
        embeddingCatalog = catalog;
        if (!Object.keys(catalog.items).length) {
          intentStatus = 'no-data';
          return;
        }
        intentWorker ??= new Worker(new URL('./intentWorker.ts', import.meta.url), {
          type: 'module',
        });
        intentWorker.onmessage = (
          message: MessageEvent<{ id: number; vector?: number[]; error?: string }>,
        ) => {
          if (message.data.id !== intentSequence) return;
          if (message.data.vector?.length === catalog.dimension) {
            queryVector = message.data.vector;
            intentStatus = 'ready';
          } else {
            intentStatus = 'fallback';
            if (message.data.error)
              console.error('Intent similarity unavailable:', message.data.error);
          }
        };
        intentWorker.onerror = () => {
          if (id === intentSequence) intentStatus = 'fallback';
        };
        intentWorker.postMessage({ id, text });
      } catch (error) {
        if (id === intentSequence) intentStatus = 'fallback';
        console.error('Intent similarity unavailable:', error);
      }
    }, 500);
  });

  onMount(() => () => {
    if (intentTimer) clearTimeout(intentTimer);
    intentWorker?.terminate();
  });

  // --- Persist filter state and decisions to localStorage ---
  $effect(() => {
    localStorage.setItem(`${PFX}.locations`, JSON.stringify([...selectedLocations]));
    localStorage.setItem(`${PFX}.days`, JSON.stringify([...selectedDays]));
    localStorage.setItem(`${PFX}.exclude`, JSON.stringify(excludeKeywords));
    localStorage.setItem(`${PFX}.newOnly`, JSON.stringify(newOnly));

    const pruned = pruneDecisions(decisions);
    if (Object.keys(pruned).length !== Object.keys(decisions).length) {
      decisions = pruned;
      return;
    }
    localStorage.setItem(`${PFX}.decisions`, JSON.stringify(decisions));
  });

  // --- Optional cross-device sync (off until a sync code is created or joined) ---
  // Last write wins. A device pulls on load and when it becomes visible, and
  // pushes its own changes after a short pause.
  let syncCode = $state(localStorage.getItem(SYNC_CODE_KEY) ?? '');
  let syncedAt = $state(localStorage.getItem(SYNC_TIME_KEY) ?? '');
  let syncStatus = $state<'idle' | 'syncing' | 'error'>('idle');
  let syncError = $state('');
  // The JSON this device last sent or received. Compared with the current
  // settings so that applying remote data does not echo back as a push.
  let lastSyncedJSON = '';

  function currentSettings(): SyncSettings {
    return {
      excludeKeywords: [...excludeKeywords],
      selectedLocations: [...selectedLocations],
      selectedDays: [...selectedDays],
      newOnly,
      decisions,
    };
  }

  function applySettings(s: SyncSettings) {
    const next: SyncSettings = { ...s, decisions: pruneDecisions(s.decisions) };
    lastSyncedJSON = canonicalJSON(next);
    excludeKeywords = next.excludeKeywords;
    selectedLocations = new Set(next.selectedLocations);
    selectedDays = new Set(next.selectedDays);
    newOnly = next.newOnly;
    decisions = next.decisions;
  }

  function saveSyncCode(code: string, updated_at: string, json: string) {
    syncCode = code;
    syncedAt = updated_at;
    lastSyncedJSON = json;
    localStorage.setItem(SYNC_CODE_KEY, code);
    localStorage.setItem(SYNC_TIME_KEY, updated_at);
  }

  function syncFailed(e: unknown) {
    syncStatus = 'error';
    syncError =
      e instanceof SyncError && e.status === 404
        ? 'This sync code no longer exists. Disconnect this device and join again.'
        : 'Sync failed. Your choices are still saved on this device.';
    console.error('Sync failed:', e);
  }

  async function syncPull() {
    if (!syncCode) return;
    syncStatus = 'syncing';
    syncError = '';
    try {
      const remote = await pullSync(syncCode);
      const lastSeen = localStorage.getItem(SYNC_TIME_KEY) ?? '';
      if (!lastSeen || remote.updated_at > lastSeen) {
        applySettings(remote.settings);
        syncedAt = remote.updated_at;
        localStorage.setItem(SYNC_TIME_KEY, remote.updated_at);
      }
      syncStatus = 'idle';
    } catch (e) {
      syncFailed(e);
    }
  }

  async function syncPush(json: string) {
    const code = syncCode;
    if (!code) return;
    syncStatus = 'syncing';
    try {
      const { updated_at } = await pushSync(code, JSON.parse(json) as SyncSettings);
      lastSyncedJSON = json;
      syncedAt = updated_at;
      localStorage.setItem(SYNC_TIME_KEY, updated_at);
      syncStatus = 'idle';
    } catch (e) {
      syncFailed(e);
    }
  }

  $effect(() => {
    const json = canonicalJSON(currentSettings());
    if (!syncCode || json === lastSyncedJSON) return;
    const timer = setTimeout(() => void syncPush(json), 1500);
    return () => clearTimeout(timer);
  });

  async function onSyncCreate(): Promise<string> {
    const settings = currentSettings();
    const { code, updated_at } = await createSync(settings);
    saveSyncCode(code, updated_at, canonicalJSON(settings));
    return code;
  }

  async function onSyncJoin(code: string): Promise<void> {
    const remote = await pullSync(code);
    const merged = mergeOnJoin(currentSettings(), remote.settings);
    const { updated_at } = await pushSync(code, merged);
    applySettings(merged);
    saveSyncCode(code, updated_at, lastSyncedJSON);
  }

  async function onSyncRotate(): Promise<string> {
    const { code, updated_at } = await rotateSync(syncCode);
    saveSyncCode(code, updated_at, lastSyncedJSON);
    return code;
  }

  function onSyncDisconnect() {
    syncCode = '';
    syncedAt = '';
    syncStatus = 'idle';
    syncError = '';
    lastSyncedJSON = '';
    localStorage.removeItem(SYNC_CODE_KEY);
    localStorage.removeItem(SYNC_TIME_KEY);
  }

  onMount(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void syncPull();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  });

  // --- Data fetching ---
  // Show events whose Pacific start day is today or later. Applied and ignored
  // events leave Upcoming. They stay under Handled only while that start day
  // has not passed, and the record is deleted after 7 days.
  onMount(async () => {
    try {
      const resp = await fetch(DATA_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: EventData = await resp.json();

      const notBlocked = (e: LumaEvent) =>
        !BLOCKED_CALENDARS.has(e.calendar_name) &&
        !BLOCKED_NAME_KEYWORDS.some((kw) => e.name.includes(kw));

      const filtered = data.events.filter((e) => notBlocked(e) && startsOnOrAfterToday(e));

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
    if (syncCode) void syncPull();
  });

  // --- Derived filter options (single-pass) ---
  // Saved locations whose city has no events in today's data are appended at
  // the end so the user can still see and click off filters they previously set.
  let upcomingEvents = $derived(events.filter((e) => !(e.api_id in decisions)));
  let handledEvents = $derived.by(() => {
    const live = new Map(events.map((e) => [e.api_id, e]));
    const list: LumaEvent[] = [];
    for (const decision of Object.values(decisions)) {
      if (handledReason !== 'all' && decision.status !== handledReason) continue;
      // A handled event leaves the list once its start day is before today, even
      // if the 7-day record is still kept on this device.
      if (!startsOnOrAfterToday(decision.event)) continue;
      const current = live.get(decision.event.api_id);
      if (current) {
        list.push(current);
        continue;
      }
      const copy = snapshotEvent(decision.event);
      enrichEvents([copy]);
      list.push(copy);
    }
    return list;
  });
  let activeEvents = $derived(mode === 'upcoming' ? upcomingEvents : handledEvents);
  let handledCounts = $derived.by(() => {
    let applied = 0;
    let ignored = 0;
    for (const decision of Object.values(decisions)) {
      if (!startsOnOrAfterToday(decision.event)) continue;
      if (decision.status === 'applied') applied += 1;
      else ignored += 1;
    }
    return { applied, ignored };
  });

  let newCount = $derived(activeEvents.filter((e) => isNewlyListed(e, updatedAt)).length);
  let locationIndex = $derived(buildLocationIndex(activeEvents));
  let allLocations = $derived.by(() => {
    const base = locationIndex.sorted;
    const orphans: string[] = [];
    for (const loc of selectedLocations) {
      if (!locationIndex.counts.has(loc)) orphans.push(loc);
    }
    return orphans.length ? [...base, ...orphans.sort()] : base;
  });
  let locationCounts = $derived(locationIndex.counts);

  // --- Filtering (earliest start time first) ---
  let filteredEvents = $derived.by(() => {
    const q = searchQuery.toLowerCase().trim();

    const result = activeEvents.filter((e) => {
      if (newOnly && !isNewlyListed(e, updatedAt)) return false;
      if (selectedLocations.size > 0 && !selectedLocations.has(e._strippedLocation!)) return false;
      if (selectedDays.size > 0 && !selectedDays.has(e._dayOfWeek!)) return false;
      const haystack = eventMatchText(e);
      if (q && !haystack.includes(q)) return false;
      if (excludeKeywords.length > 0 && excludeKeywords.some((kw) => haystack.includes(kw))) {
        return false;
      }
      return true;
    });

    result.sort((a, b) => a._startMs! - b._startMs!);
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
    if (!currentIntent.trim()) return groups;
    return groups.map((group) => ({
      date: group.date,
      events: rankWithinDay(group.events, currentIntent, queryVector, embeddingCatalog),
    }));
  });

  // --- Filter callbacks ---
  function toggleLocation(loc: string) {
    const next = new Set(selectedLocations);
    if (next.has(loc)) next.delete(loc);
    else next.add(loc);
    selectedLocations = next;
  }

  function toggleDay(day: number) {
    const next = new Set(selectedDays);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    selectedDays = next;
  }

  function setMode(next: EventListMode) {
    if (mode === next) return;
    mode = next;
  }

  function remember(event: LumaEvent, status: EventDecisionStatus) {
    decisions = pruneDecisions({
      ...decisions,
      [event.api_id]: {
        status,
        at: new Date().toISOString(),
        event: snapshotEvent(event),
      },
    });
  }

  function restore(id: string) {
    if (!(id in decisions)) return;
    const next = { ...decisions };
    delete next[id];
    decisions = next;
  }
</script>

<div class="event-list">
  <header class="event-header">
    <div class="event-title-row">
      <h2 class="event-title">Bay Area Tech & AI Events</h2>
    </div>

    <p class="event-subtitle">
      Luma's current Bay Area Tech and AI listings, refreshed once a day.
    </p>
  </header>

  {#if loading}
    <p class="event-status">Loading events...</p>
  {:else if error}
    <p class="event-status event-status--error">
      Unable to load events right now. Please try again later.
    </p>
  {:else if events.length === 0 && Object.keys(decisions).length === 0}
    <div class="event-empty">
      <p>No upcoming events in the latest check.</p>
      {#if updatedAt}
        <p class="event-meta">Last checked: {formatUpdatedAt(updatedAt)} (Refreshes once daily)</p>
      {/if}
    </div>
  {:else}
    {#if updatedAt}
      <div class="event-meta-bar">
        <span class="event-updated"
          >Last checked: {formatUpdatedAt(updatedAt)} (Refreshes once daily)</span
        >
        <p class="sync-hint">
          {#if syncCode}
            Your filters and handled events stay in sync across devices.
          {:else}
            Keep your filters and handled events on your other devices.
          {/if}
          <EventSync
            code={syncCode}
            {syncedAt}
            status={syncStatus}
            error={syncError}
            onCreate={onSyncCreate}
            onJoin={onSyncJoin}
            onShowCode={() => syncCode}
            onRotate={onSyncRotate}
            onDisconnect={onSyncDisconnect}
          />
        </p>
      </div>
    {/if}

    <div class="filter-row event-mode">
      <button
        type="button"
        class="pill"
        class:pill--active={mode === 'upcoming'}
        aria-pressed={mode === 'upcoming'}
        onclick={() => setMode('upcoming')}
      >
        Upcoming <span class="pill-count">({upcomingEvents.length})</span>
      </button>
      <button
        type="button"
        class="pill"
        class:pill--active={mode === 'handled'}
        aria-pressed={mode === 'handled'}
        onclick={() => setMode('handled')}
      >
        Handled <span class="pill-count">({handledCounts.applied + handledCounts.ignored})</span>
      </button>
    </div>

    {#if mode === 'handled'}
      <div class="filter-row">
        <button
          type="button"
          class="pill"
          class:pill--active={handledReason === 'all'}
          aria-pressed={handledReason === 'all'}
          onclick={() => (handledReason = 'all')}
        >
          All
          <span class="pill-count">({handledCounts.applied + handledCounts.ignored})</span>
        </button>
        <button
          type="button"
          class="pill"
          class:pill--active={handledReason === 'applied'}
          aria-pressed={handledReason === 'applied'}
          onclick={() => (handledReason = 'applied')}
        >
          Applied <span class="pill-count">({handledCounts.applied})</span>
        </button>
        <button
          type="button"
          class="pill"
          class:pill--active={handledReason === 'ignored'}
          aria-pressed={handledReason === 'ignored'}
          onclick={() => (handledReason = 'ignored')}
        >
          Ignored <span class="pill-count">({handledCounts.ignored})</span>
        </button>
      </div>
      <p class="event-handled-note">
        Applied and ignored events stay here through today. Events that started on an earlier day
        are hidden, and the record is deleted after 7 days.
      </p>
    {/if}

    <!-- Filter Controls -->
    <EventFilters
      {allLocations}
      {locationCounts}
      {selectedLocations}
      {selectedDays}
      {searchQuery}
      {currentIntent}
      {intentStatus}
      {excludeKeywords}
      {newOnly}
      {newCount}
      onLocationToggle={toggleLocation}
      onDayToggle={toggleDay}
      onSearchChange={(q) => {
        searchQuery = q;
      }}
      onIntentChange={(intent) => {
        currentIntent = intent;
      }}
      onAddExclude={(kw) => {
        excludeKeywords = [...excludeKeywords, kw.toLowerCase().trim()];
      }}
      onNewOnlyChange={(next) => {
        newOnly = next;
      }}
    />

    {#if isStale}
      <p class="event-stale">Data may be stale. Last update was over 48 hours ago.</p>
    {/if}

    <div class="event-count">
      <span>
        {#if filteredEvents.length !== activeEvents.length}
          {filteredEvents.length} / {activeEvents.length} events found
        {:else}
          {filteredEvents.length} events found
        {/if}
      </span>
      {#if excludeKeywords.length > 0}
        <span class="why-wrap">
          <button class="why-btn" onclick={() => (excludePopupOpen = !excludePopupOpen)}>
            {excludeKeywords.length} excluded
          </button>
          <Popup
            open={excludePopupOpen}
            title="Excluded keywords"
            onClose={() => (excludePopupOpen = false)}
          >
            <div class="exclude-chips">
              {#each excludeKeywords as kw}
                <span class="exclude-chip">
                  {kw}
                  <button
                    class="exclude-chip-remove"
                    onclick={() => {
                      excludeKeywords = excludeKeywords.filter((k) => k !== kw);
                    }}>&times;</button
                  >
                </span>
              {/each}
            </div>
          </Popup>
        </span>
      {/if}
    </div>

    {#if mode === 'handled' && Object.keys(decisions).length === 0}
      <p class="event-status">Nothing applied or ignored for today or later.</p>
    {:else if mode === 'upcoming' && upcomingEvents.length === 0}
      <p class="event-status">Everything in this check is in Handled.</p>
    {:else if filteredEvents.length === 0}
      <p class="event-status">No events match filters</p>
    {/if}

    {#each groupedEvents as group}
      <h3 class="date-group-header">{formatDateGroup(group.date)}</h3>
      <ul class="event-cards">
        {#each group.events as event (event.api_id)}
          <EventCard
            {event}
            isNew={isNewlyListed(event, updatedAt)}
            decision={mode === 'handled' ? decisions[event.api_id] : undefined}
            onApplied={() => remember(event, 'applied')}
            onIgnore={() => remember(event, 'ignored')}
            onRestore={() => restore(event.api_id)}
          />
        {/each}
      </ul>
    {/each}

    <section class="privacy-section">
      <h2 class="privacy-heading">Privacy</h2>
      <p class="privacy-desc">
        Event data is fetched from a public source and displayed directly in your browser. Applied
        and ignored choices stay on this device for 7 days. Your choices are sent to this site only
        if you turn on Sync with a code, and only to the devices that have that code. Current intent
        stays in your browser for this visit.
      </p>
      <a href="/events/privacy" class="privacy-link">Full privacy policy →</a>
    </section>
  {/if}
</div>

<style>
  .event-header {
    margin-bottom: var(--space-sm);
  }

  .event-title-row {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .event-title {
    font-size: var(--fs-lg);
    font-weight: 700;
    line-height: 1.3;
    color: var(--text);
    margin-bottom: var(--space-xs);
  }

  .event-subtitle {
    font-size: var(--fs-xs);
    color: var(--text-light);
    margin: 0 0 var(--space-xs);
    line-height: 1.5;
  }

  .event-mode {
    margin-bottom: var(--space-sm);
  }

  .event-handled-note {
    font-size: var(--fs-xs);
    color: var(--text-light);
    line-height: 1.5;
    margin: 0 0 var(--space-sm);
  }

  .why-wrap {
    position: relative;
    display: inline-block;
  }

  .why-btn {
    font-family: inherit;
    font-size: var(--fs-xs);
    line-height: 1.5;
    color: var(--text-light);
    background: none;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0.1em 0.4em;
    cursor: pointer;
    transition:
      border-color 0.15s,
      color 0.15s;
    white-space: nowrap;
    margin-left: 0.3em;
  }

  .why-btn:hover {
    border-color: rgba(0, 0, 0, 0.25);
    color: var(--text);
  }

  .event-meta-bar {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: var(--fs-xs);
    line-height: 1.5;
    color: var(--text-light);
    margin-bottom: var(--space-sm);
  }

  .sync-hint {
    margin: 0;
  }

  .event-count {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    font-size: var(--fs-xs);
    color: var(--text);
    font-weight: 500;
    line-height: 1.5;
    margin-top: var(--space-sm);
    margin-bottom: var(--space-xs);
    padding-bottom: var(--space-xs);
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .date-group-header {
    font-size: var(--fs-xs);
    font-weight: 600;
    line-height: 1.5;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-light);
    margin: var(--space-sm) 0 0.2rem;
    padding-bottom: 0.2rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  .event-status {
    font-size: var(--fs-xs);
    color: var(--text-light);
    line-height: 1.5;
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
    line-height: 1.5;
  }

  .event-meta {
    font-size: var(--fs-xs);
    line-height: 1.5;
    color: var(--text-light);
    margin-top: var(--space-xs);
  }

  .event-stale {
    font-size: var(--fs-xs);
    color: var(--color-pm);
    line-height: 1.5;
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
    0% {
      background: rgba(90, 138, 110, 0.15);
    }
    100% {
      background: transparent;
    }
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
    font-weight: 700;
    line-height: 1.3;
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
    font-weight: 600;
    font-size: var(--fs-xs);
    line-height: 1.5;
  }

  .privacy-link:hover {
    opacity: 0.7;
  }
</style>
