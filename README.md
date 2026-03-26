# kunli.co

Personal brand site. Who I am, not what I've done.

**Live:** [kunli.co](https://kunli.co)

## Design Philosophy

- **Minimal** -- Page depth ≤ 3. Dependencies in single digits.
- **Warm** -- Palette refined from 小龙格林. Serif typefaces across both languages.
- **Personal** -- Who I am, not what I've done.

## Stack

| Layer | Tech |
|---|---|
| Framework | [Astro 5](https://astro.build) (static) |
| Interactive | [Svelte 5](https://svelte.dev) (events page) |
| Maps | [D3-geo](https://d3js.org) (journey page) |
| i18n | Bilingual EN/ZH via `data-i18n` |
| Deploy | Cloudflare Pages |

## Structure

```
src/
  pages/          Routes (19 pages)
  components/     Svelte + Astro components
  i18n/           Translations + language store
  styles/         Global CSS with design tokens
  utils/          Analytics, journey modules
  data/           Professional areas, changelog data
scripts/          Daily event pipeline (Luma)
docs/             Brand guidelines
```

## Dev

```bash
npm install
npm run dev       # localhost:4321
npm run build     # production → ./dist/
```

## Brand Guidelines

Full design system documented at [kunli.co/brand](https://kunli.co/brand) and in [`docs/brand-guidelines.md`](docs/brand-guidelines.md).
