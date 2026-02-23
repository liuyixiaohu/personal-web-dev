<!--
  BarNote — A random bartender's note displayed on the counter.
  Picks one note on mount; language switches update the display text
  but keep the same note selected.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { subscribe, initLang, t } from '../../i18n/langStore';

  // === Note pool ===
  const NOTE_KEYS = [
    'bar.note.1',
    'bar.note.2',
    'bar.note.3',
    'bar.note.4',
    'bar.note.5',
    'bar.note.6',
  ];

  // === State ===
  let noteKey = $state('');
  let visible = $state(false);

  // === i18n ===
  initLang();
  let langVersion = $state(0);
  $effect(() => {
    const unsub = subscribe(() => { langVersion++; });
    return unsub;
  });

  let noteText = $derived((langVersion, noteKey ? t(noteKey) : ''));

  // === Pick random note on mount ===
  onMount(() => {
    const idx = Math.floor(Math.random() * NOTE_KEYS.length);
    noteKey = NOTE_KEYS[idx];
    // Slight delay for a gentle fade-in
    requestAnimationFrame(() => { visible = true; });
  });
</script>

{#if noteText}
  <div class="bar-note" class:visible>
    <div class="note-card">
      <span class="note-deco">~</span>
      <p class="note-text">{noteText}</p>
    </div>
  </div>
{/if}

<style>
  .bar-note {
    display: flex;
    justify-content: center;
    padding: 0 var(--space-md);
    pointer-events: auto;
    opacity: 0;
    transition: opacity 0.6s ease;
  }

  .bar-note.visible {
    opacity: 1;
  }

  .note-card {
    max-width: 380px;
    width: 100%;
    padding: 0.75rem 1.1rem;
    background: #faf7f2;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transform: rotate(-1.5deg);
    text-align: center;
    position: relative;
  }

  .note-deco {
    display: block;
    font-size: 0.85rem;
    color: var(--text-light);
    opacity: 0.35;
    margin-bottom: 0.2rem;
    line-height: 1;
  }

  .note-text {
    font-size: clamp(0.75rem, 0.68rem + 0.3vw, 0.88rem);
    font-style: italic;
    color: var(--text-light);
    line-height: 1.55;
    margin: 0;
  }

  :global(html[data-lang="zh"]) .note-text {
    font-family: var(--font-zh-body);
    font-style: normal;
  }

  /* Mobile: remove tilt, wider card */
  @media (max-width: 480px) {
    .bar-note {
      padding: 0 var(--space-sm);
    }

    .note-card {
      transform: rotate(0);
      max-width: 90%;
    }
  }
</style>
