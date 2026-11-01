// Admin «Парсинг» (platform-plan, admin toolkit). The API only queues and reviews jobs.
// The scraping runs in server/parse-worker.mjs, which may run on a machine with Docker.
// Every route needs an admin with an AAL2 session (see admin-auth.mjs).
import { extractDetails, extractImages } from './place-images.mjs';
import { readJsonBody, sendJson } from './lib/http.mjs';
import { staffFromRequest } from './admin-auth.mjs';
import { supabaseAdmin } from './supabase-admin.mjs';

export const TILE_RADIUS_M = 1500;
// Tiles overlap a little, so the circles cover the whole area.
const TILE_STEP_M = Math.round(TILE_RADIUS_M * 1.4);
// One job sends one engine request per tile and category. Above this the job is refused.
export const MAX_ENGINE_RUNS = 400;
const MAX_CATEGORIES = 20;
const CATEGORY_PATTERN = /^[a-z][a-z-]{1,40}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RESULT_STATUSES = ['draft', 'approved', 'rejected'];

export function distanceMeters(aLat, aLng, bLat, bLng) {
  const toRad = deg => (deg * Math.PI) / 180;
  const h =
    Math.sin(toRad(bLat - aLat) / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(toRad(bLng - aLng) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Lower-case kebab slug for a category typed by an admin, or null when nothing usable is left. */
export function slugCategory(value) {
  const slug = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return CATEGORY_PATTERN.test(slug) ? slug : null;
}

/**
 * Grid of search circles that covers a job's circle. Each tile is one engine run.
 * Tiles may reach past the job circle; listings outside it are dropped in rowToResult.
 */
export function planTiles({ centerLat, centerLng, radiusM }) {
  const latStep = TILE_STEP_M / 111320;
  const lngStep = TILE_STEP_M / (111320 * Math.cos((centerLat * Math.PI) / 180));
  const span = Math.ceil((radiusM + TILE_RADIUS_M) / TILE_STEP_M);
  const tiles = [];
  for (let row = -span; row <= span; row++) {
    for (let col = -span; col <= span; col++) {
      const lat = centerLat + row * latStep;
      const lng = centerLng + col * lngStep;
      if (distanceMeters(centerLat, centerLng, lat, lng) <= radiusM + TILE_RADIUS_M / 2) {
        tiles.push({ lat, lng, radiusM: TILE_RADIUS_M });
      }
    }
  }
  return tiles;
}

/** Checks a job request. Returns `{ value }` with clean fields, or `{ error }` in Ukrainian. */
export function validateJobInput(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (name.length < 1 || name.length > 120) return { error: 'Назвіть завдання (до 120 символів).' };

  const rawCategories = Array.isArray(body?.categories) ? body.categories : [];
  const categories = [...new Set(rawCategories.map(slugCategory).filter(Boolean))];
  if (!categories.length) return { error: 'Додайте хоча б одну категорію латиницею, наприклад cafe.' };
  if (categories.length > MAX_CATEGORIES) return { error: `Не більше ${MAX_CATEGORIES} категорій в одному завданні.` };

  const centerLat = Number(body?.centerLat);
  const centerLng = Number(body?.centerLng);
  if (!Number.isFinite(centerLat) || centerLat < -90 || centerLat > 90) return { error: 'Широта центру некоректна.' };
  if (!Number.isFinite(centerLng) || centerLng < -180 || centerLng > 180) return { error: 'Довгота центру некоректна.' };

  const radiusM = Math.round(Number(body?.radiusM));
  if (!Number.isFinite(radiusM) || radiusM < 200 || radiusM > 30000) {
    return { error: 'Радіус має бути від 200 м до 30 км.' };
  }

  const runs = planTiles({ centerLat, centerLng, radiusM }).length * categories.length;
  if (runs > MAX_ENGINE_RUNS) {
    return { error: `Завдання дає ${runs} запитів, це більше ліміту ${MAX_ENGINE_RUNS}. Зменште радіус або категорії.` };
  }

  return {
    value: {
      name,
      categories,
      center_lat: centerLat,
      center_lng: centerLng,
      radius_m: radiusM,
      include_photos: body?.includePhotos !== false,
    },
  };
}

const parseJson = value => {
  try {
    return JSON.parse(value || 'null');
  } catch {
    return null;
  }
};

/**
 * Turns one CSV row from the engine into a draft result, or null when the row is unusable
 * or lies outside the job circle. Review texts are not stored, and photos only when asked.
 */
export function rowToResult(row, { category, job, includePhotos }) {
  const name = String(row.title || '').trim();
  const lat = Number(row.latitude);
  const lng = Number(row.longitude);
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (distanceMeters(job.center_lat, job.center_lng, lat, lng) > job.radius_m) return null;

  const details = extractDetails(row);
  const hours = parseJson(row.open_hours);
  const openHours = hours && typeof hours === 'object'
    ? Object.entries(hours).map(([day, slots]) => ({ day, hours: Array.isArray(slots) ? slots.join(', ') : String(slots) }))
    : [];
  const externalId = String(row.data_id || row.cid || row.link || `${name}@${lat.toFixed(5)},${lng.toFixed(5)}`).slice(0, 200);
  const rating = Number(row.review_rating);
  const reviewCount = Math.round(Number(row.review_count));

  return {
    job_id: job.id,
    source: 'google_maps',
    external_id: externalId,
    category,
    name: name.slice(0, 200),
    address: details.address?.slice(0, 300) || null,
    lat,
    lng,
    phone: details.phone?.slice(0, 40) || null,
    website: /^https?:\/\//.test(details.website || '') ? details.website.slice(0, 500) : null,
    rating: rating > 0 && rating <= 5 ? rating : null,
    review_count: Number.isFinite(reviewCount) && reviewCount >= 0 ? reviewCount : null,
    photo_urls: includePhotos ? extractImages(row).filter(url => url.startsWith('https://')) : [],
    details: { openHours: openHours.slice(0, 7) },
  };
}

/** Maps a result to a `places` row for approval. Scraped photos are not copied; the admin adds them. */
export function placeRowFrom(result, actorId) {
  const hours = Array.isArray(result.details?.openHours)
    ? result.details.openHours.map(item => `${item.day} ${item.hours}`).join('; ').slice(0, 300)
    : '';
  return {
    name_uk: result.name,
    category: result.category,
    address: result.address,
    lat: result.lat,
    lng: result.lng,
    phone: result.phone,
    website: result.website?.startsWith('https://') ? result.website : null,
    hours: hours || null,
    status: 'draft',
    created_by: actorId,
  };
}

// ─── HTTP ──────────────────────────────────────────────────────────────────────

const JOB_COLUMNS =
  'id, name, categories, center_lat, center_lng, radius_m, include_photos, status, cancel_requested, progress_done, progress_total, found_count, error, created_at, started_at, finished_at';

async function listJobs(db) {
  const { data, error } = await db.from('parse_jobs').select(JOB_COLUMNS).order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return { status: 200, body: { data } };
}

async function createJob(db, actorId, body) {
  const { value, error } = validateJobInput(body);
  if (error) return { status: 400, body: { error } };
  const { data, error: insertError } = await db
    .from('parse_jobs')
    .insert({ ...value, created_by: actorId })
    .select(JOB_COLUMNS)
    .single();
  if (insertError) throw insertError;
  return { status: 201, body: { data } };
}

async function cancelJob(db, id) {
  const { data: job, error } = await db.from('parse_jobs').select('id, status').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!job) return { status: 404, body: { error: 'Завдання не знайдено.' } };
  if (job.status === 'queued') {
    const { error: updateError } = await db.from('parse_jobs').update({ status: 'cancelled', finished_at: new Date().toISOString() }).eq('id', id);
    if (updateError) throw updateError;
  } else if (job.status === 'running') {
    // The worker checks this flag between engine runs and stops there.
    const { error: updateError } = await db.from('parse_jobs').update({ cancel_requested: true }).eq('id', id);
    if (updateError) throw updateError;
  } else {
    return { status: 409, body: { error: 'Це завдання вже завершилось.' } };
  }
  return { status: 200, body: { id, cancelRequested: job.status === 'running' } };
}

async function listResults(db, jobId, status) {
  const { data, error } = await db
    .from('parse_results')
    .select('id, job_id, category, name, address, lat, lng, phone, website, rating, review_count, photo_urls, status, place_id, created_at')
    .eq('job_id', jobId)
    .eq('status', status)
    .order('created_at', { ascending: true })
    .limit(500);
  if (error) throw error;
  return { status: 200, body: { data } };
}

/** Approve writes a draft `places` row; reject only marks the result. Both are audited by the trigger. */
async function reviewResult(db, actorId, id, action) {
  const { data: result, error } = await db.from('parse_results').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!result) return { status: 404, body: { error: 'Результат не знайдено.' } };
  if (result.status !== 'draft') return { status: 409, body: { error: 'Результат вже перевірено.' } };

  let placeId = null;
  if (action === 'approve') {
    const { data: place, error: placeError } = await db.from('places').insert(placeRowFrom(result, actorId)).select('id').single();
    if (placeError) throw placeError;
    placeId = place.id;
  }
  const { error: updateError } = await db
    .from('parse_results')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      place_id: placeId,
      reviewed_by: actorId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (updateError) throw updateError;
  return { status: 200, body: { id, status: action === 'approve' ? 'approved' : 'rejected', placeId } };
}

/**
 * Routes under /api/admin/parse. Returns false when the path is not one of them, so the
 * caller can try its other routes.
 */
export async function handleParseRequest(req, res, url) {
  const pathname = url.pathname.replace(/\/+$/, '');
  if (!pathname.startsWith('/api/admin/parse')) return false;
  const headers = { 'Cache-Control': 'no-store' };

  const staff = await staffFromRequest(req, 'admin');
  if (staff.status) {
    sendJson(res, staff.status, staff.body, headers);
    return true;
  }
  const db = supabaseAdmin();
  if (!db) {
    sendJson(res, 503, { error: 'Admin is not configured on the server.' }, headers);
    return true;
  }

  try {
    let result = null;
    if (pathname === '/api/admin/parse/jobs' && req.method === 'GET') {
      result = await listJobs(db);
    } else if (pathname === '/api/admin/parse/jobs' && req.method === 'POST') {
      let body;
      try {
        body = await readJsonBody(req, 8192);
      } catch {
        sendJson(res, 400, { error: 'Invalid request body' }, headers);
        return true;
      }
      result = await createJob(db, staff.user.id, body);
    } else {
      const cancel = pathname.match(/^\/api\/admin\/parse\/jobs\/([^/]+)\/cancel$/);
      const results = pathname.match(/^\/api\/admin\/parse\/jobs\/([^/]+)\/results$/);
      const review = pathname.match(/^\/api\/admin\/parse\/results\/([^/]+)$/);
      if (cancel && req.method === 'POST' && UUID_PATTERN.test(cancel[1])) {
        result = await cancelJob(db, cancel[1]);
      } else if (results && req.method === 'GET' && UUID_PATTERN.test(results[1])) {
        const status = RESULT_STATUSES.includes(url.searchParams.get('status')) ? url.searchParams.get('status') : 'draft';
        result = await listResults(db, results[1], status);
      } else if (review && req.method === 'POST' && UUID_PATTERN.test(review[1])) {
        let body;
        try {
          body = await readJsonBody(req);
        } catch {
          sendJson(res, 400, { error: 'Invalid request body' }, headers);
          return true;
        }
        if (body?.action !== 'approve' && body?.action !== 'reject') {
          sendJson(res, 400, { error: 'action must be approve or reject' }, headers);
          return true;
        }
        result = await reviewResult(db, staff.user.id, review[1], body.action);
      }
    }
    if (!result) {
      sendJson(res, 404, { error: 'Not found' }, headers);
      return true;
    }
    sendJson(res, result.status, result.body, headers);
  } catch (error) {
    console.error('[parse] Request failed:', error?.message);
    sendJson(res, 500, { error: 'Could not complete the request.' }, headers);
  }
  return true;
}
