<script lang="ts">
  import { onMount } from 'svelte';
  import { geoNaturalEarth1, geoPath } from 'd3-geo';
  import { zoom } from 'd3-zoom';
  import { select } from 'd3-selection';
  import { feature } from 'topojson-client';
  import { pins, type PinData } from './pins';
  import StoryModal from './StoryModal.svelte';

  let selectedPin = $state<PinData | null>(null);
  let countryPaths = $state<string[]>([]);
  let transform = $state('');
  let currentScale = $state(1);
  let svgEl: SVGSVGElement;

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

  onMount(async () => {
    const res = await fetch(
      'https://unpkg.com/world-atlas@2/countries-110m.json',
    );
    const world = await res.json();
    const countries = (feature(world, world.objects.countries) as any).features;
    countryPaths = countries
      .map((f: any) => pathGenerator(f))
      .filter(Boolean) as string[];

    const zoomBehavior = zoom()
      .scaleExtent([1, 12])
      .on('zoom', (e) => {
        transform = `translate(${e.transform.x},${e.transform.y}) scale(${e.transform.k})`;
        currentScale = e.transform.k;
      });

    select(svgEl).call(zoomBehavior as any);
  });
</script>

<div class="map-container">
  <svg viewBox="0 0 {width} {height}" class="world-map" bind:this={svgEl}>
    <rect {width} {height} fill="#D6E6F3" />

    <g {transform}>
      {#each countryPaths as d}
        <path {d} fill="#DDEEE7" stroke="#b8d4ca" stroke-width="0.5" />
      {/each}

      {#each pinPositions as pin}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <circle
          cx={pin.x}
          cy={pin.y}
          r={5 / currentScale}
          fill={pin.color}
          class="pin-marker"
          onclick={() => (selectedPin = pin)}
          role="button"
          tabindex="0"
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
    width: 100%;
    max-width: 960px;
    margin: 0 auto;
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

  .pin-marker {
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .pin-marker:hover {
    opacity: 0.7;
  }
</style>
