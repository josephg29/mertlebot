import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateResetToken, hashToken, resetTokenExpiresAt } from '../lib/server/auth.js';

// ── Token generation ─────────────────────────────────────────────────────────

describe('generateResetToken', () => {
  it('returns a 64-char hex string', () => {
    const token = generateResetToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 20 }, generateResetToken));
    expect(tokens.size).toBe(20);
  });
});

describe('hashToken', () => {
  it('returns a 64-char hex string (SHA-256)', () => {
    expect(hashToken('abc')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for the same input', () => {
    expect(hashToken('stable')).toBe(hashToken('stable'));
  });

  it('differs for different inputs', () => {
    expect(hashToken('a')).not.toBe(hashToken('b'));
  });

  it('raw token never equals its hash', () => {
    const raw = generateResetToken();
    expect(hashToken(raw)).not.toBe(raw);
  });
});

describe('resetTokenExpiresAt', () => {
  it('returns a timestamp roughly 1 hour in the future', () => {
    const now = Date.now();
    const exp = resetTokenExpiresAt();
    const oneHour = 60 * 60 * 1000;
    expect(exp).toBeGreaterThan(now + oneHour - 500);
    expect(exp).toBeLessThan(now + oneHour + 500);
  });
});

// ── DB helpers — tested with a real in-memory SQLite DB ──────────────────────

describe('password reset DB helpers', () => {
  let createUser, createPasswordResetToken, getPasswordResetToken,
      consumePasswordResetToken, updateUserPassword, getUserByEmail;

  beforeEach(async () => {
    // Reset module state so each test gets a fresh in-memory DB
    vi.resetModules();
    process.env.DATABASE_PATH = ':memory:';

    const db = await import('../lib/server/db.js');
    createUser = db.createUser;
    createPasswordResetToken = db.createPasswordResetToken;
    getPasswordResetToken = db.getPasswordResetToken;
    consumePasswordResetToken = db.consumePasswordResetToken;
    updateUserPassword = db.updateUserPassword;
    getUserByEmail = db.getUserByEmail;
  });

  function makeUser() {
    return createUser('reset@example.com', '$2a$12$fakehashfortest');
  }

  it('stores a token and retrieves it before expiry', () => {
    const user = makeUser();
    const hash = hashToken('raw-token-abc');
    const expiresAt = Date.now() + 60_000;
    createPasswordResetToken(hash, user.id, expiresAt);
    const record = getPasswordResetToken(hash);
    expect(record).not.toBeNull();
    expect(record.user_id).toBe(user.id);
    expect(record.used_at).toBeNull();
  });

  it('returns null for an expired token', () => {
    const user = makeUser();
    const hash = hashToken('expired-token');
    createPasswordResetToken(hash, user.id, Date.now() - 1);
    expect(getPasswordResetToken(hash)).toBeNull();
  });

  it('returns null after the token is consumed', () => {
    const user = makeUser();
    const hash = hashToken('consume-me');
    createPasswordResetToken(hash, user.id, Date.now() + 60_000);
    consumePasswordResetToken(hash);
    expect(getPasswordResetToken(hash)).toBeNull();
  });

  it('invalidates prior tokens when a new one is created', () => {
    const user = makeUser();
    const hash1 = hashToken('old-token');
    const hash2 = hashToken('new-token');
    createPasswordResetToken(hash1, user.id, Date.now() + 60_000);
    createPasswordResetToken(hash2, user.id, Date.now() + 60_000);
    expect(getPasswordResetToken(hash1)).toBeNull();
    expect(getPasswordResetToken(hash2)).not.toBeNull();
  });

  it('updateUserPassword changes the stored hash and resets lockout', () => {
    const user = makeUser();
    updateUserPassword(user.id, '$2a$12$newhashabcdefghij');
    const updated = getUserByEmail('reset@example.com');
    expect(updated.password_hash).toBe('$2a$12$newhashabcdefghij');
    expect(updated.failed_attempts).toBe(0);
    expect(updated.locked_until).toBe(0);
  });
});
