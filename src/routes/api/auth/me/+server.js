import { json } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth.js';

export async function GET({ cookies }) {
  try {
    const sessionId = cookies.get('auth_session');
    
    if (!sessionId) {
      return json({ user: null });
    }

    const { user } = await validateSession(sessionId);
    
    if (!user) {
      // Clear invalid session
      const sessionCookie = (await import('$lib/server/auth.js')).lucia.createBlankSessionCookie();
      cookies.set(sessionCookie.name, sessionCookie.value, {
        path: '.',
        ...sessionCookie.attributes
      });
      return json({ user: null });
    }

    return json({ 
      user: {
        id: user.userId,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return json({ user: null });
  }
}