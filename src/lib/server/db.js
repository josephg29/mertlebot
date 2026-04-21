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
  {
    name: '005_user_profile',
    migrate(db) {
      db.exec(`ALTER TABLE users ADD COLUMN display_name TEXT`);
      db.exec(`ALTER TABLE users ADD COLUMN avatar_url TEXT`);
      db.exec(`ALTER TABLE users ADD COLUMN bio TEXT`);
      db.exec(`ALTER TABLE users ADD COLUMN notification_prefs TEXT NOT NULL DEFAULT '{}'`);
      db.exec(`ALTER TABLE users ADD COLUMN privacy_settings TEXT NOT NULL DEFAULT '{}'`);
    },
  },
  {
    name: '006_projects',
    sql: `
      CREATE TABLE IF NOT EXISTS folders (
        id         TEXT    PRIMARY KEY,
        user_id    TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name       TEXT    NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id);

      CREATE TABLE IF NOT EXISTS projects (
        id         TEXT    PRIMARY KEY,
        user_id    TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        folder_id  TEXT    REFERENCES folders(id) ON DELETE SET NULL,
        title      TEXT    NOT NULL DEFAULT '',
        prompt     TEXT    NOT NULL DEFAULT '',
        skill      TEXT    NOT NULL DEFAULT 'MONKEY',
        guide      TEXT    NOT NULL DEFAULT '',
        chat_html  TEXT    NOT NULL DEFAULT '',
        tags       TEXT    NOT NULL DEFAULT '[]',
        version    INTEGER NOT NULL DEFAULT 1,
        client_ts  INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_projects_user    ON projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at);

      CREATE TABLE IF NOT EXISTS project_versions (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        guide      TEXT    NOT NULL,
        version    INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_pv_project ON project_versions(project_id);
    `,
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

// ── User profile ─────────────────────────────────────────────────────────────

export function getUserProfile(id) {
  return getDb().prepare(
    `SELECT id, email, display_name, avatar_url, bio,
            notification_prefs, privacy_settings, created_at, email_verified_at
     FROM users WHERE id = ?`
  ).get(id) ?? null;
}

export function getUserForAuth(id) {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) ?? null;
}

export function updateUserProfile(id, { display_name, avatar_url, bio }) {
  getDb().prepare(
    'UPDATE users SET display_name = ?, avatar_url = ?, bio = ? WHERE id = ?'
  ).run(display_name ?? null, avatar_url ?? null, bio ?? null, id);
}

export function updateNotificationPrefs(id, prefs) {
  getDb().prepare('UPDATE users SET notification_prefs = ? WHERE id = ?')
    .run(JSON.stringify(prefs), id);
}

export function updatePrivacySettings(id, settings) {
  getDb().prepare('UPDATE users SET privacy_settings = ? WHERE id = ?')
    .run(JSON.stringify(settings), id);
}

export function updateUserEmail(id, newEmail) {
  getDb().prepare('UPDATE users SET email = ? WHERE id = ?').run(newEmail.toLowerCase().trim(), id);
}

// ── Folders ──────────────────────────────────────────────────────────────────

export function createFolder(userId, name) {
  const id = randomUUID();
  const now = Date.now();
  getDb().prepare(
    'INSERT INTO folders (id, user_id, name, created_at) VALUES (?, ?, ?, ?)'
  ).run(id, userId, name, now);
  return { id, user_id: userId, name, created_at: now };
}

export function getFolders(userId) {
  return getDb().prepare(
    'SELECT * FROM folders WHERE user_id = ? ORDER BY name ASC'
  ).all(userId);
}

export function getFolderById(id, userId) {
  return getDb().prepare(
    'SELECT * FROM folders WHERE id = ? AND user_id = ?'
  ).get(id, userId) ?? null;
}

export function updateFolder(id, userId, name) {
  getDb().prepare('UPDATE folders SET name = ? WHERE id = ? AND user_id = ?').run(name, id, userId);
}

export function deleteFolder(id, userId) {
  const db = getDb();
  db.prepare('UPDATE projects SET folder_id = NULL WHERE folder_id = ? AND user_id = ?').run(id, userId);
  db.prepare('DELETE FROM folders WHERE id = ? AND user_id = ?').run(id, userId);
}

// ── Projects ─────────────────────────────────────────────────────────────────

const MAX_VERSIONS = 10;

function parseProjectRow(row) {
  if (!row) return null;
  return { ...row, tags: JSON.parse(row.tags || '[]') };
}

export function createProject(userId, data) {
  const { id, title, prompt, skill, guide, chat_html, tags, folder_id, client_ts } = data;
  const now = Date.now();
  getDb().prepare(`
    INSERT INTO projects
      (id, user_id, folder_id, title, prompt, skill, guide, chat_html, tags, client_ts, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, userId, folder_id ?? null,
    title ?? '', prompt ?? '', skill ?? 'MONKEY',
    guide ?? '', chat_html ?? '',
    JSON.stringify(tags ?? []),
    client_ts ?? now, now, now
  );
  return parseProjectRow(getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id));
}

export function getProject(id, userId) {
  return parseProjectRow(
    getDb().prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(id, userId)
  );
}

export function getProjects(userId, { q, folder_id, limit = 50, offset = 0, since } = {}) {
  let sql = 'SELECT * FROM projects WHERE user_id = ? AND deleted_at IS NULL';
  const params = [userId];
  if (since != null) { sql += ' AND updated_at > ?'; params.push(since); }
  if (folder_id !== undefined) { sql += folder_id ? ' AND folder_id = ?' : ' AND folder_id IS NULL'; if (folder_id) params.push(folder_id); }
  if (q) { sql += ' AND (title LIKE ? OR prompt LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  return getDb().prepare(sql).all(...params).map(parseProjectRow);
}

export function updateProject(id, userId, data) {
  const existing = getDb().prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(id, userId);
  if (!existing) return null;
  const { title, prompt, skill, guide, chat_html, tags, folder_id } = data;
  const now = Date.now();
  const db = getDb();
  const newGuide = guide ?? existing.guide;
  db.prepare(`
    UPDATE projects
    SET title=?, prompt=?, skill=?, guide=?, chat_html=?, tags=?, folder_id=?,
        version=version+1, updated_at=?
    WHERE id=? AND user_id=?
  `).run(
    title ?? existing.title,
    prompt ?? existing.prompt,
    skill ?? existing.skill,
    newGuide,
    chat_html ?? existing.chat_html,
    JSON.stringify(tags ?? JSON.parse(existing.tags || '[]')),
    folder_id !== undefined ? folder_id : existing.folder_id,
    now, id, userId
  );
  // Archive previous guide as a version
  if (newGuide !== existing.guide && existing.guide) {
    db.prepare(
      'INSERT INTO project_versions (project_id, guide, version, created_at) VALUES (?, ?, ?, ?)'
    ).run(id, existing.guide, existing.version, now);
    const old = db.prepare(
      'SELECT id FROM project_versions WHERE project_id = ? ORDER BY id ASC'
    ).all(id);
    if (old.length > MAX_VERSIONS) {
      const prune = old.slice(0, old.length - MAX_VERSIONS);
      db.prepare(
        `DELETE FROM project_versions WHERE id IN (${prune.map(() => '?').join(',')})`
      ).run(...prune.map(r => r.id));
    }
  }
  return parseProjectRow(db.prepare('SELECT * FROM projects WHERE id = ?').get(id));
}

export function upsertProject(userId, data) {
  const existing = getDb().prepare(
    'SELECT * FROM projects WHERE id = ? AND user_id = ?'
  ).get(data.id, userId);
  if (!existing) return createProject(userId, data);
  const clientUpdated = data.updated_at ?? 0;
  if (clientUpdated > existing.updated_at) return updateProject(data.id, userId, data);
  return parseProjectRow(existing);
}

export function softDeleteProject(id, userId) {
  getDb().prepare('UPDATE projects SET deleted_at = ? WHERE id = ? AND user_id = ?')
    .run(Date.now(), id, userId);
}

export function getProjectVersions(id, userId) {
  const project = getDb().prepare(
    'SELECT id FROM projects WHERE id = ? AND user_id = ?'
  ).get(id, userId);
  if (!project) return null;
  return getDb().prepare(
    'SELECT id, version, created_at FROM project_versions WHERE project_id = ? ORDER BY id DESC'
  ).all(id);
}

export function getProjectsSince(userId, since) {
  return getDb().prepare(
    'SELECT * FROM projects WHERE user_id = ? AND updated_at > ?  ORDER BY updated_at DESC'
  ).all(userId, since).map(parseProjectRow);
}

export function getDeletedSince(userId, since) {
  return getDb().prepare(
    'SELECT id, deleted_at FROM projects WHERE user_id = ? AND deleted_at IS NOT NULL AND deleted_at > ?'
  ).all(userId, since);
}
