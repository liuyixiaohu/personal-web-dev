# Event update email subscriptions

The Events page offers an optional double-opt-in email subscription. No LLM is
used. Confirmation and notification content is deterministic.

## Architecture

- `POST /api/subscriptions/subscribe` accepts an email and hidden `website`
  honeypot. It always returns the same public response and limits confirmation
  sends per address with a cooldown.
- `GET /api/subscriptions/confirm` accepts a single-use token that expires after
  24 hours.
- `GET` or `POST /api/subscriptions/unsubscribe` immediately marks the address
  unsubscribed. Update emails include both a visible link and standard
  one-click unsubscribe headers.
- `POST /api/subscriptions/notify` requires `NOTIFY_SECRET`. A D1
  `notification_runs` row is unique by the deployed `events.json` `updated_at`.
  Delivery rows are unique by run and subscriber.
- Resend batches contain no more than 100 messages. Each batch uses a stable
  `Idempotency-Key` derived from `updated_at` and the batch index.
- GitHub Actions waits until production serves the exact repository
  `updated_at`, then invokes the notification endpoint. A daily schedule retries
  this automation if dispatch failed.

## Platform configuration

Cloudflare Pages production requires:

- D1 binding `SUBSCRIPTIONS`
- encrypted secret `RESEND_API_KEY`
- encrypted secret `NOTIFY_SECRET`
- variable `SITE_URL=https://kunli.co`
- variable `EMAIL_FROM=Latest Luma Events <LatestLumaEvents@kunli.co>`

GitHub Actions requires `EVENT_NOTIFY_SECRET` with the same value as Cloudflare
`NOTIFY_SECRET`. Resend keys remain only in Cloudflare. Use a dedicated Resend
key with Sending access restricted to `kunli.co`.

Apply `migrations/0001_email_subscriptions.sql` to an empty local database
before applying it to the production D1 database. Do not place secret values in
Wrangler configuration, source files, shell history, or logs.

## Verification

1. Run `npm run check:all`.
2. Confirm the migration executes against an empty local D1 database.
3. Confirm all workflow YAML parses.
4. Deploy the feature branch or merge the approved PR and wait for the Pages
   production deployment.
5. Subscribe with a controlled mailbox, follow the confirmation link, and
   invoke a notification for a test `updated_at`.
6. Confirm one message arrives, unsubscribe, and replay the identical payload.
   The replay must report a duplicate/completed run and send no second email.
7. Inspect D1 `notification_runs` and `deliveries` without printing email
   addresses or secrets.

Local unit and Pages Functions tests do not prove production deliverability.
Record production subscription, confirmation, delivery, replay, and
unsubscribe as separate verification evidence in the pull request.
