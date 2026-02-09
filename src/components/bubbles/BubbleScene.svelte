<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import Bubble from './Bubble.svelte';
  import BurstEffect from './BurstEffect.svelte';
  import { lighten, darken } from '../../utils/colors';
  import {
    createBubbles,
    updateBubble,
    checkCollisions,
    startDrag,
    moveDrag,
    endDrag,
    getClickRoute,
    getCollisionRoute,
    type BubbleState,
    type BubbleId,
  } from './physics';

  // --- State ---
  let container: HTMLDivElement;
  let bubbles = $state<BubbleState[]>([]);
  let animationId: number | null = null;
  let startTime = 0;
  let lastTime = 0;

  // Drag state
  let dragBubbleId = $state<BubbleId | null>(null);
  let dragPrevX = 0;
  let dragPrevY = 0;
  let dragPrevTime = 0;
  let clickStartTime = 0;
  let clickStartX = 0;
  let clickStartY = 0;

  // Burst effects
  interface BurstInfo {
    id: number;
    x: number;
    y: number;
    colors: string[];
  }
  let bursts = $state<BurstInfo[]>([]);
  let burstCounter = 0;
  let isNavigating = false;
  let pendingRoute: string | null = null;
  let burstsPendingCount = $state(0);

  // --- Lifecycle ---
  onMount(() => {
    const rect = container.getBoundingClientRect();
    bubbles = createBubbles(rect.width, rect.height);
    startTime = performance.now() / 1000;
    lastTime = startTime;
    animationId = requestAnimationFrame(tick);

    // Handle window resize
    const resizeObserver = new ResizeObserver((entries) => {
      if (isNavigating) return;
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      // Re-initialize bubbles on resize
      bubbles = createBubbles(width, height);
    });
    resizeObserver.observe(container);

    return () => {
      if (animationId !== null) cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  });

  // --- Animation Loop ---
  function tick(now: number) {
    if (isNavigating) return;

    const time = now / 1000 - startTime;
    const dt = Math.min(time - lastTime, 0.05); // cap at 50ms
    lastTime = time;

    const rect = container.getBoundingClientRect();

    for (const bubble of bubbles) {
      updateBubble(bubble, dt, time, rect.width, rect.height);
    }

    // Check collisions (only when dragging)
    if (dragBubbleId !== null) {
      const collision = checkCollisions(bubbles);
      if (collision) {
        const route = getCollisionRoute(collision.a, collision.b);
        if (route) {
          triggerCollisionBurst(collision.a, collision.b, collision.midX, collision.midY, route);
          return; // Stop animation loop
        }
      }
    }

    // Force Svelte reactivity update
    bubbles = bubbles;

    animationId = requestAnimationFrame(tick);
  }

  // --- Drag Handlers ---
  function handlePointerDown(bubbleId: BubbleId, e: PointerEvent) {
    if (isNavigating) return;

    const bubble = bubbles.find(b => b.id === bubbleId);
    if (!bubble) return;

    dragBubbleId = bubbleId;
    startDrag(bubble);

    const rect = container.getBoundingClientRect();
    dragPrevX = e.clientX - rect.left;
    dragPrevY = e.clientY - rect.top;
    dragPrevTime = performance.now() / 1000;

    // Track for click detection
    clickStartTime = performance.now();
    clickStartX = e.clientX;
    clickStartY = e.clientY;

    // Capture pointer for smooth dragging
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    // Listen on window to catch moves outside the bubble
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  function handlePointerMove(e: PointerEvent) {
    if (dragBubbleId === null || isNavigating) return;

    const bubble = bubbles.find(b => b.id === dragBubbleId);
    if (!bubble) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now() / 1000;
    const dt = now - dragPrevTime;

    moveDrag(bubble, x, y, dragPrevX, dragPrevY, dt);

    dragPrevX = x;
    dragPrevY = y;
    dragPrevTime = now;

    // Check collision in real-time during drag
    const collision = checkCollisions(bubbles);
    if (collision) {
      const route = getCollisionRoute(collision.a, collision.b);
      if (route) {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        triggerCollisionBurst(collision.a, collision.b, collision.midX, collision.midY, route);
        return;
      }
    }

    // Trigger Svelte update
    bubbles = bubbles;
  }

  function handlePointerUp(e: PointerEvent) {
    if (dragBubbleId === null) return;

    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);

    const bubble = bubbles.find(b => b.id === dragBubbleId);
    const wasId = dragBubbleId;
    dragBubbleId = null;

    if (!bubble || isNavigating) return;

    endDrag(bubble);

    // Detect click: short duration + small movement
    const duration = performance.now() - clickStartTime;
    const dx = e.clientX - clickStartX;
    const dy = e.clientY - clickStartY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (duration < 300 && dist < 10) {
      // It's a click!
      triggerClickBurst(wasId, bubble.x, bubble.y);
    }
  }

  // --- Burst + Navigate ---
  function triggerClickBurst(id: BubbleId, x: number, y: number) {
    isNavigating = true;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    const bubble = bubbles.find(b => b.id === id)!;
    const route = getClickRoute(id);

    // Hide the clicked bubble
    bubbles = bubbles.filter(b => b.id !== id);

    // Spawn burst
    burstsPendingCount = 1;
    pendingRoute = route;
    bursts = [{
      id: burstCounter++,
      x,
      y,
      colors: [bubble.color, lighten(bubble.color), darken(bubble.color)],
    }];
  }

  function triggerCollisionBurst(aId: BubbleId, bId: BubbleId, midX: number, midY: number, route: string) {
    isNavigating = true;
    dragBubbleId = null;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    const a = bubbles.find(b => b.id === aId)!;
    const b = bubbles.find(b => b.id === bId)!;

    // Hide both bubbles
    bubbles = bubbles.filter(b => b.id !== aId && b.id !== bId);

    // Spawn two bursts
    burstsPendingCount = 2;
    pendingRoute = route;
    bursts = [
      {
        id: burstCounter++,
        x: a.x,
        y: a.y,
        colors: [a.color, lighten(a.color), darken(a.color)],
      },
      {
        id: burstCounter++,
        x: b.x,
        y: b.y,
        colors: [b.color, lighten(b.color), darken(b.color)],
      },
    ];
  }

  function handleBurstComplete() {
    burstsPendingCount--;
    if (burstsPendingCount <= 0 && pendingRoute) {
      navigate(pendingRoute);
    }
  }

</script>

<div class="bubble-scene" bind:this={container}>
  {#each bubbles as bubble (bubble.id)}
    <Bubble
      {bubble}
      onPointerDown={(e) => handlePointerDown(bubble.id, e)}
    />
  {/each}

  {#each bursts as burst (burst.id)}
    <BurstEffect
      x={burst.x}
      y={burst.y}
      colors={burst.colors}
      onComplete={handleBurstComplete}
    />
  {/each}
</div>

<style>
  .bubble-scene {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
</style>
