import { json } from '@sveltejs/kit';
import { validateEmail, generateResetToken, hashToken, resetTokenExpiresAt } from '$lib/server/auth.js';
import { getUserByEmail, createPasswordResetToken, logAuthEvent } from '$lib/server/db.js';
import { sendPasswordResetEmail } from '$lib/server/email.js';

// Per-email rate limit: max 3 requests per 10 minutes
const resetRateMap = new Map();
const RESET_WINDOW_MS = 10 * 60 * 1000;
const RESET_MAX = 3;

function checkResetRateLimit(key) {
  const now = Date.now();
  let entry = resetRateMap.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RESET_WINDOW_MS };
  }
  entry.count++;
  resetRateMap.set(key, entry);
  return entry.count <= RESET_MAX;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of resetRateMap) {
    if (now > v.resetAt) resetRateMap.delete(k);
  }
}, 10 * 60 * 1000);

// Always return the same message so we don't reveal email existence
const SUCCESS_MSG = "If that email is registered, you'll receive a reset link shortly.";

export async function POST({ request }) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

  const { email } = body;
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';

  const emailErr = validateEmail(email);
  if (emailErr) return json({ error: emailErr }, { status: 400 });

  const normalized = email.trim().toLowerCase();

  // Rate limit by email address (normalized) to slow brute-force token fishing
  if (!checkResetRateLimit(normalized)) {
    return json({ ok: true, message: SUCCESS_MSG });
  }

  const user = getUserByEmail(normalized);

  if (!user) {
    logAuthEvent('password_reset_unknown', { email: normalized, ip });
    return json({ ok: true, message: SUCCESS_MSG });
  }

  const rawToken = generateResetToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = resetTokenExpiresAt();

  createPasswordResetToken(tokenHash, user.id, expiresAt, ip);
  logAuthEvent('password_reset_requested', { userId: user.id, email: normalized, ip });

  const origin = request.headers.get('origin') ?? request.headers.get('host') ?? '';
  const resetUrl = `${origin}/auth?token=${rawToken}`;

  sendPasswordResetEmail(normalized, resetUrl);

  return json({ ok: true, message: SUCCESS_MSG });
}
