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
  const DATA_URL = '/data/events.json';
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

  // --- Location collapse ---
  let locationExpanded = $state(false);
  let locationOverflows = $state(false);
  let locationPillsEl: HTMLElement | undefined = $state(undefined);

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

  // Detect if collapsed location pills overflow
  $effect(() => {
    if (locationPillsEl && !locationExpanded) {
      locationOverflows = locationPillsEl.scrollHeight > locationPillsEl.clientHeight;
    }
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
  const TZ = 'America/Los_Angeles';
  const locale = () => lang === 'zh' ? 'zh-CN' : 'en-US';

  function formatEventRange(startIso: string, endIso: string, tz: string): string {
    try {
      const t = tz || TZ;
      const s = new Date(startIso);
      const e = new Date(endIso);
      const sDate = s.toLocaleDateString(locale(), { weekday: 'short', month: 'short', day: 'numeric', timeZone: t });
      const eDate = e.toLocaleDateString(locale(), { weekday: 'short', month: 'short', day: 'numeric', timeZone: t });
      const sTime = s.toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit', timeZone: t });
      const eTime = e.toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit', timeZone: t });
      if (sDate === eDate) return `${sDate}, ${sTime} – ${eTime}`;
      return `${sDate}, ${sTime} – ${eDate}, ${eTime}`;
    } catch { return startIso; }
  }

  function formatUpdatedAt(isoStr: string): string {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(locale(), { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch { return isoStr; }
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
    [...new Set(events.map(e => stripState(e.location)).filter(l => l && l.trim()))]
      .sort((a, b) => locationCount(b) - locationCount(a))
  );

  // --- Calendar grid data ---
  function toLocalSlotKey(iso: string): string {
    const d = new Date(iso);
    const local = new Date(d.toLocaleString('en-US', { timeZone: TZ }));
    const y = local.getFullYear();
    const m = String(local.getMonth() + 1).padStart(2, '0');
    const day = String(local.getDate()).padStart(2, '0');
    const h = String(local.getHours()).padStart(2, '0');
    const min = local.getMinutes() < 30 ? '00' : '30';
    return `${y}-${m}-${day}T${h}:${min}`;
  }

  function getEventSlots(event: LumaEvent): string[] {
    const slots: string[] = [];
    const start = new Date(new Date(event.start_at).toLocaleString('en-US', { timeZone: TZ }));
    const end = new Date(new Date(event.end_at).toLocaleString('en-US', { timeZone: TZ }));
    const cursor = new Date(start);
    cursor.setMinutes(cursor.getMinutes() < 30 ? 0 : 30, 0, 0);
    while (cursor < end) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, '0');
      const d = String(cursor.getDate()).padStart(2, '0');
      const h = String(cursor.getHours()).padStart(2, '0');
      const min = String(cursor.getMinutes()).padStart(2, '0');
      slots.push(`${y}-${m}-${d}T${h}:${min}`);
      cursor.setMinutes(cursor.getMinutes() + 30);
    }
    return slots;
  }

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

  // Slot density map: slot key → { count, firstId } (from filtered events)
  let slotDensity = $derived.by(() => {
    const map = new Map<string, { count: number; firstId: string }>();
    for (const e of filteredEvents) {
      for (const s of getEventSlots(e)) {
        const cur = map.get(s);
        if (cur) cur.count++;
        else map.set(s, { count: 1, firstId: e.api_id });
      }
    }
    return map;
  });

  function scrollToEvent(eventId: string) {
    const el = document.getElementById(`event-${eventId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('event-card--highlight');
      setTimeout(() => el.classList.remove('event-card--highlight'), 1500);
    }
  }

  function slotTitle(key: string): string {
    const info = slotDensity.get(key);
    if (!info) return '';
    return lang === 'zh' ? `${info.count} 个活动` : `${info.count} event${info.count > 1 ? 's' : ''}`;
  }

  function formatDayHeader(dayStr: string): string {
    const [y, m, d] = dayStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const wk = date.toLocaleDateString(locale(), { weekday: 'short' });
    const mon = date.toLocaleDateString(locale(), { month: 'short' });
    return `${wk}, ${mon} ${d}`;
  }

  function formatTimeLabel(time: string): string {
    const h = parseInt(time.split(':')[0], 10);
    return h === 12 ? 'Noon' : `${h}`;
  }

  // --- Filtering & Sorting ---
  function matchesPrice(event: LumaEvent): boolean {
    if (selectedPrice === null) return true;
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
    selectedPrice = null;
    searchQuery = '';
  }

  // --- Event counts per filter option ---
  function priceCount(opt: string): number {
    return events.filter(e => {
      if (opt === 'free-approval') return e.is_free || e.price_cents == null;
      if (opt === 'paid') return !e.is_free && e.price_cents != null;
      return true;
    }).length;
  }

  function locationCount(loc: string): number {
    return events.filter(e => stripState(e.location) === loc).length;
  }

  // --- Date grouping ---
  function eventDateKey(event: LumaEvent): string {
    const d = new Date(event.start_at);
    const local = new Date(d.toLocaleString('en-US', { timeZone: TZ }));
    return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
  }

  function formatDateGroup(dateKey: string): string {
    const [y, m, d] = dateKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(locale(), { weekday: 'long', month: 'short', day: 'numeric' });
  }

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

    <!-- Filter & Sort Controls + Calendar -->
    <div class="filter-layout">
      <div class="filter-controls" bind:clientHeight={filterHeight}>
        <!-- Price filter (single-select pills) -->
        <div class="filter-row">
          <span class="filter-label">{t('events.filterPrice')}</span>
          <div class="filter-pills">
            {#each ['free-approval', 'paid'] as priceOpt}
              <button
                class="pill"
                class:pill--active={selectedPrice === priceOpt}
                onclick={() => selectedPrice = selectedPrice === priceOpt ? null : priceOpt}
              >
                {priceOpt === 'free-approval' ? t('events.filterFreeApproval') :
                 t('events.filterPaid')} <span class="pill-count">({priceCount(priceOpt)})</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- Location filter (multi-select, collapsible) -->
        {#if allLocations.length > 0}
          <div class="filter-row filter-row--stacked">
            <span class="filter-label">{t('events.filterLocation')}</span>
            <div class="location-pills-wrap">
              <div class="filter-pills filter-pills--wrap"
                   class:filter-pills--collapsed={!locationExpanded}
                   bind:this={locationPillsEl}>
                {#each allLocations as loc}
                  <button
                    class="pill"
                    class:pill--active={selectedLocations.has(loc)}
                    onclick={() => toggleLocation(loc)}
                  >{loc} <span class="pill-count">({locationCount(loc)})</span></button>
                {/each}
              </div>
              {#if locationOverflows || locationExpanded}
                <button class="show-more-btn"
                        class:show-more-btn--collapsed={!locationExpanded}
                        onclick={() => locationExpanded = !locationExpanded}>
                  {locationExpanded ? t('events.showLess') : t('events.showMore')}
                </button>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Sort (pills) -->
        <div class="filter-row filter-row--stacked">
          <span class="filter-label">{t('events.sortBy')}</span>
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

        <div class="filter-row filter-row--stacked">
          <span class="filter-label">{t('events.searchLabel')}</span>
          <input
            class="search-input"
            type="text"
            placeholder={t('events.searchPlaceholder')}
            bind:value={searchQuery}
          />
        </div>

      </div>

      <!-- Read-only calendar (side panel) -->
      {#if calendarDays.length > 0 && timeSlots.length > 0}
        <div class="cal-panel" style="max-height: {filterHeight}px;">
          <span class="filter-label">{t('events.calendar')} <span class="cal-pan-hint">(↔ ↕ Pan to view)</span></span>
          <div class="cal-wrapper">
            <div
              class="cal-grid"
              style="grid-template-columns: 48px repeat({calendarDays.length}, 1fr); width: {48 + calendarDays.length * 72}px;"
            >
              <!-- Header row -->
              <div class="cal-corner"></div>
              {#each calendarDays as day}
                <div class="cal-day-header">{formatDayHeader(day)}</div>
              {/each}
              <!-- Time rows -->
              {#each timeSlots as time}
                <div class="cal-time-label" class:cal-time-label--hour={time.endsWith(':00')}>{time.endsWith(':00') ? formatTimeLabel(time) : ''}</div>
                {#each calendarDays as day}
                  {@const key = `${day}T${time}`}
                  {@const info = slotDensity.get(key)}
                  {@const count = info?.count ?? 0}
                  <div
                    class="cal-cell"
                    class:cal-cell--d1={count === 1}
                    class:cal-cell--d2={count === 2}
                    class:cal-cell--d3={count >= 3}
                    class:cal-cell--hour={time.endsWith(':00')}
                    class:cal-cell--clickable={count > 0}
                    title={slotTitle(key)}
                    role={count > 0 ? 'button' : undefined}
                    tabindex={count > 0 ? 0 : undefined}
                    onclick={() => { if (info) scrollToEvent(info.firstId); }}
                    onkeydown={(ev) => { if (info && (ev.key === 'Enter' || ev.key === ' ')) scrollToEvent(info.firstId); }}
                  ></div>
                {/each}
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>

    {#if isStale}
      <p class="event-stale">{t('events.staleWarning')}</p>
    {/if}

    <div class="event-count">{filteredEvents.length} {t('events.eventCount')}</div>

    {#if filteredEvents.length === 0}
      <p class="event-status">{t('events.noMatch')}</p>
    {/if}

    {#each groupedEvents as group}
      <h3 class="date-group-header">{formatDateGroup(group.date)}</h3>
      <ul class="event-cards">
        {#each group.events as event (event.api_id)}
          <li class="event-card" id="event-{event.api_id}">
            <div class="event-card-header">
              <a href={event.url} target="_blank" rel="noopener noreferrer" class="event-name">
                {event.name}
              </a>
              <span class="event-price" class:event-price--free={event.is_free} class:event-price--approval={!event.is_free && event.price_cents == null} class:event-price--paid={!event.is_free && event.price_cents != null}>
                {formatPrice(event)}
              </span>
            </div>

            <div class="event-card-details">
              <span class="event-date"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>{formatEventRange(event.start_at, event.end_at, event.timezone)}</span>

              {#if locationDisplay(event)}
                <span class="event-location"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>{locationDisplay(event)}</span>
              {/if}

              {#if event.guest_count > 0}
                <span class="event-guests"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>{event.guest_count} {t('events.guests')}</span>
              {/if}
            </div>
          </li>
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

  .event-card--highlight {
    animation: highlight-fade 1.5s ease-out;
  }

  @keyframes highlight-fade {
    0% { background: rgba(90, 160, 120, 0.15); }
    100% { background: transparent; }
  }

  .search-input {
    font-family: inherit;
    font-size: var(--fs-xs);
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

  .filter-controls {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: var(--fs-xs);
  }

  .cal-panel {
    flex: 0 0 48%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .cal-wrapper {
    flex: 1;
    overflow: auto;
    max-width: 100%;
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
    font-size: var(--fs-xs);
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
    font-size: var(--fs-xs);
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
    font-size: var(--fs-xs);
  }

  .location-pills-wrap {
    flex: 1;
    min-width: 0;
    position: relative;
  }

  .filter-pills--collapsed {
    max-height: 3.6rem;
    overflow: hidden;
  }

  .show-more-btn {
    font-family: inherit;
    font-size: var(--fs-xs);
    color: var(--text-light);
    background: var(--bg);
    border: none;
    padding: 0.2em 0 0.2em 0.4em;
    cursor: pointer;
    text-decoration: underline;
    white-space: nowrap;
    line-height: 1.4;
  }

  .show-more-btn:hover {
    color: var(--text);
  }

  .show-more-btn--collapsed {
    position: absolute;
    right: 0;
    bottom: 0;
  }

  /* --- Calendar grid --- */
  .cal-grid {
    display: grid;
    gap: 0;
    user-select: none;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 4px;
    overflow: hidden;
  }

  .cal-pan-hint {
    font-size: var(--fs-xs);
    color: var(--text-light);
    font-style: italic;
  }

  .cal-corner {
    position: sticky;
    top: 0;
    background: var(--bg, #fff);
    z-index: 1;
  }

  .cal-day-header {
    font-size: var(--fs-xs);
    color: var(--text-light);
    text-align: center;
    padding: 0.25em 0.15em;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    border-left: 1px solid rgba(0, 0, 0, 0.08);
    white-space: nowrap;
    position: sticky;
    top: 0;
    background: var(--bg, #fff);
    z-index: 1;
  }

  .cal-time-label {
    font-size: var(--fs-xs);
    color: var(--text-light);
    text-align: right;
    padding-right: 0.3em;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    border-top: 1px solid rgba(0, 0, 0, 0.02);
  }

  .cal-time-label--hour {
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .cal-cell {
    height: 16px;
    border-right: 1px solid rgba(0, 0, 0, 0.03);
    border-left: 1px solid rgba(0, 0, 0, 0.08);
    border-top: 1px solid rgba(0, 0, 0, 0.02);
    transition: background 0.1s;
  }

  .cal-cell--hour {
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .cal-cell--clickable {
    cursor: pointer;
  }

  .cal-cell--clickable:hover {
    opacity: 0.7;
  }

  .cal-cell--d1 { background: rgba(90, 160, 120, 0.18); }
  .cal-cell--d2 { background: rgba(90, 160, 120, 0.35); }
  .cal-cell--d3 { background: rgba(90, 160, 120, 0.55); }

  .clear-filters {
    font-family: inherit;
    font-size: var(--fs-xs);
    color: var(--text-light);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
    align-self: flex-start;
  }

  .clear-filters:hover {
    color: var(--text);
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
  :global(html[data-lang="zh"]) .event-title {
    font-family: var(--font-zh);
  }

  :global(html[data-lang="zh"]) .event-name,
  :global(html[data-lang="zh"]) .event-card-details,
  :global(html[data-lang="zh"]) .filter-controls {
    font-family: var(--font-zh);
    font-style: normal;
  }

  /* Tablet: stack layout */
  @media (max-width: 768px) {
    .filter-layout {
      flex-direction: column;
    }

    .cal-panel {
      width: 100%;
      max-width: none;
      min-width: 0;
    }
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
