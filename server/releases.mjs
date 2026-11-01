// «Що нового» (platform-plan S7). Public list of release notes, and the CI-only write.
import { timingSafeEqual } from 'crypto';
import { releaseRowFrom } from './lib/release-note.mjs';
import { supabaseAdmin } from './supabase-admin.mjs';

const tokenMatches = (given, expected) => {
  const a = Buffer.from(given || '');
  const b = Buffer.from(expected || '');
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
};

/** Newest first, without `internal` notes. */
export async function listReleases() {
  const db = supabaseAdmin();
  if (!db) return { status: 503, body: { error: 'Release notes are not configured on the server.' } };
  const { data, error } = await db
    .from('releases')
    .select('id, pr_number, category, title_uk, body_uk, preview_url, published_at')
    .neq('category', 'internal')
    .order('published_at', { ascending: false })
    .limit(200);
  if (error) {
    console.error('[releases] Could not read releases:', error.message);
    return { status: 502, body: { error: 'Release notes are temporarily unavailable.' } };
  }
  return { status: 200, body: { data } };
}

/** Called by the release-notes GitHub Action with RELEASES_CI_TOKEN. One row per PR. */
export async function publishRelease(authorization, payload) {
  const expected = process.env.RELEASES_CI_TOKEN;
  if (!expected) return { status: 503, body: { error: 'Release publishing is not configured.' } };
  if (!tokenMatches((authorization || '').replace(/^Bearer\s+/i, ''), expected)) {
    return { status: 401, body: { error: 'Unauthorized' } };
  }
  const { row, error: invalid } = releaseRowFrom(payload);
  if (invalid) return { status: 400, body: { error: invalid } };
  const db = supabaseAdmin();
  if (!db) return { status: 503, body: { error: 'Release notes are not configured on the server.' } };
  const { data, error } = await db.from('releases').upsert(row, { onConflict: 'pr_number' }).select('id').single();
  if (error) {
    console.error('[releases] Could not save the release:', error.message);
    return { status: 500, body: { error: 'Could not save the release note.' } };
  }
  return { status: 200, body: { id: data.id } };
}
