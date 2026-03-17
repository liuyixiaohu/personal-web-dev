// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://kunli.co',
  integrations: [
    svelte(),
    sitemap({
      filter: (page) => !page.startsWith('https://kunli.co/job-lens'),
    }),
  ]
});