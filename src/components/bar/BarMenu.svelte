<!--
  BarMenu — Cocktail menu displayed below the bar counter.
  Shows "Single Pours" (3 drinks) and "House Blends" (3 mixes).
  Highlights items linked to the hovered/selected glasses above.
-->
<script lang="ts">
  import { subscribe, initLang, t } from '../../i18n/langStore';
  import { DRINKS, MIXES, getDrink, type DrinkId, type Mix } from './drinks';

  interface Props {
    hoveredDrink: DrinkId | null;
    selectedDrink: DrinkId | null;
    onItemHover: (drinkId: DrinkId | null, mixId?: string | null) => void;
    onItemClick: (route: string) => void;
  }

  let { hoveredDrink, selectedDrink, onItemHover, onItemClick }: Props = $props();

  // === i18n ===
  initLang();
  let langVersion = $state(0);
  $effect(() => {
    const unsub = subscribe(() => { langVersion++; });
    return unsub;
  });

  // Pre-translated strings — re-derived whenever langVersion bumps
  let singlesHeading = $derived((langVersion, t('bar.menu.singles')));
  let blendsHeading  = $derived((langVersion, t('bar.menu.blends')));

  // For drink items, derive arrays of translated names/descs
  let drinkNames = $derived((langVersion, DRINKS.map(d => t(`bar.drink.${d.id}`))));
  let drinkDescs = $derived((langVersion, DRINKS.map(d => t(d.descKey))));
  let mixNames   = $derived((langVersion, MIXES.map(m => t(m.titleKey))));
  let mixDescs   = $derived((langVersion, MIXES.map(m => t(m.descKey))));

  // === Highlight logic ===
  function isSingleHighlighted(drinkId: DrinkId): boolean {
    return hoveredDrink === drinkId || selectedDrink === drinkId;
  }

  function blendHighlight(mix: Mix): 'full' | 'partial' | null {
    const [a, b] = mix.drinks;
    // Full: both drinks involved (one selected, other hovered)
    if (selectedDrink && hoveredDrink && selectedDrink !== hoveredDrink) {
      if ((selectedDrink === a || selectedDrink === b) &&
          (hoveredDrink === a || hoveredDrink === b)) {
        return 'full';
      }
    }
    // Partial: one drink of the blend is active
    if (selectedDrink === a || selectedDrink === b) return 'partial';
    if (hoveredDrink === a || hoveredDrink === b) return 'partial';
    return null;
  }
</script>

<div class="bar-menu">
  <!-- Single Pours -->
  <section class="menu-section">
    <h2 class="menu-heading">{singlesHeading}</h2>
    <ul class="menu-list">
      {#each DRINKS as drink, i}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <li
          class="menu-item"
          class:highlighted={isSingleHighlighted(drink.id)}
          onmouseenter={() => onItemHover(drink.id)}
          onmouseleave={() => onItemHover(null)}
          onclick={() => onItemClick(drink.route)}
          role="button"
          tabindex="0"
        >
          <span class="color-dot" style="background: {drink.color}"></span>
          <span class="item-name">{drinkNames[i]}</span>
          <span class="item-desc">{drinkDescs[i]}</span>
        </li>
      {/each}
    </ul>
  </section>

  <div class="menu-divider"></div>

  <!-- House Blends -->
  <section class="menu-section">
    <h2 class="menu-heading">{blendsHeading}</h2>
    <ul class="menu-list">
      {#each MIXES as mix, i}
        {@const hl = blendHighlight(mix)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <li
          class="menu-item"
          class:highlighted={hl === 'full'}
          class:highlighted-partial={hl === 'partial'}
          onmouseenter={() => onItemHover(null, mix.id)}
          onmouseleave={() => onItemHover(null)}
          onclick={() => onItemClick(mix.route)}
          role="button"
          tabindex="0"
        >
          <span class="color-dots">
            <span class="color-dot" style="background: {getDrink(mix.drinks[0]).color}"></span>
            <span class="dot-sep">&times;</span>
            <span class="color-dot" style="background: {getDrink(mix.drinks[1]).color}"></span>
          </span>
          <span class="item-name">{mixNames[i]}</span>
          <span class="item-desc">{mixDescs[i]}</span>
        </li>
      {/each}
    </ul>
  </section>
</div>

<style>
  .bar-menu {
    max-width: 520px;
    margin: 0 auto;
    padding: var(--space-sm) var(--space-md);
    pointer-events: auto;
  }

  .menu-heading {
    font-size: clamp(0.65rem, 0.6rem + 0.25vw, 0.75rem);
    font-weight: 500;
    color: var(--text-light);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    margin-bottom: var(--space-xs);
    padding-left: var(--space-xs);
  }

  :global(html[data-lang="zh"]) .menu-heading {
    font-family: var(--font-zh-body);
    letter-spacing: 0.08em;
  }

  .menu-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .menu-item {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    column-gap: var(--space-sm);
    padding: var(--space-xs) var(--space-xs);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .menu-item:hover {
    background: rgba(255, 255, 255, 0.45);
  }

  .menu-item.highlighted {
    background: rgba(255, 255, 255, 0.55);
  }

  .menu-item.highlighted-partial {
    background: rgba(255, 255, 255, 0.25);
  }

  .color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    grid-row: 1 / -1;
    align-self: center;
  }

  .color-dots {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    grid-row: 1 / -1;
    align-self: center;
  }

  .color-dots .color-dot {
    grid-row: unset;
    width: 10px;
    height: 10px;
  }

  .dot-sep {
    font-size: 0.65rem;
    color: var(--text-light);
    opacity: 0.6;
    line-height: 1;
  }

  .item-name {
    font-size: clamp(0.85rem, 0.8rem + 0.25vw, 0.95rem);
    color: var(--text);
    font-weight: 500;
    grid-column: 2;
    line-height: 1.3;
  }

  :global(html[data-lang="zh"]) .item-name {
    font-family: var(--font-zh-body);
  }

  .item-desc {
    font-size: clamp(0.7rem, 0.65rem + 0.2vw, 0.8rem);
    color: var(--text-light);
    font-style: italic;
    grid-column: 2;
    line-height: 1.4;
    margin-top: 0.1rem;
  }

  .menu-divider {
    height: 1px;
    background: rgba(0, 0, 0, 0.06);
    margin: var(--space-xs) var(--space-xs);
  }

  .menu-section + .menu-section {
    /* no extra margin needed, divider handles it */
  }

  /* Mobile: hide descriptions */
  @media (max-width: 480px) {
    .bar-menu {
      padding: var(--space-xs) var(--space-sm);
    }

    .item-desc {
      display: none;
    }

    .menu-item {
      grid-template-rows: auto;
      padding: var(--space-xs) var(--space-xs);
    }
  }
</style>
