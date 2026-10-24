/**
 * Telegram sign-in. The browser gets signed user data from the Telegram Login
 * widget; this verifies the signature with the bot token
 * (https://core.telegram.org/widgets/login#checking-authorization), finds or
 * creates the matching Supabase user, and returns a one-time magic-link token
 * hash that the browser exchanges for a session with `verifyOtp`.
 *
 * Supabase users need an email, so Telegram users get a placeholder address on
 * the reserved `.invalid` domain. No mail is ever sent to it.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { supabaseAdmin } from './supabase-admin.mjs';

const MAX_AGE_SECONDS = 10 * 60;

/** True when `data` carries a valid, recent signature from the bot. */
export function verifyTelegramLogin(data, botToken, now = Date.now() / 1000) {
  if (!data || typeof data !== 'object' || typeof data.hash !== 'string') return false;
  const authDate = Number(data.auth_date);
  if (!Number.isFinite(authDate) || now - authDate > MAX_AGE_SECONDS || authDate - now > 60) return false;
  const checkString = Object.keys(data)
    .filter(key => key !== 'hash' && data[key] !== undefined && data[key] !== null)
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('\n');
  const secret = createHash('sha256').update(botToken).digest();
  const expected = createHmac('sha256', secret).update(checkString).digest();
  const actual = Buffer.from(data.hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function signInWithTelegram(data) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const db = supabaseAdmin();
  if (!botToken || !db) return { status: 503, body: { error: 'Telegram sign-in is not configured on the server.' } };
  if (!verifyTelegramLogin(data, botToken)) return { status: 401, body: { error: 'Telegram sign-in data is invalid or expired.' } };

  const id = String(data.id);
  if (!/^\d{1,20}$/.test(id)) return { status: 400, body: { error: 'Invalid Telegram user id.' } };
  const email = `telegram-${id}@telegram.invalid`;
  const metadata = {
    full_name: [data.first_name, data.last_name].filter(Boolean).join(' ').slice(0, 120) || undefined,
    username: typeof data.username === 'string' ? data.username.slice(0, 64) : undefined,
    avatar_url: typeof data.photo_url === 'string' && data.photo_url.startsWith('https://') ? data.photo_url : undefined,
  };

  // app_metadata cannot be changed by the user, so it marks accounts this endpoint created.
  const appMetadata = { provider: 'telegram', providers: ['telegram'], telegram_id: id };
  const created = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: metadata,
    app_metadata: appMetadata,
  });
  if (created.error && created.error.code !== 'email_exists') {
    console.error('[auth/telegram] Could not create the user:', created.error.message);
    return { status: 500, body: { error: 'Could not create the account.' } };
  }

  const link = await db.auth.admin.generateLink({ type: 'magiclink', email });
  if (link.error || !link.data?.properties?.hashed_token) {
    console.error('[auth/telegram] Could not issue a sign-in token:', link.error?.message);
    return { status: 500, body: { error: 'Could not sign in.' } };
  }
  if (link.data.user.app_metadata?.telegram_id !== id) {
    // Someone registered this placeholder address another way. Never hand that account to a Telegram login.
    console.error('[auth/telegram] Placeholder address belongs to a non-Telegram account:', link.data.user.id);
    return { status: 409, body: { error: 'This Telegram account cannot be used to sign in.' } };
  }
  if (!created.data?.user) {
    // Returning user: keep name and photo in step with Telegram.
    const { error } = await db.auth.admin.updateUserById(link.data.user.id, { user_metadata: metadata });
    if (error) console.error('[auth/telegram] Could not update the profile:', error.message);
  }
  return { status: 200, body: { tokenHash: link.data.properties.hashed_token } };
}
