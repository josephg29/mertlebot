import { json } from '@sveltejs/kit';
import { upsertProject, softDeleteProject, getProjectsSince, getDeletedSince } from '$lib/server/db.js';
import { validateProjectData, isValidUUID } from '../../_projectValidation.js';

export async function POST({ request, locals }) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

  const { since = 0, changes = [] } = body;
  const userId = locals.session.user_id;

  if (!Array.isArray(changes) || changes.length > 100) {
    return json({ error: 'changes must be an array of up to 100 items' }, { status: 400 });
  }

  const errors = [];
  for (const item of changes) {
    if (!item.id || !isValidUUID(item.id)) { errors.push(`Invalid id: ${item.id}`); continue; }

    if (item.deleted_at) {
      softDeleteProject(item.id, userId);
      continue;
    }

    const err = validateProjectData(item);
    if (err) { errors.push(`${item.id}: ${err}`); continue; }

    upsertProject(userId, item);
  }

  const serverTime = Date.now();
  const updates = getProjectsSince(userId, since);
  const deleted = getDeletedSince(userId, since);

  return json({
    ok: true,
    server_time: serverTime,
    updates,
    deleted_ids: deleted.map(r => r.id),
    errors: errors.length ? errors : undefined,
  });
}
