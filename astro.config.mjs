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
  // 301 redirects live in public/_redirects — true edge 301s on Cloudflare
  // Pages, rather than the <meta http-equiv="refresh"> HTML pages Astro emits
  // for static `redirects`. Keep both slash forms in sync there.
  integrations: [
    mdx(),
    svelte(),
    sitemap({
      filter: (page) => !page.includes('/privacy'),
    }),
  ],
});
