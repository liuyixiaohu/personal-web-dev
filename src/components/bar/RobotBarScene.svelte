<!--
  RobotBarScene — Interactive robot bartender with coupe glass drinks.
  Orchestrates: robotScene.ts (Three.js), CoupeGlass.svelte (UI), drinks.ts (data).
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import { subscribe, initLang, t } from '../../i18n/langStore';
  import { DRINKS, getDrink, type DrinkId } from './drinks';
  import { createRobotScene, type RobotController } from './robotScene';
  import CoupeGlass from './CoupeGlass.svelte';

  // === Constants ===
  const SPEECH_DURATION = 1800; // ms before mouth stops

  // === State ===
  let container: HTMLDivElement;
  let hoveredDrink = $state<DrinkId | null>(null);
  let isSpeaking   = $state(false);
  let dialogText   = $state('');
  let isLoaded     = $state(false);
  let speechTimeout: ReturnType<typeof setTimeout> | null = null;
  let robot: RobotController | null = null;

  // === i18n ===
  initLang();
  dialogText = t('bar.greeting');

  $effect(() => {
    const unsub = subscribe(() => {
      if (hoveredDrink) {
        dialogText = t(getDrink(hoveredDrink).descKey);
      } else {
        dialogText = t('bar.greeting');
      }
    });
    return unsub;
  });

  // === Handlers ===
  function handleDrinkHover(drinkId: DrinkId) {
    hoveredDrink = drinkId;
    dialogText = t(getDrink(drinkId).descKey);
    isSpeaking = true;

    robot?.fadeToAction('ThumbsUp', 0.4);
    robot?.setMouthOpen(true);

    if (speechTimeout) clearTimeout(speechTimeout);
    speechTimeout = setTimeout(() => {
      isSpeaking = false;
      robot?.setMouthOpen(false);
    }, SPEECH_DURATION);
  }

  function handleDrinkLeave() {
    hoveredDrink = null;
    dialogText = t('bar.greeting');
    isSpeaking = false;
    robot?.setMouthOpen(false);
    robot?.fadeToAction('Idle', 0.5);

    if (speechTimeout) clearTimeout(speechTimeout);
  }

  function handleDrinkClick(drinkId: DrinkId) {
    navigate(getDrink(drinkId).route);
  }

  // === Lifecycle ===
  onMount(async () => {
    robot = await createRobotScene(container, () => {
      isLoaded = true;
    });
    return () => robot?.dispose();
  });
</script>

<div class="robot-bar-scene">
  <!-- Speech Bubble -->
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
            onhover={() => handleDrinkHover(drink.id)}
            onleave={() => handleDrinkLeave()}
            onclick={() => handleDrinkClick(drink.id)}
          />
        {/each}
      </div>

      <div class="bar-counter">
        <div class="counter-top"></div>
        <div class="counter-body"></div>
      </div>
    </div>
  </div>
</div>

<style>
  .robot-bar-scene {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: var(--space-sm) 0 0 0;
  }

  /* --- Speech Bubble --- */
  .speech-bubble {
    position: absolute;
    top: 12%;
    left: 50%;
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

  .speech-bubble::after {
    content: '';
    position: absolute;
    bottom: -9px;
    left: 20%;
    border-left: 9px solid transparent;
    border-right: 9px solid transparent;
    border-top: 9px solid white;
  }

  .speech-bubble::before {
    content: '';
    position: absolute;
    bottom: -11px;
    left: calc(20% - 1px);
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
    height: 35vh;
    background: #eae6e0;
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
      height: 70px;
    }

    .speech-bubble {
      max-width: 280px;
    }

    .drinks-row {
      padding-left: calc(50% - 24px - clamp(1.5rem, 6vw, 3rem));
      gap: clamp(1.5rem, 6vw, 3rem);
    }
  }
</style>
