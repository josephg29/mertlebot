import { json } from '@sveltejs/kit';
import { getFolders, createFolder } from '$lib/server/db.js';

export async function GET({ locals }) {
  const folders = getFolders(locals.session.user_id);
  return json({ ok: true, folders });
}

export async function POST({ request, locals }) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

  const { name } = body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return json({ error: 'Folder name is required' }, { status: 400 });
  }
  if (name.trim().length > 60) {
    return json({ error: 'Folder name must be 60 characters or fewer' }, { status: 400 });
  }

  const folder = createFolder(locals.session.user_id, name.trim());
  return json({ ok: true, folder }, { status: 201 });
}
