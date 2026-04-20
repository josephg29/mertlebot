import { json } from '@sveltejs/kit';
import { verifyUser, createSession } from '$lib/server/auth.js';

export async function POST({ request, cookies }) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Verify user
    const user = await verifyUser(email, password);
    if (!user) {
      return json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Create session
    const session = await createSession(user.id);
    
    // Set session cookie
    const sessionCookie = (await import('$lib/server/auth.js')).lucia.createSessionCookie(session.id);
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes
    });

    return json({ 
      success: true, 
      user: { id: user.id, email: user.email, username: user.username },
      redirect: '/'
    });

  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Login failed' }, { status: 500 });
  }
}