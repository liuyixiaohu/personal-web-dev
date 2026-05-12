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

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let message = '';
    let honeypot = '';

    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { message?: string; _gotcha?: string };
      message = body?.message ?? '';
      honeypot = body?._gotcha ?? '';
    } else {
      const form = await request.formData();
      message = String(form.get('message') ?? '');
      honeypot = String(form.get('_gotcha') ?? '');
    }

    if (honeypot.trim()) {
      // Bot. Silently accept without storing.
      return json({ ok: true });
    }

    message = message.trim();
    if (!message) return json({ error: 'empty message' }, 400);
    if (message.length > MAX_LENGTH) return json({ error: 'message too long' }, 400);

    const ts = new Date().toISOString();
    const id = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const entry = {
      id,
      ts,
      message,
      ua: request.headers.get('user-agent') ?? '',
      ip: request.headers.get('cf-connecting-ip') ?? '',
      country: (request as { cf?: { country?: string } }).cf?.country ?? '',
      referer: request.headers.get('referer') ?? '',
    };

    await env.FEEDBACK.put(`fb:${id}`, JSON.stringify(entry), { expirationTtl: TTL_SECONDS });
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
