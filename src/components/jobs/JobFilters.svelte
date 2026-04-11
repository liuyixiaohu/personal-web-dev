<script lang="ts">
  import '../../styles/filters.css';

  interface Props {
    allLocations: string[];
    locationCounts: Map<string, number>;
    selectedLocations: Set<string>;
    sortBy: string;
    searchQuery: string;
    excludeKeywords: string[];
    onLocationToggle: (loc: string) => void;
    onSortChange: (sort: string) => void;
    onSearchChange: (query: string) => void;
    onAddExclude: (keyword: string) => void;
    onRemoveExclude: (keyword: string) => void;
    onClear: () => void;
  }

  let {
    allLocations,
    locationCounts,
    selectedLocations,
    sortBy,
    searchQuery,
    excludeKeywords,
    onLocationToggle,
    onSortChange,
    onSearchChange,
    onAddExclude,
    onRemoveExclude,
    onClear,
  }: Props = $props();

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
    selectedLocations.size > 0 ||
    searchQuery.trim() !== '' || excludeKeywords.length > 0
  );
</script>

<div class="filter-controls">
  <!-- Location filter -->
  {#if allLocations.length > 0}
    <div class="filter-row">
      <span class="filter-label">Location</span>
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
            {locationExpanded ? 'Show less' : 'Show more'}
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Sort -->
  <div class="filter-row">
    <span class="filter-label">Sort</span>
    <div class="filter-pills">
      {#each [
        ['company-asc', 'Company A→Z'],
        ['title-asc', 'Title A→Z'],
        ['date-desc', 'Newest first'],
        ['date-asc', 'Oldest first'],
      ] as [val, label]}
        <button
          class="pill"
          class:pill--active={sortBy === val}
          onclick={() => onSortChange(val)}
        >{label}</button>
      {/each}
    </div>
  </div>

  <!-- Clear -->
  {#if hasActiveFilters}
    <button class="clear-filters" onclick={onClear}>Clear filters</button>
  {/if}

  <!-- Search -->
  <div class="filter-row filter-row--stacked">
    <span class="filter-label">Search</span>
    <input
      class="search-input"
      type="text"
      placeholder="Filter by title, company, location..."
      value={searchQuery}
      oninput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
    />
  </div>

  <!-- Exclude keywords -->
  <div class="filter-row filter-row--stacked">
    <span class="filter-label">Exclude</span>
    <input
      class="search-input"
      type="text"
      placeholder="Type keyword and press Enter to exclude..."
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
