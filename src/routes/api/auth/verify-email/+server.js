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
    return json({ error: 'Verification link is invalid or has expired' }, { status: 400 });
  }

  consumeEmailVerificationToken(tokenHash);
  markEmailVerified(record.user_id);
  logAuthEvent('email_verified', { userId: record.user_id, ip, userAgent: ua });

  return json({ ok: true });
}
