/* ── Global daily demo cap ──
 * Bounds worst-case Anthropic spend on a public demo regardless of IP rotation
 * (the per-IP limiter below does not). In-memory, so it resets on restart —
 * fine for the single-instance demo deployment. Set DEMO_DAILY_LIMIT=0 to
 * disable (e.g. for a private/self-hosted instance with its own key). */
const DAY_MS = 24 * 60 * 60 * 1000;
const DEMO_DAILY_LIMIT = Number.parseInt(process.env.DEMO_DAILY_LIMIT ?? '300', 10);
const BILLABLE_ENDPOINTS = new Set(['generate', 'clarify', 'simulate']);
const demoUsage = { count: 0, resetAt: Date.now() + DAY_MS };

function checkDailyCap() {
  if (!Number.isFinite(DEMO_DAILY_LIMIT) || DEMO_DAILY_LIMIT <= 0) return { ok: true };
  const now = Date.now();
  if (now > demoUsage.resetAt) {
    demoUsage.count = 0;
    demoUsage.resetAt = now + DAY_MS;
  }
  demoUsage.count++;
  return { ok: demoUsage.count <= DEMO_DAILY_LIMIT, reset: Math.ceil(demoUsage.resetAt / 1000) };
}

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

    if (BILLABLE_ENDPOINTS.has(endpointType)) {
      const cap = checkDailyCap();
      if (!cap.ok) {
        return new Response(JSON.stringify({
          error: 'The shared demo has reached its limit for today. Please try again tomorrow, or run your own instance with an Anthropic API key.',
          retryAfter: Math.max(cap.reset - Math.ceil(Date.now() / 1000), 0)
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'RateLimit-Reset': String(cap.reset) }
        });
      }
    }

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
