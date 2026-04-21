import { json } from '@sveltejs/kit';
import {
  validateEmail, validatePassword, hashPassword,
  generateSessionToken, sessionExpiresAt, deriveCsrfToken,
  SESSION_COOKIE, sessionCookieOptions,
  generateVerificationToken, verificationTokenExpiresAt, hashToken,
} from '$lib/server/auth.js';
import { getUserByEmail, createUser, createSession, logAuthEvent, createEmailVerificationToken } from '$lib/server/db.js';
import { sendVerificationEmail } from '$lib/server/email.js';

export async function POST({ request, cookies }) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

  const { email, password } = body;
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const ua = request.headers.get('user-agent') ?? '';

  const emailErr = validateEmail(email);
  if (emailErr) return json({ error: emailErr }, { status: 400 });

  const pwErr = validatePassword(password);
  if (pwErr) return json({ error: pwErr }, { status: 400 });

  if (getUserByEmail(email)) {
    // Deliberately vague + delayed to resist user-enumeration
    await new Promise(r => setTimeout(r, 150 + Math.random() * 100));
    logAuthEvent('register_duplicate', { email, ip, userAgent: ua });
    return json({ error: 'An account with that email already exists' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = createUser(email, passwordHash);

  const token = generateSessionToken();
  createSession(token, user.id, sessionExpiresAt(), ip, ua);
  logAuthEvent('register', { userId: user.id, email: user.email, ip, userAgent: ua });

  const verifyRaw = generateVerificationToken();
  createEmailVerificationToken(hashToken(verifyRaw), user.id, verificationTokenExpiresAt());
  const verifyUrl = `${new URL(request.url).origin}/auth?verify=${verifyRaw}`;
  sendVerificationEmail(user.email, verifyUrl);

  const secure = request.url.startsWith('https');
  cookies.set(SESSION_COOKIE, token, sessionCookieOptions(secure));

  return json({ ok: true, user: { id: user.id, email: user.email }, csrfToken: deriveCsrfToken(token), needsVerification: true });
}
