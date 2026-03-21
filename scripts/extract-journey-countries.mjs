/**
 * Extract USA and China GeoJSON + provinces from world/province TopoJSON.
 * Outputs a small JSON file with just the two countries and their subdivisions.
 */
import { readFileSync, writeFileSync } from 'fs';
import { feature, mesh } from 'topojson-client';

const worldTopo = JSON.parse(readFileSync('public/data/countries-110m.json', 'utf8'));
const provTopo = JSON.parse(readFileSync('public/data/provinces-50m.json', 'utf8'));

const countries = feature(worldTopo, worldTopo.objects.countries);

// USA = 840, China = 156
const usa = countries.features.find(f => f.id === '840');
const china = countries.features.find(f => f.id === '156');

if (!usa || !china) {
  console.error('Could not find USA or China in TopoJSON');
  process.exit(1);
}

// Filter out Alaska, Hawaii, and US territories for a cleaner contiguous US shape
// Keep only polygons roughly within contiguous US bounds
function filterContiguousUS(geojson) {
  if (geojson.geometry.type !== 'MultiPolygon') return geojson;
  const filtered = geojson.geometry.coordinates.filter(polygon => {
    // Check if any point in the polygon is within contiguous US bounds
    const flat = polygon.flat(2);
    // Extract all lngs (even indices) and lats (odd indices)
    let hasContiguous = false;
    for (let i = 0; i < flat.length; i += 2) {
      const lng = flat[i], lat = flat[i + 1];
      if (lng > -130 && lng < -60 && lat > 24 && lat < 50) {
        hasContiguous = true;
        break;
      }
    }
    return hasContiguous;
  });
  return {
    ...geojson,
    geometry: { type: 'MultiPolygon', coordinates: filtered }
  };
}

// Filter China to exclude islands far from mainland
function filterMainlandChina(geojson) {
  if (geojson.geometry.type !== 'MultiPolygon') return geojson;
  const filtered = geojson.geometry.coordinates.filter(polygon => {
    const flat = polygon.flat(2);
    // Keep polygons that have points within mainland China bounds
    for (let i = 0; i < flat.length; i += 2) {
      const lng = flat[i], lat = flat[i + 1];
      if (lng > 73 && lng < 136 && lat > 18 && lat < 54) return true;
    }
    return false;
  });
  return {
    ...geojson,
    geometry: { type: 'MultiPolygon', coordinates: filtered }
  };
}

// Get province boundaries as GeoJSON line strings
const provBoundaries = mesh(provTopo, provTopo.objects.provinces);

const output = {
  usa: filterContiguousUS(usa),
  china: filterMainlandChina(china),
  provinces: provBoundaries,
};

const outPath = 'public/data/journey-countries.json';
writeFileSync(outPath, JSON.stringify(output));
const size = (readFileSync(outPath).length / 1024).toFixed(1);
console.log(`Wrote ${outPath} (${size} KB)`);
