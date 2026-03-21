<script lang="ts">
  import { onMount } from 'svelte';
  import { geoMercator, geoPath } from 'd3-geo';
  import { pins, type PinData } from './pins';
  import StoryModal from './StoryModal.svelte';
  import { t } from '../../i18n/langStore';

  let selectedPin = $state<PinData | null>(null);
  let loaded = $state(false);

  // Rendered paths & pin positions (filled after data loads)
  let usaPath = $state('');
  let chinaPath = $state('');
  let usaProvPath = $state('');
  let chinaProvPath = $state('');

  interface PinPos extends PinData { x: number; y: number; panel: 'usa' | 'china' }
  let pinPositions = $state<PinPos[]>([]);

  const usaPins = pins.filter(p => p.country.includes('USA'));
  const chinaPins = pins.filter(p => p.country.includes('China'));

  // SVG dimensions per panel
  const W = 400;
  const H = 340;
  const PAD = 20;

  onMount(async () => {
    const res = await fetch('/data/journey-countries.json');
    const data = await res.json();

    // Create per-country projections fitted to the SVG size
    const usaProj = geoMercator().fitExtent([[PAD, PAD], [W - PAD, H - PAD]], data.usa);
    const chinaProj = geoMercator().fitExtent([[PAD, PAD], [W - PAD, H - PAD]], data.china);

    const usaPathGen = geoPath().projection(usaProj);
    const chinaPathGen = geoPath().projection(chinaProj);

    usaPath = usaPathGen(data.usa) ?? '';
    chinaPath = chinaPathGen(data.china) ?? '';

    // Province boundaries -- clip to each country's bounds
    if (data.provinces) {
      // Split province lines by filtering coordinates into USA vs China regions
      usaProvPath = usaPathGen(data.provinces) ?? '';
      chinaProvPath = chinaPathGen(data.provinces) ?? '';
    }

    // Project pins
    const positions: PinPos[] = [];
    for (const p of usaPins) {
      const [x, y] = usaProj([p.lng, p.lat]) ?? [0, 0];
      positions.push({ ...p, x, y, panel: 'usa' });
    }
    for (const p of chinaPins) {
      const [x, y] = chinaProj([p.lng, p.lat]) ?? [0, 0];
      positions.push({ ...p, x, y, panel: 'china' });
    }
    pinPositions = positions;
    loaded = true;
  });

  function handlePinClick(pin: PinData) {
    selectedPin = pin;
    (window as any).dataLayer?.push({
      event: 'map_pin_click',
      pin_city: pin.city,
      pin_id: pin.id,
    });
  }
</script>

<div class="country-pair" class:loaded>
  <p class="map-hint">{t('journey.hint')}</p>

  <div class="panels">
    <!-- China panel -->
    <div class="panel">
      <span class="panel-label">China</span>
      <svg viewBox="0 0 {W} {H}" class="country-svg">
        <path d={chinaPath} class="country-fill" />
        {#if chinaProvPath}
          <path d={chinaProvPath} class="province-line" />
        {/if}
        {#each pinPositions.filter(p => p.panel === 'china') as pin, i}
          <circle cx={pin.x} cy={pin.y} r="5" fill="none" stroke={pin.color}
            stroke-width="1" class="pin-ripple" style="animation-delay: {i * 0.4}s" />
          <circle cx={pin.x} cy={pin.y} r="5" fill={pin.color} class="pin-marker"
            onclick={() => handlePinClick(pin)}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePinClick(pin); }}
            role="button" tabindex="0" aria-label={pin.city}>
            <title>{pin.city}</title>
          </circle>
        {/each}
      </svg>
    </div>

    <!-- USA panel -->
    <div class="panel">
      <span class="panel-label">United States</span>
      <svg viewBox="0 0 {W} {H}" class="country-svg">
        <path d={usaPath} class="country-fill" />
        {#if usaProvPath}
          <path d={usaProvPath} class="province-line" />
        {/if}
        {#each pinPositions.filter(p => p.panel === 'usa') as pin, i}
          <circle cx={pin.x} cy={pin.y} r="5" fill="none" stroke={pin.color}
            stroke-width="1" class="pin-ripple" style="animation-delay: {i * 0.4}s" />
          <circle cx={pin.x} cy={pin.y} r="5" fill={pin.color} class="pin-marker"
            onclick={() => handlePinClick(pin)}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePinClick(pin); }}
            role="button" tabindex="0" aria-label={pin.city}>
            <title>{pin.city}</title>
          </circle>
        {/each}
      </svg>
    </div>
  </div>
</div>

{#if selectedPin}
  <StoryModal pin={selectedPin} onClose={() => (selectedPin = null)} />
{/if}

<style>
  .country-pair {
    width: 100%;
    max-width: 56rem;
    margin: 0 auto;
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .country-pair.loaded {
    opacity: 1;
  }

  .map-hint {
    text-align: center;
    font-size: var(--fs-xs);
    color: var(--color-visual);
    margin-bottom: var(--space-sm);
  }

  .panels {
    display: flex;
    gap: var(--space-md);
    justify-content: center;
    align-items: start;
  }

  .panel {
    flex: 1;
    max-width: 26rem;
    position: relative;
  }

  .panel-label {
    display: block;
    text-align: center;
    font-size: var(--fs-xs);
    color: var(--text-light);
    font-weight: 500;
    margin-bottom: 0.3rem;
    letter-spacing: 0.03em;
  }

  .country-svg {
    width: 100%;
    height: auto;
    display: block;
  }

  .country-fill {
    fill: var(--bubble-visual);
    stroke: var(--border);
    stroke-width: 0.5;
  }

  .province-line {
    fill: none;
    stroke: var(--color-visual);
    stroke-width: 0.3;
    opacity: 0.5;
  }

  .pin-ripple {
    transform-box: fill-box;
    transform-origin: center;
    animation: ripple 2.5s ease-out infinite;
    pointer-events: none;
  }

  @keyframes ripple {
    0% { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(3); opacity: 0; }
  }

  .pin-marker {
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .pin-marker:hover {
    opacity: 0.7;
  }

  @media (max-width: 640px) {
    .panels {
      flex-direction: column;
      align-items: center;
    }

    .panel {
      max-width: 100%;
    }
  }
</style>
