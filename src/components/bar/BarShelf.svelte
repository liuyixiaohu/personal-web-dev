<!--
  BarShelf — Decorative tool display below the bar counter.
  Shows tools/technologies grouped by expertise area (drink color).
  Purely atmospheric — no interactivity.
-->
<script lang="ts">
  import { subscribe, initLang, t } from '../../i18n/langStore';
  import { DRINKS, type DrinkId } from './drinks';

  // === Tool data (inline — brand names, no translation needed) ===
  interface ShelfGroup { category: DrinkId; tools: string[]; }

  const SHELF: ShelfGroup[] = [
    { category: 'pm',     tools: ['Salesforce', 'HubSpot', 'Google Analytics', 'Optimizely'] },
    { category: 'ds',     tools: ['Python', 'SQL', 'Tableau', 'Machine Learning'] },
    { category: 'visual', tools: ['Figma', 'Adobe CC', 'Blender', 'Three.js'] },
  ];

  // === i18n ===
  initLang();
  let langVersion = $state(0);
  $effect(() => {
    const unsub = subscribe(() => { langVersion++; });
    return unsub;
  });

  let shelfTitle = $derived((langVersion, t('bar.shelf.title')));

  // === Color lookup ===
  function getColor(category: DrinkId): string {
    return DRINKS.find(d => d.id === category)?.color ?? '#ccc';
  }
</script>

<div class="bar-shelf">
  <h2 class="shelf-heading">{shelfTitle}</h2>
  <div class="shelf-groups">
    {#each SHELF as group}
      <div class="shelf-group">
        {#each group.tools as tool}
          <span
            class="shelf-label"
            style="border-bottom-color: {getColor(group.category)}"
          >{tool}</span>
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  .bar-shelf {
    max-width: 520px;
    margin: 0 auto;
    padding: 0 var(--space-md);
    pointer-events: auto;
  }

  .shelf-heading {
    font-size: clamp(0.62rem, 0.58rem + 0.2vw, 0.72rem);
    font-weight: 500;
    color: var(--text-light);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    margin-bottom: var(--space-xs);
    text-align: center;
    opacity: 0.6;
  }

  :global(html[data-lang="zh"]) .shelf-heading {
    font-family: var(--font-zh-body);
    letter-spacing: 0.08em;
  }

  .shelf-groups {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.35rem;
  }

  .shelf-group {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.35rem;
  }

  /* Subtle separator between groups */
  .shelf-group + .shelf-group::before {
    content: '';
    width: 1px;
    height: 16px;
    background: rgba(0, 0, 0, 0.06);
    align-self: center;
    margin: 0 0.15rem;
  }

  .shelf-label {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.35);
    border-bottom: 2px solid transparent; /* overridden by inline style */
    font-size: clamp(0.62rem, 0.58rem + 0.2vw, 0.72rem);
    color: var(--text-light);
    opacity: 0.7;
    white-space: nowrap;
    letter-spacing: 0.02em;
  }

  /* Mobile: slightly tighter */
  @media (max-width: 480px) {
    .bar-shelf {
      padding: 0 var(--space-sm);
    }

    .shelf-label {
      padding: 0.15rem 0.45rem;
      font-size: clamp(0.58rem, 0.54rem + 0.18vw, 0.65rem);
    }

    .shelf-group + .shelf-group::before {
      display: none;
    }
  }
</style>
