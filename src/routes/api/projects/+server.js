import { json } from '@sveltejs/kit';
import { createProject, getProjects } from '$lib/server/db.js';
import { validateProjectData, isValidUUID } from '../_projectValidation.js';

export async function GET({ locals, url }) {
  const q = url.searchParams.get('q') || undefined;
  const folder_id = url.searchParams.has('folder_id') ? (url.searchParams.get('folder_id') || null) : undefined;
  const since = url.searchParams.has('since') ? Number(url.searchParams.get('since')) : undefined;
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 100);
  const offset = Number(url.searchParams.get('offset') || 0);

  const projects = getProjects(locals.session.user_id, { q, folder_id, since, limit, offset });
  return json({ ok: true, projects });
}

export async function POST({ request, locals }) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

  if (!body.id || !isValidUUID(body.id)) {
    return json({ error: 'Invalid or missing project id' }, { status: 400 });
  }

  const err = validateProjectData(body);
  if (err) return json({ error: err }, { status: 400 });

  try {
    const project = createProject(locals.session.user_id, body);
    return json({ ok: true, project }, { status: 201 });
  } catch (e) {
    if (e?.message?.includes('UNIQUE constraint')) {
      return json({ error: 'Project with this id already exists' }, { status: 409 });
    }
    throw e;
  }
}
