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

  const headers = new Headers(request.headers);
  // Forward the visitor's real IP so GA geolocates them, not Cloudflare's edge.
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) headers.set('X-Forwarded-For', ip);
  // Strip headers that should not be replayed to the upstream origin.
  headers.delete('host');
  headers.delete('cookie');

  const isBodyless = request.method === 'GET' || request.method === 'HEAD';
  const upstreamResponse = await fetch(upstream, {
    method: request.method,
    headers,
    body: isBodyless ? undefined : await request.arrayBuffer(),
  });

  // Pass the response through; drop any cookies the upstream tries to set.
  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete('set-cookie');
  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}
