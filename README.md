# kunli.co

Personal site. *Who I am, not what I've done.*

**Live:** [kunli.co](https://kunli.co)

## What this is

A hand-built personal site that doubles as a working portfolio of full-stack
shipping: front-end design (Astro + Svelte), data pipelines (Python +
GitHub Actions cron), and a fully Cloudflare-native deploy (Pages + Functions
+ KV + Access).

The site is split into two repos:

- **This repo** is the public site (homepage, brand showcase, life journey
  map, events feed, Sift product page).
- A separate private repo serves [workbench.kunli.co](https://workbench.kunli.co),
  a personal workbench gated by Cloudflare Access.

## Stack

| Layer | Tech |
|---|---|
| Framework | [Astro 5](https://astro.build) (static output) |
| Interactive islands | [Svelte 5](https://svelte.dev) runes (`$state`, `$derived`, `$effect`) |
| Maps | [D3-geo](https://d3js.org) for life-journey world map |
| Pages | 8 routes incl. EN + ZH variants for select pages |
| Data pipelines | Python scripts + GitHub Actions cron (daily) |
| Hosting | Cloudflare Pages (static) + Functions (KV-backed APIs) |
| Analytics | GTM, with a thin typed wrapper in `src/utils/analytics.ts` |

## Data flow

```
Luma API ─┐
          ├──► GitHub Actions (cron daily) ──► public/data/*.json ──► /events page
Connector docs ─┘                                                 (Svelte islands)
```

Two scheduled workflows fetch fresh data each day, merge with the prior
day's snapshot to preserve `first_seen_at` (so "new today" works), and
commit the result. The front-end reads only the final JSON; no runtime API
calls.

## Structure

```
src/
  pages/          8 routes (Astro)
  components/     Svelte islands + Astro components
  layouts/        BaseLayout with view transitions
  styles/         Global CSS with design tokens
  utils/          Analytics, journey buildSVG, etc.
  data/           Sift changelog (typed TS data)
scripts/          Daily fetch pipelines (Luma events, MCP connectors)
functions/        Cloudflare Pages Functions (KV feedback inbox)
.github/workflows/  Cron jobs
docs/             Brand guidelines (live showcase at /brand)
```

## Dev

```bash
npm install
npm run dev       # localhost:4321
npm run build     # static output → ./dist/
```

Optional helpers:

```bash
npm run seo:diagnose    # query Google Search Console for crawl errors
npm run seo:resubmit    # request reindex of new/updated URLs
```

## Brand

Full design system documented in [`docs/brand-guidelines.md`](docs/brand-guidelines.md)
and showcased live at [kunli.co/brand](https://kunli.co/brand).

## License

MIT (see [`LICENSE`](LICENSE)). Code is open; brand assets and content
remain ©Kun Li.
