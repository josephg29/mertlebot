import { describe, it, expect } from 'vitest';
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
