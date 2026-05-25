// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://kunli.co',
  // Match Cloudflare Pages' default behavior (folder routes serve at /path/).
  // Aligns sitemap, canonical URLs, and redirect targets so Google indexes
  // the same URL it sees in the sitemap, instead of flagging "Page with redirect".
  trailingSlash: 'always',
  redirects: {
    // Renamed products
    '/job-lens': '/sift/',
    '/joblens': '/sift/',
    '/job-lens/privacy': '/sift/privacy/',
    '/shift': '/sift/',

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
    '/professional/brand-narrative': '/',  // /brand page removed in 1a1f5dd
    '/professional/quant-insights': '/',
    '/professional/information-design': '/',

    // Removed products
    '/ingrain': '/',
    '/ingrain/privacy': '/',

    // Old map demos
    '/map-demo-leaflet': '/life-journey/',
    '/map-demo-d3': '/life-journey/',
    '/map-demo-svg': '/life-journey/',
  },
  integrations: [
    mdx(),
    svelte(),
    sitemap({
      filter: (page) => !page.includes('/privacy'),
    }),
  ]
});
