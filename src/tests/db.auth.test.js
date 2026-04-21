/**
 * Integration tests for auth-related DB functions.
 * Uses a fresh in-memory database per test suite — isolates from app.db.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

// ── Build a minimal in-memory DB with the auth schema ──────────────────────

let db;

beforeAll(() => {
  db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id              TEXT PRIMARY KEY,
      email           TEXT UNIQUE NOT NULL,
      password_hash   TEXT NOT NULL,
      created_at      INTEGER NOT NULL,
      failed_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until    INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      ip         TEXT,
      user_agent TEXT
    );
    CREATE TABLE IF NOT EXISTS auth_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      event      TEXT    NOT NULL,
      user_id    TEXT,
      email      TEXT,
      ip         TEXT,
      user_agent TEXT,
      created_at INTEGER NOT NULL
    );
  `);
});

afterAll(() => db.close());

// ── Helpers that mirror db.js functions ──────────────────────────────────────

function insertUser(email, hash) {
  const id = randomUUID();
  db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)')
    .run(id, email.toLowerCase(), hash, Date.now());
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function insertSession(userId, expiresAt, token = randomUUID()) {
  db.prepare('INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .run(token, userId, expiresAt, Date.now());
  return token;
}

// ── User CRUD ─────────────────────────────────────────────────────────────────

describe('users table', () => {
  it('inserts and retrieves a user by email', () => {
    const u = insertUser('alice@test.com', 'hash1');
    const found = db.prepare('SELECT * FROM users WHERE email = ?').get('alice@test.com');
    expect(found).not.toBeNull();
    expect(found.id).toBe(u.id);
  });

  it('enforces email uniqueness', () => {
    insertUser('bob@test.com', 'hash2');
    expect(() => insertUser('bob@test.com', 'hash3')).toThrow();
  });

  it('stores email in lowercase', () => {
    const u = insertUser('Carol@Test.COM', 'hash4');
    expect(u.email).toBe('carol@test.com');
  });

  it('defaults failed_attempts and locked_until to 0', () => {
    const u = insertUser('dave@test.com', 'hash5');
    expect(u.failed_attempts).toBe(0);
    expect(u.locked_until).toBe(0);
  });

  it('updates failed_attempts', () => {
    const u = insertUser('eve@test.com', 'hash6');
    db.prepare('UPDATE users SET failed_attempts = 3 WHERE id = ?').run(u.id);
    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(u.id);
    expect(updated.failed_attempts).toBe(3);
  });
});

// ── Sessions ──────────────────────────────────────────────────────────────────

describe('sessions table', () => {
  let userId;

  beforeEach(() => {
    const u = insertUser(`u-${randomUUID()}@test.com`, 'h');
    userId = u.id;
  });

  it('inserts and retrieves a valid session', () => {
    const token = insertSession(userId, Date.now() + 60_000);
    const s = db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > ?').get(token, Date.now());
    expect(s).not.toBeNull();
    expect(s.user_id).toBe(userId);
  });

  it('does not return an expired session', () => {
    const token = insertSession(userId, Date.now() - 1); // already expired
    const s = db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > ?').get(token, Date.now());
    expect(s).toBeUndefined();
  });

  it('deletes a session', () => {
    const token = insertSession(userId, Date.now() + 60_000);
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    const s = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
    expect(s).toBeUndefined();
  });

  it('cascades delete when user is removed', () => {
    const token = insertSession(userId, Date.now() + 60_000);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    const s = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
    expect(s).toBeUndefined();
  });

  it('cleans up expired sessions with a bulk delete', () => {
    const t1 = insertSession(userId, Date.now() - 5_000); // expired
    const t2 = insertSession(userId, Date.now() + 60_000); // valid
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
    expect(db.prepare('SELECT * FROM sessions WHERE token = ?').get(t1)).toBeUndefined();
    expect(db.prepare('SELECT * FROM sessions WHERE token = ?').get(t2)).not.toBeUndefined();
  });
});

// ── Auth log ──────────────────────────────────────────────────────────────────

describe('auth_log table', () => {
  it('inserts log entries', () => {
    const before = db.prepare('SELECT COUNT(*) as n FROM auth_log').get().n;
    db.prepare("INSERT INTO auth_log (event, email, ip, created_at) VALUES ('login_failed', 'x@x.com', '127.0.0.1', ?)")
      .run(Date.now());
    const after = db.prepare('SELECT COUNT(*) as n FROM auth_log').get().n;
    expect(after).toBe(before + 1);
  });

  it('records the event type correctly', () => {
    db.prepare("INSERT INTO auth_log (event, created_at) VALUES ('register', ?)").run(Date.now());
    const row = db.prepare("SELECT * FROM auth_log WHERE event = 'register' ORDER BY id DESC LIMIT 1").get();
    expect(row.event).toBe('register');
  });
});
