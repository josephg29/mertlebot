import bcrypt from 'bcryptjs';
import { randomBytes, createHmac } from 'crypto';

const SALT_ROUNDS = 12;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// Stable CSRF secret — rotate via env var in production
const CSRF_SECRET = process.env.CSRF_SECRET ?? 'mertle-csrf-dev-secret-change-in-prod';

export function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken() {
  return randomBytes(32).toString('hex');
}

/** Derive a CSRF token from the session token — no extra DB state needed. */
export function deriveCsrfToken(sessionToken) {
  return createHmac('sha256', CSRF_SECRET).update(sessionToken).digest('hex');
}

export function sessionExpiresAt() {
  return Date.now() + SESSION_TTL_MS;
}

export function isAccountLocked(user) {
  return user.locked_until > Date.now();
}

export function shouldLock(failedAttempts) {
  return failedAttempts >= MAX_FAILED_ATTEMPTS;
}

export function lockoutExpiry() {
  return Date.now() + LOCKOUT_MS;
}

/** Cookie options shared across auth endpoints. */
export const SESSION_COOKIE = 'mertle_session';

export function sessionCookieOptions(secure) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
    secure: !!secure,
  };
}

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return 'Email is required';
  const t = email.trim();
  if (t.length > 254) return 'Email is too long';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'Invalid email address';
  return null;
}

export function validatePassword(password) {
  if (!password || typeof password !== 'string') return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 128) return 'Password is too long';
  return null;
}

// Dummy hash used for constant-time comparison when user not found
export const DUMMY_HASH = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfNJ4tbGFW7ya';
