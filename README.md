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
| Hosting             | Cloudflare Pages (static site + Functions)                             |
| Runtime storage     | Cloudflare KV (optional sync) + D1 (email subscriptions)               |
| Transactional email | Resend batch API with idempotency keys                                 |
| Analytics           | Google Analytics 4 via a direct gtag.js snippet (no Tag Manager)       |

## Data flow

```
Luma API ──► GitHub Actions ──► events.json ──► Cloudflare Pages ──► subscriber notification
                                             └────────────────────► /events (Svelte island)
```

A scheduled workflow fetches Luma's current Bay Area Tech and AI catalog
each day, keeps `first_seen_at` for events it has already seen, and publishes
that full current catalog. Events Luma no longer lists are left out — this is
the live catalog, not a historical archive. The front-end reads the final JSON.

Runtime APIs are Cloudflare Pages Functions. The optional `functions/api/sync/`
endpoint is backed by KV and stores sync codes as SHA-256 hashes. The
`functions/api/subscriptions/` endpoint uses D1 and Resend for double-opt-in
event update emails. Notifications run only after the deployed `events.json`
matches the repository version; `updated_at` and Resend idempotency keys prevent
duplicate sends.

See [`docs/email-subscriptions.md`](docs/email-subscriptions.md) for operations,
configuration, migrations, and verification.

## Event email subscription reference

The subscription feature uses these pieces:

| Piece                  | Resource or location                             | Purpose                                                                             |
| ---------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Pages project          | `personal-web-dev` (`kunli.co`)                  | Hosts the static site and Functions                                                 |
| Pages Function         | `functions/api/subscriptions/[action].ts`        | Routes subscribe, confirm, unsubscribe, and notify requests                         |
| Shared server module   | `src/server/subscriptions.ts`                    | Validation, tokens, D1 state, deterministic email content, and Resend calls         |
| D1 database            | `personal-web-subscriptions`                     | Stores subscribers, notification runs, and deliveries                               |
| D1 binding             | `SUBSCRIPTIONS`                                  | Makes the database available to Pages Functions                                     |
| Migration              | `migrations/0001_email_subscriptions.sql`        | Creates the subscription schema                                                     |
| Email provider         | Resend, verified domain `kunli.co`               | Sends confirmation and update email                                                 |
| Sender                 | `Latest Luma Events <LatestLumaEvents@kunli.co>` | Visible From identity                                                               |
| Automation             | `.github/workflows/notify-subscribers.yml`       | Waits for the production JSON version, calls notify, and retries daily              |
| Event pipeline handoff | `.github/workflows/fetch-events.yml`             | Dispatches notification only after the event-data PR merges                         |
| Trigger script         | `scripts/notify-subscribers.mjs`                 | Compares deployed and repository `updated_at` before authenticating the notify call |

Pages configuration is versioned in `wrangler.toml`, including the existing KV
bindings, the D1 binding, `SITE_URL`, and `EMAIL_FROM`. Secrets stay in their
native platforms:

- Cloudflare Pages encrypted secrets: `RESEND_API_KEY`, `NOTIFY_SECRET`
- GitHub Actions encrypted secret: `EVENT_NOTIFY_SECRET` (same value as
  Cloudflare `NOTIFY_SECRET`)
- Resend API key: Sending access only, restricted to `kunli.co`

`RESEND_API_KEY` never enters GitHub. Existing `LUMA_API_URL`, `GEMINI_API_KEY`,
Google credentials, KV bindings, and feedback storage are separate and are not
reused by this feature.

The public API surface is:

- `POST /api/subscriptions/subscribe`
- `GET /api/subscriptions/confirm`
- `GET` or `POST /api/subscriptions/unsubscribe`
- `POST /api/subscriptions/notify` (Bearer-authenticated automation only)

Notifications are unique by `events.json.updated_at`. D1 prevents a second run
for the same version, while stable Resend batch `Idempotency-Key` values protect
network retries. Each email includes the event count, `/events/`, and one-click
unsubscribe. No LLM participates in subscription or email generation.

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
docs/             Notes
```

## Dev

```bash
npm install
npm run dev       # localhost:4321
npm run build     # static output → ./dist/
```

For local subscription work, install Wrangler 4, apply the migration to a local
D1 instance, then run Pages locally:

```bash
npx wrangler d1 execute personal-web-subscriptions --local --file migrations/0001_email_subscriptions.sql
npm run build
npx wrangler pages dev dist
```

Use local-only test values through Wrangler's secret mechanisms; never commit a
`.dev.vars` or `.env` file. `npm run check:all` is the required repository gate.
Local tests prove routing, schema, and idempotency logic, but production delivery
is verified separately with a controlled mailbox: subscribe, confirm, receive
one update, replay the same `updated_at` without a second email, then unsubscribe.

Optional helpers:

```bash
npm run seo:diagnose    # query Google Search Console for crawl errors
npm run seo:resubmit    # request reindex of new/updated URLs
```

## Design system

Documented at [kunli.co/design-system](https://kunli.co/design-system/).
Tokens in `src/styles/global.css` must match that page.

## License

MIT (see [`LICENSE`](LICENSE)). Code is open; brand assets and content
remain ©Kun Li.
