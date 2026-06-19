import { json } from '@sveltejs/kit';
import { getApiKey } from '$lib/server/config.js';

export async function GET() {
  return json({
    status: 'ok',
    apiConfigured: !!getApiKey(),
    timestamp: new Date().toISOString(),
  });
}
