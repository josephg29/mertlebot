import { json } from '@sveltejs/kit';
import { invalidateSession } from '$lib/server/auth.js';

export async function POST({ cookies, locals }) {
  try {
    const sessionId = cookies.get('auth_session');
    if (sessionId) {
      await invalidateSession(sessionId);
    }

    // Clear session cookie
    const sessionCookie = (await import('$lib/server/auth.js')).lucia.createBlankSessionCookie();
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes
    });

    return json({ 
      success: true,
      redirect: '/'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return json({ error: 'Logout failed' }, { status: 500 });
  }
}