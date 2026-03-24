// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://kunli.co',
  trailingSlash: 'never',
  redirects: {
    // Renamed products
    '/job-lens': '/sift',
    '/joblens': '/sift',
    '/job-lens/privacy': '/sift/privacy',
    '/shift': '/sift',

    // Removed pages
    '/dream-job-monitor': '/',
    '/chaguan': '/',
    '/tools/excel': '/',
    '/tools': '/',
    '/tool': '/',

    // Old /professional/* structure → homepage (craft section)
    '/professional': '/',
    '/professional/product-marketing': '/',
    '/professional/data-science': '/',
    '/professional/visual-design': '/visual-design',
    '/professional/brand-narrative': '/brand',
    '/professional/quant-insights': '/',
    '/professional/information-design': '/visual-design',

    // Old map demos
    '/map-demo-leaflet': '/life-journey',
    '/map-demo-d3': '/life-journey',
    '/map-demo-svg': '/life-journey',
  },
  integrations: [
    svelte(),
    sitemap(),
  ]
});