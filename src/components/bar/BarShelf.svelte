<!--
  BarShelf — Background wall decoration behind the bar counter.
  Shows tools/technologies grouped by expertise area (drink color).
  Purely atmospheric — low opacity, no interactivity.
-->
<script lang="ts">
  import { DRINKS, type DrinkId } from './drinks';

  // === Tool data (brand names — no translation needed) ===
  interface ShelfGroup { category: DrinkId; tools: string[]; }

  const SHELF: ShelfGroup[] = [
    { category: 'pm',     tools: ['Salesforce', 'HubSpot', 'Google Analytics', 'Optimizely'] },
    { category: 'ds',     tools: ['Python', 'SQL', 'Tableau', 'Machine Learning'] },
    { category: 'visual', tools: ['Figma', 'Adobe CC', 'Blender', 'Three.js'] },
  ];

  // === Color lookup ===
  function getColor(category: DrinkId): string {
    return DRINKS.find(d => d.id === category)?.color ?? '#ccc';
  }
</script>

<div class="bar-shelf">
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
    pointer-events: none;
    opacity: 0.45;
  }

  .shelf-groups {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.4rem;
  }

  .shelf-group {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.4rem;
  }

  /* Subtle separator between groups */
  .shelf-group + .shelf-group::before {
    content: '';
    width: 1px;
    height: 16px;
    background: rgba(0, 0, 0, 0.08);
    align-self: center;
    margin: 0 0.2rem;
  }

  .shelf-label {
    display: inline-block;
    padding: 0.22rem 0.65rem;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.2);
    border-bottom: 2px solid transparent; /* overridden by inline style */
    font-size: clamp(0.65rem, 0.6rem + 0.25vw, 0.78rem);
    color: var(--text-light);
    white-space: nowrap;
    letter-spacing: 0.03em;
  }

  /* Mobile: smaller, tighter */
  @media (max-width: 480px) {
    .bar-shelf {
      padding: 0 var(--space-sm);
      opacity: 0.35;
    }

    .shelf-label {
      padding: 0.15rem 0.45rem;
      font-size: clamp(0.55rem, 0.5rem + 0.18vw, 0.62rem);
    }

    .shelf-group + .shelf-group::before {
      display: none;
    }
  }
</style>
