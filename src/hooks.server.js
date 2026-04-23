/* ── In-memory rate limiter ── */
const rateLimitMap = new Map();
const WINDOW_MS = 60 * 1000;

const RATE_LIMITS = {
  'generate': { limit: 20, burst: 5 },
  'clarify': { limit: 30, burst: 10 },
  'simulate': { limit: 10, burst: 3 },
  'key': { limit: 5, burst: 2 },
  'default': { limit: 30, burst: 10 }
};

function getEndpointType(path) {
  if (path.includes('/api/generate')) return 'generate';
  if (path.includes('/api/clarify')) return 'clarify';
  if (path.includes('/api/simulate')) return 'simulate';
  if (path.includes('/api/key')) return 'key';
  return 'default';
}

function checkRateLimit(identifier, endpointType) {
  const now = Date.now();
  const limits = RATE_LIMITS[endpointType] || RATE_LIMITS.default;

  let entry = rateLimitMap.get(identifier);
  if (!entry || now > entry.resetAt) {
    entry = {
      count: 0,
      burstCount: 0,
      resetAt: now + WINDOW_MS,
      burstResetAt: now + 10000
    };
  }

  if (now > entry.burstResetAt) {
    entry.burstCount = 0;
    entry.burstResetAt = now + 10000;
  }

  entry.count++;
  entry.burstCount++;

  rateLimitMap.set(identifier, entry);

  const burstOk = entry.burstCount <= limits.burst;
  const windowOk = entry.count <= limits.limit;

  return {
    ok: burstOk && windowOk,
    remaining: Math.max(0, limits.limit - entry.count),
    reset: Math.ceil(entry.resetAt / 1000),
    burstRemaining: Math.max(0, limits.burst - entry.burstCount),
    burstReset: Math.ceil(entry.burstResetAt / 1000)
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [identifier, entry] of rateLimitMap) {
    if (now > entry.resetAt && now > entry.burstResetAt) {
      rateLimitMap.delete(identifier);
    }
  }
}, 5 * 60 * 1000);

export async function handle({ event, resolve }) {
  const path = event.url.pathname;

  if (path.startsWith('/api/')) {
    const origin = event.request.headers.get('origin');
    const host = event.request.headers.get('host');
    if (origin && origin !== `http://${host}` && origin !== `https://${host}`) {
      return new Response(JSON.stringify({ error: 'Cross-origin requests are not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const endpointType = getEndpointType(path);
    const identifier = `ip:${event.getClientAddress()}:${endpointType}`;

    const limit = checkRateLimit(identifier, endpointType);
    if (!limit.ok) {
      return new Response(JSON.stringify({
        error: 'Too many requests — please wait a moment',
        retryAfter: Math.max(limit.reset - Math.ceil(Date.now() / 1000), limit.burstReset - Math.ceil(Date.now() / 1000))
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'RateLimit-Limit': String(RATE_LIMITS[endpointType]?.limit || 30),
          'RateLimit-Remaining': '0',
          'RateLimit-Reset': String(limit.reset),
          'RateLimit-Burst-Remaining': '0',
          'RateLimit-Burst-Reset': String(limit.burstReset)
        }
      });
    }
  }

  const response = await resolve(event);

  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "script-src 'self' 'unsafe-inline'; " +
    "connect-src 'self'; " +
    "frame-src https://wokwi.com; " +
    "img-src 'self' data: https:;"
  );
  response.headers.delete('x-powered-by');

  return response;
}
