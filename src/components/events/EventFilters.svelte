<script lang="ts">
  import type { Lang } from '../../i18n/translations';
  import { t } from '../../i18n/langStore';
  import { priceCount, locationCount, type LumaEvent } from './eventUtils';

  interface Props {
    events: LumaEvent[];
    allLocations: string[];
    selectedLocations: Set<string>;
    selectedPrice: string | null;
    selectedDays: Set<number>;
    selectedTimeStart: string;
    selectedTimeEnd: string;
    sortBy: string;
    searchQuery: string;
    lang: Lang;
    onLocationToggle: (loc: string) => void;
    onPriceChange: (price: string | null) => void;
    onDayToggle: (day: number) => void;
    onTimeStartChange: (v: string) => void;
    onTimeEndChange: (v: string) => void;
    onSortChange: (sort: string) => void;
    onSearchChange: (query: string) => void;
    onClear: () => void;
  }

  let {
    events,
    allLocations,
    selectedLocations,
    selectedPrice,
    selectedDays,
    selectedTimeStart,
    selectedTimeEnd,
    sortBy,
    searchQuery,
    lang,
    onLocationToggle,
    onPriceChange,
    onDayToggle,
    onTimeStartChange,
    onTimeEndChange,
    onSortChange,
    onSearchChange,
    onClear,
  }: Props = $props();

  // Day-of-week labels (0=Sun ... 6=Sat)
  const DAY_KEYS = [
    'events.daySun', 'events.dayMon', 'events.dayTue', 'events.dayWed',
    'events.dayThu', 'events.dayFri', 'events.daySat',
  ] as const;

  // Generate 15-minute time slots: ['00:00', '00:15', ..., '23:45']
  const TIME_SLOTS: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
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

  let hasActiveFilters = $derived(
    selectedLocations.size > 0 || selectedPrice !== null ||
    selectedDays.size > 0 || selectedTimeStart !== '' || selectedTimeEnd !== '' ||
    searchQuery.trim() !== ''
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
           t('events.filterPaid')} <span class="pill-count">({priceCount(events, priceOpt)})</span>
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
              onclick={() => onLocationToggle(loc)}
            >{loc} <span class="pill-count">({locationCount(events, loc)})</span></button>
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

  <!-- Time range filter (dropdowns) -->
  <div class="filter-row">
    <span class="filter-label">{t('events.filterTime')}</span>
    <div class="time-range">
      <select
        class="time-select"
        value={selectedTimeStart}
        onchange={(e) => onTimeStartChange((e.target as HTMLSelectElement).value)}
      >
        <option value="">{t('events.timeAny')}</option>
        {#each TIME_SLOTS as slot}
          <option value={slot}>{slot}</option>
        {/each}
      </select>
      <span class="time-sep">–</span>
      <select
        class="time-select"
        value={selectedTimeEnd}
        onchange={(e) => onTimeEndChange((e.target as HTMLSelectElement).value)}
      >
        <option value="">{t('events.timeAny')}</option>
        {#each TIME_SLOTS as slot}
          <option value={slot}>{slot}</option>
        {/each}
      </select>
    </div>
  </div>

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

  /* Chinese font overrides */
  :global(html[data-lang="zh"]) .filter-controls {
    font-family: var(--font-zh);
    font-style: normal;
  }
</style>
