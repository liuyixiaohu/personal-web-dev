// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import sanity from '@sanity/astro';

// https://astro.build/config
export default defineConfig({
  site: 'https://kunli.co',
  integrations: [
    svelte(),
    sitemap(),
    sanity({
      projectId: 'tq8zalau',
      dataset: 'production',
      useCdn: false,
    }),
  ]
});