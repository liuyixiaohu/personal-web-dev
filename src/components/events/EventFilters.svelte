<script lang="ts">
  import '../../styles/filters.css';

  interface Props {
    allLocations: string[];
    locationCounts: Map<string, number>;
    selectedLocations: Set<string>;
    selectedDays: Set<number>;
    searchQuery: string;
    excludeKeywords: string[];
    newOnly: boolean;
    newCount: number;
    onLocationToggle: (loc: string) => void;
    onDayToggle: (day: number) => void;
    onSearchChange: (query: string) => void;
    onAddExclude: (keyword: string) => void;
    onNewOnlyChange: (next: boolean) => void;
  }

  let {
    allLocations,
    locationCounts,
    selectedLocations,
    selectedDays,
    searchQuery,
    excludeKeywords,
    newOnly,
    newCount,
    onLocationToggle,
    onDayToggle,
    onSearchChange,
    onAddExclude,
    onNewOnlyChange,
  }: Props = $props();

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
  const DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ] as const;

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
  let searchSentinel: HTMLElement | undefined = $state();
  let searchStuck = $state(false);

  // The sentinel sits just above the search bar. Once it leaves the viewport,
  // the bar has taken over the top edge and should read as a pinned toolbar.
  $effect(() => {
    const sentinel = searchSentinel;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        searchStuck = !entry.isIntersecting;
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  });

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
  <div class="filter-row">
    <span class="filter-label">Show</span>
    <div class="filter-pills">
      <button
        type="button"
        class="pill"
        class:pill--active={!newOnly}
        aria-pressed={!newOnly}
        onclick={() => onNewOnlyChange(false)}
      >
        All
      </button>
      <button
        type="button"
        class="pill"
        class:pill--active={newOnly}
        aria-pressed={newOnly}
        onclick={() => onNewOnlyChange(true)}
      >
        New <span class="pill-count">({newCount})</span>
      </button>
    </div>
  </div>

  <!-- Location filter (multi-select, collapsible) -->
  {#if allLocations.length > 0}
    <div class="filter-row">
      <span class="filter-label">{'Location'}</span>
      <div class="location-pills-wrap">
        <div
          class="filter-pills filter-pills--wrap"
          class:filter-pills--collapsed={!locationExpanded}
          bind:this={locationPillsEl}
        >
          {#each allLocations as loc}
            {@const count = locationCounts.get(loc) ?? 0}
            <button
              class="pill"
              class:pill--active={selectedLocations.has(loc)}
              class:pill--empty={count === 0}
              aria-pressed={selectedLocations.has(loc)}
              title={count === 0 ? 'Saved filter — no matches in the current list' : undefined}
              onclick={() => onLocationToggle(loc)}
              >{loc} <span class="pill-count">({count})</span></button
            >
          {/each}
        </div>
        {#if locationOverflows || locationExpanded}
          <button
            class="show-more-btn"
            class:show-more-btn--collapsed={!locationExpanded}
            onclick={() => (locationExpanded = !locationExpanded)}
          >
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
          aria-pressed={selectedDays.has(i)}
          aria-label={DAY_NAMES[i]}
          onclick={() => onDayToggle(i)}>{dayLabel}</button
        >
      {/each}
    </div>
  </div>
</div>

<!-- Search + Exclude stay pinned to the top of the viewport while the list scrolls.
     They live outside .filter-controls so the sticky range is the whole event list. -->
<div class="filter-search-sentinel" bind:this={searchSentinel} aria-hidden="true"></div>
<div class="filter-search-bar" class:filter-search-bar--stuck={searchStuck}>
  <div class="filter-row-pair">
    <div class="filter-row filter-row--stacked">
      <span class="filter-label">{'Search Events or Hosts'}</span>
      <input
        class="search-input"
        type="text"
        aria-label="Search events or hosts"
        placeholder={'e.g. hackathon, google, etc'}
        value={searchQuery}
        oninput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
      />
    </div>

    <div class="filter-row filter-row--stacked">
      <span class="filter-label">{'Exclude events containing...'}</span>
      <input
        class="search-input"
        type="text"
        aria-label="Exclude events containing a keyword"
        placeholder={"in case you don't enjoy happy hour"}
        bind:value={excludeInput}
        onkeydown={handleExcludeKeydown}
      />
    </div>
  </div>
</div>

<style>
  .filter-search-sentinel {
    height: 1px;
    margin-bottom: -1px;
    pointer-events: none;
  }

  /* Pins under the viewport top for the whole event list. Padding (not margin)
     keeps the background opaque and stops the input margin from collapsing out. */
  .filter-search-bar {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--bg);
    padding-top: 0.5rem;
    padding-bottom: var(--space-xs);
    border-bottom: 1px solid transparent;
  }

  .filter-search-bar--stuck {
    border-bottom-color: var(--border);
    box-shadow: var(--shadow-md);
  }

  /* Labels stay for the resting layout. Once the bar is pinned, the inputs
     already have accessible names, and dropping the labels keeps the bar short
     enough that it does not cover the event being read. */
  .filter-search-bar--stuck :global(.filter-label) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .filter-search-bar :global(.search-input) {
    max-width: none;
    margin-bottom: 0;
  }
</style>
