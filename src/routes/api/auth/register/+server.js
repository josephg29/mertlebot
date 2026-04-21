import { json } from '@sveltejs/kit';
import { createUser, createSession } from '$lib/server/auth.js';

export async function POST({ request, cookies }) {
  try {
    const body = await request.json();
    const { email, username, password } = body;

    // Validation
    if (!email || !username || !password) {
      return json({ error: 'Email, username, and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if user already exists
    const db = (await import('better-sqlite3')).default('auth.db');
    const existingUser = db.prepare('SELECT * FROM user WHERE email = ? OR username = ?').get(email, username);
    
    if (existingUser) {
      return json({ error: 'Email or username already exists' }, { status: 409 });
    }

    // Create user
    const userId = await createUser(email, username, password);
    
    // Create session
    const session = await createSession(userId);
    
    // Set session cookie
    const sessionCookie = (await import('$lib/server/auth.js')).lucia.createSessionCookie(session.id);
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes
    });

    return json({ 
      success: true, 
      user: { id: userId, email, username },
      redirect: '/'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return json({ error: 'Registration failed' }, { status: 500 });
  }
}