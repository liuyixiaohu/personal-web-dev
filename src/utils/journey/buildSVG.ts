/**
 * SVG map builder for the Life Journey page.
 * Static country outlines, province boundaries, and labeled pins.
 */
import { geoMercator, geoPath } from 'd3-geo';

const NS = 'http://www.w3.org/2000/svg';

/** Fit a country GeoJSON into a padded square and return projection + viewBox. */
export function fitAndCrop(
  countryGeo: any,
  padPx: number,
  padTop?: number,
) {
  const top = padTop ?? padPx;
  const BIG = 2000;
  const proj = geoMercator().fitExtent(
    [[padPx, padPx], [BIG - padPx, BIG - padPx]],
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

/** Build a country SVG: outline, provinces, dot + label per pin. Non-interactive. */
export function buildSVG(
  svgEl: SVGSVGElement,
  countryGeo: any,
  provGeo: any,
  countryPins: any[],
  clipId: string,
  padTop: number,
  labelPos: Record<string, { dx: number; dy: number; anchor: string }>,
) {
  const PAD = 160;
  const { proj, gen, vb } = fitAndCrop(countryGeo, PAD, padTop);
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

    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('cx', String(x));
    dot.setAttribute('cy', String(y));
    dot.setAttribute('r', '8');
    dot.setAttribute('fill', pin.color);
    dot.setAttribute('class', 'pin-dot');
    svgEl.appendChild(dot);

    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', String(x + lp.dx));
    label.setAttribute('y', String(y + lp.dy));
    label.setAttribute('text-anchor', lp.anchor);
    label.setAttribute('class', 'map-label');
    label.textContent = `${pin.city} · ${pin.year}`;
    svgEl.appendChild(label);
  }
}
