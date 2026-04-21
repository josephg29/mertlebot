import { json } from '@sveltejs/kit';
import { getProjectVersions } from '$lib/server/db.js';
import { isValidUUID } from '../../../_projectValidation.js';

export async function GET({ params, locals }) {
  if (!isValidUUID(params.id)) return json({ error: 'Invalid id' }, { status: 400 });
  const versions = getProjectVersions(params.id, locals.session.user_id);
  if (versions === null) return json({ error: 'Not found' }, { status: 404 });
  return json({ ok: true, versions });
}
