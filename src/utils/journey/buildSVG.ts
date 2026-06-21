import { geoMercator, geoPath, type GeoPermissibleObjects } from 'd3-geo';

const NS = 'http://www.w3.org/2000/svg';

export interface JourneyMapPin {
  id: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  year: number;
  title: string;
  summary: string;
  href: string;
}

export interface PinHandlers {
  onPinActivate?: (pin: JourneyMapPin) => void;
  onPinEnter?: (pin: JourneyMapPin, event: MouseEvent | FocusEvent) => void;
  onPinMove?: (pin: JourneyMapPin, event: MouseEvent) => void;
  onPinLeave?: (pin: JourneyMapPin, event: MouseEvent | FocusEvent) => void;
}

export type LabelPos = Record<string, { dx: number; dy: number; anchor: string }>;

export function fitAndCrop(countryGeo: GeoPermissibleObjects, padPx: number, padTop?: number) {
  const top = padTop ?? padPx;
  const BIG = 2000;
  const proj = geoMercator().fitExtent(
    [
      [padPx, padPx],
      [BIG - padPx, BIG - padPx],
    ],
    countryGeo,
  );
  const gen = geoPath().projection(proj);
  const bounds = gen.bounds(countryGeo);
  const x0 = bounds[0][0] - padPx;
  const y0 = bounds[0][1] - top;
  const w = bounds[1][0] - bounds[0][0] + padPx * 2;
  const h = bounds[1][1] - bounds[0][1] + top + padPx;
  return { proj, gen, vb: `${x0} ${y0} ${w} ${h}` };
}

export function buildSVG(
  svgEl: SVGSVGElement,
  countryGeo: GeoPermissibleObjects,
  provGeo: GeoPermissibleObjects | null | undefined,
  countryPins: JourneyMapPin[],
  clipId: string,
  padTop: number,
  labelPos: LabelPos,
  handlers: PinHandlers = {},
) {
  const PAD = 160;
  const { proj, gen, vb } = fitAndCrop(countryGeo, PAD, padTop);
  svgEl.replaceChildren();
  svgEl.setAttribute('viewBox', vb);

  const countryPath = document.createElementNS(NS, 'path');
  countryPath.setAttribute('d', gen(countryGeo) ?? '');
  countryPath.setAttribute('class', 'country-fill');
  svgEl.appendChild(countryPath);

  const defs = document.createElementNS(NS, 'defs');
  const clipPath = document.createElementNS(NS, 'clipPath');
  clipPath.id = clipId;
  const clipShape = document.createElementNS(NS, 'path');
  clipShape.setAttribute('d', gen(countryGeo) ?? '');
  clipPath.appendChild(clipShape);
  defs.appendChild(clipPath);
  svgEl.insertBefore(defs, svgEl.firstChild);

  if (provGeo) {
    const provPath = document.createElementNS(NS, 'path');
    provPath.setAttribute('d', gen(provGeo) ?? '');
    provPath.setAttribute('class', 'province-line');
    provPath.setAttribute('clip-path', `url(#${clipId})`);
    svgEl.appendChild(provPath);
  }

  for (const pin of countryPins) {
    const [x, y] = proj([pin.lng, pin.lat]) ?? [0, 0];
    const lp = labelPos[pin.id] ?? { dx: 14, dy: -8, anchor: 'start' };

    const marker = document.createElementNS(NS, 'g');
    marker.setAttribute('class', 'pin-marker');
    marker.setAttribute('data-pin-id', pin.id);

    // Ripple rings — invisible at rest, animated only on hover/focus (see
    // life-journey.astro). Two staggered rings sit behind the solid dot so the
    // hovered pin reads as emitting a ripple. Dot colour is owned by CSS.
    for (let i = 0; i < 2; i++) {
      const ripple = document.createElementNS(NS, 'circle');
      ripple.setAttribute('cx', String(x));
      ripple.setAttribute('cy', String(y));
      ripple.setAttribute('r', '8');
      ripple.setAttribute('class', i === 0 ? 'pin-ripple' : 'pin-ripple pin-ripple-2');
      marker.appendChild(ripple);
    }

    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('cx', String(x));
    dot.setAttribute('cy', String(y));
    dot.setAttribute('r', '8');
    dot.setAttribute('class', 'pin-dot');
    marker.appendChild(dot);

    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', String(x + lp.dx));
    label.setAttribute('y', String(y + lp.dy));
    label.setAttribute('text-anchor', lp.anchor);
    label.setAttribute('class', 'map-label');
    label.setAttribute('data-pin-id', pin.id);
    label.textContent = `${pin.city} · ${pin.year}`;

    if (handlers.onPinActivate) {
      label.setAttribute('role', 'link');
      label.setAttribute('tabindex', '0');
      label.setAttribute('aria-label', `${pin.city}, ${pin.year}. ${pin.title}`);

      marker.addEventListener('click', () => handlers.onPinActivate?.(pin));
      marker.addEventListener('mouseenter', (e) => handlers.onPinEnter?.(pin, e));
      marker.addEventListener('mousemove', (e) => handlers.onPinMove?.(pin, e));
      marker.addEventListener('mouseleave', (e) => handlers.onPinLeave?.(pin, e));
      label.addEventListener('focus', (e) => handlers.onPinEnter?.(pin, e));
      label.addEventListener('blur', (e) => handlers.onPinLeave?.(pin, e));
      label.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handlers.onPinActivate?.(pin);
        }
      });
    }

    marker.appendChild(label);
    svgEl.appendChild(marker);
  }
}
