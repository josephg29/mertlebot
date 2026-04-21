<script>
  import { goto } from '$app/navigation';

  let mode = $state('login'); // 'login' | 'register'
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let error = $state('');
  let loading = $state(false);

  // Check if already authenticated
  $effect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => { if (data.authenticated) goto('/'); })
      .catch(() => {});
  });

  async function submit() {
    error = '';
    if (mode === 'register' && password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    loading = true;
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        error = data.error ?? 'Something went wrong';
        return;
      }

      // Store CSRF token in sessionStorage for subsequent API calls
      if (data.csrfToken) {
        sessionStorage.setItem('csrfToken', data.csrfToken);
      }

      goto('/');
    } catch {
      error = 'Network error — please try again';
    } finally {
      loading = false;
    }
  }

  function switchMode() {
    mode = mode === 'login' ? 'register' : 'login';
    error = '';
    password = '';
    confirmPassword = '';
  }
</script>

<div class="page">
  <div class="card">
    <!-- Logo mark -->
    <div class="logo">
      <span class="logo-m">M</span>
      <span class="logo-text">ertle</span>
      <span class="logo-dot">.bot</span>
    </div>
    <p class="subtitle">AI electronics prototyping assistant</p>

    <div class="tabs">
      <button class="tab" class:active={mode === 'login'} onclick={() => { mode = 'login'; error = ''; }}>
        Sign in
      </button>
      <button class="tab" class:active={mode === 'register'} onclick={() => { mode = 'register'; error = ''; }}>
        Create account
      </button>
    </div>

    <form onsubmit={(e) => { e.preventDefault(); submit(); }}>
      <div class="field">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          required
          bind:value={email}
          disabled={loading}
        />
      </div>

      <div class="field">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
          placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
          required
          bind:value={password}
          disabled={loading}
        />
      </div>

      {#if mode === 'register'}
        <div class="field">
          <label for="confirm">Confirm password</label>
          <input
            id="confirm"
            type="password"
            autocomplete="new-password"
            placeholder="••••••••"
            required
            bind:value={confirmPassword}
            disabled={loading}
          />
        </div>
      {/if}

      {#if error}
        <div class="error" role="alert">{error}</div>
      {/if}

      <button type="submit" class="submit-btn" disabled={loading}>
        {#if loading}
          <span class="spinner" aria-hidden="true"></span>
          {mode === 'login' ? 'Signing in…' : 'Creating account…'}
        {:else}
          {mode === 'login' ? 'Sign in' : 'Create account'}
        {/if}
      </button>
    </form>

    <p class="switch">
      {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
      <button class="link-btn" onclick={switchMode} disabled={loading}>
        {mode === 'login' ? 'Create one' : 'Sign in'}
      </button>
    </p>
  </div>
</div>

<style>
  .page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    padding: 1rem;
  }

  .card {
    width: 100%;
    max-width: 400px;
    background: var(--surface);
    border: 1px solid var(--border-col);
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }

  .logo {
    text-align: center;
    margin-bottom: 0.25rem;
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .logo-m   { color: var(--primary); }
  .logo-text{ color: var(--text); }
  .logo-dot { color: var(--cta); }

  .subtitle {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.85rem;
    margin: 0 0 1.5rem;
  }

  .tabs {
    display: flex;
    border: 1px solid var(--border-col);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 1.5rem;
  }
  .tab {
    flex: 1;
    padding: 0.5rem;
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .tab.active {
    background: var(--primary);
    color: var(--road-xdark);
    font-weight: 600;
  }
  .tab:not(.active):hover {
    background: var(--surface2);
    color: var(--text);
  }

  .field {
    margin-bottom: 1rem;
  }
  label {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 0.35rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  input {
    width: 100%;
    box-sizing: border-box;
    background: var(--surface2);
    border: 1px solid var(--border-col);
    border-radius: 6px;
    padding: 0.6rem 0.75rem;
    color: var(--text);
    font-size: 0.95rem;
    transition: border-color 0.15s;
    outline: none;
  }
  input:focus {
    border-color: var(--primary);
  }
  input::placeholder {
    color: var(--text-muted);
    opacity: 0.6;
  }
  input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    background: rgba(229, 57, 53, 0.12);
    border: 1px solid var(--danger);
    border-radius: 6px;
    padding: 0.6rem 0.75rem;
    color: #ef9a9a;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .submit-btn {
    width: 100%;
    padding: 0.7rem;
    background: var(--cta);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: background 0.15s;
    margin-bottom: 1rem;
  }
  .submit-btn:hover:not(:disabled) { background: var(--cta-dark); }
  .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .switch {
    text-align: center;
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0;
  }
  .link-btn {
    background: none;
    border: none;
    color: var(--link);
    cursor: pointer;
    font-size: inherit;
    padding: 0 0.25rem;
    text-decoration: underline;
  }
  .link-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
