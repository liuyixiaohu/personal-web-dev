<!--
  MixPreviewCard — Overlay card previewing a drink mix before navigation.
  Follows the StoryModal pattern: fade overlay + fly card + Escape/click-outside dismiss.
-->
<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { subscribe, initLang, t } from '../../i18n/langStore';
  import { getDrink, type Mix } from './drinks';

  interface Props {
    mix: Mix;
    onNavigate: () => void;
    onDismiss: () => void;
  }

  let { mix, onNavigate, onDismiss }: Props = $props();

  const color1 = getDrink(mix.drinks[0]).color;
  const color2 = getDrink(mix.drinks[1]).color;

  // === i18n ===
  initLang();
  let translatedTitle    = $state(t(mix.titleKey));
  let translatedSubtitle = $state(t(mix.subtitleKey));
  let translatedDesc     = $state(t(mix.descKey));
  let translatedCta      = $state(t('bar.card.cta'));

  $effect(() => {
    const unsub = subscribe(() => {
      translatedTitle    = t(mix.titleKey);
      translatedSubtitle = t(mix.subtitleKey);
      translatedDesc     = t(mix.descKey);
      translatedCta      = t('bar.card.cta');
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
    class="mix-card"
    transition:fly={{ y: 40, duration: 350 }}
    role="dialog"
    aria-modal="true"
    aria-label={translatedTitle}
  >
    <!-- Gradient bar at top -->
    <div
      class="card-gradient"
      style="background: linear-gradient(135deg, {color1} 0%, {color2} 100%)"
    ></div>

    <!-- Close button -->
    <button class="card-close" onclick={onDismiss} aria-label="Close">
      &times;
    </button>

    <!-- Color dots -->
    <div class="card-dots">
      <span class="dot" style="background: {color1}"></span>
      <span class="dot-sep">&times;</span>
      <span class="dot" style="background: {color2}"></span>
    </div>

    <!-- Title -->
    <h2 class="card-title">{translatedTitle}</h2>

    <!-- Subtitle -->
    <p class="card-subtitle">{translatedSubtitle}</p>

    <!-- Flavor text -->
    <p class="card-flavor">{translatedDesc}</p>

    <!-- CTA -->
    <button class="card-cta" onclick={onNavigate}>
      {translatedCta}
    </button>
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
    background: rgba(228, 221, 210, 0.75);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 1.5rem;
  }

  .mix-card {
    position: relative;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 16px;
    box-shadow:
      0 8px 40px rgba(0, 0, 0, 0.08),
      0 1px 3px rgba(0, 0, 0, 0.04);
    max-width: 24rem;
    width: 100%;
    overflow: hidden;
    font-family: inherit;
  }

  .card-gradient {
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

  .card-dots {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding-top: clamp(1.25rem, 2.5vw, 2rem);
  }

  .dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  .dot-sep {
    font-size: 0.9rem;
    color: var(--text-light);
    font-weight: 300;
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

  .card-subtitle {
    text-align: center;
    font-size: clamp(0.8rem, 0.75rem + 0.25vw, 0.9rem);
    color: var(--text-light);
    font-style: italic;
    margin: 0.25rem clamp(1.25rem, 2.5vw, 2rem) 0;
  }

  .card-flavor {
    text-align: center;
    font-size: clamp(0.85rem, 0.8rem + 0.25vw, 0.95rem);
    color: var(--text-light);
    margin: var(--space-sm) clamp(1.25rem, 2.5vw, 2rem) 0;
    line-height: 1.5;
  }

  .card-cta {
    display: block;
    margin: var(--space-md) auto clamp(1.25rem, 2.5vw, 2rem);
    padding: 0.6rem 1.5rem;
    background: var(--text);
    color: #FAF7F2;
    border: none;
    border-radius: 24px;
    font-family: inherit;
    font-size: clamp(0.85rem, 0.8rem + 0.25vw, 0.95rem);
    cursor: pointer;
    transition: opacity 0.2s ease, transform 0.15s ease;
    letter-spacing: 0.02em;
  }

  .card-cta:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }
</style>
