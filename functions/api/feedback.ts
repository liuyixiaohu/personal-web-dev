// POST /api/feedback — public endpoint for the events page feedback form.
// Validates input, writes to FEEDBACK KV with a 30-day TTL.
//
// Required Cloudflare Pages setup:
//   1. CF dashboard → Workers & Pages → KV → Create namespace "FEEDBACK"
//   2. Pages → personal-web-dev → Settings → Functions → KV namespace
//      bindings → variable name "FEEDBACK", namespace "FEEDBACK"

interface Env {
  FEEDBACK: KVNamespace;
}

const MAX_LENGTH = 5000;
const TTL_SECONDS = 30 * 24 * 60 * 60;
const RATE_LIMIT_SECONDS = 60 * 60;
const RATE_LIMIT_MAX = 5;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env.FEEDBACK) {
      return json({ error: 'feedback unavailable' }, 503);
    }

    let body;
    try {
      body = await readBody(request);
    } catch {
      return json({ error: 'invalid request' }, 400);
    }

    if (body.honeypot.trim()) {
      // Bot. Silently accept without storing.
      return json({ ok: true });
    }

    const rateLimit = await checkRateLimit(request, env);
    if (!rateLimit.ok) {
      return json({ error: 'too many requests' }, 429, {
        'retry-after': String(rateLimit.retryAfter),
      });
    }

    const message = body.message.trim();
    if (!message) return json({ error: 'empty message' }, 400);
    if (message.length > MAX_LENGTH) return json({ error: 'message too long' }, 400);

    const ts = new Date().toISOString();
    const id = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const entry = {
      id,
      ts,
      message,
      country: (request as { cf?: { country?: string } }).cf?.country ?? '',
    };

    await env.FEEDBACK.put(`fb:${id}`, JSON.stringify(entry), { expirationTtl: TTL_SECONDS });
    return json({ ok: true });
  } catch (e) {
    console.error('Feedback submission failed', e);
    return json({ error: 'feedback unavailable' }, 500);
  }
};

async function readBody(request: Request): Promise<{ message: string; honeypot: string }> {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = (await request.json()) as { message?: string; _gotcha?: string };
    return {
      message: body?.message ?? '',
      honeypot: body?._gotcha ?? '',
    };
  }

  const form = await request.formData();
  return {
    message: String(form.get('message') ?? ''),
    honeypot: String(form.get('_gotcha') ?? ''),
  };
}

async function checkRateLimit(
  request: Request,
  env: Env,
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  const identity = request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-forwarded-for')
    ?? request.headers.get('user-agent')
    ?? 'unknown';
  const key = `feedback-rate:${await sha256(identity)}`;
  const current = Number(await env.FEEDBACK.get(key) ?? '0');

  if (current >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfter: RATE_LIMIT_SECONDS };
  }

  await env.FEEDBACK.put(key, String(current + 1), { expirationTtl: RATE_LIMIT_SECONDS });
  return { ok: true };
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}
