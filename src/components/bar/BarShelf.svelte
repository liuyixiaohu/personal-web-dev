<!--
  BarShelf — Grid wine rack on the back wall behind the bar.
  6 skill-category bottles in 3×2 grid (one row per expertise area).
  Clickable — emits onBottleClick for popup detail card.
-->
<script lang="ts">
  import { DRINKS, BOTTLES, type DrinkId, type SkillBottle } from './drinks';
  import { subscribe, initLang, t } from '../../i18n/langStore';

  interface Props {
    onBottleClick?: (bottle: SkillBottle, rect: DOMRect) => void;
  }

  let { onBottleClick }: Props = $props();

  // === i18n reactive labels ===
  initLang();
  let langVersion = $state(0);
  $effect(() => {
    const unsub = subscribe(() => { langVersion++; });
    return unsub;
  });

  function label(bottle: SkillBottle): string {
    return (langVersion, t(bottle.labelKey)) || bottle.label;
  }

  // === Color lookup ===
  function getColor(category: DrinkId): string {
    return DRINKS.find(d => d.id === category)?.color ?? '#ccc';
  }

  function handleClick(bottle: SkillBottle, e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onBottleClick?.(bottle, rect);
  }
</script>

<div class="wine-rack">
  {#each BOTTLES as bottle}
    <button
      class="rack-cell"
      onclick={(e) => handleClick(bottle, e)}
      aria-label={label(bottle)}
    >
      <div class="bottle">
        <div class="bottle-cap"></div>
        <div class="bottle-neck"></div>
        <div class="bottle-body">
          <div class="bottle-liquid" style="background: {getColor(bottle.category)}"></div>
          <div class="bottle-shine"></div>
        </div>
        <span class="bottle-label">{label(bottle)}</span>
      </div>
    </button>
  {/each}
</div>

<style>
  /* === Wine rack grid === */
  .wine-rack {
    display: grid;
    grid-template-columns: repeat(2, auto);
    grid-template-rows: repeat(3, auto);
    pointer-events: auto;

    /* Outer frame */
    border: 2.5px solid #c8c3bc;
    border-radius: 3px;
    background: rgba(200, 195, 188, 0.12);
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.05),
      inset 0 0 0 0.5px rgba(255, 255, 255, 0.15);
  }

  /* === Cubby cell (now a button) === */
  .rack-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    padding: 8px 12px 6px;
    border: 1px solid rgba(200, 195, 188, 0.45);
    cursor: pointer;
    background: none;
    font-family: inherit;
    outline: none;
    transition: background 0.25s ease;
  }

  .rack-cell:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  .rack-cell:focus-visible {
    outline: 2px solid #5A636B;
    outline-offset: -2px;
    border-radius: 2px;
  }

  /* === Bottle (bigger for 3×2 grid) === */
  .bottle {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    transition: transform 0.25s ease;
  }

  .rack-cell:hover .bottle {
    transform: translateY(-3px);
  }

  .bottle-cap {
    width: 10px;
    height: 6px;
    background: linear-gradient(to bottom, #d5d0ca, #c8c3bc);
    border-radius: 2px 2px 1px 1px;
  }

  .bottle-neck {
    width: 12px;
    height: 12px;
    background: rgba(255, 255, 255, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-top: none;
    border-radius: 0;
  }

  .bottle-body {
    position: relative;
    width: 30px;
    height: 44px;
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
    transition: opacity 0.25s ease;
  }

  .rack-cell:hover .bottle-liquid {
    opacity: 0.9;
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
    margin-top: 4px;
    font-size: clamp(0.52rem, 0.48rem + 0.2vw, 0.62rem);
    color: var(--text-light);
    white-space: nowrap;
    letter-spacing: 0.02em;
    text-align: center;
    line-height: 1.2;
  }

  /* === Mobile === */
  @media (max-width: 480px) {
    .wine-rack {
      border-width: 1.5px;
    }

    .rack-cell {
      padding: 5px 6px 3px;
      border-width: 0.5px;
    }

    .bottle-cap {
      width: 7px;
      height: 4px;
    }

    .bottle-neck {
      width: 9px;
      height: 7px;
    }

    .bottle-body {
      width: 20px;
      height: 28px;
    }

    .bottle-label {
      font-size: 0.42rem;
      letter-spacing: 0;
    }
  }
</style>
