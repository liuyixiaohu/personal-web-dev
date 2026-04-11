<script lang="ts">
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
  const LOCATION_COLLAPSED_COUNT = 8;

  let visibleLocations = $derived(
    locationExpanded ? allLocations : allLocations.slice(0, LOCATION_COLLAPSED_COUNT)
  );

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

  <!-- Location filter -->
  {#if allLocations.length > 0}
    <div class="filter-row filter-row--stacked">
      <span class="filter-label">Location</span>
      <div class="filter-pills">
        {#each visibleLocations as loc}
          <button
            class="pill"
            class:pill--active={selectedLocations.has(loc)}
            onclick={() => onLocationToggle(loc)}
          >{loc} <span class="pill-count">({locationCounts.get(loc) ?? 0})</span></button>
        {/each}
        {#if allLocations.length > LOCATION_COLLAPSED_COUNT}
          <button class="show-more-btn" onclick={() => locationExpanded = !locationExpanded}>
            {locationExpanded ? 'Show less' : `+${allLocations.length - LOCATION_COLLAPSED_COUNT} more`}
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
</div>

<style>
  .filter-controls {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
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
    flex-shrink: 0;
  }

  .filter-pills {
    display: flex;
    gap: 0.1rem 0.15rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .pill {
    font-family: inherit;
    font-size: var(--fs-xs);
    padding: 0.15em 0.3em;
    border: none;
    background: transparent;
    color: var(--text-light);
    cursor: pointer;
    white-space: nowrap;
    transition: color 0.15s;
    line-height: 1.4;
  }

  .pill:hover {
    color: var(--text);
  }

  .pill--active {
    color: var(--text);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .pill-count {
    font-size: var(--fs-xs);
    opacity: 0.5;
  }

  .show-more-btn {
    font-family: inherit;
    font-size: var(--fs-xs);
    color: var(--text-light);
    background: none;
    border: none;
    padding: 0.2em 0.4em;
    cursor: pointer;
    text-decoration: underline;
    white-space: nowrap;
    line-height: 1.4;
  }

  .show-more-btn:hover {
    color: var(--text);
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
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text);
    width: 100%;
    max-width: 20rem;
    transition: border-color 0.15s;
  }

  .search-input:focus {
    border-color: rgba(0, 0, 0, 0.25);
  }

  .search-input::placeholder {
    color: var(--text-light);
    opacity: 0.5;
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
    border-radius: var(--radius-sm);
    background: rgba(0, 0, 0, 0.03);
    color: var(--text);
    line-height: 1.4;
  }

  .exclude-chip-remove {
    font-family: inherit;
    font-size: var(--fs-sm);
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
</style>
