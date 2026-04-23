import { json } from '@sveltejs/kit';
import { getApiKey } from '$lib/server/config.js';

export function GET() {
  return json({
    configured: !!getApiKey(),
    provider: 'anthropic',
    managed: 'server'
  });
}

export function POST() {
  return json({ error: 'API key is managed by the server and cannot be set from the client.' }, { status: 403 });
}
