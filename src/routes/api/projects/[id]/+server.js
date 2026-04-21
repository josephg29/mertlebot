import { json } from '@sveltejs/kit';
import { getProject, updateProject, softDeleteProject } from '$lib/server/db.js';
import { validateProjectData, isValidUUID } from '../../_projectValidation.js';

export async function GET({ params, locals }) {
  if (!isValidUUID(params.id)) return json({ error: 'Invalid id' }, { status: 400 });
  const project = getProject(params.id, locals.session.user_id);
  if (!project) return json({ error: 'Not found' }, { status: 404 });
  return json({ ok: true, project });
}

export async function PUT({ params, request, locals }) {
  if (!isValidUUID(params.id)) return json({ error: 'Invalid id' }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

  const err = validateProjectData(body);
  if (err) return json({ error: err }, { status: 400 });

  const project = updateProject(params.id, locals.session.user_id, body);
  if (!project) return json({ error: 'Not found' }, { status: 404 });
  return json({ ok: true, project });
}

export async function DELETE({ params, locals }) {
  if (!isValidUUID(params.id)) return json({ error: 'Invalid id' }, { status: 400 });
  const project = getProject(params.id, locals.session.user_id);
  if (!project) return json({ error: 'Not found' }, { status: 404 });
  softDeleteProject(params.id, locals.session.user_id);
  return json({ ok: true });
}
