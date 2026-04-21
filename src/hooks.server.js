import { SESSION_COOKIE, deriveCsrfToken } from '$lib/server/auth.js';
import { getSession, getUserById } from '$lib/server/db.js';

// Routes that require an authenticated session
const PROTECTED_PREFIXES = [
  '/api/generate', '/api/clarify', '/api/simulate', '/api/key',
  '/api/user', '/api/projects', '/api/folders',
];
// Routes that are part of auth itself — never apply session guard here
const AUTH_PREFIXES = ['/api/auth/'];

/* ── In-memory rate limiter ── */
const rateLimitMap = new Map();
const WINDOW_MS = 60 * 1000;

// Different limits for different endpoints
const RATE_LIMITS = {
  'generate': { limit: 20, burst: 5 },  // Most expensive
  'clarify': { limit: 30, burst: 10 },  // Cheaper
  'simulate': { limit: 10, burst: 3 },  // External API dependency
  'key': { limit: 5, burst: 2 },        // Admin operations
  'auth': { limit: 30, burst: 10 },     // Auth endpoints
  'default': { limit: 30, burst: 10 }   // Everything else
};

function getEndpointType(path) {
  if (path.includes('/api/generate')) return 'generate';
  if (path.includes('/api/clarify')) return 'clarify';
  if (path.includes('/api/simulate')) return 'simulate';
  if (path.includes('/api/key')) return 'key';
  if (path.includes('/api/auth/')) return 'auth';
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
      burstResetAt: now + 10000 // 10 second burst window
    };
  }

  // Check burst limit first
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

// Clean up stale entries every 5 minutes
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

  // ── Session guard on protected API routes ────────────────────────────────
  const isProtected = PROTECTED_PREFIXES.some(p => path.startsWith(p));
  const isAuthRoute  = AUTH_PREFIXES.some(p => path.startsWith(p));

  if (isProtected && !isAuthRoute) {
    const token = event.cookies.get(SESSION_COOKIE);
    if (!token) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const session = getSession(token);
    if (!session) {
      event.cookies.delete(SESSION_COOKIE, { path: '/' });
      return new Response(JSON.stringify({ error: 'Session expired — please log in again' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // CSRF check for mutating requests
    const method = event.request.method;
    if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      const csrfHeader = event.request.headers.get('x-csrf-token');
      const expected = deriveCsrfToken(token);
      if (csrfHeader !== expected) {
        return new Response(JSON.stringify({ error: 'Invalid CSRF token' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    event.locals.session = session;

    // Optional verification gate — set REQUIRE_EMAIL_VERIFICATION=true to enable
    if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
      const user = getUserById(session.user_id);
      if (!user?.email_verified_at) {
        return new Response(JSON.stringify({ error: 'Please verify your email address to use this feature' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }

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

    // Rate limiting — use session user ID for authenticated requests, IP for anonymous
    const endpointType = getEndpointType(path);
    const userId = event.locals.session?.user_id;
    const identifier = userId
      ? `user:${userId}:${endpointType}`
      : `ip:${event.getClientAddress()}:${endpointType}`;

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

  // Security headers on all responses
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
