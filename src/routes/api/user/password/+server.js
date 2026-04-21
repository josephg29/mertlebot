import { json } from '@sveltejs/kit';
import { validatePassword, verifyPassword, hashPassword } from '$lib/server/auth.js';
import { getUserForAuth, updateUserPassword, logAuthEvent } from '$lib/server/db.js';

export async function PUT({ request, locals }) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

  const { current_password, new_password } = body;
  if (!current_password) return json({ error: 'Current password is required' }, { status: 400 });

  const pwErr = validatePassword(new_password);
  if (pwErr) return json({ error: pwErr }, { status: 400 });

  if (new_password === current_password) {
    return json({ error: 'New password must differ from current password' }, { status: 400 });
  }

  const user = getUserForAuth(locals.session.user_id);
  if (!user) return json({ error: 'User not found' }, { status: 404 });

  const valid = await verifyPassword(current_password, user.password_hash);
  if (!valid) return json({ error: 'Current password is incorrect' }, { status: 401 });

  const newHash = await hashPassword(new_password);
  updateUserPassword(user.id, newHash);
  logAuthEvent('password_changed', { userId: user.id, email: user.email });

  return json({ ok: true });
}
