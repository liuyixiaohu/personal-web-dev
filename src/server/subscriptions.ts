export interface SubscriptionEnv {
  SUBSCRIPTIONS: D1Database;
  RESEND_API_KEY: string;
  NOTIFY_SECRET: string;
  SITE_URL?: string;
  EMAIL_FROM?: string;
}

interface EventUpdate {
  updated_at: string;
  new_event_ids: string[];
}

interface SubscriberRow {
  id: string;
  email: string;
  status: 'pending' | 'confirmed' | 'unsubscribed';
  confirm_expires_at: string | null;
  last_confirmation_sent_at: string | null;
  unsubscribe_token: string;
}

interface DeliveryRow {
  id: string;
  email: string;
  unsubscribe_token: string;
  batch_index: number;
}

const RESEND_API = 'https://api.resend.com';
const DEFAULT_SITE_URL = 'https://kunli.co';
const DEFAULT_EMAIL_FROM = 'Latest Luma Events <LatestLumaEvents@kunli.co>';
const CONFIRM_TTL_MS = 24 * 60 * 60 * 1000;
const CONFIRM_COOLDOWN_MS = 10 * 60 * 1000;
const RUN_LEASE_MS = 15 * 60 * 1000;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_BATCH_SIZE = 100;
const GENERIC_SUBSCRIBE_MESSAGE =
  'If that address can be subscribed, a confirmation email will arrive shortly.';

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function page(title: string, message: string, status = 200): Response {
  return new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title><body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><p><a href="/events/">Return to Events</a></p></main></body></html>`,
    {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
      },
    },
  );
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return replacements[character];
  });
}

function siteUrl(env: SubscriptionEnv): string {
  return (env.SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
}

function emailFrom(env: SubscriptionEnv): string {
  return env.EMAIL_FROM || DEFAULT_EMAIL_FROM;
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 254 || /[\r\n]/.test(email)) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  const length = Number(request.headers.get('Content-Length') || '0');
  if (length > MAX_BODY_BYTES) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let value = '';
  let bytes = 0;
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.byteLength;
    if (bytes > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    value += decoder.decode(chunk.value, { stream: true });
  }
  value += decoder.decode();
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function tokenFrom(request: Request): string | null {
  const token = new URL(request.url).searchParams.get('token');
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

async function sendResend(
  env: SubscriptionEnv,
  path: '/emails' | '/emails/batch',
  body: unknown,
  idempotencyKey: string,
): Promise<unknown> {
  const response = await fetch(`${RESEND_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(body),
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Resend request failed with HTTP ${response.status}`);
  return result;
}

export function buildUpdateEmail(
  updatedAt: string,
  newEventCount: number,
  eventsUrl: string,
  unsubscribeUrl: string,
) {
  const noun = newEventCount === 1 ? 'event' : 'events';
  const date = new Date(updatedAt).toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const subject = `${newEventCount} new Bay Area tech & AI ${noun}`;
  const text = `${newEventCount} new ${noun} were added in the ${date} update.\n\nView events: ${eventsUrl}\n\nUnsubscribe: ${unsubscribeUrl}`;
  const html = `<p><strong>${newEventCount} new ${noun}</strong> were added in the ${escapeHtml(date)} update.</p><p><a href="${escapeHtml(eventsUrl)}">View the latest events</a></p><p><a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe with one click</a></p>`;
  return { subject, text, html };
}

export async function batchIdempotencyKey(updatedAt: string, batchIndex: number): Promise<string> {
  return `event-update/${await sha256(updatedAt)}/${batchIndex}`;
}

async function subscribe(request: Request, env: SubscriptionEnv): Promise<Response> {
  const body = await readJson(request);
  if (!body) return json({ message: GENERIC_SUBSCRIBE_MESSAGE });
  if (typeof body.website === 'string' && body.website.trim()) {
    return json({ message: GENERIC_SUBSCRIBE_MESSAGE });
  }
  const email = normalizeEmail(body.email);
  if (!email) return json({ message: GENERIC_SUBSCRIBE_MESSAGE });

  const existing = await env.SUBSCRIPTIONS.prepare(
    `SELECT id, email, status, confirm_expires_at, last_confirmation_sent_at, unsubscribe_token
     FROM subscribers WHERE email_normalized = ?`,
  )
    .bind(email)
    .first<SubscriberRow>();
  const now = Date.now();
  if (
    existing?.status === 'confirmed' ||
    (existing?.last_confirmation_sent_at &&
      now - Date.parse(existing.last_confirmation_sent_at) < CONFIRM_COOLDOWN_MS)
  ) {
    return json({ message: GENERIC_SUBSCRIBE_MESSAGE });
  }

  const id = existing?.id || crypto.randomUUID();
  const confirmToken = randomToken();
  const unsubscribeToken = existing?.unsubscribe_token || randomToken();
  const confirmHash = await sha256(confirmToken);
  const expiresAt = new Date(now + CONFIRM_TTL_MS).toISOString();
  const sentAt = new Date(now).toISOString();
  const cooldownBefore = new Date(now - CONFIRM_COOLDOWN_MS).toISOString();
  const stored = await env.SUBSCRIPTIONS.prepare(
    `INSERT INTO subscribers (
       id, email, email_normalized, status, confirm_token_hash, confirm_expires_at,
       unsubscribe_token, last_confirmation_sent_at, created_at, updated_at
     ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)
     ON CONFLICT(email_normalized) DO UPDATE SET
       email = excluded.email,
       status = 'pending',
       confirm_token_hash = excluded.confirm_token_hash,
       confirm_expires_at = excluded.confirm_expires_at,
       unsubscribe_token = excluded.unsubscribe_token,
       last_confirmation_sent_at = excluded.last_confirmation_sent_at,
       unsubscribed_at = NULL,
       updated_at = excluded.updated_at
     WHERE subscribers.status != 'confirmed'
       AND (subscribers.last_confirmation_sent_at IS NULL
         OR subscribers.last_confirmation_sent_at < ?)`,
  )
    .bind(
      id,
      email,
      email,
      confirmHash,
      expiresAt,
      unsubscribeToken,
      sentAt,
      sentAt,
      sentAt,
      cooldownBefore,
    )
    .run();
  if (!stored.meta.changes) return json({ message: GENERIC_SUBSCRIBE_MESSAGE });

  const confirmUrl = `${siteUrl(env)}/api/subscriptions/confirm?token=${confirmToken}`;
  try {
    await sendResend(
      env,
      '/emails',
      {
        from: emailFrom(env),
        to: [email],
        subject: 'Confirm your Latest Luma Events subscription',
        text: `Confirm your subscription within 24 hours: ${confirmUrl}\n\nIf you did not request this, you can ignore this email.`,
        html: `<p>Confirm your Latest Luma Events subscription within 24 hours.</p><p><a href="${escapeHtml(confirmUrl)}">Confirm subscription</a></p><p>If you did not request this, you can ignore this email.</p>`,
      },
      `subscription-confirm/${id}/${Math.floor(now / CONFIRM_COOLDOWN_MS)}`,
    );
  } catch (error) {
    console.error('Confirmation email failed', {
      subscriberId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
  return json({ message: GENERIC_SUBSCRIBE_MESSAGE });
}

async function confirm(request: Request, env: SubscriptionEnv): Promise<Response> {
  const token = tokenFrom(request);
  if (!token) return page('Confirmation link invalid', 'Request a new confirmation email.');
  const hash = await sha256(token);
  const subscriber = await env.SUBSCRIPTIONS.prepare(
    `SELECT id, email, status, confirm_expires_at, last_confirmation_sent_at
     FROM subscribers WHERE confirm_token_hash = ?`,
  )
    .bind(hash)
    .first<SubscriberRow>();
  if (!subscriber || subscriber.status !== 'pending' || !subscriber.confirm_expires_at) {
    return page('Confirmation link invalid', 'Request a new confirmation email.');
  }
  if (Date.parse(subscriber.confirm_expires_at) < Date.now()) {
    return page('Confirmation link expired', 'Request a new confirmation email.');
  }
  const now = new Date().toISOString();
  await env.SUBSCRIPTIONS.prepare(
    `UPDATE subscribers SET status = 'confirmed', confirmed_at = ?, confirm_token_hash = NULL,
       confirm_expires_at = NULL, updated_at = ? WHERE id = ?`,
  )
    .bind(now, now, subscriber.id)
    .run();
  return page(
    'Subscription confirmed',
    'You will receive a message when new events are published.',
  );
}

async function unsubscribe(request: Request, env: SubscriptionEnv): Promise<Response> {
  let token = tokenFrom(request);
  if (!token && request.method === 'POST') {
    const body = await readJson(request);
    token = typeof body?.token === 'string' ? body.token : null;
  }
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    const now = new Date().toISOString();
    await env.SUBSCRIPTIONS.prepare(
      `UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = ?, updated_at = ?
       WHERE unsubscribe_token = ?`,
    )
      .bind(now, now, token)
      .run();
  }
  if (request.method === 'POST') return json({ message: 'Unsubscribed.' });
  return page('Unsubscribed', 'You will no longer receive event update emails.');
}

async function secretsMatch(actual: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [actualHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(actual)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const left = new Uint8Array(actualHash);
  const right = new Uint8Array(expectedHash);
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

function parseUpdate(body: Record<string, unknown> | null): EventUpdate | null {
  if (!body || typeof body.updated_at !== 'string' || Number.isNaN(Date.parse(body.updated_at))) {
    return null;
  }
  if (
    !Array.isArray(body.new_event_ids) ||
    body.new_event_ids.length > 10_000 ||
    !body.new_event_ids.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 200)
  ) {
    return null;
  }
  return { updated_at: body.updated_at, new_event_ids: [...new Set(body.new_event_ids)] };
}

async function notify(request: Request, env: SubscriptionEnv): Promise<Response> {
  const authorization = request.headers.get('Authorization') || '';
  const expected = `Bearer ${env.NOTIFY_SECRET || ''}`;
  if (!env.NOTIFY_SECRET || !(await secretsMatch(authorization, expected))) {
    return json({ error: 'Unauthorized' }, 401);
  }
  const update = parseUpdate(await readJson(request));
  if (!update) return json({ error: 'Invalid event update' }, 400);

  const now = new Date().toISOString();
  const staleBefore = new Date(Date.now() - RUN_LEASE_MS).toISOString();
  await env.SUBSCRIPTIONS.prepare(
    `INSERT OR IGNORE INTO notification_runs
       (updated_at, new_event_count, status, started_at, attempt_started_at)
     VALUES (?, ?, 'pending', ?, NULL)`,
  )
    .bind(update.updated_at, update.new_event_ids.length, now)
    .run();
  const acquired = await env.SUBSCRIPTIONS.prepare(
    `UPDATE notification_runs SET status = 'processing', attempt_started_at = ?, error = NULL
     WHERE updated_at = ? AND status != 'completed'
       AND (attempt_started_at IS NULL OR attempt_started_at < ?)`,
  )
    .bind(now, update.updated_at, staleBefore)
    .run();
  if (!acquired.meta.changes) {
    const run = await env.SUBSCRIPTIONS.prepare(
      'SELECT status FROM notification_runs WHERE updated_at = ?',
    )
      .bind(update.updated_at)
      .first<{ status: string }>();
    return json({ status: run?.status || 'processing', duplicate: true });
  }

  try {
    if (update.new_event_ids.length === 0) {
      await env.SUBSCRIPTIONS.prepare(
        `UPDATE notification_runs SET status = 'completed', completed_at = ?, attempt_started_at = NULL
         WHERE updated_at = ?`,
      )
        .bind(new Date().toISOString(), update.updated_at)
        .run();
      return json({ status: 'completed', sent: 0 });
    }

    await env.SUBSCRIPTIONS.prepare(
      `INSERT OR IGNORE INTO deliveries
         (id, run_updated_at, subscriber_id, batch_index, status, created_at, updated_at)
       SELECT lower(hex(randomblob(16))), ?, ranked.id,
         CAST((ranked.position - 1) / ${MAX_BATCH_SIZE} AS INTEGER), 'pending', ?, ?
       FROM (
         SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS position
         FROM subscribers WHERE status = 'confirmed'
       ) AS ranked`,
    )
      .bind(update.updated_at, now, now)
      .run();

    const batches = await env.SUBSCRIPTIONS.prepare(
      `SELECT DISTINCT batch_index FROM deliveries
       WHERE run_updated_at = ? AND status != 'sent' ORDER BY batch_index`,
    )
      .bind(update.updated_at)
      .all<{ batch_index: number }>();
    let sent = 0;
    for (const batch of batches.results) {
      const deliveries = await env.SUBSCRIPTIONS.prepare(
        `SELECT deliveries.id, subscribers.email, subscribers.unsubscribe_token, deliveries.batch_index
         FROM deliveries JOIN subscribers ON subscribers.id = deliveries.subscriber_id
         WHERE deliveries.run_updated_at = ? AND deliveries.batch_index = ?
           AND deliveries.status != 'sent' AND subscribers.status = 'confirmed'
         ORDER BY deliveries.id`,
      )
        .bind(update.updated_at, batch.batch_index)
        .all<DeliveryRow>();
      if (!deliveries.results.length) continue;
      const messages = deliveries.results.map((delivery) => {
        const unsubscribeUrl = `${siteUrl(env)}/api/subscriptions/unsubscribe?token=${delivery.unsubscribe_token}`;
        const content = buildUpdateEmail(
          update.updated_at,
          update.new_event_ids.length,
          `${siteUrl(env)}/events/`,
          unsubscribeUrl,
        );
        return {
          from: emailFrom(env),
          to: [delivery.email],
          ...content,
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        };
      });
      const result = (await sendResend(
        env,
        '/emails/batch',
        messages,
        await batchIdempotencyKey(update.updated_at, batch.batch_index),
      )) as { data?: Array<{ id?: string }> };
      if (!Array.isArray(result.data) || result.data.length !== deliveries.results.length) {
        throw new Error('Resend returned an unexpected batch response');
      }
      const completedAt = new Date().toISOString();
      await env.SUBSCRIPTIONS.batch(
        deliveries.results.map((delivery, index) =>
          env.SUBSCRIPTIONS.prepare(
            `UPDATE deliveries SET status = 'sent', resend_email_id = ?, sent_at = ?, updated_at = ?, error = NULL
             WHERE id = ?`,
          ).bind(result.data?.[index]?.id || null, completedAt, completedAt, delivery.id),
        ),
      );
      sent += deliveries.results.length;
    }
    await env.SUBSCRIPTIONS.prepare(
      `UPDATE notification_runs SET status = 'completed', completed_at = ?, attempt_started_at = NULL
       WHERE updated_at = ?`,
    )
      .bind(new Date().toISOString(), update.updated_at)
      .run();
    return json({ status: 'completed', sent });
  } catch (error) {
    const message =
      error instanceof Error ? error.message.slice(0, 500) : 'Unknown notification error';
    console.error('Subscriber notification failed', {
      updatedAt: update.updated_at,
      error: message,
    });
    await env.SUBSCRIPTIONS.prepare(
      `UPDATE notification_runs SET status = 'failed', error = ?, attempt_started_at = NULL
       WHERE updated_at = ?`,
    )
      .bind(message, update.updated_at)
      .run();
    return json({ error: 'Notification failed' }, 502);
  }
}

export async function handleSubscriptionRequest(
  action: string,
  request: Request,
  env: SubscriptionEnv,
): Promise<Response> {
  if (!env.SUBSCRIPTIONS) return json({ error: 'Subscription storage is not configured' }, 503);
  if (action === 'subscribe' && request.method === 'POST') return subscribe(request, env);
  if (action === 'confirm' && request.method === 'GET') return confirm(request, env);
  if (action === 'unsubscribe' && (request.method === 'GET' || request.method === 'POST')) {
    return unsubscribe(request, env);
  }
  if (action === 'notify' && request.method === 'POST') return notify(request, env);
  return json({ error: 'Not found' }, 404);
}
