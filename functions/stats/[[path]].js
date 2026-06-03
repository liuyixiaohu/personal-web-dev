// First-party reverse proxy for Google Analytics (gtag.js).
//
// DNS-, extension-, and browser-level blockers reject the third-party domains
// googletagmanager.com / google-analytics.com outright (manifesting as
// ERR_BLOCKED_BY_ORB), which silently zeroes out first-party measurement.
// Serving both the loader script and the collect beacon from kunli.co keeps
// the site's own analytics working for those visitors.
//
// Routes (Cloudflare Pages Function, mounted at /stats/*):
//   GET  /stats/gtag/js   -> https://www.googletagmanager.com/gtag/js
//   *    /stats/g/collect -> https://www.google-analytics.com/g/collect
// The collect endpoint is reached because BaseLayout sets gtag's transport_url
// to `${origin}/stats`.

const GTM_ORIGIN = 'https://www.googletagmanager.com';
const GA_ORIGIN = 'https://www.google-analytics.com';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const rest = url.pathname.replace(/^\/stats/, '');

  let upstream;
  if (rest.startsWith('/gtag/js')) {
    upstream = GTM_ORIGIN + rest + url.search;
  } else if (
    rest.startsWith('/g/collect') ||
    rest.startsWith('/j/collect') ||
    rest === '/collect'
  ) {
    upstream = GA_ORIGIN + rest + url.search;
  } else {
    return new Response('Not found', { status: 404 });
  }

  // Build a clean header set. Replaying the raw browser/Cloudflare headers
  // (the inbound Host in particular) makes Google's frontend fail to route the
  // request and return a generic 404 — so forward only a minimal known-good set
  // and let fetch derive the correct Host from the upstream URL.
  const headers = new Headers();
  const forward = ['User-Agent', 'Accept-Language', 'Content-Type', 'Referer'];
  for (const name of forward) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Forward the visitor's real IP so GA geolocates them, not Cloudflare's edge.
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) headers.set('X-Forwarded-For', ip);

  // TEMP diagnostics: /stats/gtag/js?id=...&__debug=1 tries several fetch
  // strategies for gtag.js and probes the collect host. Removed before merge.
  if (url.searchParams.has('__debug')) {
    const id = url.searchParams.get('id') || 'G-KFH5JNT2RC';
    const TEST = GTM_ORIGIN + '/gtag/js?id=' + id;
    const browserUA = request.headers.get('User-Agent') || '';
    const variants = {
      bare: () => fetch(TEST),
      uaOnly: () => fetch(TEST, { headers: { 'User-Agent': browserUA, Accept: '*/*' } }),
      inherit: () => fetch(new Request(TEST, request)),
      cleanMinimal: () => fetch(TEST, { headers }),
    };
    const results = {};
    for (const [name, run] of Object.entries(variants)) {
      try {
        const r = await run();
        results[name] = { status: r.status, ct: r.headers.get('content-type') };
      } catch (e) {
        results[name] = { error: String(e) };
      }
    }
    let collect;
    try {
      const c = await fetch(GA_ORIGIN + '/g/collect?v=2&tid=' + id + '&cid=555.555&en=__probe', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
      });
      collect = { status: c.status };
    } catch (e) {
      collect = { error: String(e) };
    }
    return new Response(JSON.stringify({ TEST, variants: results, collect }, null, 2), {
      status: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }

  const isBodyless = request.method === 'GET' || request.method === 'HEAD';
  const upstreamResponse = await fetch(upstream, {
    method: request.method,
    headers,
    body: isBodyless ? undefined : await request.arrayBuffer(),
  });

  // Pass the response through; drop cookies and stale encoding/length headers
  // (fetch has already decoded the body for us).
  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete('set-cookie');
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');
  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}
