import { json } from '@sveltejs/kit';
import { SESSION_COOKIE } from '$lib/server/auth.js';
import { getSession, deleteSession, logAuthEvent } from '$lib/server/db.js';

export async function POST({ request, cookies }) {
  const token = cookies.get(SESSION_COOKIE);
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const ua = request.headers.get('user-agent') ?? '';

  if (token) {
    const session = getSession(token);
    if (session) {
      logAuthEvent('logout', { userId: session.user_id, ip, userAgent: ua });
    }
    deleteSession(token);
    cookies.delete(SESSION_COOKIE, { path: '/' });
  }

  return json({ ok: true });
}
