/* ── In-memory rate limiter (30 req / 60s per IP) ── */
const rateLimitMap = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 30;

function checkRateLimit(ip) {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
  }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return {
    ok: entry.count <= MAX_REQUESTS,
    remaining: Math.max(0, MAX_REQUESTS - entry.count),
    reset: Math.ceil(entry.resetAt / 1000),
  };
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

export async function handle({ event, resolve }) {
  const path = event.url.pathname;

  if (path.startsWith('/api/')) {
    // Same-origin CORS check
    const origin = event.request.headers.get('origin');
    const host = event.request.headers.get('host');
    if (origin && origin !== `http://${host}` && origin !== `https://${host}`) {
      return new Response(JSON.stringify({ error: 'Cross-origin requests are not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Rate limiting
    const ip = event.getClientAddress();
    const limit = checkRateLimit(ip);
    if (!limit.ok) {
      return new Response(JSON.stringify({ error: 'Too many requests — please wait a moment' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'RateLimit-Limit': String(MAX_REQUESTS),
          'RateLimit-Remaining': '0',
          'RateLimit-Reset': String(limit.reset),
        }
      });
    }
  }

  const response = await resolve(event);

  // Security headers on all responses
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "script-src 'self' 'unsafe-inline'; " +
    "connect-src 'self'; " +
    "frame-src https://wokwi.com; " +
    "img-src 'self' data:;"
  );
  response.headers.delete('x-powered-by');

  return response;
}
