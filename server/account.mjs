// Account deletion (platform-plan S8; App Store rule 5.1.1(v)). The caller proves who they are
// with their own access token; the service role then deletes the auth user. Rows that
// reference auth.users (push_subscriptions, profiles) go with it through ON DELETE CASCADE.
import { supabaseAdmin } from './supabase-admin.mjs';

export async function deleteAccount(accessToken) {
  const db = supabaseAdmin();
  if (!db) return { status: 503, body: { error: 'Accounts are not configured on the server.' } };
  if (!accessToken) return { status: 401, body: { error: 'Sign in to delete your account.' } };
  const { data, error: authError } = await db.auth.getUser(accessToken);
  if (authError || !data?.user) return { status: 401, body: { error: 'The session has expired. Sign in again.' } };
  const { error } = await db.auth.admin.deleteUser(data.user.id);
  if (error) {
    console.error('[account] Could not delete user:', error.message);
    return { status: 500, body: { error: 'Could not delete the account. Try again later.' } };
  }
  return { status: 200, body: { deleted: true } };
}
