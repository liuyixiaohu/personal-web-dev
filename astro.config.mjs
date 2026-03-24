// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://kunli.co',
  trailingSlash: 'never',
  redirects: {
    '/job-lens': '/sift',
    '/dream-job-monitor': '/',
    '/chaguan': '/',
  },
  integrations: [
    svelte(),
    sitemap(),
  ]
});