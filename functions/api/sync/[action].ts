// Cloudflare Pages Function: POST /api/sync/{create,pull,push,rotate}
//
// A sync code is a bearer secret that lets its holder read and change one
// settings record. Only the SHA-256 hash of the code is stored, so a dump of
// the KV namespace does not reveal any code. Codes travel in the JSON body,
// never in the URL, so they do not show up in access logs.

interface Env {
  EVENTS_SYNC: KVNamespace;
}

// 32 symbols without 0, 1, i, l, o. 16 symbols is 80 bits of entropy, so
// guessing a live code is not practical.
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const CODE_LENGTH = 16;
// Keep this in step with the client limit in src/components/events/syncUtils.ts.
const MAX_BODY_BYTES = 4 * 1024 * 1024;
const MAX_LIST = 500;
const MAX_TEXT = 300;
const MAX_DECISIONS = 2000;

const EVENT_FIELDS = [
  'api_id',
  'name',
  'url',
  'start_at',
  'end_at',
  'timezone',
  'location',
  'location_type',
  'calendar_name',
  'host_names',
  'guest_count',
  'is_free',
  'price_cents',
  'price_currency',
  'first_seen_at',
] as const;

interface SyncDecision {
  status: 'applied' | 'ignored';
  at: string;
  event: Record<string, unknown>;
}

interface SyncSettings {
  excludeKeywords: string[];
  selectedLocations: string[];
  selectedDays: number[];
  newOnly: boolean;
  decisions: Record<string, SyncDecision>;
}

interface StoredRecord {
  settings: SyncSettings;
  updated_at: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function generateCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  // 256 is a multiple of 32, so taking the remainder keeps the symbols uniform.
  let raw = '';
  for (const b of bytes) raw += ALPHABET[b % ALPHABET.length];
  return raw.match(/.{4}/g)!.join('-');
}

/** Accepts the code with or without hyphens or spaces, in any case. */
function normalizeCode(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const raw = input.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (raw.length !== CODE_LENGTH) return null;
  for (const ch of raw) if (!ALPHABET.includes(ch)) return null;
  return raw.match(/.{4}/g)!.join('-');
}

async function keyFor(code: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `sync:${hex}`;
}

function isStringList(v: unknown): v is string[] {
  return (
    Array.isArray(v) &&
    v.length <= MAX_LIST &&
    v.every((s) => typeof s === 'string' && s.length <= MAX_TEXT)
  );
}

/** Keep only known event fields, so the stored record stays small and predictable. */
function pickEvent(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const src = raw as Record<string, unknown>;
  if (typeof src.api_id !== 'string' || typeof src.name !== 'string') return null;
  const out: Record<string, unknown> = {};
  for (const key of EVENT_FIELDS) {
    const value = src[key];
    if (value === undefined) continue;
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      out[key] = value;
    } else if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
      out[key] = value;
    }
  }
  return out;
}

function parseSettings(v: unknown): SyncSettings | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  if (!isStringList(o.excludeKeywords) || !isStringList(o.selectedLocations)) return null;
  if (
    !Array.isArray(o.selectedDays) ||
    o.selectedDays.length > 7 ||
    !o.selectedDays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  ) {
    return null;
  }
  if (typeof o.newOnly !== 'boolean') return null;
  if (!o.decisions || typeof o.decisions !== 'object' || Array.isArray(o.decisions)) return null;

  const entries = Object.entries(o.decisions as Record<string, unknown>);
  if (entries.length > MAX_DECISIONS) return null;
  const decisions: Record<string, SyncDecision> = {};
  for (const [id, raw] of entries) {
    if (!raw || typeof raw !== 'object') return null;
    const d = raw as Record<string, unknown>;
    if (d.status !== 'applied' && d.status !== 'ignored') return null;
    if (typeof d.at !== 'string' || Number.isNaN(Date.parse(d.at))) return null;
    const event = pickEvent(d.event);
    if (!event || event.api_id !== id) return null;
    decisions[id] = { status: d.status, at: d.at, event };
  }

  return {
    excludeKeywords: o.excludeKeywords,
    selectedLocations: o.selectedLocations,
    selectedDays: o.selectedDays as number[],
    newOnly: o.newOnly,
    decisions,
  };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!env.EVENTS_SYNC) return json({ error: 'Sync storage is not configured' }, 503);

  // Read in bounded chunks, including when Content-Length is missing or incorrect.
  const reader = request.body?.getReader();
  if (!reader) return json({ error: 'Invalid request' }, 400);
  const decoder = new TextDecoder();
  let text = '';
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_BODY_BYTES) {
      await reader.cancel();
      return json({ error: 'Request is too large' }, 413);
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'Invalid request' }, 400);
  }

  const action = String(params.action ?? '');
  const now = new Date().toISOString();

  if (action === 'create') {
    const settings = parseSettings(body.settings);
    if (!settings) return json({ error: 'Invalid settings' }, 400);
    const code = generateCode();
    const record: StoredRecord = { settings, updated_at: now };
    await env.EVENTS_SYNC.put(await keyFor(code), JSON.stringify(record));
    return json({ code, updated_at: now });
  }

  const code = normalizeCode(body.code);
  if (!code) return json({ error: 'Invalid sync code' }, 400);
  const key = await keyFor(code);

  if (action === 'pull') {
    const raw = await env.EVENTS_SYNC.get(key);
    if (!raw) return json({ error: 'Sync code not found' }, 404);
    return json(JSON.parse(raw) as StoredRecord);
  }

  if (action === 'push') {
    const settings = parseSettings(body.settings);
    if (!settings) return json({ error: 'Invalid settings' }, 400);
    if (!(await env.EVENTS_SYNC.get(key))) return json({ error: 'Sync code not found' }, 404);
    const record: StoredRecord = { settings, updated_at: now };
    await env.EVENTS_SYNC.put(key, JSON.stringify(record));
    return json({ updated_at: now });
  }

  if (action === 'rotate') {
    const raw = await env.EVENTS_SYNC.get(key);
    if (!raw) return json({ error: 'Sync code not found' }, 404);
    const next = generateCode();
    await env.EVENTS_SYNC.put(await keyFor(next), raw);
    await env.EVENTS_SYNC.delete(key);
    return json({ code: next, updated_at: now });
  }

  return json({ error: 'Not found' }, 404);
};
