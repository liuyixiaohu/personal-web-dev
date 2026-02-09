<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import type { PinData } from './pins';
  import { subscribe, initLang, t } from '../../i18n/langStore';

  interface Props {
    pin: PinData;
    onClose: () => void;
  }

  let { pin, onClose }: Props = $props();

  // Map pin.id to translation keys (replace '-' with '' for hong-kong → hongkong)
  function pinKey(pinId: string, field: string): string {
    return `pin.${pinId.replace(/-/g, '')}.${field}`;
  }

  initLang();
  let translatedTitle = $state(t(pinKey(pin.id, 'title')) || pin.title);
  let translatedStory = $state(t(pinKey(pin.id, 'story')) || pin.story);

  $effect(() => {
    const unsub = subscribe(() => {
      translatedTitle = t(pinKey(pin.id, 'title')) || pin.title;
      translatedStory = t(pinKey(pin.id, 'story')) || pin.story;
    });
    return unsub;
  });

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
    <p class="modal-body">{translatedStory}</p>
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
    font-family: 'EB Garamond', Garamond, serif;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .modal-location {
    font-size: clamp(0.9rem, 0.85rem + 0.3vw, 1.05rem);
    color: #8a9199;
    font-style: italic;
  }

  .modal-city {
    color: #5A636B;
    font-weight: 500;
    font-style: normal;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 1.6rem;
    color: #8a9199;
    cursor: pointer;
    padding: 0.2rem 0.5rem;
    line-height: 1;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .modal-close:hover {
    color: #5A636B;
    background: rgba(0, 0, 0, 0.04);
  }

  .modal-divider {
    height: 1px;
    background: #e2ded8;
    margin-bottom: 1.25rem;
  }

  .modal-title {
    font-size: clamp(1.3rem, 1.1rem + 1vw, 1.8rem);
    font-weight: 500;
    color: #5A636B;
    margin-bottom: 1rem;
    line-height: 1.3;
  }

  .modal-body {
    font-size: clamp(0.95rem, 0.9rem + 0.3vw, 1.1rem);
    color: #6b737b;
    line-height: 1.7;
  }
</style>
