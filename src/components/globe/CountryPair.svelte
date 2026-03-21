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

  // Ripple delays: sorted by year, 1.2s apart, full cycle = 6 * 1.2 = 7.2s
  const RIPPLE_GAP = 1.2; // seconds between each pin's ripple
  const RIPPLE_CYCLE = pins.length * RIPPLE_GAP; // total cycle duration
  const sortedByYear = [...pins].sort((a, b) => a.year - b.year);
  const rippleDelay: Record<string, number> = {};
  sortedByYear.forEach((p, i) => { rippleDelay[p.id] = i * RIPPLE_GAP; });

  // Label positions relative to pin (Google Maps style, no connector lines).
  // 'anchor' controls SVG text-anchor: 'start' = label right of point, 'end' = label left.
  const labelPos: Record<string, { dx: number; dy: number; anchor: string }> = {
    shouguang: { dx: 16,  dy: -22, anchor: 'start' },  // above-right
    qingdao:   { dx: 16,  dy: 12,  anchor: 'start' },  // right
    jiaozhou:  { dx: -16, dy: 34,  anchor: 'end' },    // below-left
    madison:   { dx: 16,  dy: -16, anchor: 'start' },  // above-right
    fairfield: { dx: -16, dy: -16, anchor: 'end' },    // above-left (Pacific)
    berkeley:  { dx: -16, dy: 30,  anchor: 'end' },    // below-left (Pacific)
  };

  const PAD = 160;
  // Dynamic viewBoxes computed after projection (set in onMount)
  let chinaVB = $state('0 0 100 100');
  let usaVB = $state('0 0 100 100');

  /** Fit a country into a large canvas, then crop the viewBox to its rendered bounds */
  function fitAndCrop(countryGeo: any, padPx: number) {
    const BIG = 2000; // large canvas so fitExtent has room
    const proj = geoMercator().fitExtent([[padPx, padPx], [BIG - padPx, BIG - padPx]], countryGeo);
    const gen = geoPath().projection(proj);
    const bounds = gen.bounds(countryGeo);
    const x0 = bounds[0][0] - padPx;
    const y0 = bounds[0][1] - padPx;
    const w = bounds[1][0] - bounds[0][0] + padPx * 2;
    const h = bounds[1][1] - bounds[0][1] + padPx * 2;
    return { proj, gen, vb: `${x0} ${y0} ${w} ${h}` };
  }

  onMount(async () => {
    const res = await fetch('/data/journey-countries.json');
    const data = await res.json();

    const china = fitAndCrop(data.china, PAD);
    const usa = fitAndCrop(data.usa, PAD);

    chinaVB = china.vb;
    usaVB = usa.vb;

    chinaPath = china.gen(data.china) ?? '';
    usaPath = usa.gen(data.usa) ?? '';

    if (data.provinces) {
      chinaProvPath = china.gen(data.provinces) ?? '';
      usaProvPath = usa.gen(data.provinces) ?? '';
    }

    // Project pins
    const positions: PinPos[] = [];
    for (const p of usaPins) {
      const [x, y] = usa.proj([p.lng, p.lat]) ?? [0, 0];
      positions.push({ ...p, x, y, panel: 'usa' });
    }
    for (const p of chinaPins) {
      const [x, y] = china.proj([p.lng, p.lat]) ?? [0, 0];
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
      <svg viewBox={chinaVB} class="country-svg">
        <defs>
          <clipPath id="clip-china"><path d={chinaPath} /></clipPath>
        </defs>
        <path d={chinaPath} class="country-fill" />
        {#if chinaProvPath}
          <path d={chinaProvPath} class="province-line" clip-path="url(#clip-china)" />
        {/if}
        {#each pinPositions.filter(p => p.panel === 'china') as pin, i}
          {@const lp = labelPos[pin.id] ?? { dx: 14, dy: -8, anchor: 'start' }}
          <circle cx={pin.x} cy={pin.y} r="8" fill="none" stroke={pin.color}
            stroke-width="1.5" class="pin-ripple" style="animation-delay: {rippleDelay[pin.id]}s; animation-duration: {RIPPLE_CYCLE}s" />
          <circle cx={pin.x} cy={pin.y} r="8" fill={pin.color} class="pin-dot" />
          <text x={pin.x + lp.dx} y={pin.y + lp.dy}
            text-anchor={lp.anchor} class="map-label"
            onclick={() => handlePinClick(pin)}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePinClick(pin); }}
            role="button" tabindex="0">
            {pin.city} · {pin.year}
          </text>
        {/each}
      </svg>
    </div>

    <!-- USA panel -->
    <div class="panel">
      <span class="panel-label">United States</span>
      <svg viewBox={usaVB} class="country-svg">
        <defs>
          <clipPath id="clip-usa"><path d={usaPath} /></clipPath>
        </defs>
        <path d={usaPath} class="country-fill" />
        {#if usaProvPath}
          <path d={usaProvPath} class="province-line" clip-path="url(#clip-usa)" />
        {/if}
        {#each pinPositions.filter(p => p.panel === 'usa') as pin, i}
          {@const lp = labelPos[pin.id] ?? { dx: 14, dy: -8, anchor: 'start' }}
          <circle cx={pin.x} cy={pin.y} r="8" fill="none" stroke={pin.color}
            stroke-width="1.5" class="pin-ripple" style="animation-delay: {rippleDelay[pin.id]}s; animation-duration: {RIPPLE_CYCLE}s" />
          <circle cx={pin.x} cy={pin.y} r="8" fill={pin.color} class="pin-dot" />
          <text x={pin.x + lp.dx} y={pin.y + lp.dy}
            text-anchor={lp.anchor} class="map-label"
            onclick={() => handlePinClick(pin)}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePinClick(pin); }}
            role="button" tabindex="0">
            {pin.city} · {pin.year}
          </text>
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
    flex-direction: column;
    gap: var(--space-lg);
    align-items: center;
  }

  .panel {
    width: 100%;
    max-width: 44rem;
    position: relative;
  }

  .panel-label {
    display: block;
    text-align: center;
    font-size: var(--fs-sm);
    color: var(--text-light);
    font-weight: 500;
    margin-bottom: 0.4rem;
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
    stroke-width: 1.5;
  }

  .province-line {
    fill: none;
    stroke: var(--color-visual);
    stroke-width: 1;
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
    12% { transform: scale(3); opacity: 0; }
    100% { transform: scale(3); opacity: 0; }
  }

  .pin-dot {
    pointer-events: none;
  }

  .map-label {
    font-size: 30px;
    font-family: var(--font-body);
    fill: var(--text-light);
    cursor: pointer;
    transition: fill 0.15s ease;
    dominant-baseline: central;
  }

  .map-label:hover {
    fill: var(--color-rose);
  }

</style>
