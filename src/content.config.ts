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

const probes = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/probes', ignored: ['_*.mdx'] }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { journey, probes };
