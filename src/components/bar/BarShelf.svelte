<!--
  BarShelf — Grid wine rack on the back wall behind the bar.
  12 bottles in 3×4 grid (one row per expertise area).
  Purely atmospheric — positioned right side, no interactivity.
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

<div class="wine-rack">
  {#each SHELF as group}
    {#each group.tools as tool}
      <div class="rack-cell">
        <div class="bottle">
          <div class="bottle-cap"></div>
          <div class="bottle-neck"></div>
          <div class="bottle-body">
            <div class="bottle-liquid" style="background: {getColor(group.category)}"></div>
            <div class="bottle-shine"></div>
          </div>
          <span class="bottle-label">{tool}</span>
        </div>
      </div>
    {/each}
  {/each}
</div>

<style>
  /* === Wine rack grid === */
  .wine-rack {
    display: grid;
    grid-template-columns: repeat(4, auto);
    grid-template-rows: repeat(3, auto);
    pointer-events: none;
    opacity: 0.75;

    /* Outer frame */
    border: 2.5px solid #c8c3bc;
    border-radius: 3px;
    background: rgba(200, 195, 188, 0.12);
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.05),
      inset 0 0 0 0.5px rgba(255, 255, 255, 0.15);
  }

  /* === Cubby cell === */
  .rack-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    padding: 6px 8px 4px;
    border: 1px solid rgba(200, 195, 188, 0.45);
  }

  /* === Bottle === */
  .bottle {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  .bottle-cap {
    width: 8px;
    height: 5px;
    background: linear-gradient(to bottom, #d5d0ca, #c8c3bc);
    border-radius: 2px 2px 1px 1px;
  }

  .bottle-neck {
    width: 10px;
    height: 10px;
    background: rgba(255, 255, 255, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-top: none;
    border-radius: 0;
  }

  .bottle-body {
    position: relative;
    width: 24px;
    height: 36px;
    background: rgba(255, 255, 255, 0.22);
    border: 1px solid rgba(255, 255, 255, 0.45);
    border-radius: 3px 3px 6px 6px;
    overflow: hidden;
    box-shadow:
      inset 0 0 0 0.5px rgba(255, 255, 255, 0.25),
      inset 0 -1px 3px rgba(0, 0, 0, 0.03);
  }

  .bottle-liquid {
    position: absolute;
    bottom: 1px;
    left: 1px;
    right: 1px;
    height: 70%;
    border-radius: 0 0 5px 5px;
    opacity: 0.7;
  }

  .bottle-shine {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 35%;
    height: 50%;
    background: linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.45) 0%,
      rgba(255, 255, 255, 0.08) 50%,
      transparent 100%
    );
    border-radius: 2px 1px 30% 15%;
    pointer-events: none;
  }

  .bottle-label {
    display: block;
    margin-top: 3px;
    font-size: clamp(0.48rem, 0.44rem + 0.2vw, 0.58rem);
    color: var(--text-light);
    white-space: nowrap;
    letter-spacing: 0.02em;
    text-align: center;
    line-height: 1.2;
    /* long names (Google Analytics, Machine Learning) fit naturally in auto-sized grid */
  }

  /* === Mobile === */
  @media (max-width: 480px) {
    .wine-rack {
      opacity: 0.5;
      border-width: 1.5px;
    }

    .rack-cell {
      padding: 3px 4px 2px;
      border-width: 0.5px;
    }

    .bottle-cap {
      width: 5px;
      height: 3px;
    }

    .bottle-neck {
      width: 7px;
      height: 5px;
    }

    .bottle-body {
      width: 14px;
      height: 20px;
    }

    .bottle-label {
      font-size: 0.38rem;
      letter-spacing: 0;
      max-width: 36px;
    }
  }
</style>
