// Creates (or resets) an admin account on a LOCAL Supabase stack (`supabase start`).
// It refuses any other host, so it can never create an admin on staging or production.
//
//   LOCAL_ADMIN_EMAIL=admin@local.test LOCAL_ADMIN_PASSWORD=… \
//   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=… \
//   node scripts/create-local-admin.mjs
//
// Keep the values in .env.development.local (git-ignored). The first visit to /admin
// still asks for a second factor (TOTP): admin rights need an AAL2 session.
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const email = process.env.LOCAL_ADMIN_EMAIL || 'admin@local.test';
const password = process.env.LOCAL_ADMIN_PASSWORD || '';

const host = (() => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
})();
if (!['localhost', '127.0.0.1', '[::1]'].includes(host)) {
  console.error(`Refusing: ${host || 'no SUPABASE_URL'} is not a local Supabase. Run \`supabase start\` and use its URL.`);
  process.exit(1);
}
if (!serviceKey) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY (printed by `supabase status`).');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Set LOCAL_ADMIN_PASSWORD to at least 8 characters.');
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: list, error: listError } = await db.auth.admin.listUsers({ perPage: 1000 });
if (listError) throw listError;
let user = list.users.find((item) => item.email === email);
if (user) {
  const { error } = await db.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  if (error) throw error;
} else {
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  user = data.user;
}

// handle_new_user() creates the profile row; upsert covers users made before the trigger.
const { error: roleError } = await db.from('profiles').upsert({ id: user.id, role: 'admin' });
if (roleError) throw roleError;
console.log(`Admin ready: ${email} on ${url}. Open /admin and enrol the second factor.`);
