import { writable } from 'svelte/store';

// Create auth store
export const authStore = writable({
  user: null,
  loading: true,
  initialized: false
});

// Initialize auth state
export async function initAuth() {
  try {
    const response = await fetch('/api/auth/me');
    const data = await response.json();
    
    authStore.set({
      user: data.user,
      loading: false,
      initialized: true
    });
  } catch (error) {
    console.error('Auth initialization error:', error);
    authStore.set({
      user: null,
      loading: false,
      initialized: true
    });
  }
}

// Login function
export async function login(email, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (data.success) {
      authStore.set({
        user: data.user,
        loading: false,
        initialized: true
      });
      return { success: true, redirect: data.redirect };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Register function
export async function register(email, username, password) {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password })
    });

    const data = await response.json();
    
    if (data.success) {
      authStore.set({
        user: data.user,
        loading: false,
        initialized: true
      });
      return { success: true, redirect: data.redirect };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Logout function
export async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST'
    });

    authStore.set({
      user: null,
      loading: false,
      initialized: true
    });

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: 'Logout failed' };
  }
}