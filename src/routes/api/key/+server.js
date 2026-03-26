import { json } from '@sveltejs/kit';
import { getApiKey, loadConfig, saveConfig } from '$lib/server/config.js';

export async function GET() {
  return json({ configured: !!getApiKey() });
}

export async function POST({ request }) {
  const body = await request.json();
  const key = body.key?.trim();
  if (!key) return json({ error: 'Key required' }, { status: 400 });
  if (!/^sk-ant-/.test(key)) return json({ error: 'Invalid key format — expected sk-ant-...' }, { status: 400 });

  const cfg = loadConfig();
  cfg.apiKey = key;
  saveConfig(cfg);
  return json({ ok: true });
}
