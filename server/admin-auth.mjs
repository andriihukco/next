// Role check for /api/admin/* (platform-plan S2). The caller's own access token proves who
// they are; the role comes from public.profiles. Admin rights also need an AAL2 (MFA)
// session, the same rule the database enforces in public.is_admin().
import { supabaseAdmin } from './supabase-admin.mjs';

/** Reads `aal` from a token that auth.getUser has already verified. */
function assuranceLevel(accessToken) {
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'));
    return payload.aal === 'aal2' ? 'aal2' : 'aal1';
  } catch {
    return 'aal1';
  }
}

/**
 * Returns { user, role, aal } for a signed-in editor or admin, or { status, body } to send back.
 * `need: 'admin'` also requires AAL2.
 */
export async function staffFromRequest(req, need = 'editor') {
  const db = supabaseAdmin();
  if (!db) return { status: 503, body: { error: 'Admin is not configured on the server.' } };
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { status: 401, body: { error: 'Sign in first.' } };
  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user) return { status: 401, body: { error: 'The session has expired. Sign in again.' } };
  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profileError) {
    console.error('[admin] Could not read the profile:', profileError.message);
    return { status: 502, body: { error: 'Could not check your role.' } };
  }
  const role = profile?.role ?? 'user';
  const aal = assuranceLevel(token);
  if (role !== 'editor' && role !== 'admin') return { status: 403, body: { error: 'Forbidden' } };
  if (need === 'admin' && (role !== 'admin' || aal !== 'aal2')) {
    return { status: 403, body: { error: role === 'admin' ? 'Confirm with your second factor.' : 'Forbidden' } };
  }
  return { user: data.user, role, aal };
}

/** GET /api/admin/me: who the caller is in admin terms. */
export async function adminMe(req) {
  const staff = await staffFromRequest(req);
  if (staff.status) return staff;
  return {
    status: 200,
    body: { role: staff.role, aal: staff.aal, mfaRequired: staff.role === 'admin' && staff.aal !== 'aal2' },
  };
}
