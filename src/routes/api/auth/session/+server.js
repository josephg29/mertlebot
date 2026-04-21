import { json } from '@sveltejs/kit';
import { SESSION_COOKIE, deriveCsrfToken } from '$lib/server/auth.js';
import { getSession, getUserById } from '$lib/server/db.js';

export async function GET({ cookies }) {
  const token = cookies.get(SESSION_COOKIE);
  if (!token) return json({ authenticated: false });

  const session = getSession(token);
  if (!session) return json({ authenticated: false });

  const user = getUserById(session.user_id);
  if (!user) return json({ authenticated: false });

  return json({ authenticated: true, user, csrfToken: deriveCsrfToken(token) });
}
