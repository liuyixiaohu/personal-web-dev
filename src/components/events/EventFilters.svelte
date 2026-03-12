<script lang="ts">
  import { t } from '../../i18n/langStore';

  interface Props {
    allLocations: string[];
    locationCounts: Map<string, number>;
    priceCounts: Map<string, number>;
    selectedLocations: Set<string>;
    selectedPrice: string | null;
    selectedDays: Set<number>;
    selectedTimeStart: string;
    selectedTimeEnd: string;
    sortBy: string;
    searchQuery: string;
    excludeKeywords: string[];
    onLocationToggle: (loc: string) => void;
    onPriceChange: (price: string | null) => void;
    onDayToggle: (day: number) => void;
    onTimeStartChange: (v: string) => void;
    onTimeEndChange: (v: string) => void;
    onSortChange: (sort: string) => void;
    onSearchChange: (query: string) => void;
    onAddExclude: (keyword: string) => void;
    onRemoveExclude: (keyword: string) => void;
    onClear: () => void;
  }

  let {
    allLocations,
    locationCounts,
    priceCounts,
    selectedLocations,
    selectedPrice,
    selectedDays,
    selectedTimeStart,
    selectedTimeEnd,
    sortBy,
    searchQuery,
    excludeKeywords,
    onLocationToggle,
    onPriceChange,
    onDayToggle,
    onTimeStartChange,
    onTimeEndChange,
    onSortChange,
    onSearchChange,
    onAddExclude,
    onRemoveExclude,
    onClear,
  }: Props = $props();

  // Day-of-week labels (0=Sun ... 6=Sat)
  const DAY_KEYS = [
    'events.daySun', 'events.dayMon', 'events.dayTue', 'events.dayWed',
    'events.dayThu', 'events.dayFri', 'events.daySat',
  ] as const;

  // Hour (0–23) and minute (00/15/30/45) options for time dropdowns
  const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const MINUTES = ['00', '15', '30', '45'];

  // Decompose "HH:MM" strings into hour/minute parts
  let startH = $derived(selectedTimeStart ? selectedTimeStart.split(':')[0] : '');
  let startM = $derived(selectedTimeStart ? selectedTimeStart.split(':')[1] : '');
  let endH = $derived(selectedTimeEnd ? selectedTimeEnd.split(':')[0] : '');
  let endM = $derived(selectedTimeEnd ? selectedTimeEnd.split(':')[1] : '');

  function setStartHour(h: string) {
    if (!h) { onTimeStartChange(''); return; }
    onTimeStartChange(`${h}:${startM || '00'}`);
  }
  function setStartMin(m: string) {
    if (!startH) return;
    onTimeStartChange(`${startH}:${m}`);
  }
  function setEndHour(h: string) {
    if (!h) { onTimeEndChange(''); return; }
    onTimeEndChange(`${h}:${endM || '00'}`);
  }
  function setEndMin(m: string) {
    if (!endH) return;
    onTimeEndChange(`${endH}:${m}`);
  }

  // --- Location collapse ---
  let locationExpanded = $state(false);
  let locationOverflows = $state(false);
  let locationPillsEl: HTMLElement | undefined = $state(undefined);

  $effect(() => {
    if (locationPillsEl && !locationExpanded) {
      locationOverflows = locationPillsEl.scrollHeight > locationPillsEl.clientHeight;
    }
  });

  let excludeInput = $state('');

  function handleExcludeKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && excludeInput.trim()) {
      e.preventDefault();
      const kw = excludeInput.trim().toLowerCase();
      if (!excludeKeywords.includes(kw)) {
        onAddExclude(kw);
      }
      excludeInput = '';
    }
  }

  let hasActiveFilters = $derived(
    selectedLocations.size > 0 || selectedPrice !== null ||
    selectedDays.size > 0 || selectedTimeStart !== '' || selectedTimeEnd !== '' ||
    searchQuery.trim() !== '' || excludeKeywords.length > 0
  );
</script>

<div class="filter-controls">
  <!-- Price filter (single-select pills) -->
  <div class="filter-row">
    <span class="filter-label">{t('events.filterPrice')}</span>
    <div class="filter-pills">
      {#each ['free-approval', 'paid'] as priceOpt}
        <button
          class="pill"
          class:pill--active={selectedPrice === priceOpt}
          onclick={() => onPriceChange(selectedPrice === priceOpt ? null : priceOpt)}
        >
          {priceOpt === 'free-approval' ? t('events.filterFreeApproval') :
           t('events.filterPaid')} <span class="pill-count">({priceCounts.get(priceOpt) ?? 0})</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Location filter (multi-select, collapsible) -->
  {#if allLocations.length > 0}
    <div class="filter-row">
      <span class="filter-label">{t('events.filterLocation')}</span>
      <div class="location-pills-wrap">
        <div class="filter-pills filter-pills--wrap"
             class:filter-pills--collapsed={!locationExpanded}
             bind:this={locationPillsEl}>
          {#each allLocations as loc}
            <button
              class="pill"
              class:pill--active={selectedLocations.has(loc)}
              onclick={() => onLocationToggle(loc)}
            >{loc} <span class="pill-count">({locationCounts.get(loc) ?? 0})</span></button>
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

  <!-- Day-of-week filter (multi-select pills) -->
  <div class="filter-row">
    <span class="filter-label">{t('events.filterDay')}</span>
    <div class="filter-pills">
      {#each DAY_KEYS as dayKey, i}
        <button
          class="pill"
          class:pill--active={selectedDays.has(i)}
          onclick={() => onDayToggle(i)}
        >{t(dayKey)}</button>
      {/each}
    </div>
  </div>

  <!-- Time range filter (4 dropdowns: hour:min – hour:min) -->
  <div class="filter-row">
    <span class="filter-label">{t('events.filterTime')}</span>
    <div class="time-range">
      <select class="time-select" value={startH}
        onchange={(e) => setStartHour((e.target as HTMLSelectElement).value)}>
        <option value="">{t('events.timeAny')}</option>
        {#each HOURS as h}<option value={h}>{h}</option>{/each}
      </select>
      <span class="time-sep">:</span>
      <select class="time-select" value={startM || '00'} disabled={!startH}
        onchange={(e) => setStartMin((e.target as HTMLSelectElement).value)}>
        {#each MINUTES as m}<option value={m}>{m}</option>{/each}
      </select>
      <span class="time-sep">–</span>
      <select class="time-select" value={endH}
        onchange={(e) => setEndHour((e.target as HTMLSelectElement).value)}>
        <option value="">{t('events.timeAny')}</option>
        {#each HOURS as h}<option value={h}>{h}</option>{/each}
      </select>
      <span class="time-sep">:</span>
      <select class="time-select" value={endM || '00'} disabled={!endH}
        onchange={(e) => setEndMin((e.target as HTMLSelectElement).value)}>
        {#each MINUTES as m}<option value={m}>{m}</option>{/each}
      </select>
    </div>
  </div>

  <!-- Sort (pills) -->
  <div class="filter-row">
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
          onclick={() => onSortChange(val)}
        >{label}</button>
      {/each}
    </div>
  </div>

  <!-- Clear filters -->
  {#if hasActiveFilters}
    <button class="clear-filters" onclick={onClear}>{t('events.clearFilters')}</button>
  {/if}

  <div class="filter-row filter-row--stacked">
    <span class="filter-label">{t('events.searchLabel')}</span>
    <input
      class="search-input"
      type="text"
      placeholder={t('events.searchPlaceholder')}
      value={searchQuery}
      oninput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
    />
  </div>

  <div class="filter-row filter-row--stacked">
    <span class="filter-label">{t('events.excludeLabel')}</span>
    <input
      class="search-input"
      type="text"
      placeholder={t('events.excludePlaceholder')}
      bind:value={excludeInput}
      onkeydown={handleExcludeKeydown}
    />
    {#if excludeKeywords.length > 0}
      <div class="exclude-chips">
        {#each excludeKeywords as kw}
          <span class="exclude-chip">
            {kw}
            <button class="exclude-chip-remove" onclick={() => onRemoveExclude(kw)}>&times;</button>
          </span>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .filter-controls {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: var(--fs-xs);
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

  .filter-pills--wrap {
    flex-wrap: wrap;
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

  .time-range {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .time-select {
    font-family: inherit;
    font-size: var(--fs-xs);
    padding: 0.2em 0.4em;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 3px;
    background: transparent;
    color: var(--text);
    cursor: pointer;
    outline: none;
    transition: border-color 0.12s;
  }

  .time-select:focus {
    border-color: rgba(0, 0, 0, 0.25);
  }

  .time-sep {
    color: var(--text-light);
  }

  .exclude-chips {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
  }

  .exclude-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
    font-size: var(--fs-xs);
    padding: 0.15em 0.45em;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 3px;
    background: rgba(0, 0, 0, 0.03);
    color: var(--text);
    line-height: 1.4;
  }

  .exclude-chip-remove {
    font-family: inherit;
    font-size: 0.85em;
    background: none;
    border: none;
    color: var(--text-light);
    cursor: pointer;
    padding: 0 0.1em;
    line-height: 1;
  }

  .exclude-chip-remove:hover {
    color: var(--text);
  }

  /* Chinese font overrides */
  :global(html[data-lang="zh"]) .filter-controls {
    font-family: var(--font-zh);
    font-style: normal;
  }
</style>
