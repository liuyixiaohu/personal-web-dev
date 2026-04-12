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

    // Removed pages
    '/craft': '/',
    '/special-thanks': '/',
    '/special-thanks/yan-zhang': '/',
    '/special-thanks/zach-beasley': '/',
    '/visual-design': '/',
    '/visual-design/sprint-cadence': '/',
    '/privacy': '/',

    // Old /professional/* structure → homepage
    '/professional': '/',
    '/professional/product-marketing': '/',
    '/professional/data-science': '/',
    '/professional/visual-design': '/',
    '/professional/brand-narrative': '/brand',
    '/professional/quant-insights': '/',
    '/professional/information-design': '/',

    // Old map demos
    '/map-demo-leaflet': '/life-journey',
    '/map-demo-d3': '/life-journey',
    '/map-demo-svg': '/life-journey',
  },
  integrations: [
    svelte(),
    sitemap({
      filter: (page) => !page.includes('/privacy') && !page.includes('/console'),
    }),
  ]
});