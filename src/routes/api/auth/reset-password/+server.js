import { json } from '@sveltejs/kit';
import {
  validatePassword, hashPassword,
  hashToken,
  generateSessionToken, sessionExpiresAt, deriveCsrfToken,
  SESSION_COOKIE, sessionCookieOptions,
} from '$lib/server/auth.js';
import {
  getPasswordResetToken, consumePasswordResetToken,
  updateUserPassword, getUserById, createSession, logAuthEvent,
} from '$lib/server/db.js';

export async function POST({ request, cookies }) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

  const { token, password } = body;
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const ua = request.headers.get('user-agent') ?? '';

  if (!token || typeof token !== 'string') {
    return json({ error: 'Reset token is required' }, { status: 400 });
  }

  const passwordErr = validatePassword(password);
  if (passwordErr) return json({ error: passwordErr }, { status: 400 });

  const tokenHash = hashToken(token);
  const record = getPasswordResetToken(tokenHash);

  if (!record) {
    return json({ error: 'This reset link is invalid or has expired' }, { status: 400 });
  }

  const user = getUserById(record.user_id);
  if (!user) {
    return json({ error: 'User not found' }, { status: 400 });
  }

  const newHash = await hashPassword(password);

  consumePasswordResetToken(tokenHash);
  updateUserPassword(record.user_id, newHash);
  logAuthEvent('password_reset_complete', { userId: record.user_id, email: user.email, ip, userAgent: ua });

  // Log the user in immediately after a successful reset
  const sessionToken = generateSessionToken();
  createSession(sessionToken, record.user_id, sessionExpiresAt(), ip, ua);

  const secure = request.url.startsWith('https');
  cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions(secure));

  return json({
    ok: true,
    user: { id: user.id, email: user.email },
    csrfToken: deriveCsrfToken(sessionToken),
  });
}
