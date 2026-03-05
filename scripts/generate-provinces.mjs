#!/usr/bin/env node
/**
 * Fetch Natural Earth 50m admin-1 (provinces/states) boundaries,
 * convert to TopoJSON and simplify for lightweight client use.
 *
 * Output: public/data/provinces-50m.json
 */

import { writeFileSync, mkdirSync } from 'fs';
import { topology } from 'topojson-server';
import { presimplify, simplify, quantile } from 'topojson-simplify';

const SRC_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson';

async function main() {
  console.log('Fetching admin-1 GeoJSON (~12 MB)…');
  const res = await fetch(SRC_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const geojson = await res.json();

  console.log(`Features: ${geojson.features.length}`);

  // Strip heavy properties — keep only what we need
  const stripped = {
    type: 'FeatureCollection',
    features: geojson.features.map((f) => ({
      type: 'Feature',
      geometry: f.geometry,
      properties: {
        name: f.properties.name,
        admin: f.properties.admin, // country name
        iso_a2: f.properties.iso_a2, // country code
      },
    })),
  };

  console.log('Converting to TopoJSON…');
  let topo = topology({ provinces: stripped });

  console.log('Simplifying…');
  topo = presimplify(topo);
  const minWeight = quantile(topo, 0.05); // keep top 95% of detail
  topo = simplify(topo, minWeight);

  const json = JSON.stringify(topo);
  const sizeMB = (Buffer.byteLength(json) / 1024 / 1024).toFixed(2);
  console.log(`Output size: ${sizeMB} MB`);

  mkdirSync('public/data', { recursive: true });
  writeFileSync('public/data/provinces-50m.json', json);
  console.log('Written to public/data/provinces-50m.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
