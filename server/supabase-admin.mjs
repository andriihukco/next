// Supabase client with the service role key. Server only: it bypasses row level security.
import { createClient } from '@supabase/supabase-js';

let client;

/** Returns null when the server keys are not set. */
export function supabaseAdmin() {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  client = url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
  return client;
}
