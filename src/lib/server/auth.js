import { Lucia } from 'lucia';
import { SqliteAdapter } from '@lucia-auth/adapter-sqlite';
import Database from 'better-sqlite3';
import { dev } from '$app/environment';

// Initialize SQLite database
const db = new Database('auth.db');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS user_key (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id),
    hashed_password TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS user_session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id),
    active_expires INTEGER NOT NULL,
    idle_expires INTEGER NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );
`);

const adapter = new SqliteAdapter(db, {
  user: 'user',
  session: 'user_session',
  key: 'user_key'
});

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: !dev
    }
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      username: attributes.username,
      createdAt: attributes.created_at
    };
  }
});

// Helper functions
export async function createUser(email, username, password) {
  const userId = generateId(15);
  const hashedPassword = await hashPassword(password);
  
  // Insert user
  db.prepare('INSERT INTO user (id, email, username) VALUES (?, ?, ?)')
    .run(userId, email, username);
  
  // Insert key (password)
  const keyId = `email:${email}`;
  db.prepare('INSERT INTO user_key (id, user_id, hashed_password) VALUES (?, ?, ?)')
    .run(keyId, userId, hashedPassword);
  
  return userId;
}

export async function verifyUser(email, password) {
  const key = db.prepare('SELECT * FROM user_key WHERE id = ?').get(`email:${email}`);
  if (!key) return null;
  
  const valid = await verifyPassword(password, key.hashed_password);
  if (!valid) return null;
  
  return db.prepare('SELECT * FROM user WHERE id = ?').get(key.user_id);
}

export async function createSession(userId) {
  const session = await lucia.createSession(userId, {});
  return session;
}

export async function validateSession(sessionId) {
  const { session, user } = await lucia.validateSession(sessionId);
  return { session, user };
}

export async function invalidateSession(sessionId) {
  await lucia.invalidateSession(sessionId);
}

// Password utilities
import { randomBytes, pbkdf2Sync } from 'crypto';

function hashPassword(password) {
  return new Promise((resolve) => {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    resolve(`${salt}:${hash}`);
  });
}

function verifyPassword(password, storedHash) {
  return new Promise((resolve) => {
    const [salt, hash] = storedHash.split(':');
    const verifyHash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    resolve(hash === verifyHash);
  });
}

function generateId(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}