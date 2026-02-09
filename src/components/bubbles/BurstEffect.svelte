<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    x: number;
    y: number;
    colors: string[];
    onComplete: () => void;
  }

  let { x, y, colors, onComplete }: Props = $props();

  interface Particle {
    id: number;
    x: number;
    y: number;
    angle: number;
    distance: number;
    size: number;
    color: string;
    delay: number;
  }

  const PARTICLE_COUNT = 24;
  const DURATION = 600; // ms

  // Generate particles
  const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.5;
    return {
      id: i,
      x: 0,
      y: 0,
      angle,
      distance: 40 + Math.random() * 80,
      size: 4 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 80,
    };
  });

  onMount(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, DURATION + 100);
    return () => clearTimeout(timer);
  });
</script>

<div class="burst" style="left: {x}px; top: {y}px;">
  {#each particles as p (p.id)}
    <div
      class="particle"
      style="
        --dx: {Math.cos(p.angle) * p.distance}px;
        --dy: {Math.sin(p.angle) * p.distance}px;
        --size: {p.size}px;
        --color: {p.color};
        --delay: {p.delay}ms;
        --duration: {DURATION}ms;
      "
    ></div>
  {/each}
</div>

<style>
  .burst {
    position: absolute;
    pointer-events: none;
    z-index: 100;
  }

  .particle {
    position: absolute;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    background: var(--color);
    opacity: 1;
    animation: burst-fly var(--duration) ease-out var(--delay) forwards;
    transform: translate(-50%, -50%);
  }

  @keyframes burst-fly {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.9;
    }
    30% {
      opacity: 1;
    }
    100% {
      transform: translate(
        calc(-50% + var(--dx)),
        calc(-50% + var(--dy))
      ) scale(0.2);
      opacity: 0;
    }
  }
</style>
