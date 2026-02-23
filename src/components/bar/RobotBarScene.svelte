<!--
  RobotBarScene — Interactive robot bartender with coupe glass drinks.
  Orchestrates: robotScene.ts (Three.js), CoupeGlass.svelte (UI), drinks.ts (data).
  Supports: weather-based greeting, single-drink navigation, two-click mixing.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import { subscribe, initLang, getLang, t } from '../../i18n/langStore';
  import { DRINKS, getDrink, getMix, getMixRoute, getMixDescKey, type DrinkId, type Mix } from './drinks';
  import { createRobotScene, type RobotController } from './robotScene';
  import { getWeatherGreeting, getCachedGreeting } from '../../utils/weather';
  import CoupeGlass from './CoupeGlass.svelte';
  import BarShelf from './BarShelf.svelte';
  import BarNote from './BarNote.svelte';
  import MixPreviewCard from './MixPreviewCard.svelte';

  // === Constants ===
  const SPEECH_DURATION = 1800;

  // === State ===
  let container: HTMLDivElement;
  let hoveredDrink   = $state<DrinkId | null>(null);
  let selectedDrink  = $state<DrinkId | null>(null);
  let isSpeaking     = $state(false);
  let dialogText     = $state('');
  let isLoaded       = $state(false);
  let showMixCard    = $state(false);
  let activeMix      = $state<Mix | null>(null);
  let speechTimeout: ReturnType<typeof setTimeout> | null = null;
  let robot: RobotController | null = null;
  let weatherLoaded  = false;

  // === Default greeting (before weather loads) ===
  function getDefaultGreeting(): string {
    return getCachedGreeting(getLang()) ?? t('bar.greeting');
  }

  // === i18n ===
  initLang();
  dialogText = t('bar.greeting');

  $effect(() => {
    const unsub = subscribe(() => {
      if (hoveredDrink && selectedDrink && hoveredDrink !== selectedDrink) {
        const key = getMixDescKey(selectedDrink, hoveredDrink);
        dialogText = key ? t(key) : getDefaultGreeting();
      } else if (hoveredDrink) {
        dialogText = t(getDrink(hoveredDrink).descKey);
      } else if (selectedDrink) {
        dialogText = t('bar.select.prompt');
      } else {
        dialogText = getDefaultGreeting();
      }
    });
    return unsub;
  });

  // === Helpers ===
  function scheduleMouthClose(duration = SPEECH_DURATION) {
    if (speechTimeout) clearTimeout(speechTimeout);
    speechTimeout = setTimeout(() => {
      isSpeaking = false;
      robot?.setMouthOpen(false);
    }, duration);
  }

  // === Handlers ===
  function handleDrinkHover(drinkId: DrinkId) {
    hoveredDrink = drinkId;
    isSpeaking = true;

    if (selectedDrink && drinkId !== selectedDrink) {
      const key = getMixDescKey(selectedDrink, drinkId);
      dialogText = key ? t(key) : getDefaultGreeting();
    } else {
      dialogText = t(getDrink(drinkId).descKey);
    }

    robot?.fadeToAction('ThumbsUp', 0.4);
    robot?.setMouthOpen(true);
    scheduleMouthClose();
  }

  function handleDrinkLeave() {
    hoveredDrink = null;
    isSpeaking = false;
    robot?.setMouthOpen(false);

    if (selectedDrink) {
      dialogText = t('bar.select.prompt');
    } else {
      dialogText = getDefaultGreeting();
    }

    robot?.fadeToAction('Idle', 0.5);
    if (speechTimeout) clearTimeout(speechTimeout);
  }

  function handleDrinkClick(drinkId: DrinkId) {
    if (selectedDrink === null) {
      // IDLE → SELECTED
      selectedDrink = drinkId;
      dialogText = t('bar.select.prompt');
      robot?.fadeToAction('Yes', 0.4);
      robot?.setMouthOpen(true);
      scheduleMouthClose(1500);
    } else if (selectedDrink === drinkId) {
      // SELECTED → same drink: navigate
      navigate(getDrink(drinkId).route);
    } else {
      // SELECTED → different drink: show mix preview card
      const mix = getMix(selectedDrink, drinkId);
      if (mix) {
        activeMix = mix;
        showMixCard = true;
        robot?.fadeToAction('Jump', 0.4);
        robot?.setMouthOpen(true);
        scheduleMouthClose(2000);
      }
    }
  }

  function handleBackgroundClick(e: MouseEvent) {
    if (showMixCard) return; // card has its own overlay dismiss
    const target = e.target as HTMLElement;
    if (
      !target.closest('.glass-btn') &&
      selectedDrink
    ) {
      selectedDrink = null;
      dialogText = getDefaultGreeting();
      robot?.fadeToAction('Idle', 0.5);
    }
  }

  // === Mix Card handlers ===
  function handleMixNavigate() {
    if (activeMix) navigate(activeMix.route);
  }

  function handleMixDismiss() {
    showMixCard = false;
    activeMix = null;
    selectedDrink = null;
    dialogText = getDefaultGreeting();
    robot?.fadeToAction('Idle', 0.5);
  }

  // === Lifecycle ===
  onMount(async () => {
    robot = await createRobotScene(container, () => {
      isLoaded = true;
    });

    // Load weather greeting async (non-blocking)
    getWeatherGreeting().then((greeting) => {
      weatherLoaded = true;
      const lang = getLang();
      // Only update if still on default greeting (not hovering/selecting)
      if (!hoveredDrink && !selectedDrink) {
        dialogText = greeting[lang];
      }
    });

    return () => {
      robot?.dispose();
      if (speechTimeout) clearTimeout(speechTimeout);
    };
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="robot-bar-scene" onclick={handleBackgroundClick}>
  <!-- Speech Bubble — positioned near robot's head -->
  <div class="speech-bubble" class:visible={isLoaded}>
    <p class="speech-text">{dialogText}</p>
  </div>

  <!-- Stage: canvas + overlapping bar -->
  <div class="stage">
    <!-- 3D Canvas (robot only) -->
    <div class="canvas-container" bind:this={container}></div>

    <!-- Bar Area: CSS glasses + counter -->
    <div class="bar-area">
      <div class="drinks-row">
        {#each DRINKS as drink}
          <CoupeGlass
            color={drink.color}
            hovered={hoveredDrink === drink.id}
            selected={selectedDrink === drink.id}
            onhover={() => handleDrinkHover(drink.id)}
            onleave={() => handleDrinkLeave()}
            onclick={() => handleDrinkClick(drink.id)}
          />
        {/each}
      </div>

      <div class="bar-counter">
        <div class="counter-top"></div>
        <div class="counter-body">
          <BarShelf />
          <div class="counter-divider"></div>
          <BarNote />
        </div>
      </div>
    </div>
  </div>

  <!-- Mix Preview Card -->
  {#if showMixCard && activeMix}
    <MixPreviewCard
      mix={activeMix}
      onNavigate={handleMixNavigate}
      onDismiss={handleMixDismiss}
    />
  {/if}
</div>

<style>
  .robot-bar-scene {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow-x: hidden;
    overflow-y: auto;
    padding: var(--space-sm) 0 0 0;
  }

  /* --- Speech Bubble (near robot head, right side) --- */
  .speech-bubble {
    position: absolute;
    top: 18%;
    left: 38%;
    transform: translateX(-50%);
    max-width: 380px;
    width: auto;
    padding: 0.55rem 1.2rem;
    background: white;
    border: 1.2px solid #e2ded8;
    border-radius: 26px;
    opacity: 0;
    transition: opacity 0.5s ease;
    z-index: 3;
  }

  .speech-bubble.visible {
    opacity: 1;
  }

  /* Arrow pointing toward robot */
  .speech-bubble::after {
    content: '';
    position: absolute;
    bottom: -9px;
    left: 15%;
    border-left: 9px solid transparent;
    border-right: 9px solid transparent;
    border-top: 9px solid white;
  }

  .speech-bubble::before {
    content: '';
    position: absolute;
    bottom: -11px;
    left: calc(15% - 1px);
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid #e2ded8;
  }

  .speech-text {
    font-family: inherit;
    font-size: clamp(0.72rem, 0.62rem + 0.45vw, 0.95rem);
    color: #5A636B;
    text-align: center;
    line-height: 1.45;
    margin: 0;
  }

  /* --- Stage --- */
  .stage {
    position: relative;
    width: 100%;
  }

  .canvas-container {
    width: 100%;
    height: 58vh;
    min-height: 340px;
    max-height: 600px;
    position: relative;
    z-index: 1;
  }

  .canvas-container :global(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }

  /* --- Bar Area --- */
  .bar-area {
    position: absolute;
    top: 65%;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
    pointer-events: none;
  }

  .drinks-row {
    position: relative;
    display: flex;
    justify-content: flex-start;
    padding-left: calc(50% - 34px - clamp(3rem, 8vw, 6rem));
    gap: clamp(3rem, 8vw, 6rem);
    margin-bottom: -4px;
  }

  /* --- Bar Counter --- */
  .bar-counter {
    position: relative;
    width: 100%;
  }

  .counter-top {
    height: 12px;
    background: #d5d0ca;
    border-radius: 4px 4px 0 0;
    box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.3);
  }

  .counter-body {
    background: #eae6e0;
    padding-top: var(--space-sm);
    padding-bottom: var(--space-md);
  }

  .counter-divider {
    height: 1px;
    background: rgba(0, 0, 0, 0.05);
    max-width: 520px;
    margin: var(--space-xs) auto;
  }

  /* --- Responsive --- */
  @media (max-width: 480px) {
    .robot-bar-scene {
      padding: var(--space-xs);
    }

    .stage {
      width: 92%;
    }

    .canvas-container {
      height: 45vh;
      min-height: 260px;
    }

    .counter-body {
      min-height: auto;
      padding-bottom: var(--space-sm);
    }

    .speech-bubble {
      max-width: 280px;
      left: 50%;
      top: 10%;
    }

    .speech-bubble::after {
      left: 20%;
    }

    .speech-bubble::before {
      left: calc(20% - 1px);
    }

    .drinks-row {
      padding-left: calc(50% - 24px - clamp(1.5rem, 6vw, 3rem));
      gap: clamp(1.5rem, 6vw, 3rem);
    }
  }
</style>
