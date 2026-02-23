<!--
  BottleDetailCard — Compact tooltip bubble showing skill-category details.
  Appears next to the clicked bottle with an arrow pointing at it.
  No overlay — lightweight, doesn't obscure the bar scene.
-->
<script lang="ts">
  import { fly } from 'svelte/transition';
  import { subscribe, initLang, t } from '../../i18n/langStore';
  import { getDrink, type SkillBottle } from './drinks';

  interface Props {
    bottle: SkillBottle;
    anchorRect: DOMRect;
    onDismiss: () => void;
  }

  let { bottle, anchorRect, onDismiss }: Props = $props();

  // Reactive color — updates when bottle changes
  let color = $derived(getDrink(bottle.category).color);

  // === i18n — reactive to both language AND bottle changes ===
  initLang();
  let translatedLabel = $state(t(bottle.labelKey));
  let translatedDesc  = $state(t(bottle.descKey));

  $effect(() => {
    // Access bottle keys in the outer effect scope so Svelte tracks them
    const labelKey = bottle.labelKey;
    const descKey  = bottle.descKey;

    // Update immediately (for bottle changes)
    translatedLabel = t(labelKey);
    translatedDesc  = t(descKey);

    // Also subscribe to language changes
    const unsub = subscribe(() => {
      translatedLabel = t(labelKey);
      translatedDesc  = t(descKey);
    });
    return unsub;
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onDismiss();
    }
  }

  // === Positioning — reactive to anchorRect changes ===
  const ARROW_SIZE = 7;
  const GAP = 4;

  let tipWidth = $state(window.innerWidth <= 480 ? 200 : 240);
  let posStyle = $state('');
  let arrowSide = $state<'bottom' | 'top'>('bottom');
  let arrowLeftPx = $state(0);

  function computePosition(r: DOMRect) {
    const vw = window.innerWidth;

    tipWidth = vw <= 480 ? 200 : 240;
    const tipHeightEst = 140;

    // Anchor center X
    const anchorCx = r.left + r.width / 2;

    // Prefer ABOVE the bottle
    let top = r.top - tipHeightEst - ARROW_SIZE - GAP;
    let left = anchorCx - tipWidth / 2;

    if (top < 8) {
      // Not enough room above — place BELOW
      top = r.bottom + ARROW_SIZE + GAP;
      arrowSide = 'top';
    } else {
      arrowSide = 'bottom';
    }

    // Clamp horizontally
    if (left < 8) left = 8;
    if (left + tipWidth > vw - 8) left = vw - 8 - tipWidth;

    posStyle = `top: ${top}px; left: ${left}px; width: ${tipWidth}px;`;

    // Arrow points at anchor center, relative to tooltip left edge
    arrowLeftPx = Math.max(14, Math.min(tipWidth - 14, anchorCx - left));
  }

  // Recompute position whenever anchorRect changes
  $effect(() => {
    computePosition(anchorRect);
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="bottle-tooltip"
  class:arrow-top={arrowSide === 'top'}
  class:arrow-bottom={arrowSide === 'bottom'}
  style="{posStyle} --arrow-left: {arrowLeftPx}px;"
  transition:fly={{ y: arrowSide === 'bottom' ? 6 : -6, duration: 180 }}
  role="tooltip"
  aria-label={translatedLabel}
>
  <!-- Color accent -->
  <div class="tip-accent" style="background: {color}"></div>

  <!-- Header: dot + title -->
  <div class="tip-header">
    <span class="tip-dot" style="background: {color}"></span>
    <span class="tip-title">{translatedLabel}</span>
  </div>

  <!-- Description -->
  <p class="tip-desc">{translatedDesc}</p>

  <!-- Tool tags -->
  <div class="tip-tools">
    {#each bottle.tools as tool}
      <span class="tip-tag" style="
        background: {color}1A;
        border-color: {color}4D;
      ">{tool}</span>
    {/each}
  </div>
</div>

<style>
  .bottle-tooltip {
    position: fixed;
    z-index: 10;
    background: rgba(255, 255, 255, 0.97);
    border: 1.2px solid #e2ded8;
    border-radius: 12px;
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.10),
      0 1px 3px rgba(0, 0, 0, 0.05);
    font-family: inherit;
    pointer-events: auto;
    overflow: visible;
  }

  /* --- Arrow pointing DOWN (tooltip above bottle) --- */
  .bottle-tooltip.arrow-bottom::after {
    content: '';
    position: absolute;
    bottom: -7px;
    left: var(--arrow-left, 50%);
    transform: translateX(-50%);
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-top: 7px solid white;
  }

  .bottle-tooltip.arrow-bottom::before {
    content: '';
    position: absolute;
    bottom: -9px;
    left: var(--arrow-left, 50%);
    transform: translateX(-50%);
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid #e2ded8;
  }

  /* --- Arrow pointing UP (tooltip below bottle) --- */
  .bottle-tooltip.arrow-top::after {
    content: '';
    position: absolute;
    top: -7px;
    left: var(--arrow-left, 50%);
    transform: translateX(-50%);
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-bottom: 7px solid white;
  }

  .bottle-tooltip.arrow-top::before {
    content: '';
    position: absolute;
    top: -9px;
    left: var(--arrow-left, 50%);
    transform: translateX(-50%);
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 8px solid #e2ded8;
  }

  /* --- Content --- */
  .tip-accent {
    height: 3px;
    border-radius: 12px 12px 0 0;
  }

  .tip-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 0.75rem 0;
  }

  .tip-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .tip-title {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text);
    line-height: 1.3;
  }

  :global(html[data-lang="zh"]) .tip-title {
    font-family: var(--font-zh-heading);
  }

  .tip-desc {
    font-size: 0.75rem;
    color: var(--text-light);
    line-height: 1.45;
    margin: 0.25rem 0.75rem 0;
  }

  .tip-tools {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    padding: 0.45rem 0.75rem 0.6rem;
  }

  .tip-tag {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    border: 1px solid;
    font-size: 0.7rem;
    color: var(--text);
    white-space: nowrap;
  }

  /* === Mobile === */
  @media (max-width: 480px) {
    .tip-title {
      font-size: 0.8rem;
    }

    .tip-desc {
      font-size: 0.7rem;
    }

    .tip-tag {
      font-size: 0.65rem;
      padding: 0.12rem 0.4rem;
    }

    .tip-header {
      padding: 0.45rem 0.6rem 0;
    }

    .tip-tools {
      padding: 0.35rem 0.6rem 0.5rem;
    }

    .tip-desc {
      margin: 0.2rem 0.6rem 0;
    }
  }
</style>
