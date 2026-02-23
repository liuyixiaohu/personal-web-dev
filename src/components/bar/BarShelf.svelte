<!--
  BarShelf — Decorative bottle display on the back wall behind the bar.
  Shows tools/technologies as colored bottles grouped by expertise area.
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
          <div class="bottle">
            <div class="bottle-cap"></div>
            <div class="bottle-neck"></div>
            <div class="bottle-body">
              <div class="bottle-liquid" style="background: {getColor(group.category)}"></div>
              <div class="bottle-shine"></div>
            </div>
            <span class="bottle-label">{tool}</span>
          </div>
        {/each}
      </div>
    {/each}
  </div>
  <!-- Shelf plank + brackets -->
  <div class="shelf-plank">
    <div class="bracket bracket-left"></div>
    <div class="bracket bracket-right"></div>
  </div>
</div>

<style>
  /* === Container === */
  .bar-shelf {
    position: relative;
    max-width: 560px;
    margin: 0 auto;
    padding: 0 var(--space-md);
    pointer-events: none;
    opacity: 0.5;
  }

  .shelf-groups {
    display: flex;
    justify-content: center;
    gap: 1.2rem;
  }

  .shelf-group {
    display: flex;
    align-items: flex-end;
    gap: 0.6rem;
  }

  /* Subtle separator between groups */
  .shelf-group + .shelf-group::before {
    content: '';
    width: 1px;
    height: 32px;
    background: rgba(0, 0, 0, 0.06);
    align-self: center;
    margin: 0 0.2rem;
  }

  /* === Single bottle === */
  .bottle {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  /* Cap */
  .bottle-cap {
    width: 8px;
    height: 5px;
    background: linear-gradient(to bottom, #d5d0ca, #c8c3bc);
    border-radius: 2px 2px 1px 1px;
  }

  /* Neck */
  .bottle-neck {
    width: 10px;
    height: 10px;
    background: rgba(255, 255, 255, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-top: none;
    border-radius: 0;
  }

  /* Body */
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

  /* Liquid fill */
  .bottle-liquid {
    position: absolute;
    bottom: 1px;
    left: 1px;
    right: 1px;
    height: 70%;
    border-radius: 0 0 5px 5px;
    opacity: 0.7;
  }

  /* Glass highlight */
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

  /* Label below bottle */
  .bottle-label {
    display: block;
    margin-top: 3px;
    font-size: clamp(0.52rem, 0.48rem + 0.2vw, 0.62rem);
    color: var(--text-light);
    white-space: nowrap;
    letter-spacing: 0.02em;
    text-align: center;
    line-height: 1.2;
  }

  /* === Shelf plank (3D look: top surface + front face) === */
  .shelf-plank {
    position: absolute;
    bottom: 12px;
    left: -12px;
    right: -12px;
    height: 5px;
    background: linear-gradient(to bottom, #e0dcd6, #d5d0ca);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.35),
      0 1px 0 rgba(0, 0, 0, 0.04);
  }

  /* Front face of the shelf (visible thickness) */
  .shelf-plank::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    height: 7px;
    background: linear-gradient(to bottom, #ccc8c1, #c0bbb4);
    border-radius: 0 0 2px 2px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
  }

  /* Brackets */
  .bracket {
    position: absolute;
    top: 100%;
    width: 5px;
    height: 14px;
    background: linear-gradient(to right, #c8c3bc, #d0ccc6, #c0bbb4);
    border-radius: 0 0 1px 1px;
    margin-top: 7px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  }

  .bracket-left {
    left: 14%;
  }

  .bracket-right {
    right: 14%;
  }

  /* === Mobile === */
  @media (max-width: 480px) {
    .bar-shelf {
      padding: 0;
      opacity: 0.35;
    }

    .shelf-groups {
      gap: 0.4rem;
    }

    .shelf-group {
      gap: 0.2rem;
    }

    .shelf-group + .shelf-group::before {
      display: none;
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
      font-size: 0.4rem;
      letter-spacing: 0;
    }

    .shelf-plank {
      bottom: 8px;
      height: 3px;
      left: -6px;
      right: -6px;
    }

    .shelf-plank::after {
      height: 5px;
    }

    .bracket {
      width: 4px;
      height: 10px;
      margin-top: 5px;
    }
  }
</style>
