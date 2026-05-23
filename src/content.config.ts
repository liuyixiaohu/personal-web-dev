import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const journey = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/journey' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    heroImage: z.string().optional(),
  }),
});

export const collections = { journey };
