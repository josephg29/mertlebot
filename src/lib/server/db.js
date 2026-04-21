import Database from 'better-sqlite3';
import { mkdirSync, existsSync, readFileSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';

const DB_PATH = process.env.DATABASE_PATH
  || join(process.env.DATA_DIR || process.cwd(), 'data', 'app.db');

const RETAIN_DAYS = parseInt(process.env.BACKUP_RETAIN_DAYS ?? '7', 10);

let _db = null;

export function getDb() {
  if (_db) return _db;

  mkdirSync(dirname(DB_PATH), { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _db.pragma('busy_timeout = 5000');
  _db.pragma('synchronous = NORMAL');

  runMigrations(_db);
  migrateFromConfigJson(_db);
  scheduleBackup();
  registerShutdownHooks();

  return _db;
}

// ── Migrations ─────────────────────────────────────────────────────────────

const MIGRATIONS = [
  {
    name: '001_initial',
    sql: `
      CREATE TABLE IF NOT EXISTS config (
        key        TEXT PRIMARY KEY,
        value      TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    name: '002_auth',
    sql: `
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

      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_exp  ON sessions(expires_at);

      CREATE TABLE IF NOT EXISTS auth_log (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        event      TEXT    NOT NULL,
        user_id    TEXT,
        email      TEXT,
        ip         TEXT,
        user_agent TEXT,
        created_at INTEGER NOT NULL
      );
    `,
  },
  {
    name: '003_password_reset',
    sql: `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token_hash  TEXT    PRIMARY KEY,
        user_id     TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at  INTEGER NOT NULL,
        used_at     INTEGER,
        created_at  INTEGER NOT NULL,
        ip          TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_prt_user ON password_reset_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_prt_exp  ON password_reset_tokens(expires_at);
    `,
  },
  {
    name: '004_email_verification',
    sql: null,
    migrate(db) {
      db.exec(`ALTER TABLE users ADD COLUMN email_verified_at INTEGER`);
      db.exec(`
        CREATE TABLE IF NOT EXISTS email_verification_tokens (
          token_hash  TEXT    PRIMARY KEY,
          user_id     TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at  INTEGER NOT NULL,
          used_at     INTEGER,
          created_at  INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_evt_user ON email_verification_tokens(user_id);
        CREATE INDEX IF NOT EXISTS idx_evt_exp  ON email_verification_tokens(expires_at);
      `);
    },
  },
];

function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      name   TEXT    NOT NULL UNIQUE,
      run_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const applied = new Set(
    db.prepare('SELECT name FROM _migrations').all().map(r => r.name)
  );

  for (const m of MIGRATIONS) {
    if (applied.has(m.name)) continue;
    db.transaction(() => {
      if (m.migrate) {
        m.migrate(db);
      } else {
        db.exec(m.sql);
      }
      db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(m.name);
    })();
  }
}

// One-time migration from legacy config.json to SQLite
function migrateFromConfigJson(db) {
  const jsonPath = join(process.cwd(), 'config.json');
  if (!existsSync(jsonPath)) return;

  try {
    const cfg = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    if (cfg.apiKey) {
      db.prepare(`
        INSERT OR IGNORE INTO config (key, value) VALUES ('apiKey', ?)
      `).run(cfg.apiKey);
    }
  } catch {
    // ignore corrupt file
  }
}

// ── Session cleanup ─────────────────────────────────────────────────────────

let _cleanupScheduled = false;
function scheduleSessionCleanup() {
  if (_cleanupScheduled) return;
  _cleanupScheduled = true;
  setInterval(() => {
    try { getDb().prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now()); }
    catch { /* non-fatal */ }
  }, 60 * 60 * 1000);
}

// ── Daily backup ────────────────────────────────────────────────────────────

let _lastBackupAt = null;

async function runBackup() {
  try {
    const db = getDb();
    const backupDir = join(dirname(DB_PATH), 'backups');
    mkdirSync(backupDir, { recursive: true });

    const ts = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
    const dest = join(backupDir, `app_${ts}.db`);

    await db.backup(dest);

    // Verify the backup before keeping it
    const verify = new Database(dest, { readonly: true });
    const ok = verify.prepare('PRAGMA integrity_check').get()?.integrity_check === 'ok';
    verify.close();

    if (!ok) {
      unlinkSync(dest);
      return;
    }

    _lastBackupAt = Date.now();

    // Prune backups older than RETAIN_DAYS
    const cutoff = Date.now() - RETAIN_DAYS * 24 * 60 * 60 * 1000;
    readdirSync(backupDir)
      .filter(f => /^app_\d+\.db$/.test(f))
      .map(f => join(backupDir, f))
      .filter(p => statSync(p).mtimeMs < cutoff)
      .forEach(p => unlinkSync(p));
  } catch {
    // non-fatal — backup failures must not crash the app
  }
}

let _backupScheduled = false;
function scheduleBackup() {
  if (_backupScheduled) return;
  _backupScheduled = true;
  // First run 1 minute after startup so migrations settle, then every 24 hours
  setTimeout(runBackup, 60_000);
  setInterval(runBackup, 24 * 60 * 60 * 1000);
}

export function lastBackupAt() {
  return _lastBackupAt;
}

// ── Graceful shutdown ───────────────────────────────────────────────────────

let _shutdownRegistered = false;
function registerShutdownHooks() {
  if (_shutdownRegistered) return;
  _shutdownRegistered = true;

  function shutdown() {
    if (_db) {
      try {
        // Checkpoint WAL so the DB file is self-contained on next start
        _db.pragma('wal_checkpoint(TRUNCATE)');
        _db.close();
      } catch { /* ignore */ }
      _db = null;
    }
    process.exit(0);
  }

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

// ── Auth CRUD ───────────────────────────────────────────────────────────────

import { randomUUID } from 'crypto';

export function createUser(email, passwordHash) {
  const db = getDb();
  const id = randomUUID();
  const now = Date.now();
  db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)')
    .run(id, email.toLowerCase(), passwordHash, now);
  scheduleSessionCleanup();
  return { id, email: email.toLowerCase(), created_at: now };
}

export function getUserByEmail(email) {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) ?? null;
}

export function getUserById(id) {
  return getDb().prepare('SELECT id, email, created_at, email_verified_at FROM users WHERE id = ?').get(id) ?? null;
}

export function updateFailedAttempts(userId, attempts, lockedUntil = 0) {
  getDb().prepare('UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?')
    .run(attempts, lockedUntil, userId);
}

export function resetFailedAttempts(userId) {
  getDb().prepare('UPDATE users SET failed_attempts = 0, locked_until = 0 WHERE id = ?').run(userId);
}

export function createSession(token, userId, expiresAt, ip = null, userAgent = null) {
  getDb().prepare('INSERT INTO sessions (token, user_id, expires_at, created_at, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)')
    .run(token, userId, expiresAt, Date.now(), ip, userAgent);
}

export function getSession(token) {
  return getDb().prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > ?').get(token, Date.now()) ?? null;
}

export function deleteSession(token) {
  getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function logAuthEvent(event, { userId = null, email = null, ip = null, userAgent = null } = {}) {
  getDb().prepare('INSERT INTO auth_log (event, user_id, email, ip, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(event, userId, email, ip, userAgent, Date.now());
}

// ── Password reset ──────────────────────────────────────────────────────────

export function createPasswordResetToken(tokenHash, userId, expiresAt, ip = null) {
  const db = getDb();
  db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(userId);
  db.prepare('INSERT INTO password_reset_tokens (token_hash, user_id, expires_at, created_at, ip) VALUES (?, ?, ?, ?, ?)')
    .run(tokenHash, userId, expiresAt, Date.now(), ip);
}

export function getPasswordResetToken(tokenHash) {
  return getDb()
    .prepare('SELECT * FROM password_reset_tokens WHERE token_hash = ? AND expires_at > ? AND used_at IS NULL')
    .get(tokenHash, Date.now()) ?? null;
}

export function consumePasswordResetToken(tokenHash) {
  getDb().prepare('UPDATE password_reset_tokens SET used_at = ? WHERE token_hash = ?')
    .run(Date.now(), tokenHash);
}

export function updateUserPassword(userId, passwordHash) {
  getDb().prepare('UPDATE users SET password_hash = ?, failed_attempts = 0, locked_until = 0 WHERE id = ?')
    .run(passwordHash, userId);
}

// ── Email verification ──────────────────────────────────────────────────────

export function createEmailVerificationToken(tokenHash, userId, expiresAt) {
  const db = getDb();
  db.prepare('DELETE FROM email_verification_tokens WHERE user_id = ?').run(userId);
  db.prepare('INSERT INTO email_verification_tokens (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .run(tokenHash, userId, expiresAt, Date.now());
}

export function getEmailVerificationToken(tokenHash) {
  return getDb()
    .prepare('SELECT * FROM email_verification_tokens WHERE token_hash = ? AND expires_at > ? AND used_at IS NULL')
    .get(tokenHash, Date.now()) ?? null;
}

export function consumeEmailVerificationToken(tokenHash) {
  getDb().prepare('UPDATE email_verification_tokens SET used_at = ? WHERE token_hash = ?')
    .run(Date.now(), tokenHash);
}

export function markEmailVerified(userId) {
  getDb().prepare('UPDATE users SET email_verified_at = ? WHERE id = ?')
    .run(Date.now(), userId);
}

// ── Health ──────────────────────────────────────────────────────────────────

export function checkIntegrity() {
  try {
    const result = getDb().prepare('PRAGMA integrity_check').get();
    return result?.integrity_check === 'ok';
  } catch {
    return false;
  }
}

export function dbPath() {
  return DB_PATH;
}
