import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateEmail,
  validatePassword,
  hashPassword,
  verifyPassword,
  generateSessionToken,
  deriveCsrfToken,
  sessionExpiresAt,
  isAccountLocked,
  shouldLock,
  lockoutExpiry,
  DUMMY_HASH,
} from '../lib/server/auth.js';

// ── validateEmail ────────────────────────────────────────────────────────────

describe('validateEmail', () => {
  it('accepts a valid email', () => {
    expect(validateEmail('user@example.com')).toBeNull();
  });

  it('rejects missing email', () => {
    expect(validateEmail('')).toBeTruthy();
    expect(validateEmail(null)).toBeTruthy();
    expect(validateEmail(undefined)).toBeTruthy();
  });

  it('rejects email without @', () => {
    expect(validateEmail('notanemail')).toBeTruthy();
  });

  it('rejects email without domain', () => {
    expect(validateEmail('user@')).toBeTruthy();
  });

  it('rejects email over 254 chars', () => {
    const long = 'a'.repeat(250) + '@x.com';
    expect(validateEmail(long)).toBeTruthy();
  });

  it('rejects non-string value', () => {
    expect(validateEmail(42)).toBeTruthy();
  });
});

// ── validatePassword ─────────────────────────────────────────────────────────

describe('validatePassword', () => {
  it('accepts a valid password', () => {
    expect(validatePassword('securePw123')).toBeNull();
  });

  it('rejects missing password', () => {
    expect(validatePassword('')).toBeTruthy();
    expect(validatePassword(null)).toBeTruthy();
  });

  it('rejects password under 8 chars', () => {
    expect(validatePassword('short')).toBeTruthy();
  });

  it('rejects password over 128 chars', () => {
    expect(validatePassword('a'.repeat(129))).toBeTruthy();
  });

  it('accepts exactly 8 chars', () => {
    expect(validatePassword('abcdefgh')).toBeNull();
  });
});

// ── hashPassword / verifyPassword ────────────────────────────────────────────

describe('hashPassword / verifyPassword', () => {
  it('produces a bcrypt hash that verifies correctly', async () => {
    const hash = await hashPassword('mySecret99');
    expect(hash).toMatch(/^\$2[ab]\$/);
    expect(await verifyPassword('mySecret99', hash)).toBe(true);
  }, 15_000);

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('correct');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  }, 15_000);

  it('DUMMY_HASH is a valid bcrypt string', () => {
    expect(DUMMY_HASH).toMatch(/^\$2[ab]\$\d+\$/);
  });
});

// ── generateSessionToken ─────────────────────────────────────────────────────

describe('generateSessionToken', () => {
  it('returns a 64-char hex string', () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 20 }, generateSessionToken));
    expect(tokens.size).toBe(20);
  });
});

// ── deriveCsrfToken ──────────────────────────────────────────────────────────

describe('deriveCsrfToken', () => {
  it('returns a 64-char hex string', () => {
    const csrf = deriveCsrfToken('some-session-token');
    expect(csrf).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for the same input', () => {
    const t = 'stable-token';
    expect(deriveCsrfToken(t)).toBe(deriveCsrfToken(t));
  });

  it('differs for different session tokens', () => {
    expect(deriveCsrfToken('token-a')).not.toBe(deriveCsrfToken('token-b'));
  });
});

// ── Session timing helpers ───────────────────────────────────────────────────

describe('sessionExpiresAt', () => {
  it('returns a future timestamp roughly 30 days out', () => {
    const now = Date.now();
    const exp = sessionExpiresAt();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    expect(exp).toBeGreaterThan(now + thirtyDays - 1000);
    expect(exp).toBeLessThan(now + thirtyDays + 1000);
  });
});

describe('isAccountLocked', () => {
  it('returns true when locked_until is in the future', () => {
    expect(isAccountLocked({ locked_until: Date.now() + 60_000 })).toBe(true);
  });

  it('returns false when locked_until is in the past', () => {
    expect(isAccountLocked({ locked_until: Date.now() - 1 })).toBe(false);
  });

  it('returns false when locked_until is 0', () => {
    expect(isAccountLocked({ locked_until: 0 })).toBe(false);
  });
});

describe('shouldLock', () => {
  it('returns true at exactly 5 failed attempts', () => {
    expect(shouldLock(5)).toBe(true);
  });

  it('returns true above 5', () => {
    expect(shouldLock(10)).toBe(true);
  });

  it('returns false below 5', () => {
    expect(shouldLock(4)).toBe(false);
  });
});

describe('lockoutExpiry', () => {
  it('returns a timestamp roughly 15 minutes from now', () => {
    const now = Date.now();
    const exp = lockoutExpiry();
    const fifteenMin = 15 * 60 * 1000;
    expect(exp).toBeGreaterThan(now + fifteenMin - 500);
    expect(exp).toBeLessThan(now + fifteenMin + 500);
  });
});
