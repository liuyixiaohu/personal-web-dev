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
  let searchBarEl: HTMLElement | undefined = $state();
  // How far the on-screen keyboard covers the bottom of the layout viewport.
  // Added to the bar's `bottom` so the fields stay visible while typing.
  let keyboardOffset = $state(0);

  $effect(() => {
    const bar = searchBarEl;
    if (!bar) return;

    const publishHeight = () => {
      document.documentElement.style.setProperty(
        '--events-search-bar-height',
        `${bar.offsetHeight}px`,
      );
    };
    const resizeObserver = new ResizeObserver(publishHeight);
    resizeObserver.observe(bar);
    publishHeight();

    const viewport = window.visualViewport;
    const publishKeyboard = () => {
      keyboardOffset = viewport
        ? Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop))
        : 0;
    };
    publishKeyboard();
    viewport?.addEventListener('resize', publishKeyboard);
    viewport?.addEventListener('scroll', publishKeyboard);

    return () => {
      resizeObserver.disconnect();
      viewport?.removeEventListener('resize', publishKeyboard);
      viewport?.removeEventListener('scroll', publishKeyboard);
      document.documentElement.style.removeProperty('--events-search-bar-height');
    };
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

<!-- Fixed panel: bottom-right above Top on desktop, bottom-center on phones.
     Everything that filters the list lives here, and scrolls inside the panel
     once the cities no longer fit. -->
<div class="filter-panel" bind:this={searchBarEl} style:--keyboard-offset="{keyboardOffset}px">
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
</div>

<style>
  /* Desktop: a compact panel in the screen's bottom-right, just above the
     Top button (itself fixed at bottom/right 2rem, about 1.6rem tall). */
  .filter-panel {
    position: fixed;
    z-index: 20;
    right: 2rem;
    bottom: calc(4.5rem + var(--keyboard-offset, 0px));
    width: min(22rem, calc(100vw - 4rem));
    max-height: calc(100dvh - 6.5rem - var(--keyboard-offset, 0px));
    padding: var(--space-xs);
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
  }

  .filter-panel :global(.filter-row-pair) {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-xs);
  }

  .filter-panel :global(.search-input) {
    max-width: none;
    margin-bottom: 0;
  }

  /* Room so the footer and the last event can scroll clear of the panel.
     4.5rem matches the panel's desktop offset above Top. */
  :global(body.events-page) {
    padding-bottom: calc(var(--events-search-bar-height, 6rem) + 4.5rem + var(--space-xs));
  }

  /* Phones: center along the bottom with its own inset, since the screen edge
     has no page margin to tuck a corner control into. Top moves above the bar. */
  @media (max-width: 32rem) {
    .filter-panel {
      left: var(--space-sm);
      right: var(--space-sm);
      width: auto;
      max-height: calc(
        100dvh - var(--space-lg) - var(--keyboard-offset, 0px) - env(safe-area-inset-bottom, 0px)
      );
      bottom: calc(
        var(--space-sm) + env(safe-area-inset-bottom, 0px) + var(--keyboard-offset, 0px)
      );
    }

    :global(body.events-page) {
      padding-bottom: calc(
        var(--events-search-bar-height, 8rem) + var(--space-sm) + env(safe-area-inset-bottom, 0px)
      );
    }

    :global(body.events-page .back-to-top) {
      bottom: calc(
        var(--events-search-bar-height, 8rem) + var(--space-sm) + var(--space-xs) +
          env(safe-area-inset-bottom, 0px)
      );
    }
  }
</style>
