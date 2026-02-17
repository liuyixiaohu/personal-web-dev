<!--
  RobotBarScene — Interactive robot bartender with coupe glass drinks.
  Orchestrates: robotScene.ts (Three.js), CoupeGlass.svelte (UI), drinks.ts (data).
  Supports: single-drink navigation + two-drink mixing with pour animation + SVG stream.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import { subscribe, initLang, t } from '../../i18n/langStore';
  import { DRINKS, getDrink, getMixRoute, getMixDescKey, blendColors, type DrinkId } from './drinks';
  import { createRobotScene, type RobotController } from './robotScene';
  import CoupeGlass from './CoupeGlass.svelte';

  // === Animation Timing Constants ===
  const SPEECH_DURATION = 1800;
  const MIX_NAVIGATE_DELAY = 2200; // total time before page navigation

  // === State ===
  let container: HTMLDivElement;
  let drinksRowEl: HTMLDivElement;
  let hoveredDrink   = $state<DrinkId | null>(null);
  let selectedDrink  = $state<DrinkId | null>(null);
  let mixingState    = $state<{ from: DrinkId; to: DrinkId } | null>(null);
  let isSpeaking     = $state(false);
  let dialogText     = $state('');
  let isLoaded       = $state(false);
  let speechTimeout: ReturnType<typeof setTimeout> | null = null;
  let mixTimeout: ReturnType<typeof setTimeout> | null = null;
  let robot: RobotController | null = null;

  // Glass element refs for position calculation
  let glassEls: Partial<Record<DrinkId, HTMLDivElement>> = {};

  // SVG pour stream path data (computed on mix trigger)
  let streamPath = $state('');
  let streamColor = $state('');
  let streamVisible = $state(false);
  let svgViewBox = $state('0 0 0 0');
  let svgStyle = $state('');
  let pathLength = $state(0);

  // === Pour direction ===
  function getPourDirection(from: DrinkId, to: DrinkId): 'left' | 'right' {
    const fromIdx = DRINKS.findIndex(d => d.id === from);
    const toIdx = DRINKS.findIndex(d => d.id === to);
    return toIdx > fromIdx ? 'right' : 'left';
  }

  // === Compute SVG pour stream between two glasses ===
  function computeStream(from: DrinkId, to: DrinkId) {
    const fromEl = glassEls[from];
    const toEl = glassEls[to];
    if (!fromEl || !toEl || !drinksRowEl) return;

    const rowRect = drinksRowEl.getBoundingClientRect();
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    // Source: rim of lifted+tilted glass (center-top of source, offset up for the lift)
    const fromX = fromRect.left + fromRect.width / 2 - rowRect.left;
    const fromY = -50; // above the drinks-row (glass lifts -70px from -12px base)

    // Target: center-top of target glass bowl
    const toX = toRect.left + toRect.width / 2 - rowRect.left;
    const toY = 4; // top of target glass bowl

    // Control point for the arc: midpoint X, higher Y for a nice parabolic arc
    const cpX = (fromX + toX) / 2;
    const cpY = Math.min(fromY, toY) - 25;

    // SVG path: quadratic bezier
    streamPath = `M ${fromX} ${fromY} Q ${cpX} ${cpY} ${toX} ${toY}`;
    streamColor = getDrink(from).color;

    // Compute viewBox to contain the path with padding
    const minX = Math.min(fromX, toX, cpX) - 10;
    const maxX = Math.max(fromX, toX, cpX) + 10;
    const minY = Math.min(fromY, toY, cpY) - 10;
    const maxY = Math.max(fromY, toY) + 10;

    svgViewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
    svgStyle = `left: ${minX}px; top: ${minY}px; width: ${maxX - minX}px; height: ${maxY - minY}px;`;

    // Approximate path length for dash animation
    const dx = toX - fromX;
    const dy = toY - fromY;
    pathLength = Math.sqrt(dx * dx + dy * dy) * 1.3;
  }

  // === i18n ===
  initLang();
  dialogText = t('bar.greeting');

  $effect(() => {
    const unsub = subscribe(() => {
      if (mixingState) {
        dialogText = t('bar.mixing');
      } else if (hoveredDrink && selectedDrink && hoveredDrink !== selectedDrink) {
        const key = getMixDescKey(selectedDrink, hoveredDrink);
        dialogText = key ? t(key) : t('bar.greeting');
      } else if (hoveredDrink) {
        dialogText = t(getDrink(hoveredDrink).descKey);
      } else if (selectedDrink) {
        dialogText = t('bar.select.prompt');
      } else {
        dialogText = t('bar.greeting');
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
    if (mixingState) return;

    hoveredDrink = drinkId;
    isSpeaking = true;

    if (selectedDrink && drinkId !== selectedDrink) {
      const key = getMixDescKey(selectedDrink, drinkId);
      dialogText = key ? t(key) : t('bar.greeting');
    } else {
      dialogText = t(getDrink(drinkId).descKey);
    }

    robot?.fadeToAction('ThumbsUp', 0.4);
    robot?.setMouthOpen(true);
    scheduleMouthClose();
  }

  function handleDrinkLeave() {
    if (mixingState) return;

    hoveredDrink = null;
    isSpeaking = false;
    robot?.setMouthOpen(false);

    if (selectedDrink) {
      dialogText = t('bar.select.prompt');
    } else {
      dialogText = t('bar.greeting');
    }

    robot?.fadeToAction('Idle', 0.5);
    if (speechTimeout) clearTimeout(speechTimeout);
  }

  function handleDrinkClick(drinkId: DrinkId) {
    if (mixingState) return;

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
      // SELECTED → different drink: mix!
      const from = selectedDrink;
      const to = drinkId;
      const route = getMixRoute(from, to);
      if (!route) return;

      // Compute SVG stream before setting state (need rects before animation moves things)
      computeStream(from, to);

      mixingState = { from, to };
      selectedDrink = null;
      hoveredDrink = null;

      // Robot gets excited
      dialogText = t('bar.mixing');
      robot?.fadeToAction('Jump', 0.3);
      robot?.setMouthOpen(true);

      // Show stream after pour begins (400ms delay)
      setTimeout(() => { streamVisible = true; }, 400);

      // Hide stream as pour completes
      setTimeout(() => { streamVisible = false; }, 1400);

      // Navigate after animation
      mixTimeout = setTimeout(() => {
        navigate(route);
      }, MIX_NAVIGATE_DELAY);
    }
  }

  function handleBackgroundClick(e: MouseEvent) {
    if (
      !(e.target as HTMLElement).closest('.glass-btn') &&
      selectedDrink &&
      !mixingState
    ) {
      selectedDrink = null;
      dialogText = t('bar.greeting');
      robot?.fadeToAction('Idle', 0.5);
    }
  }

  // === Lifecycle ===
  onMount(async () => {
    robot = await createRobotScene(container, () => {
      isLoaded = true;
    });
    return () => {
      robot?.dispose();
      if (speechTimeout) clearTimeout(speechTimeout);
      if (mixTimeout) clearTimeout(mixTimeout);
    };
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="robot-bar-scene" onclick={handleBackgroundClick}>
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
      <div class="drinks-row" bind:this={drinksRowEl}>
        {#each DRINKS as drink}
          <div class="glass-wrapper" bind:this={glassEls[drink.id]}>
            <CoupeGlass
              color={drink.color}
              hovered={hoveredDrink === drink.id}
              selected={selectedDrink === drink.id}
              pouring={mixingState?.from === drink.id ? 'out' :
                       mixingState?.to === drink.id ? 'in' : null}
              pourDirection={mixingState?.from === drink.id
                ? getPourDirection(mixingState.from, mixingState.to)
                : null}
              blendColor={mixingState?.to === drink.id
                ? blendColors(getDrink(mixingState.from).color, drink.color)
                : null}
              onhover={() => handleDrinkHover(drink.id)}
              onleave={() => handleDrinkLeave()}
              onclick={() => handleDrinkClick(drink.id)}
            />
          </div>
        {/each}

        <!-- SVG Pour Stream -->
        {#if mixingState && streamPath}
          <svg
            class="pour-stream"
            class:visible={streamVisible}
            viewBox={svgViewBox}
            style={svgStyle}
            style:--path-length={pathLength}
          >
            <path
              d={streamPath}
              fill="none"
              stroke={streamColor}
              stroke-width="3.5"
              stroke-linecap="round"
              opacity="0.7"
            />
            <!-- Drip at the end -->
            <circle
              cx={streamPath.split(' ').slice(-2, -1)[0]}
              cy={streamPath.split(' ').slice(-1)[0]}
              r="3"
              fill={streamColor}
              opacity="0.6"
              class="drip"
            />
          </svg>
        {/if}
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

  .glass-wrapper {
    position: relative;
  }

  /* --- Pour Stream SVG --- */
  .pour-stream {
    position: absolute;
    pointer-events: none;
    z-index: 4;
    overflow: visible;
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .pour-stream.visible {
    opacity: 1;
  }

  .pour-stream path {
    stroke-dasharray: calc(var(--path-length) * 1px);
    stroke-dashoffset: calc(var(--path-length) * 1px);
    animation: stream-flow 600ms ease-in-out forwards;
  }

  .pour-stream.visible path {
    animation: stream-flow 600ms ease-in-out forwards;
  }

  @keyframes stream-flow {
    to { stroke-dashoffset: 0; }
  }

  .pour-stream .drip {
    opacity: 0;
    animation: drip-appear 300ms ease-out 500ms forwards;
  }

  @keyframes drip-appear {
    0%   { opacity: 0; r: 2; }
    50%  { opacity: 0.7; r: 4; }
    100% { opacity: 0; r: 5; }
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
