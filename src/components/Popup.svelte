<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open: boolean;
    title: string;
    onClose: () => void;
    width?: string;
    children: Snippet;
  }

  let { open, title, onClose, width = '22rem', children }: Props = $props();
</script>

{#if open}
  <div class="popup-backdrop" onclick={onClose} role="presentation"></div>
  <div class="popup" style="--popup-w: {width}">
    <div class="popup-header">
      <span class="popup-title">{title}</span>
      <button class="popup-close" onclick={onClose}>&times;</button>
    </div>
    {@render children()}
  </div>
{/if}

<style>
  .popup-backdrop {
    position: fixed;
    inset: 0;
    z-index: 99;
  }

  .popup {
    position: absolute;
    top: calc(100% + 0.4rem);
    right: 0;
    z-index: 100;
    width: min(var(--popup-w, 22rem), calc(100vw - 2rem));
    max-height: 28rem;
    overflow-y: auto;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    padding: 0.75rem;
  }

  @media (max-width: 480px) {
    .popup {
      position: fixed;
      top: auto;
      right: 1rem;
      bottom: 1rem;
      left: 1rem;
      width: auto;
      max-height: 70vh;
    }
  }

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .popup-title {
    font-size: var(--fs-xs);
    font-weight: 700;
    line-height: 1.5;
    color: var(--text);
  }

  .popup-close {
    font-family: inherit;
    font-size: var(--fs-md);
    color: var(--text-light);
    background: none;
    border: none;
    cursor: pointer;
    line-height: 1;
    padding: 0 0.15rem;
  }

  .popup-close:hover {
    color: var(--text);
  }
</style>
