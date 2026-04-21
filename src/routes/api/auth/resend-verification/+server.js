import { json } from '@sveltejs/kit';
import {
  generateVerificationToken,
  verificationTokenExpiresAt,
  hashToken,
  SESSION_COOKIE,
  deriveCsrfToken,
} from '$lib/server/auth.js';
import {
  createEmailVerificationToken,
  getUserById,
  logAuthEvent,
  getSession,
} from '$lib/server/db.js';
import { sendVerificationEmail } from '$lib/server/email.js';

// Per-user rate limit: max 3 resend requests per 10 minutes
const resendRateMap = new Map();
const RESEND_WINDOW_MS = 10 * 60 * 1000;
const RESEND_MAX = 3;

function checkResendRateLimit(userId) {
  const now = Date.now();
  let entry = resendRateMap.get(userId);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RESEND_WINDOW_MS };
  }
  entry.count++;
  resendRateMap.set(userId, entry);
  return entry.count <= RESEND_MAX;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of resendRateMap) {
    if (now > v.resetAt) resendRateMap.delete(k);
  }
}, RESEND_WINDOW_MS);

export async function POST({ request, cookies, url }) {
  const token = cookies.get(SESSION_COOKIE);
  if (!token) return json({ error: 'Authentication required' }, { status: 401 });

  const session = getSession(token);
  if (!session) return json({ error: 'Session expired' }, { status: 401 });

  const csrfHeader = request.headers.get('x-csrf-token');
  if (csrfHeader !== deriveCsrfToken(token)) {
    return json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const ua = request.headers.get('user-agent') ?? '';
  const user = getUserById(session.user_id);
  if (!user) return json({ error: 'User not found' }, { status: 404 });

  const genericMsg = "If your email is unverified, you'll receive a new link shortly.";
  if (user.email_verified_at) {
    return json({ message: genericMsg });
  }

  // Rate limit re-sends per user
  if (!checkResendRateLimit(user.id)) {
    return json({ message: genericMsg });
  }

  const raw = generateVerificationToken();
  const tokenHash = hashToken(raw);
  createEmailVerificationToken(tokenHash, user.id, verificationTokenExpiresAt());

  const verifyUrl = `${url.origin}/auth?verify=${raw}`;
  sendVerificationEmail(user.email, verifyUrl);

  logAuthEvent('verification_email_resent', { userId: user.id, email: user.email, ip, userAgent: ua });

  return json({ message: genericMsg });
}
