// GET /console/api/feedback — gated by Cloudflare Access via the /console/*
// path policy. Lists feedback entries from the FEEDBACK KV namespace and
// returns them sorted newest-first.

interface Env {
  FEEDBACK: KVNamespace;
}

interface Entry {
  id: string;
  ts: string;
  message: string;
  ua: string;
  ip: string;
  country: string;
  referer: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const list = await env.FEEDBACK.list({ prefix: 'fb:', limit: 1000 });
    const entries = await Promise.all(
      list.keys.map(async (k) => {
        const value = await env.FEEDBACK.get(k.name);
        if (!value) return null;
        try {
          return JSON.parse(value) as Entry;
        } catch {
          return null;
        }
      }),
    );

    const filtered = entries
      .filter((e): e is Entry => e !== null)
      .sort((a, b) => b.ts.localeCompare(a.ts));

    return new Response(
      JSON.stringify({ count: filtered.length, entries: filtered }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
};
