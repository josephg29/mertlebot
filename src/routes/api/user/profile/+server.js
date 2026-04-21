import { json } from '@sveltejs/kit';
import {
  getUserProfile,
  updateUserProfile,
  updateNotificationPrefs,
  updatePrivacySettings,
} from '$lib/server/db.js';

export async function GET({ locals }) {
  const profile = getUserProfile(locals.session.user_id);
  if (!profile) return json({ error: 'User not found' }, { status: 404 });

  return json({
    id: profile.id,
    email: profile.email,
    display_name: profile.display_name ?? '',
    avatar_url: profile.avatar_url ?? '',
    bio: profile.bio ?? '',
    notification_prefs: JSON.parse(profile.notification_prefs || '{}'),
    privacy_settings: JSON.parse(profile.privacy_settings || '{}'),
    created_at: profile.created_at,
    email_verified_at: profile.email_verified_at,
  });
}

export async function PUT({ request, locals }) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

  const { display_name, avatar_url, bio, notification_prefs, privacy_settings } = body;
  const userId = locals.session.user_id;

  if (display_name !== undefined) {
    if (typeof display_name !== 'string' || display_name.length > 80) {
      return json({ error: 'Display name must be 80 characters or fewer' }, { status: 400 });
    }
  }
  if (bio !== undefined) {
    if (typeof bio !== 'string' || bio.length > 500) {
      return json({ error: 'Bio must be 500 characters or fewer' }, { status: 400 });
    }
  }
  if (avatar_url !== undefined && avatar_url !== null && avatar_url !== '') {
    if (typeof avatar_url !== 'string' || avatar_url.length > 500) {
      return json({ error: 'Avatar URL too long' }, { status: 400 });
    }
    if (!/^https?:\/\/.+/.test(avatar_url)) {
      return json({ error: 'Avatar URL must start with http:// or https://' }, { status: 400 });
    }
  }

  if (display_name !== undefined || avatar_url !== undefined || bio !== undefined) {
    const current = getUserProfile(userId);
    updateUserProfile(userId, {
      display_name: display_name !== undefined ? display_name.trim() || null : current?.display_name ?? null,
      avatar_url: avatar_url !== undefined ? avatar_url || null : current?.avatar_url ?? null,
      bio: bio !== undefined ? bio.trim() || null : current?.bio ?? null,
    });
  }

  if (notification_prefs !== undefined) {
    if (typeof notification_prefs !== 'object' || notification_prefs === null || Array.isArray(notification_prefs)) {
      return json({ error: 'Invalid notification preferences' }, { status: 400 });
    }
    updateNotificationPrefs(userId, notification_prefs);
  }

  if (privacy_settings !== undefined) {
    if (typeof privacy_settings !== 'object' || privacy_settings === null || Array.isArray(privacy_settings)) {
      return json({ error: 'Invalid privacy settings' }, { status: 400 });
    }
    updatePrivacySettings(userId, privacy_settings);
  }

  return json({ ok: true });
}
