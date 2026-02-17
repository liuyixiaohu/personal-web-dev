<!--
  CoupeGlass — Interactive coupe cocktail glass button
  Used by RobotBarScene to represent professional expertise drinks.
  Follows Bubble.svelte pattern: receives props, emits events.
  Supports: hover lift, selected glow, pour-out (lift+tilt)/pour-in animations.
-->
<script lang="ts">
  interface Props {
    color: string;
    hovered: boolean;
    selected: boolean;
    pouring: 'out' | 'in' | null;
    pourDirection: 'left' | 'right' | null;
    blendColor: string | null;
    onhover: () => void;
    onleave: () => void;
    onclick: () => void;
  }

  let {
    color,
    hovered,
    selected = false,
    pouring = null,
    pourDirection = null,
    blendColor = null,
    onhover,
    onleave,
    onclick,
  }: Props = $props();

  // Tilt sign: pour-right → positive rotation, pour-left → negative
  const tiltSign = $derived(pourDirection === 'left' ? -1 : 1);
</script>

<button
  class="glass-btn"
  class:hovered
  class:selected
  class:pouring-out={pouring === 'out'}
  class:pouring-in={pouring === 'in'}
  class:pour-left={pouring === 'out' && pourDirection === 'left'}
  class:pour-right={pouring === 'out' && pourDirection === 'right'}
  style="--tilt-sign: {tiltSign}"
  onmouseenter={onhover}
  onmouseleave={onleave}
  {onclick}
  onfocus={onhover}
  onblur={onleave}
>
  <div class="coupe-glass">
    <div class="glass-bowl">
      <div
        class="glass-liquid"
        style="--liquid-color: {color}; --blend-color: {blendColor ?? color}"
      ></div>
      <div class="glass-shine"></div>
    </div>
    <div class="glass-stem"></div>
    <div class="glass-base"></div>
  </div>
</button>

<style>
  .glass-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    border: none;
    background: none;
    padding: 0;
    pointer-events: auto;
    outline: none;
    transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .glass-btn:focus-visible {
    outline: 2px solid #5A636B;
    outline-offset: 6px;
    border-radius: 8px;
  }

  .glass-btn.hovered,
  .glass-btn.selected {
    transform: translateY(-12px);
  }

  .coupe-glass {
    display: flex;
    flex-direction: column;
    align-items: center;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.06));
    transition: filter 0.3s ease;
  }

  .glass-btn.hovered .coupe-glass,
  .glass-btn.selected .coupe-glass {
    filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.10));
  }

  /* Bowl */
  .glass-bowl {
    position: relative;
    width: 68px;
    height: 36px;
    border-radius: 6px 6px 50% 50%;
    background: rgba(255, 255, 255, 0.28);
    border: 1.5px solid rgba(255, 255, 255, 0.55);
    overflow: hidden;
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.3),
      inset 0 -2px 4px rgba(0, 0, 0, 0.03);
    transition: box-shadow 0.3s ease;
  }

  /* Selected: pulsing ring */
  .glass-btn.selected .glass-bowl {
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.3),
      inset 0 -2px 4px rgba(0, 0, 0, 0.03),
      0 0 0 3px rgba(90, 99, 107, 0.18),
      0 0 12px rgba(90, 99, 107, 0.10);
    animation: pulse-ring 1.5s ease-in-out infinite;
  }

  @keyframes pulse-ring {
    0%, 100% {
      box-shadow:
        inset 0 0 0 1px rgba(255, 255, 255, 0.3),
        inset 0 -2px 4px rgba(0, 0, 0, 0.03),
        0 0 0 3px rgba(90, 99, 107, 0.18),
        0 0 12px rgba(90, 99, 107, 0.10);
    }
    50% {
      box-shadow:
        inset 0 0 0 1px rgba(255, 255, 255, 0.3),
        inset 0 -2px 4px rgba(0, 0, 0, 0.03),
        0 0 0 4px rgba(90, 99, 107, 0.28),
        0 0 16px rgba(90, 99, 107, 0.15);
    }
  }

  /* Liquid */
  .glass-liquid {
    position: absolute;
    bottom: 0;
    left: 2px;
    right: 2px;
    height: 72%;
    border-radius: 0 0 50% 50%;
    background: var(--liquid-color);
    opacity: 0.8;
    transition: opacity 0.3s ease;
  }

  .glass-btn.hovered .glass-liquid,
  .glass-btn.selected .glass-liquid {
    opacity: 0.92;
  }

  /* ===== Pour-out: lift up, tilt, empty ===== */

  /* Whole button lifts up + shifts toward target */
  .glass-btn.pouring-out {
    animation: pour-lift 1400ms ease-in-out forwards;
  }

  @keyframes pour-lift {
    0%   { transform: translateY(-12px); }
    20%  { transform: translateY(-70px); }
    100% { transform: translateY(-70px); }
  }

  /* Glass tilts in pour direction (after lift completes) */
  .glass-btn.pour-right .coupe-glass {
    animation: tilt-pour-right 1100ms ease-in-out 300ms forwards;
  }
  .glass-btn.pour-left .coupe-glass {
    animation: tilt-pour-left 1100ms ease-in-out 300ms forwards;
  }

  @keyframes tilt-pour-right {
    0%   { transform: rotate(0deg) translateX(0); }
    30%  { transform: rotate(35deg) translateX(6px); }
    100% { transform: rotate(40deg) translateX(8px); }
  }

  @keyframes tilt-pour-left {
    0%   { transform: rotate(0deg) translateX(0); }
    30%  { transform: rotate(-35deg) translateX(-6px); }
    100% { transform: rotate(-40deg) translateX(-8px); }
  }

  /* Liquid empties after lift+tilt begins */
  .glass-btn.pouring-out .glass-liquid {
    animation: pour-out 800ms ease-in 400ms forwards;
  }

  @keyframes pour-out {
    0%   { height: 72%; opacity: 0.85; }
    70%  { height: 8%;  opacity: 0.6; }
    100% { height: 0%;  opacity: 0; }
  }

  /* ===== Pour-in: receive blended liquid ===== */

  .glass-btn.pouring-in .glass-liquid {
    animation: pour-in 700ms ease-out 800ms forwards;
  }

  @keyframes pour-in {
    0%   { background: var(--liquid-color); height: 72%; }
    40%  { height: 82%; }
    100% { background: var(--blend-color); height: 72%; }
  }

  /* Glass shine highlight */
  .glass-shine {
    position: absolute;
    top: 2px;
    left: 6px;
    width: 40%;
    height: 55%;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.55) 0%,
      rgba(255, 255, 255, 0.1) 50%,
      transparent 100%
    );
    border-radius: 4px 2px 40% 20%;
    pointer-events: none;
  }

  /* Stem */
  .glass-stem {
    width: 4px;
    height: 22px;
    background: linear-gradient(
      to right,
      #ccc8c1,
      #e0dcd6 40%,
      #d5d0ca 60%,
      #c8c3bc
    );
    border-radius: 1px;
  }

  /* Base */
  .glass-base {
    width: 36px;
    height: 6px;
    background: linear-gradient(
      to bottom,
      #d8d4cd,
      #c8c3bc
    );
    border-radius: 50%;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  }

  /* --- Responsive --- */
  @media (max-width: 480px) {
    .glass-bowl {
      width: 48px;
      height: 26px;
    }

    .glass-stem {
      height: 16px;
      width: 3px;
    }

    .glass-base {
      width: 28px;
      height: 5px;
    }

    /* Smaller lift + tilt on mobile */
    @keyframes pour-lift {
      0%   { transform: translateY(-12px); }
      20%  { transform: translateY(-45px); }
      100% { transform: translateY(-45px); }
    }

    @keyframes tilt-pour-right {
      0%   { transform: rotate(0deg) translateX(0); }
      30%  { transform: rotate(25deg) translateX(3px); }
      100% { transform: rotate(30deg) translateX(4px); }
    }

    @keyframes tilt-pour-left {
      0%   { transform: rotate(0deg) translateX(0); }
      30%  { transform: rotate(-25deg) translateX(-3px); }
      100% { transform: rotate(-30deg) translateX(-4px); }
    }
  }
</style>
