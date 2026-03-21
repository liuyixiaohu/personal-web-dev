<script lang="ts">
  import { toggleLang, subscribeLang, t } from '../i18n/langStore';

  let label = $state(t('lang.toggle'));
  let tooltip = $state(t('lang.tooltip'));

  $effect(() => subscribeLang(() => {
    label = t('lang.toggle');
    tooltip = t('lang.tooltip');
  }));
</script>

<button class="lang-toggle" onclick={() => toggleLang()} aria-label={tooltip} title={tooltip}>
  {label}
</button>

<style>
  .lang-toggle {
    position: fixed;
    top: 1.25rem;
    right: 1.25rem;
    z-index: 900;
    width: 2.4rem;
    height: 2.4rem;
    border-radius: var(--radius-full);
    border: 1px solid var(--border, #e2ded8);
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    font-family: inherit;
    font-size: var(--fs-xs);
    font-weight: 500;
    color: var(--text, #1F2328);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    padding: 0;
    line-height: 1;
  }

  .lang-toggle:hover {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
  }

  .lang-toggle:active {
    transform: translateY(0);
  }
</style>
