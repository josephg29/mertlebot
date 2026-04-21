import { getDb } from './db.js';

export function getApiKey() {
  try {
    const row = getDb().prepare("SELECT value FROM config WHERE key = 'apiKey'").get();
    return row?.value || process.env.ANTHROPIC_API_KEY || null;
  } catch {
    return process.env.ANTHROPIC_API_KEY || null;
  }
}

export function saveApiKey(key) {
  getDb().prepare(`
    INSERT INTO config (key, value, updated_at) VALUES ('apiKey', ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key);
}

// Legacy shim — kept so any lingering callers don't crash during transition
export function loadConfig() {
  const apiKey = getApiKey();
  return apiKey ? { apiKey } : {};
}

export function saveConfig(cfg) {
  if (cfg.apiKey) saveApiKey(cfg.apiKey);
}
