<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import type { PinData } from './pins';
  import { onLangChange, t } from '../../i18n/langStore';

  interface Props {
    pin: PinData;
    onClose: () => void;
  }

  let { pin, onClose }: Props = $props();

  // Map pin.id to translation keys (replace '-' with '' for hong-kong → hongkong)
  function pinKey(pinId: string, field: string): string {
    return `pin.${pinId.replace(/-/g, '')}.${field}`;
  }

  let translatedTitle = $state(t(pinKey(pin.id, 'title')));
  let translatedStory = $state(t(pinKey(pin.id, 'story')));

  $effect(() => onLangChange(() => {
    translatedTitle = t(pinKey(pin.id, 'title'));
    translatedStory = t(pinKey(pin.id, 'story'));
  }));

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="modal-overlay"
  transition:fade={{ duration: 250 }}
  onclick={handleOverlayClick}
>
  <div
    class="modal-card"
    transition:fly={{ y: 30, duration: 300 }}
    role="dialog"
    aria-modal="true"
    aria-label={translatedTitle}
  >
    <div class="modal-header">
      <div class="modal-location">
        <span class="modal-city">{pin.city}</span>
        <span class="modal-sep">,&nbsp;</span>
        <span class="modal-country">{pin.country}</span>
      </div>
      <button class="modal-close" onclick={onClose} aria-label="Close">
        &times;
      </button>
    </div>

    <div class="modal-divider"></div>

    <h2 class="modal-title">{translatedTitle}</h2>
    <p class="modal-body">{@html translatedStory}</p>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(250, 247, 242, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 1.5rem;
  }

  .modal-card {
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 16px;
    box-shadow:
      0 8px 40px rgba(0, 0, 0, 0.08),
      0 1px 3px rgba(0, 0, 0, 0.04);
    max-width: 32rem;
    width: 100%;
    padding: clamp(1.5rem, 3vw, 2.5rem);
    font-family: inherit;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .modal-location {
    color: var(--text-light);
  }

  .modal-city {
    color: var(--text);
    font-weight: 500;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: var(--fs-lg);
    color: var(--text-light);
    cursor: pointer;
    padding: 0.2rem 0.5rem;
    line-height: 1;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .modal-close:hover {
    color: var(--text);
    background: rgba(0, 0, 0, 0.04);
  }

  .modal-divider {
    height: 1px;
    background: var(--border);
    margin-bottom: 1.25rem;
  }

  .modal-title {
    font-size: var(--fs-lg);
    font-weight: 500;
    color: var(--text);
    margin-bottom: 1rem;
    line-height: 1.3;
  }

  :global(html[data-lang="zh"]) .modal-title {
    font-family: var(--font-zh-heading);
  }

  .modal-body {
    color: var(--text-light);
    line-height: 1.7;
    white-space: pre-line;
  }

  .modal-body :global(a) {
    color: var(--text);
    text-decoration: underline;
    text-decoration-color: var(--border);
    text-underline-offset: 2px;
    transition: text-decoration-color 0.15s ease;
  }

  .modal-body :global(a:hover) {
    text-decoration-color: var(--text);
    opacity: 1;
  }
</style>
