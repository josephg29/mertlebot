import { json } from '@sveltejs/kit';
import { SESSION_COOKIE } from '$lib/server/auth.js';
import { getSession, getUserById } from '$lib/server/db.js';

export async function GET({ cookies }) {
  try {
    const token = cookies.get(SESSION_COOKIE);
    if (!token) return json({ user: null });

    const session = getSession(token);
    if (!session) return json({ user: null });

    const user = getUserById(session.user_id);
    if (!user) return json({ user: null });

    return json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return json({ user: null });
  }
}
