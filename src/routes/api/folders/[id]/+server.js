import { json } from '@sveltejs/kit';
import { getFolderById, updateFolder, deleteFolder } from '$lib/server/db.js';
import { isValidUUID } from '../../_projectValidation.js';

export async function PUT({ params, request, locals }) {
  if (!isValidUUID(params.id)) return json({ error: 'Invalid id' }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

  const { name } = body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return json({ error: 'Folder name is required' }, { status: 400 });
  }
  if (name.trim().length > 60) {
    return json({ error: 'Folder name must be 60 characters or fewer' }, { status: 400 });
  }

  const folder = getFolderById(params.id, locals.session.user_id);
  if (!folder) return json({ error: 'Not found' }, { status: 404 });

  updateFolder(params.id, locals.session.user_id, name.trim());
  return json({ ok: true });
}

export async function DELETE({ params, locals }) {
  if (!isValidUUID(params.id)) return json({ error: 'Invalid id' }, { status: 400 });

  const folder = getFolderById(params.id, locals.session.user_id);
  if (!folder) return json({ error: 'Not found' }, { status: 404 });

  deleteFolder(params.id, locals.session.user_id);
  return json({ ok: true });
}
