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
| Analytics           | Google Analytics 4 via a direct gtag.js snippet (no Tag Manager)       |

## Data flow

```
Luma API ──► GitHub Actions (cron daily) ──► public/data/events.json ──► /events (Svelte island)
```

A scheduled workflow fetches Luma's current Bay Area Tech and AI catalog
each day, keeps `first_seen_at` for events it has already seen, and publishes
that full current catalog. Events Luma no longer lists are left out — this is
the live catalog, not a historical archive. The front-end reads the final JSON.

The only runtime API is an optional sync endpoint, `functions/api/sync/`, a
Cloudflare Pages Function backed by KV. It is used only when a visitor creates
or joins a sync code on the events page. Codes are stored as SHA-256 hashes.

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
