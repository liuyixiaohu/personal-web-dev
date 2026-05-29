# kunli.co

Personal site. _Who I am, not what I've done._

**Live:** [kunli.co](https://kunli.co)

## What this is

A hand-built personal site that doubles as a working portfolio of full-stack
shipping: front-end design (Astro + Svelte), data pipelines (Python +
GitHub Actions cron), and a Cloudflare Pages deploy.

## Stack

| Layer               | Tech                                                                   |
| ------------------- | ---------------------------------------------------------------------- |
| Framework           | [Astro 6](https://astro.build) (static output)                         |
| Interactive islands | [Svelte 5](https://svelte.dev) runes (`$state`, `$derived`, `$effect`) |
| Maps                | [D3-geo](https://d3js.org) for life-journey world map                  |
| Pages               | 8 routes incl. EN + ZH variants for select pages                       |
| Data pipelines      | Python scripts + GitHub Actions cron (daily)                           |
| Hosting             | Cloudflare Pages (static)                                              |
| Analytics           | GTM, with a thin typed wrapper in `src/utils/analytics.ts`             |

## Data flow

```
Luma API ──► GitHub Actions (cron daily) ──► public/data/events.json ──► /events (Svelte island)
```

A scheduled workflow fetches fresh events daily, merges with the prior
day's snapshot to preserve `first_seen_at` (so "new today" works), and
commits the result. The front-end reads only the final JSON; no runtime API
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
scripts/          Daily fetch pipeline (Luma events)
.github/workflows/  Cron jobs + CI
docs/             Brand guidelines
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

Full design system documented in [`docs/brand-guidelines.md`](docs/brand-guidelines.md).

## License

MIT (see [`LICENSE`](LICENSE)). Code is open; brand assets and content
remain ©Kun Li.
