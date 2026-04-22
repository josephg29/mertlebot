# Email Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional 24-hour email verification to Mertle — users register and get a session immediately, but a banner prompts them to verify; protected features can be gated behind verification via env flag.

**Architecture:** A new `email_verification_tokens` table (migration 004) stores hashed tokens with 24h TTL. On register, a verification email is queued. The UI shows an unverified banner with a resend button. Two new API routes handle token consumption and re-send. `hooks.server.js` optionally blocks protected routes for unverified users when `REQUIRE_EMAIL_VERIFICATION=true`.

**Tech Stack:** SvelteKit 5 (Svelte 5 runes), better-sqlite3 (sync API), existing `email.js` (multi-provider), Vitest for tests.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/server/auth.js` | Modify | Add `generateVerificationToken`, `verificationTokenExpiresAt` (24h) |
| `src/lib/server/db.js` | Modify | Add migration 004 (two separate `exec` calls — `ALTER TABLE` must be standalone), add DB helpers: `createEmailVerificationToken`, `getEmailVerificationToken`, `consumeEmailVerificationToken`, `markEmailVerified`; update `getUserById` to return `email_verified_at` |
| `src/lib/server/email.js` | Modify | Add `sendVerificationEmail` template |
| `src/routes/api/auth/verify-email/+server.js` | Create | Consume token → mark verified; no CSRF needed (no session required — token is the authenticator, same pattern as reset-password) |
| `src/routes/api/auth/resend-verification/+server.js` | Create | Manual session + CSRF guard (route is under `/api/auth/` so hooks.server.js does NOT apply the guard), rate-limited by global hook |
| `src/hooks.server.js` | Modify | Optionally gate protected routes behind `email_verified_at` when `REQUIRE_EMAIL_VERIFICATION=true`; note: one extra `getUserById` call per request — acceptable for single-process SQLite |
| `src/routes/api/auth/register/+server.js` | Modify | Queue verification email after user creation; add `needsVerification: true` to response |
| `src/routes/api/auth/session/+server.js` | Modify | Add `emailVerified` to response (one line — `getUserById` already imported and called) |
| `src/routes/auth/+page.svelte` | Modify | Show unverified banner + resend button; handle `?verify=<token>` |
| `src/tests/email-verification.test.js` | Create | Unit + DB integration tests |

---

## Task 1: Token helpers in auth.js

**Files:**
- Modify: `src/lib/server/auth.js`
- Test: `src/tests/email-verification.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/tests/email-verification.test.js` with static imports at the top of the file (not inside describe blocks — ES module `import` must be at the top level):

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateVerificationToken, verificationTokenExpiresAt, hashToken } from '../lib/server/auth.js';

describe('generateVerificationToken', () => {
  it('returns a 64-char hex string', () => {
    expect(generateVerificationToken()).toMatch(/^[0-9a-f]{64}$/);
  });
  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 20 }, generateVerificationToken));
    expect(tokens.size).toBe(20);
  });
});

describe('verificationTokenExpiresAt', () => {
  it('returns a timestamp roughly 24 hours in the future', () => {
    const now = Date.now();
    const exp = verificationTokenExpiresAt();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    expect(exp).toBeGreaterThan(now + twentyFourHours - 500);
    expect(exp).toBeLessThan(now + twentyFourHours + 500);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- src/tests/email-verification.test.js
```
Expected: FAIL — `generateVerificationToken` not exported.

- [ ] **Step 3: Add helpers to auth.js**

Append to `src/lib/server/auth.js` after the existing reset-token section:

```js
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function generateVerificationToken() {
  return randomBytes(32).toString('hex');
}

export function verificationTokenExpiresAt() {
  return Date.now() + VERIFICATION_TOKEN_TTL_MS;
}
```

(`hashToken` is already exported — reuse it for verification tokens.)

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test -- src/tests/email-verification.test.js
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/auth.js src/tests/email-verification.test.js
git commit -m "feat: add email verification token helpers"
```

---

## Task 2: DB migration and CRUD helpers

**Files:**
- Modify: `src/lib/server/db.js`
- Test: `src/tests/email-verification.test.js`

**Important:** SQLite's `ALTER TABLE` must not be batched with other DDL in a single `db.exec()` call. Migration 004 uses two separate `exec` calls inside the transaction — unlike migrations 001–003 which only used `CREATE TABLE` / `CREATE INDEX`.

- [ ] **Step 1: Write failing DB helper tests**

Append to `src/tests/email-verification.test.js` (after the existing tests — no new `import` statements needed at this point since `hashToken` is already imported above):

```js
describe('email verification DB helpers', () => {
  let createUser, createEmailVerificationToken, getEmailVerificationToken,
      consumeEmailVerificationToken, markEmailVerified, getUserById;

  beforeEach(async () => {
    vi.resetModules();
    process.env.DATABASE_PATH = ':memory:';
    // Dynamic import so vi.resetModules() gives a fresh in-memory DB
    const db = await import('../lib/server/db.js');
    createUser = db.createUser;
    createEmailVerificationToken = db.createEmailVerificationToken;
    getEmailVerificationToken = db.getEmailVerificationToken;
    consumeEmailVerificationToken = db.consumeEmailVerificationToken;
    markEmailVerified = db.markEmailVerified;
    getUserById = db.getUserById;
  });

  function makeUser() {
    return createUser('verify@example.com', '$2a$12$fakehash');
  }

  it('stores a token and retrieves it before expiry', () => {
    const user = makeUser();
    const hash = hashToken('raw-verify-abc');
    createEmailVerificationToken(hash, user.id, Date.now() + 60_000);
    const record = getEmailVerificationToken(hash);
    expect(record).not.toBeNull();
    expect(record.user_id).toBe(user.id);
    expect(record.used_at).toBeNull();
  });

  it('returns null for an expired token', () => {
    const user = makeUser();
    const hash = hashToken('expired-verify');
    createEmailVerificationToken(hash, user.id, Date.now() - 1);
    expect(getEmailVerificationToken(hash)).toBeNull();
  });

  it('returns null after the token is consumed', () => {
    const user = makeUser();
    const hash = hashToken('consume-verify');
    createEmailVerificationToken(hash, user.id, Date.now() + 60_000);
    consumeEmailVerificationToken(hash);
    expect(getEmailVerificationToken(hash)).toBeNull();
  });

  it('invalidates prior tokens when a new one is issued', () => {
    const user = makeUser();
    const hash1 = hashToken('old-verify');
    const hash2 = hashToken('new-verify');
    createEmailVerificationToken(hash1, user.id, Date.now() + 60_000);
    createEmailVerificationToken(hash2, user.id, Date.now() + 60_000);
    expect(getEmailVerificationToken(hash1)).toBeNull();
    expect(getEmailVerificationToken(hash2)).not.toBeNull();
  });

  it('markEmailVerified sets email_verified_at', () => {
    const user = makeUser();
    expect(getUserById(user.id).email_verified_at).toBeNull();
    markEmailVerified(user.id);
    const updated = getUserById(user.id);
    expect(updated.email_verified_at).toBeGreaterThan(0);
  });

  it('getUserById returns email_verified_at field', () => {
    const user = makeUser();
    const fetched = getUserById(user.id);
    expect(fetched).toHaveProperty('email_verified_at');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test -- src/tests/email-verification.test.js
```
Expected: FAIL — helpers not exported.

- [ ] **Step 3: Add migration 004 to db.js**

In the `MIGRATIONS` array in `src/lib/server/db.js`, add after the `003_password_reset` entry:

```js
{
  name: '004_email_verification',
  // ALTER TABLE must be run separately from CREATE TABLE in SQLite's exec().
  // We override with a custom fn property and handle it in runMigrations.
  sql: null,
  migrate(db) {
    db.exec(`ALTER TABLE users ADD COLUMN email_verified_at INTEGER`);
    db.exec(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        token_hash  TEXT    PRIMARY KEY,
        user_id     TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at  INTEGER NOT NULL,
        used_at     INTEGER,
        created_at  INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_evt_user ON email_verification_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_evt_exp  ON email_verification_tokens(expires_at);
    `);
  },
},
```

Then update `runMigrations` to call the custom `migrate` function when `sql` is null:

```js
function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      name   TEXT    NOT NULL UNIQUE,
      run_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const applied = new Set(
    db.prepare('SELECT name FROM _migrations').all().map(r => r.name)
  );

  for (const m of MIGRATIONS) {
    if (applied.has(m.name)) continue;
    db.transaction(() => {
      if (m.migrate) {
        m.migrate(db);
      } else {
        db.exec(m.sql);
      }
      db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(m.name);
    })();
  }
}
```

- [ ] **Step 4: Add CRUD helpers in db.js**

Append after the `// ── Password reset` section:

```js
// ── Email verification ──────────────────────────────────────────────────────

export function createEmailVerificationToken(tokenHash, userId, expiresAt) {
  const db = getDb();
  db.prepare('DELETE FROM email_verification_tokens WHERE user_id = ?').run(userId);
  db.prepare('INSERT INTO email_verification_tokens (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .run(tokenHash, userId, expiresAt, Date.now());
}

export function getEmailVerificationToken(tokenHash) {
  return getDb()
    .prepare('SELECT * FROM email_verification_tokens WHERE token_hash = ? AND expires_at > ? AND used_at IS NULL')
    .get(tokenHash, Date.now()) ?? null;
}

export function consumeEmailVerificationToken(tokenHash) {
  getDb().prepare('UPDATE email_verification_tokens SET used_at = ? WHERE token_hash = ?')
    .run(Date.now(), tokenHash);
}

export function markEmailVerified(userId) {
  getDb().prepare('UPDATE users SET email_verified_at = ? WHERE id = ?')
    .run(Date.now(), userId);
}
```

- [ ] **Step 5: Update getUserById to include email_verified_at**

Change the `getUserById` query in db.js from:

```js
export function getUserById(id) {
  return getDb().prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(id) ?? null;
}
```

To:

```js
export function getUserById(id) {
  return getDb().prepare('SELECT id, email, created_at, email_verified_at FROM users WHERE id = ?').get(id) ?? null;
}
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
npm run test -- src/tests/email-verification.test.js
```
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/server/db.js src/tests/email-verification.test.js
git commit -m "feat: add email verification DB migration and helpers"
```

---

## Task 3: Email template

**Files:**
- Modify: `src/lib/server/email.js`

No automated test — template is presentational. This is consistent with how `sendPasswordResetEmail` is handled. Verify manually via the console provider in dev.

- [ ] **Step 1: Add sendVerificationEmail to email.js**

Append after `sendPasswordResetEmail`:

```js
/**
 * Queue a verification email. Always returns immediately.
 */
export function sendVerificationEmail(to, verifyUrl) {
  const subject = 'Verify your Mertle email address';
  const text = [
    'Welcome to Mertle! Please verify your email address.',
    '',
    `Verification link (expires in 24 hours): ${verifyUrl}`,
    '',
    'If you did not create a Mertle account, you can safely ignore this email.',
  ].join('\n');
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:2rem">
      <h2 style="margin:0 0 1rem">Verify your email address</h2>
      <p>Welcome to Mertle! Click below to confirm your email.</p>
      <p style="margin:1.5rem 0">
        <a href="${verifyUrl}"
           style="background:#00c896;color:#fff;padding:0.75rem 1.5rem;border-radius:6px;text-decoration:none;font-weight:700">
          Verify email
        </a>
      </p>
      <p style="color:#888;font-size:0.875rem">
        This link expires in 24 hours. If you did not sign up for Mertle, ignore this email.
      </p>
      <p style="color:#888;font-size:0.75rem;word-break:break-all">Or paste this URL: ${verifyUrl}</p>
    </div>
  `;
  enqueue({ to, subject, html, text });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/server/email.js
git commit -m "feat: add verification email template"
```

---

## Task 4: POST /api/auth/verify-email route

**Files:**
- Create: `src/routes/api/auth/verify-email/+server.js`

No CSRF check — this is an explicit decision matching the `reset-password` route pattern. The token itself is the authentication proof; the user need not be logged in to verify.

- [ ] **Step 1: Create the route**

Create `src/routes/api/auth/verify-email/+server.js`:

```js
import { json } from '@sveltejs/kit';
import { hashToken } from '$lib/server/auth.js';
import {
  getEmailVerificationToken,
  consumeEmailVerificationToken,
  markEmailVerified,
  logAuthEvent,
} from '$lib/server/db.js';

export async function POST({ request }) {
  const body = await request.json().catch(() => null);
  if (!body?.token || typeof body.token !== 'string') {
    return json({ error: 'Invalid request' }, { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const ua = request.headers.get('user-agent') ?? '';
  const tokenHash = hashToken(body.token.trim());
  const record = getEmailVerificationToken(tokenHash);

  if (!record) {
    // Don't reveal whether the token ever existed
    return json({ error: 'Verification link is invalid or has expired' }, { status: 400 });
  }

  consumeEmailVerificationToken(tokenHash);
  markEmailVerified(record.user_id);
  logAuthEvent('email_verified', { userId: record.user_id, ip, userAgent: ua });

  return json({ ok: true });
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/routes/api/auth/verify-email/+server.js
git commit -m "feat: add verify-email API route"
```

---

## Task 5: POST /api/auth/resend-verification route

**Files:**
- Create: `src/routes/api/auth/resend-verification/+server.js`

**Note:** This route lives under `/api/auth/`, so `hooks.server.js` does NOT apply the session guard or CSRF check (line 7 of hooks.server.js: `AUTH_PREFIXES = ['/api/auth/']`). The session check and CSRF verification are done manually inside the route — the same pattern used by `login` and `register`.

- [ ] **Step 1: Write the route**

Create `src/routes/api/auth/resend-verification/+server.js`:

```js
import { json } from '@sveltejs/kit';
import {
  generateVerificationToken,
  verificationTokenExpiresAt,
  hashToken,
  SESSION_COOKIE,
  deriveCsrfToken,
} from '$lib/server/auth.js';
import {
  createEmailVerificationToken,
  getUserById,
  logAuthEvent,
  getSession,
} from '$lib/server/db.js';
import { sendVerificationEmail } from '$lib/server/email.js';

export async function POST({ request, cookies, url }) {
  const token = cookies.get(SESSION_COOKIE);
  if (!token) return json({ error: 'Authentication required' }, { status: 401 });

  const session = getSession(token);
  if (!session) return json({ error: 'Session expired' }, { status: 401 });

  const csrfHeader = request.headers.get('x-csrf-token');
  if (csrfHeader !== deriveCsrfToken(token)) {
    return json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const ua = request.headers.get('user-agent') ?? '';
  const user = getUserById(session.user_id);
  if (!user) return json({ error: 'User not found' }, { status: 404 });

  // Always return the same message whether verified or not — no enumeration
  const genericMsg = "If your email is unverified, you'll receive a new link shortly.";
  if (user.email_verified_at) {
    return json({ message: genericMsg });
  }

  const raw = generateVerificationToken();
  const tokenHash = hashToken(raw);
  createEmailVerificationToken(tokenHash, user.id, verificationTokenExpiresAt());

  const verifyUrl = `${url.origin}/auth?verify=${raw}`;
  sendVerificationEmail(user.email, verifyUrl);

  logAuthEvent('verification_email_resent', { userId: user.id, email: user.email, ip, userAgent: ua });

  return json({ message: genericMsg });
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/routes/api/auth/resend-verification/+server.js
git commit -m "feat: add resend-verification API route"
```

---

## Task 6: Wire verification into registration + expose emailVerified in session

**Files:**
- Modify: `src/routes/api/auth/register/+server.js`
- Modify: `src/routes/api/auth/session/+server.js`

- [ ] **Step 1: Update register route to queue verification email**

In `src/routes/api/auth/register/+server.js`, add to the existing imports:

```js
import {
  validateEmail, validatePassword, hashPassword,
  generateSessionToken, sessionExpiresAt, deriveCsrfToken,
  SESSION_COOKIE, sessionCookieOptions,
  generateVerificationToken, verificationTokenExpiresAt, hashToken,
} from '$lib/server/auth.js';
import {
  getUserByEmail, createUser, createSession, logAuthEvent,
  createEmailVerificationToken,
} from '$lib/server/db.js';
import { sendVerificationEmail } from '$lib/server/email.js';
```

After `logAuthEvent('register', ...)`, add:

```js
const verifyRaw = generateVerificationToken();
createEmailVerificationToken(hashToken(verifyRaw), user.id, verificationTokenExpiresAt());
const verifyUrl = `${new URL(request.url).origin}/auth?verify=${verifyRaw}`;
sendVerificationEmail(user.email, verifyUrl);
```

Change the final return to include `needsVerification`:

```js
return json({
  ok: true,
  user: { id: user.id, email: user.email },
  csrfToken: deriveCsrfToken(token),
  needsVerification: true,
});
```

- [ ] **Step 2: Update session endpoint to expose emailVerified**

In `src/routes/api/auth/session/+server.js`, `getUserById` is already imported and called. The only change is the return statement on line 15 — add `emailVerified`:

Current:
```js
return json({ authenticated: true, user, csrfToken: deriveCsrfToken(token) });
```

Replace with:
```js
return json({ authenticated: true, user, csrfToken: deriveCsrfToken(token), emailVerified: !!user.email_verified_at });
```

- [ ] **Step 3: Run full test suite**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/routes/api/auth/register/+server.js src/routes/api/auth/session/+server.js
git commit -m "feat: send verification email on register; expose emailVerified in session"
```

---

## Task 7: Feature gating in hooks.server.js

**Files:**
- Modify: `src/hooks.server.js`

When `REQUIRE_EMAIL_VERIFICATION=true`, unverified users are blocked from protected API routes. This adds one `getUserById` SQLite call per protected request — acceptable for a single-process deployment but worth noting.

- [ ] **Step 1: Add getUserById import to hooks.server.js**

At the top of `src/hooks.server.js`, update the db import line:

```js
import { getSession, getUserById } from '$lib/server/db.js';
```

- [ ] **Step 2: Add the gate after the session check**

After the line `event.locals.session = session;` in the session guard block, add:

```js
    // Optional verification gate — set REQUIRE_EMAIL_VERIFICATION=true to enable
    if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
      const user = getUserById(session.user_id);
      if (!user?.email_verified_at) {
        return new Response(JSON.stringify({ error: 'Please verify your email address to use this feature' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
```

- [ ] **Step 3: Run full test suite**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/hooks.server.js
git commit -m "feat: optional REQUIRE_EMAIL_VERIFICATION gate on protected routes"
```

---

## Task 8: UI — handle ?verify= token and show unverified banner

**Files:**
- Modify: `src/routes/auth/+page.svelte`

The auth page is Svelte 5 runes. Use `$app/state` (not `$app/stores`) for the `page` store — in runes mode, `page` from `$app/state` is accessed directly without the `$` prefix.

- [ ] **Step 1: Update register response handling in submitAuth**

In `src/routes/auth/+page.svelte`, update the `<script>` section. Full replacement:

```svelte
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

  // On load: check for ?verify= or ?token= in URL
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

  // Check session
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
          // Stay on page to show unverified banner
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
      return; // Stay on page to show unverified banner
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
```

- [ ] **Step 2: Update the HTML template**

Replace the full `<div class="page">` block in `src/routes/auth/+page.svelte` with:

```svelte
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

      {#if !emailVerified}
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
```

- [ ] **Step 3: Add new styles to the `<style>` block**

Append to the existing `<style>` block in `src/routes/auth/+page.svelte`:

```css
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
```

- [ ] **Step 4: Run full test suite**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/routes/auth/+page.svelte src/routes/api/auth/register/+server.js
git commit -m "feat: email verification UI — verify banner, resend button, ?verify= flow"
```

---

## Task 9: Update .env.example

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Verify EMAIL_FROM / EMAIL_PROVIDER are already documented in .env.example**

Read `.env.example` and confirm the email provider vars are present. If not, add them alongside the new var.

- [ ] **Step 2: Add the new env var**

Add to `.env.example`:

```
# Set to 'true' to block unverified users from /api/generate, /api/clarify, etc.
REQUIRE_EMAIL_VERIFICATION=false
```

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "docs: document REQUIRE_EMAIL_VERIFICATION env var"
```

---

## Task 10: Final verification

- [ ] **Run full test suite**

```bash
npm run test
```
Expected: all pass.

- [ ] **Start dev server and manually test golden paths**

```bash
npm run dev
```

Test checklist:
1. Register a new account → see "Account created! Check your inbox…" info message + unverified banner
2. Check console output for the `?verify=<token>` URL (console email provider)
3. Visit the verification URL in the browser → see "Email verified! Redirecting…" then redirect to `/`
4. Register another account, sign out, sign in → see unverified banner → click "Resend" → see new console URL → verify → no banner
5. Set `REQUIRE_EMAIL_VERIFICATION=true` in `.env`, restart, log in as unverified user, try to generate a project → get `403` with "Please verify your email" message
6. Verify a user, try again → `403` gone

- [ ] **Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: final email verification polish"
```
