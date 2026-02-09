<script lang="ts">
  import type { BubbleState } from './physics';
  import { subscribe, initLang, t } from '../../i18n/langStore';

  interface Props {
    bubble: BubbleState;
    onPointerDown: (e: PointerEvent) => void;
  }

  let { bubble, onPointerDown }: Props = $props();

  // Map bubble id → translation key
  const labelKeyMap: Record<string, string> = {
    pm: 'bubble.pm',
    ds: 'bubble.ds',
    visual: 'bubble.visual',
  };

  initLang();
  let translatedLabel = $state(t(labelKeyMap[bubble.id] ?? ''));

  $effect(() => {
    const unsub = subscribe(() => {
      translatedLabel = t(labelKeyMap[bubble.id] ?? '');
    });
    return unsub;
  });
</script>

<div
  class="bubble"
  role="button"
  tabindex="0"
  aria-label={translatedLabel}
  style="
    left: {bubble.x}px;
    top: {bubble.y}px;
    width: {bubble.radius * 2}px;
    height: {bubble.radius * 2}px;
    background: {bubble.color};
  "
  onpointerdown={onPointerDown}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Simulate a click via pointer event
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const fakeEvent = new PointerEvent('pointerdown', {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      });
      onPointerDown(fakeEvent);
    }
  }}
>
  <span class="bubble-label">{translatedLabel}</span>
</div>

<style>
  .bubble {
    position: absolute;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translate(-50%, -50%);
    cursor: grab;
    user-select: none;
    touch-action: none;
    transition: box-shadow 0.2s ease;
    /* Subtle soap-bubble sheen */
    box-shadow:
      inset -4px -4px 12px rgba(255, 255, 255, 0.6),
      inset 2px 2px 8px rgba(0, 0, 0, 0.03),
      0 2px 12px rgba(0, 0, 0, 0.06);
  }

  .bubble:hover {
    box-shadow:
      inset -4px -4px 12px rgba(255, 255, 255, 0.7),
      inset 2px 2px 8px rgba(0, 0, 0, 0.03),
      0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .bubble:active {
    cursor: grabbing;
  }

  .bubble:focus-visible {
    outline: 2px solid #5A636B;
    outline-offset: 4px;
  }

  .bubble-label {
    font-family: inherit;
    font-size: clamp(0.7rem, 0.6rem + 0.5vw, 0.95rem);
    font-weight: 500;
    color: #5A636B;
    text-align: center;
    line-height: 1.3;
    padding: 0.5em;
    pointer-events: none;
  }
</style>
