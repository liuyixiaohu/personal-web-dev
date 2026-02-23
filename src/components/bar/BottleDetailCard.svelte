<!--
  BottleDetailCard — Overlay card showing skill-category details.
  Follows MixPreviewCard pattern: fade overlay + fly card + Escape/click-outside dismiss.
  Displays high-level skill label, description, and specific tool tags.
-->
<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { subscribe, initLang, t } from '../../i18n/langStore';
  import { getDrink, type SkillBottle } from './drinks';

  interface Props {
    bottle: SkillBottle;
    onDismiss: () => void;
  }

  let { bottle, onDismiss }: Props = $props();

  const color = getDrink(bottle.category).color;

  // === i18n ===
  initLang();
  let translatedLabel = $state(t(bottle.labelKey));
  let translatedDesc  = $state(t(bottle.descKey));

  $effect(() => {
    const unsub = subscribe(() => {
      translatedLabel = t(bottle.labelKey);
      translatedDesc  = t(bottle.descKey);
    });
    return unsub;
  });

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onDismiss();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onDismiss();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="card-overlay"
  transition:fade={{ duration: 200 }}
  onclick={handleOverlayClick}
>
  <div
    class="detail-card"
    transition:fly={{ y: 40, duration: 350 }}
    role="dialog"
    aria-modal="true"
    aria-label={translatedLabel}
  >
    <!-- Color bar at top -->
    <div class="card-color-bar" style="background: {color}"></div>

    <!-- Close button -->
    <button class="card-close" onclick={onDismiss} aria-label="Close">
      &times;
    </button>

    <!-- Category dot -->
    <div class="card-dot-row">
      <span class="card-dot" style="background: {color}"></span>
    </div>

    <!-- Title -->
    <h2 class="card-title">{translatedLabel}</h2>

    <!-- Description -->
    <p class="card-desc">{translatedDesc}</p>

    <!-- Tool tags -->
    <div class="tools-list">
      {#each bottle.tools as tool}
        <span class="tool-tag" style="
          background: {color}1A;
          border-color: {color}4D;
        ">{tool}</span>
      {/each}
    </div>
  </div>
</div>

<style>
  .card-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(228, 221, 210, 0.82);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 1.5rem;
  }

  .detail-card {
    position: relative;
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 16px;
    box-shadow:
      0 8px 40px rgba(0, 0, 0, 0.12),
      0 1px 3px rgba(0, 0, 0, 0.06);
    max-width: 22rem;
    width: 100%;
    overflow: hidden;
    font-family: inherit;
  }

  .card-color-bar {
    height: 6px;
    width: 100%;
  }

  .card-close {
    position: absolute;
    top: 0.85rem;
    right: 0.85rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--text-light);
    cursor: pointer;
    padding: 0.2rem 0.5rem;
    line-height: 1;
    border-radius: 6px;
    transition: all 0.2s ease;
    z-index: 1;
  }

  .card-close:hover {
    color: var(--text);
    background: rgba(0, 0, 0, 0.04);
  }

  .card-dot-row {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: clamp(1.25rem, 2.5vw, 2rem);
  }

  .card-dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  .card-title {
    text-align: center;
    font-size: clamp(1.2rem, 1rem + 0.8vw, 1.6rem);
    font-weight: 500;
    color: var(--text);
    margin: var(--space-sm) clamp(1.25rem, 2.5vw, 2rem) 0;
    line-height: 1.3;
  }

  :global(html[data-lang="zh"]) .card-title {
    font-family: var(--font-zh-heading);
  }

  .card-desc {
    text-align: center;
    font-size: clamp(0.85rem, 0.8rem + 0.25vw, 0.95rem);
    color: var(--text-light);
    margin: var(--space-sm) clamp(1.25rem, 2.5vw, 2rem) 0;
    line-height: 1.5;
  }

  .tools-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    padding: var(--space-md) clamp(1.25rem, 2.5vw, 2rem) clamp(1.25rem, 2.5vw, 2rem);
  }

  .tool-tag {
    display: inline-block;
    padding: 0.3rem 0.75rem;
    border-radius: 20px;
    border: 1px solid;
    font-size: clamp(0.78rem, 0.74rem + 0.2vw, 0.88rem);
    color: var(--text);
    letter-spacing: 0.01em;
    white-space: nowrap;
  }
</style>
