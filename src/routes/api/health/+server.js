import { json } from '@sveltejs/kit';
import { checkIntegrity, dbPath, lastBackupAt } from '$lib/server/db.js';
import { getApiKey } from '$lib/server/config.js';

export async function GET() {
  const dbOk = checkIntegrity();
  const status = dbOk ? 'ok' : 'degraded';
  const backed = lastBackupAt();

  return json({
    status,
    db: dbOk ? 'ok' : 'error',
    dbPath: dbPath(),
    apiConfigured: !!getApiKey(),
    lastBackupAt: backed ? new Date(backed).toISOString() : null,
    timestamp: new Date().toISOString(),
  }, { status: dbOk ? 200 : 503 });
}
