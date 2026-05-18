<script lang="ts">
  import '../../styles/filters.css';
  import Popup from './Popup.svelte';

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
    onRemoveExclude: (keyword: string) => void;
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
    onRemoveExclude,
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
  let excludePopupOpen = $state(false);

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
      {#if excludeKeywords.length > 0}
        <span class="excluded-wrap">
          <button class="excluded-btn" onclick={() => excludePopupOpen = !excludePopupOpen}>
            {excludeKeywords.length} excluded
          </button>
          <Popup open={excludePopupOpen} title="Excluded keywords" onClose={() => excludePopupOpen = false}>
            <div class="exclude-chips">
              {#each excludeKeywords as kw}
                <span class="exclude-chip">
                  {kw}
                  <button class="exclude-chip-remove" onclick={() => onRemoveExclude(kw)}>&times;</button>
                </span>
              {/each}
            </div>
          </Popup>
        </span>
      {/if}
    </div>
  </div>
</div>
