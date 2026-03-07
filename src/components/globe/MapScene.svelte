<script lang="ts">
  import { onMount } from 'svelte';
  import { geoNaturalEarth1, geoPath } from 'd3-geo';
  import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
  import { select } from 'd3-selection';
  import { feature, mesh } from 'topojson-client';
  import { pins, type PinData } from './pins';
  import StoryModal from './StoryModal.svelte';

  let selectedPin = $state<PinData | null>(null);
  let countryPaths = $state<string[]>([]);
  let provincePath = $state('');
  let provincesLoaded = $state(false);
  let provincesLoading = false;
  let transform = $state('');
  let currentScale = $state(1);
  let svgEl: SVGSVGElement;
  let zoomBehavior: ZoomBehavior<SVGSVGElement, unknown>;

  const PROVINCE_ZOOM_THRESHOLD = 3;
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 12;
  const width = 960;
  const height = 500;

  const projection = geoNaturalEarth1()
    .scale(170)
    .translate([width / 2, height / 2]);

  const pathGenerator = geoPath().projection(projection);

  const pinPositions = pins.map((p) => {
    const coords = projection([p.lng, p.lat]);
    return { ...p, x: coords?.[0] ?? 0, y: coords?.[1] ?? 0 };
  });

  let showProvinces = $derived(currentScale >= PROVINCE_ZOOM_THRESHOLD);

  // Pin radius: small (1.5px) at zoom 1, grows to 2.5px at zoom 3+
  let pinRadius = $derived((1 + Math.min(currentScale, 3) * 0.5) / currentScale);

  // Slider value mapped logarithmically for smoother feel
  let sliderValue = $derived(Math.log(currentScale) / Math.log(MAX_ZOOM) * 100);

  function handleSlider(e: Event) {
    const val = +(e.target as HTMLInputElement).value;
    const scale = Math.pow(MAX_ZOOM, val / 100);
    const sel = select(svgEl);
    sel.transition().duration(200).call(
      zoomBehavior.scaleTo as any,
      scale,
    );
  }

  function zoomIn() {
    const sel = select(svgEl);
    sel.transition().duration(300).call(zoomBehavior.scaleBy as any, 1.5);
  }

  function zoomOut() {
    const sel = select(svgEl);
    sel.transition().duration(300).call(zoomBehavior.scaleBy as any, 1 / 1.5);
  }

  async function loadProvinces() {
    if (provincesLoaded || provincesLoading) return;
    provincesLoading = true;
    try {
      const res = await fetch('/data/provinces-50m.json');
      const topo = await res.json();
      const boundaries = mesh(topo, topo.objects.provinces);
      provincePath = pathGenerator(boundaries) ?? '';
      provincesLoaded = true;
    } catch (err) {
      console.error('Failed to load provinces:', err);
    }
    provincesLoading = false;
  }

  // Lazy-load provinces when zoom crosses threshold
  $effect(() => {
    if (showProvinces && !provincesLoaded) {
      loadProvinces();
    }
  });

  onMount(async () => {
    const res = await fetch('/data/countries-110m.json');
    const world = await res.json();
    const countries = (feature(world, world.objects.countries) as any).features;
    countryPaths = countries
      .map((f: any) => pathGenerator(f))
      .filter(Boolean) as string[];

    zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .on('zoom', (e) => {
        transform = `translate(${e.transform.x},${e.transform.y}) scale(${e.transform.k})`;
        currentScale = e.transform.k;
      });

    select(svgEl).call(zoomBehavior);

    // Initial view: centered on Kansas, zoomed to 50% of slider range
    const initialScale = Math.pow(MAX_ZOOM, 0.5);
    const kansasCoords = projection([-98.5, 38.5]);
    if (kansasCoords) {
      const [px, py] = kansasCoords;
      const tx = width / 2 - px * initialScale;
      const ty = height / 2 - py * initialScale;
      select(svgEl).call(
        zoomBehavior.transform,
        zoomIdentity.translate(tx, ty).scale(initialScale),
      );
    }
  });
</script>

<div class="map-container">
  <div class="zoom-controls">
    <button class="zoom-btn" onclick={zoomIn} aria-label="Zoom in">+</button>
    <input
      type="range"
      min="0"
      max="100"
      value={sliderValue}
      oninput={handleSlider}
      class="zoom-slider"
      orient="vertical"
      aria-label="Zoom level"
    />
    <button class="zoom-btn" onclick={zoomOut} aria-label="Zoom out">−</button>
  </div>

  <svg viewBox="0 0 {width} {height}" class="world-map" bind:this={svgEl}>
    <rect {width} {height} fill="#D6E6F3" />

    <g {transform}>
      {#each countryPaths as d}
        <path {d} fill="#DDEEE7" stroke="#b8d4ca" stroke-width="0.5" />
      {/each}

      {#if showProvinces && provincePath}
        <path
          d={provincePath}
          fill="none"
          stroke="#8aac9a"
          stroke-width={0.4 / currentScale}
        />
      {/if}

      {#each pinPositions as pin, i}
        <!-- Ripple ring -->
        <circle
          cx={pin.x}
          cy={pin.y}
          r={pinRadius}
          fill="none"
          stroke={pin.color}
          stroke-width={0.8 / currentScale}
          class="pin-ripple"
          style="animation-delay: {(i * 0.4) % 2.5}s"
        />

        <circle
          cx={pin.x}
          cy={pin.y}
          r={pinRadius}
          fill={pin.color}
          class="pin-marker"
          onclick={() => { selectedPin = pin; (window as any).dataLayer?.push({ event: 'map_pin_click', pin_city: pin.city, pin_id: pin.id }); }}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { selectedPin = pin; (window as any).dataLayer?.push({ event: 'map_pin_click', pin_city: pin.city, pin_id: pin.id }); } }}
          role="button"
          tabindex="0"
          aria-label={pin.city}
        >
          <title>{pin.city}</title>
        </circle>
      {/each}
    </g>
  </svg>
</div>

{#if selectedPin}
  <StoryModal pin={selectedPin} onClose={() => (selectedPin = null)} />
{/if}

<style>
  .map-container {
    position: relative;
    width: 100%;
  }

  .world-map {
    width: 100%;
    height: auto;
    display: block;
    cursor: grab;
  }

  .world-map:active {
    cursor: grabbing;
  }

  .pin-ripple {
    transform-box: fill-box;
    transform-origin: center;
    animation: ripple 2.5s ease-out infinite;
    pointer-events: none;
  }

  @keyframes ripple {
    0% {
      transform: scale(1);
      opacity: 0.6;
    }
    100% {
      transform: scale(3);
      opacity: 0;
    }
  }

  .pin-marker {
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .pin-marker:hover {
    opacity: 0.7;
  }

  /* Zoom controls */
  .zoom-controls {
    position: absolute;
    right: 12px;
    top: 50%;
    translate: 0 -50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    z-index: 5;
  }

  .zoom-btn {
    width: 28px;
    height: 28px;
    border: 1px solid #b8d4ca;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.85);
    color: #4a6e5d;
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
    transition: background 0.15s ease;
  }

  .zoom-btn:hover {
    background: rgba(255, 255, 255, 1);
  }

  .zoom-slider {
    writing-mode: vertical-lr;
    direction: rtl;
    appearance: slider-vertical;
    width: 28px;
    height: 100px;
    cursor: pointer;
    accent-color: #8aac9a;
  }
</style>
