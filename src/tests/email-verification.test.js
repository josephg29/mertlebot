import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateVerificationToken, verificationTokenExpiresAt, hashToken } from '../lib/server/auth.js';

describe('generateVerificationToken', () => {
  it('returns a 64-char hex string', () => {
    expect(generateVerificationToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 20 }, generateVerificationToken));
    expect(tokens.size).toBe(20);
  });
});

describe('verificationTokenExpiresAt', () => {
  it('returns a timestamp roughly 24 hours in the future', () => {
    const now = Date.now();
    const exp = verificationTokenExpiresAt();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    expect(exp).toBeGreaterThan(now + twentyFourHours - 500);
    expect(exp).toBeLessThan(now + twentyFourHours + 500);
  });
});

describe('email verification DB helpers', () => {
  let createUser, createEmailVerificationToken, getEmailVerificationToken,
      consumeEmailVerificationToken, markEmailVerified, getUserById;

  beforeEach(async () => {
    vi.resetModules();
    process.env.DATABASE_PATH = ':memory:';
    const db = await import('../lib/server/db.js');
    createUser = db.createUser;
    createEmailVerificationToken = db.createEmailVerificationToken;
    getEmailVerificationToken = db.getEmailVerificationToken;
    consumeEmailVerificationToken = db.consumeEmailVerificationToken;
    markEmailVerified = db.markEmailVerified;
    getUserById = db.getUserById;
  });

  function makeUser() {
    return createUser('verify@example.com', '$2a$12$fakehash');
  }

  it('stores a token and retrieves it before expiry', () => {
    const user = makeUser();
    const hash = hashToken('raw-verify-abc');
    createEmailVerificationToken(hash, user.id, Date.now() + 60_000);
    const record = getEmailVerificationToken(hash);
    expect(record).not.toBeNull();
    expect(record.user_id).toBe(user.id);
    expect(record.used_at).toBeNull();
  });

  it('returns null for an expired token', () => {
    const user = makeUser();
    const hash = hashToken('expired-verify');
    createEmailVerificationToken(hash, user.id, Date.now() - 1);
    expect(getEmailVerificationToken(hash)).toBeNull();
  });

  it('returns null after the token is consumed', () => {
    const user = makeUser();
    const hash = hashToken('consume-verify');
    createEmailVerificationToken(hash, user.id, Date.now() + 60_000);
    consumeEmailVerificationToken(hash);
    expect(getEmailVerificationToken(hash)).toBeNull();
  });

  it('invalidates prior tokens when a new one is issued', () => {
    const user = makeUser();
    const hash1 = hashToken('old-verify');
    const hash2 = hashToken('new-verify');
    createEmailVerificationToken(hash1, user.id, Date.now() + 60_000);
    createEmailVerificationToken(hash2, user.id, Date.now() + 60_000);
    expect(getEmailVerificationToken(hash1)).toBeNull();
    expect(getEmailVerificationToken(hash2)).not.toBeNull();
  });

  it('markEmailVerified sets email_verified_at', () => {
    const user = makeUser();
    expect(getUserById(user.id).email_verified_at).toBeNull();
    markEmailVerified(user.id);
    const updated = getUserById(user.id);
    expect(updated.email_verified_at).toBeGreaterThan(0);
  });

  it('getUserById returns email_verified_at field', () => {
    const user = makeUser();
    const fetched = getUserById(user.id);
    expect(fetched).toHaveProperty('email_verified_at');
  });
});
