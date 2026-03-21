<script lang="ts">
  import { t } from '../../i18n/langStore';

  interface Props {
    storageKey: string;
  }

  let { storageKey }: Props = $props();

  let open = $state(
    typeof localStorage !== 'undefined' && !localStorage.getItem(storageKey)
  );

  function dismiss() {
    open = false;
    localStorage.setItem(storageKey, '1');
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="announce-overlay" onclick={dismiss}>
    <div class="announce-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <h3 class="announce-title">{t('events.announceTitle')}</h3>
      <ol class="announce-list">
        <li>{t('events.announceP1')}</li>
        <li>{t('events.announceP2')}</li>
        <li>{t('events.announceP3')}</li>
      </ol>
      <button class="announce-btn" onclick={dismiss}>{t('events.announceOk')}</button>
    </div>
  </div>
{/if}

<style>
  .announce-overlay {
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

  .announce-card {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
    max-width: 28rem;
    width: 100%;
    padding: clamp(1.25rem, 3vw, 2rem);
  }

  .announce-title {
    font-size: var(--fs-md);
    font-weight: 500;
    color: var(--text);
    margin-bottom: 0.75rem;
  }

  .announce-list {
    list-style: decimal;
    padding-left: 1.2em;
    color: var(--text-light);
    font-size: var(--fs-sm);
    line-height: 1.7;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  .announce-btn {
    display: block;
    width: 100%;
    padding: 0.5em 0;
    font-family: inherit;
    font-size: var(--fs-sm);
    font-weight: 500;
    color: var(--text);
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .announce-btn:hover {
    background: rgba(0, 0, 0, 0.08);
  }
</style>
