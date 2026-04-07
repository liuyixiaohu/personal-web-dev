<script lang="ts">
  interface Props {
    allCompanies: string[];
    companyCounts: Map<string, number>;
    allLocations: string[];
    locationCounts: Map<string, number>;
    selectedCompanies: Set<string>;
    selectedLocations: Set<string>;
    sortBy: string;
    searchQuery: string;
    excludeKeywords: string[];
    onCompanyToggle: (company: string) => void;
    onLocationToggle: (loc: string) => void;
    onSortChange: (sort: string) => void;
    onSearchChange: (query: string) => void;
    onAddExclude: (keyword: string) => void;
    onRemoveExclude: (keyword: string) => void;
    onClear: () => void;
  }

  let {
    allCompanies,
    companyCounts,
    allLocations,
    locationCounts,
    selectedCompanies,
    selectedLocations,
    sortBy,
    searchQuery,
    excludeKeywords,
    onCompanyToggle,
    onLocationToggle,
    onSortChange,
    onSearchChange,
    onAddExclude,
    onRemoveExclude,
    onClear,
  }: Props = $props();

  // --- Company collapse ---
  let companyExpanded = $state(false);
  let companyOverflows = $state(false);
  let companyPillsEl: HTMLElement | undefined = $state(undefined);

  $effect(() => {
    if (companyPillsEl && !companyExpanded) {
      companyOverflows = companyPillsEl.scrollHeight > companyPillsEl.clientHeight;
    }
  });

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
    selectedCompanies.size > 0 || selectedLocations.size > 0 ||
    searchQuery.trim() !== '' || excludeKeywords.length > 0
  );
</script>

<div class="filter-controls">
  <!-- Company filter -->
  {#if allCompanies.length > 0}
    <div class="filter-row">
      <span class="filter-label">Company</span>
      <div class="pills-wrap">
        <div class="filter-pills filter-pills--wrap"
             class:filter-pills--collapsed={!companyExpanded}
             bind:this={companyPillsEl}>
          {#each allCompanies as company}
            <button
              class="pill"
              class:pill--active={selectedCompanies.has(company)}
              onclick={() => onCompanyToggle(company)}
            >{company} <span class="pill-count">({companyCounts.get(company) ?? 0})</span></button>
          {/each}
        </div>
        {#if companyOverflows || companyExpanded}
          <button class="show-more-btn"
                  class:show-more-btn--collapsed={!companyExpanded}
                  onclick={() => companyExpanded = !companyExpanded}>
            {companyExpanded ? 'Show less' : 'Show more'}
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Location filter -->
  {#if allLocations.length > 0}
    <div class="filter-row">
      <span class="filter-label">Location</span>
      <div class="pills-wrap">
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
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-light);
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
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

  .pills-wrap {
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
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text);
    width: 100%;
    max-width: 20rem;
    margin-bottom: var(--space-xs);
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
