<script lang="ts">
  import '../../styles/filters.css';
  import { t } from '../../i18n/langStore';
  import { ALL_BUCKETS, BUCKET_LABEL_KEYS, type CategoryBucket } from '../../utils/events/categories';

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
    /** When true, render the 5-bucket category chip row. */
    showCategoryFilter?: boolean;
    selectedBuckets?: Set<CategoryBucket>;
    bucketCounts?: Map<CategoryBucket, number>;
    onBucketToggle?: (bucket: CategoryBucket) => void;
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
    showCategoryFilter = false,
    selectedBuckets = new Set<CategoryBucket>(),
    bucketCounts = new Map<CategoryBucket, number>(),
    onBucketToggle = () => {},
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
  <!-- Category filter (5 buckets, console mode only) -->
  {#if showCategoryFilter}
    <div class="filter-row">
      <span class="filter-label">{t('events.filterCategory')}</span>
      <div class="filter-pills">
        {#each ALL_BUCKETS as bucket}
          <button
            class="pill"
            class:pill--active={selectedBuckets.has(bucket)}
            onclick={() => onBucketToggle(bucket)}
          >{t(BUCKET_LABEL_KEYS[bucket])} <span class="pill-count">({bucketCounts.get(bucket) ?? 0})</span></button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Price filter -->
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
  /* Event-specific styles only — shared styles come from filters.css */
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
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text);
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .time-select:focus {
    border-color: rgba(0, 0, 0, 0.25);
  }

  .time-sep {
    color: var(--text-light);
  }

  :global(html[data-lang="zh"]) .filter-controls {
    font-family: var(--font-zh);
    font-style: normal;
  }
</style>
