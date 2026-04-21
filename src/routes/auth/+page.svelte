<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  let mode = $state('login'); // 'login' | 'register' | 'forgot' | 'reset' | 'verify'
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let error = $state('');
  let info = $state('');
  let loading = $state(false);
  let emailVerified = $state(true);
  let resendLoading = $state(false);
  let resendInfo = $state('');
  let csrfToken = $state('');

  $effect(() => {
    const verifyToken = page.url.searchParams.get('verify');
    const resetToken = page.url.searchParams.get('token');
    if (verifyToken) {
      mode = 'verify';
      consumeVerifyToken(verifyToken);
    } else if (resetToken) {
      mode = 'reset';
    }
  });

  $effect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        if (data.authenticated) {
          csrfToken = sessionStorage.getItem('csrfToken') ?? '';
          emailVerified = data.emailVerified ?? true;
          if (emailVerified && mode !== 'verify') {
            goto('/');
          }
        }
      })
      .catch(() => {});
  });

  async function consumeVerifyToken(token) {
    loading = true;
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok) {
        info = 'Email verified! Redirecting…';
        setTimeout(() => goto('/'), 1500);
      } else {
        error = data.error ?? 'Verification failed';
        mode = 'login';
      }
    } catch {
      error = 'Network error — please try again';
      mode = 'login';
    } finally {
      loading = false;
    }
  }

  async function resendVerification() {
    resendLoading = true;
    resendInfo = '';
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
      });
      const data = await res.json();
      resendInfo = data.message ?? data.error ?? 'Done';
    } catch {
      resendInfo = 'Network error — please try again';
    } finally {
      resendLoading = false;
    }
  }

  function resetForm() {
    error = '';
    info = '';
    password = '';
    confirmPassword = '';
  }

  function switchMode(next) {
    mode = next;
    resetForm();
  }

  async function submit() {
    error = '';
    info = '';
    if ((mode === 'register' || mode === 'reset') && password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }
    loading = true;
    try {
      if (mode === 'login' || mode === 'register') {
        await submitAuth();
      } else if (mode === 'forgot') {
        await submitForgot();
      } else if (mode === 'reset') {
        await submitReset();
      }
    } catch {
      error = 'Network error — please try again';
    } finally {
      loading = false;
    }
  }

  async function submitAuth() {
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) { error = data.error ?? 'Something went wrong'; return; }
    if (data.csrfToken) {
      sessionStorage.setItem('csrfToken', data.csrfToken);
      csrfToken = data.csrfToken;
    }
    if (data.needsVerification) {
      info = 'Account created! Check your inbox for a verification link.';
      emailVerified = false;
      return;
    }
    goto('/');
  }

  async function submitForgot() {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) { error = data.error ?? 'Something went wrong'; return; }
    info = data.message ?? "If that email is registered, you'll receive a reset link shortly.";
  }

  async function submitReset() {
    const token = page.url.searchParams.get('token');
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (!res.ok) { error = data.error ?? 'Something went wrong'; return; }
    if (data.csrfToken) sessionStorage.setItem('csrfToken', data.csrfToken);
    goto('/');
  }
</script>

<div class="page">
  <div class="card">
    <div class="logo">
      <span class="logo-m">M</span>
      <span class="logo-text">ertle</span>
      <span class="logo-dot">.bot</span>
    </div>
    <p class="subtitle">AI electronics prototyping assistant</p>

    {#if mode === 'verify'}
      <h2 class="form-heading">Verifying email…</h2>
      {#if loading}
        <div class="loading-row"><span class="spinner" aria-hidden="true"></span> Verifying…</div>
      {/if}
      {#if info}
        <div class="info" role="status">{info}</div>
      {/if}
      {#if error}
        <div class="error" role="alert">{error}</div>
        <p class="switch">
          <button class="link-btn" onclick={() => switchMode('login')}>Back to sign in</button>
        </p>
      {/if}

    {:else if mode === 'login' || mode === 'register'}
      {#if !emailVerified}
        {#if info}
          <div class="info" role="status">{info}</div>
        {/if}

        <div class="verify-banner">
          <p>Your email is not verified. Check your inbox for a verification link.</p>
          {#if resendInfo}
            <p class="resend-info">{resendInfo}</p>
          {:else}
            <button class="link-btn" onclick={resendVerification} disabled={resendLoading}>
              {resendLoading ? 'Sending…' : 'Resend verification email'}
            </button>
          {/if}
        </div>
      {:else}
        <div class="tabs">
          <button class="tab" class:active={mode === 'login'} onclick={() => switchMode('login')}>
            Sign in
          </button>
          <button class="tab" class:active={mode === 'register'} onclick={() => switchMode('register')}>
            Create account
          </button>
        </div>

        {#if info}
          <div class="info" role="status">{info}</div>
        {/if}

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

        {#if mode === 'login'}
          <p class="forgot-link">
            <button class="link-btn" onclick={() => switchMode('forgot')} disabled={loading}>
              Forgot password?
            </button>
          </p>
        {/if}

        <p class="switch">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button class="link-btn" onclick={() => switchMode(mode === 'login' ? 'register' : 'login')} disabled={loading}>
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      {/if}

    {:else if mode === 'forgot'}
      <h2 class="form-heading">Reset password</h2>
      <p class="form-desc">Enter your email and we'll send you a reset link.</p>

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
            disabled={loading || !!info}
          />
        </div>

        {#if error}
          <div class="error" role="alert">{error}</div>
        {/if}

        {#if info}
          <div class="info" role="status">{info}</div>
        {:else}
          <button type="submit" class="submit-btn" disabled={loading}>
            {#if loading}
              <span class="spinner" aria-hidden="true"></span>
              Sending…
            {:else}
              Send reset link
            {/if}
          </button>
        {/if}
      </form>

      <p class="switch">
        <button class="link-btn" onclick={() => switchMode('login')} disabled={loading}>
          Back to sign in
        </button>
      </p>

    {:else if mode === 'reset'}
      <h2 class="form-heading">Choose a new password</h2>

      <form onsubmit={(e) => { e.preventDefault(); submit(); }}>
        <div class="field">
          <label for="password">New password</label>
          <input
            id="password"
            type="password"
            autocomplete="new-password"
            placeholder="At least 8 characters"
            required
            bind:value={password}
            disabled={loading}
          />
        </div>

        <div class="field">
          <label for="confirm">Confirm new password</label>
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

        {#if error}
          <div class="error" role="alert">{error}</div>
        {/if}

        <button type="submit" class="submit-btn" disabled={loading}>
          {#if loading}
            <span class="spinner" aria-hidden="true"></span>
            Resetting…
          {:else}
            Set new password
          {/if}
        </button>
      </form>

      <p class="switch">
        <button class="link-btn" onclick={() => switchMode('login')} disabled={loading}>
          Back to sign in
        </button>
      </p>
    {/if}
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

  .form-heading {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
    color: var(--text);
  }

  .form-desc {
    color: var(--text-muted);
    font-size: 0.875rem;
    margin: 0 0 1.25rem;
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

  .info {
    background: rgba(0, 200, 150, 0.1);
    border: 1px solid var(--primary);
    border-radius: 6px;
    padding: 0.6rem 0.75rem;
    color: var(--primary);
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

  .forgot-link {
    text-align: center;
    margin: -0.5rem 0 0.75rem;
  }

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

  .verify-banner {
    margin-top: 1rem;
    background: rgba(255, 193, 7, 0.1);
    border: 1px solid #ffc107;
    border-radius: 6px;
    padding: 0.75rem;
    font-size: 0.875rem;
    color: #ffd54f;
    text-align: center;
  }
  .verify-banner p { margin: 0 0 0.5rem; }
  .resend-info { color: var(--primary); margin-bottom: 0; }
  .loading-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: var(--text-muted);
    padding: 1rem 0;
  }
</style>
