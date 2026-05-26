<script lang="ts">
  import '../../styles/filters.css';

  interface Props {
    allLocations: string[];
    locationCounts: Map<string, number>;
    selectedLocations: Set<string>;
    selectedDays: Set<number>;
    searchQuery: string;
    excludeKeywords: string[];
    onLocationToggle: (loc: string) => void;
    onDayToggle: (day: number) => void;
    onSearchChange: (query: string) => void;
    onAddExclude: (keyword: string) => void;
  }

  let {
    allLocations,
    locationCounts,
    selectedLocations,
    selectedDays,
    searchQuery,
    excludeKeywords,
    onLocationToggle,
    onDayToggle,
    onSearchChange,
    onAddExclude,
  }: Props = $props();

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

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
</script>

<div class="filter-controls">
  <!-- Location filter (multi-select, collapsible) -->
  {#if allLocations.length > 0}
    <div class="filter-row">
      <span class="filter-label">{'Location'}</span>
      <div class="location-pills-wrap">
        <div class="filter-pills filter-pills--wrap"
             class:filter-pills--collapsed={!locationExpanded}
             bind:this={locationPillsEl}>
          {#each allLocations as loc}
            {@const count = locationCounts.get(loc) ?? 0}
            <button
              class="pill"
              class:pill--active={selectedLocations.has(loc)}
              class:pill--empty={count === 0}
              title={count === 0 ? 'Saved filter — no matches in today\'s events' : undefined}
              onclick={() => onLocationToggle(loc)}
            >{loc} <span class="pill-count">({count})</span></button>
          {/each}
        </div>
        {#if locationOverflows || locationExpanded}
          <button class="show-more-btn"
                  class:show-more-btn--collapsed={!locationExpanded}
                  onclick={() => locationExpanded = !locationExpanded}>
            {locationExpanded ? 'Less' : 'More'}
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Day-of-week filter (multi-select pills) -->
  <div class="filter-row">
    <span class="filter-label">{'Day'}</span>
    <div class="filter-pills">
      {#each DAY_LABELS as dayLabel, i}
        <button
          class="pill"
          class:pill--active={selectedDays.has(i)}
          onclick={() => onDayToggle(i)}
        >{dayLabel}</button>
      {/each}
    </div>
  </div>

  <!-- Search + Exclude (paired on desktop, stacked on mobile) -->
  <div class="filter-row-pair">
    <div class="filter-row filter-row--stacked">
      <span class="filter-label">{'Search Events or Hosts'}</span>
      <input
        class="search-input"
        type="text"
        placeholder={'e.g. hackathon, google, etc'}
        value={searchQuery}
        oninput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
      />
    </div>

    <div class="filter-row filter-row--stacked">
      <span class="filter-label">{'Exclude the event including...'}</span>
      <input
        class="search-input"
        type="text"
        placeholder={'in case you don\'t enjoy happy hour'}
        bind:value={excludeInput}
        onkeydown={handleExcludeKeydown}
      />
    </div>
  </div>
</div>
