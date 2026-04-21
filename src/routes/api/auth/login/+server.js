import { json } from '@sveltejs/kit';
import {
  validateEmail, verifyPassword, DUMMY_HASH,
  generateSessionToken, sessionExpiresAt, deriveCsrfToken,
  SESSION_COOKIE, sessionCookieOptions,
  isAccountLocked, shouldLock, lockoutExpiry,
} from '$lib/server/auth.js';
import {
  getUserByEmail, createSession, updateFailedAttempts, resetFailedAttempts, logAuthEvent,
} from '$lib/server/db.js';

export async function POST({ request, cookies }) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

  const { email, password } = body;
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const ua = request.headers.get('user-agent') ?? '';

  const emailErr = validateEmail(email);
  if (emailErr) return json({ error: emailErr }, { status: 400 });

  if (!password) return json({ error: 'Password is required' }, { status: 400 });

  const user = getUserByEmail(email);

  if (!user) {
    // Constant-time dummy compare to prevent user enumeration via timing
    await verifyPassword(password, DUMMY_HASH);
    logAuthEvent('login_unknown', { email, ip, userAgent: ua });
    return json({ error: 'Invalid email or password' }, { status: 401 });
  }

  if (isAccountLocked(user)) {
    const minutesLeft = Math.ceil((user.locked_until - Date.now()) / 60_000);
    logAuthEvent('login_locked', { userId: user.id, email, ip, userAgent: ua });
    return json({ error: `Account locked — try again in ${minutesLeft} minute(s)` }, { status: 429 });
  }

  const valid = await verifyPassword(password, user.password_hash);

  if (!valid) {
    const newAttempts = user.failed_attempts + 1;
    const lock = shouldLock(newAttempts);
    updateFailedAttempts(user.id, newAttempts, lock ? lockoutExpiry() : 0);
    logAuthEvent(lock ? 'account_locked' : 'login_failed', { userId: user.id, email, ip, userAgent: ua });

    if (lock) {
      return json({ error: 'Too many failed attempts — account locked for 15 minutes' }, { status: 429 });
    }
    const remaining = 5 - newAttempts;
    return json({ error: `Invalid email or password — ${remaining} attempt(s) remaining` }, { status: 401 });
  }

  resetFailedAttempts(user.id);

  const token = generateSessionToken();
  createSession(token, user.id, sessionExpiresAt(), ip, ua);
  logAuthEvent('login', { userId: user.id, email, ip, userAgent: ua });

  const secure = request.url.startsWith('https');
  cookies.set(SESSION_COOKIE, token, sessionCookieOptions(secure));

  return json({ ok: true, user: { id: user.id, email: user.email }, csrfToken: deriveCsrfToken(token) });
}
