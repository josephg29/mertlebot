/**
 * Multi-provider email abstraction with an in-memory retry queue.
 *
 * Providers (set via EMAIL_PROVIDER env var):
 *   smtp      — SMTP relay via nodemailer (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
 *   sendgrid  — SendGrid v3 API (SENDGRID_API_KEY)
 *   mailgun   — Mailgun API (MAILGUN_API_KEY, MAILGUN_DOMAIN, optionally MAILGUN_REGION=eu)
 *   console   — log to stdout (default; safe for development)
 *
 * Required for all providers: EMAIL_FROM (e.g. "Mertle <noreply@example.com>")
 */

const PROVIDER = (process.env.EMAIL_PROVIDER ?? 'console').toLowerCase();
const FROM = process.env.EMAIL_FROM ?? 'Mertle <noreply@mertle.bot>';

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 2_000;

// ── Queue ───────────────────────────────────────────────────────────────────

const queue = [];
let _processing = false;

function enqueue(job) {
  queue.push({ ...job, attempts: 0 });
  if (!_processing) processQueue();
}

async function processQueue() {
  _processing = true;
  while (queue.length > 0) {
    const job = queue[0];
    try {
      await dispatch(job);
      queue.shift();
    } catch (err) {
      job.attempts++;
      if (job.attempts >= MAX_RETRIES) {
        console.error(`[email] Dropping message to ${job.to} after ${MAX_RETRIES} attempts:`, err?.message);
        queue.shift();
      } else {
        const delay = RETRY_BASE_MS * 2 ** (job.attempts - 1);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  _processing = false;
}

// ── Dispatch ─────────────────────────────────────────────────────────────────

async function dispatch({ to, subject, html, text }) {
  switch (PROVIDER) {
    case 'smtp':     return sendSmtp({ to, subject, html, text });
    case 'sendgrid': return sendSendGrid({ to, subject, html, text });
    case 'mailgun':  return sendMailgun({ to, subject, html, text });
    default:         return sendConsole({ to, subject, html, text });
  }
}

// ── Providers ────────────────────────────────────────────────────────────────

async function sendConsole({ to, subject, text }) {
  console.log(`\n[email:console] ──────────────────────────────`);
  console.log(`  To:      ${to}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Body:\n${text}`);
  console.log(`──────────────────────────────────────────────\n`);
}

async function sendSmtp({ to, subject, html, text }) {
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  await transporter.sendMail({ from: FROM, to, subject, html, text });
}

async function sendSendGrid({ to, subject, html, text }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error('SENDGRID_API_KEY is not set');

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: parseSender(FROM),
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SendGrid error ${res.status}: ${body}`);
  }
}

async function sendMailgun({ to, subject, html, text }) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!apiKey || !domain) throw new Error('MAILGUN_API_KEY and MAILGUN_DOMAIN are required');

  const region = process.env.MAILGUN_REGION === 'eu' ? 'api.eu.mailgun.net' : 'api.mailgun.net';
  const url = `https://${region}/v3/${domain}/messages`;

  const body = new URLSearchParams({ from: FROM, to, subject, html, text });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`Mailgun error ${res.status}: ${msg}`);
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Queue a password-reset email. Always returns immediately.
 * Delivery is attempted asynchronously with up to 3 retries.
 */
export function sendPasswordResetEmail(to, resetUrl) {
  const subject = 'Reset your Mertle password';
  const text = [
    'Someone requested a password reset for your Mertle account.',
    '',
    `Reset link (expires in 1 hour): ${resetUrl}`,
    '',
    'If you did not request this, you can safely ignore this email.',
  ].join('\n');
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:2rem">
      <h2 style="margin:0 0 1rem">Reset your Mertle password</h2>
      <p>Someone requested a password reset for your account.</p>
      <p style="margin:1.5rem 0">
        <a href="${resetUrl}"
           style="background:#00c896;color:#fff;padding:0.75rem 1.5rem;border-radius:6px;text-decoration:none;font-weight:700">
          Reset password
        </a>
      </p>
      <p style="color:#888;font-size:0.875rem">
        This link expires in 1 hour. If you did not request this, ignore this email.
      </p>
      <p style="color:#888;font-size:0.75rem;word-break:break-all">Or paste this URL: ${resetUrl}</p>
    </div>
  `;
  enqueue({ to, subject, html, text });
}

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseSender(from) {
  const m = from.match(/^(.+?)\s*<(.+?)>$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { email: from };
}
