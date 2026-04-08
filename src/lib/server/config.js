import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const CONFIG_PATH = join(process.cwd(), 'config.json');

export function loadConfig() {
  try {
    if (existsSync(CONFIG_PATH)) {
      return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch { /* ignore corrupt file */ }
  return {};
}

export function saveConfig(cfg) {
  try {
    writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
  } catch (err) {
    console.error('Failed to save config:', err.message);
    throw new Error('Could not save configuration — check file permissions');
  }
}

export function getApiKey() {
  return loadConfig().apiKey || process.env.ANTHROPIC_API_KEY || process.env.DEEPSEEK_API_KEY || null;
}

export function getProvider() {
  return loadConfig().provider || 'anthropic';
}
