import { json } from '@sveltejs/kit';
import { validateEmail, verifyPassword } from '$lib/server/auth.js';
import { getUserForAuth, getUserByEmail, updateUserEmail, logAuthEvent } from '$lib/server/db.js';

export async function PUT({ request, locals }) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

  const { current_password, new_email } = body;
  if (!current_password) return json({ error: 'Current password is required' }, { status: 400 });

  const emailErr = validateEmail(new_email);
  if (emailErr) return json({ error: emailErr }, { status: 400 });

  const user = getUserForAuth(locals.session.user_id);
  if (!user) return json({ error: 'User not found' }, { status: 404 });

  if (new_email.trim().toLowerCase() === user.email) {
    return json({ error: 'New email matches current email' }, { status: 400 });
  }

  const valid = await verifyPassword(current_password, user.password_hash);
  if (!valid) return json({ error: 'Password is incorrect' }, { status: 401 });

  const existing = getUserByEmail(new_email);
  if (existing) return json({ error: 'Email address is already in use' }, { status: 409 });

  updateUserEmail(user.id, new_email);
  logAuthEvent('email_changed', { userId: user.id, email: new_email });

  return json({ ok: true, email: new_email.trim().toLowerCase() });
}
