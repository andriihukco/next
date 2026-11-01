// Background worker for the admin «Парсинг» queue. Run it on a machine that can reach the
// Google Maps scraper engine (Docker, SCRAPER_BASE_URL). It is not part of Vercel: a
// serverless function cannot run for the hours a large job takes.
//
//   npm run worker
//
// It claims one queued job at a time (status 'queued' → 'running' in one guarded update),
// searches each category in each tile of the job's circle, and saves the listings as drafts.
import path from 'path';
import { fileURLToPath } from 'url';
import { parseCsv } from './place-images.mjs';
import { planTiles, rowToResult } from './parse-jobs.mjs';
import { supabaseAdmin } from './supabase-admin.mjs';

const ENGINE_URL = process.env.SCRAPER_BASE_URL || 'http://127.0.0.1:8080';
const POLL_INTERVAL_MS = 5000;
const RUN_TIMEOUT_MS = 10 * 60 * 1000;
const IDLE_INTERVAL_MS = 15000;
const MAX_CONSECUTIVE_FAILURES = 3;
const MAX_RESULTS_PER_RUN = 120;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function engine(method, route, body) {
  const response = await fetch(`${ENGINE_URL}${route}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Engine ${method} ${route} returned ${response.status}`);
  return response;
}

/** One engine job around one keyword and one tile. Returns the parsed CSV rows. */
async function searchTile({ keyword, tile }) {
  const created = await (await engine('POST', '/api/v1/jobs', {
    name: `parse-${Date.now()}`.slice(0, 60),
    keywords: [keyword],
    lang: 'uk',
    zoom: 15,
    lat: String(tile.lat),
    lon: String(tile.lng),
    fast_mode: false,
    radius: tile.radiusM,
    depth: 1,
    email: false,
    max_time: 300,
  })).json();

  const deadline = Date.now() + RUN_TIMEOUT_MS;
  for (;;) {
    await sleep(POLL_INTERVAL_MS);
    const job = await (await engine('GET', `/api/v1/jobs/${created.id}`)).json();
    if (job.Status === 'failed') throw new Error('Engine job failed');
    if (job.Status === 'ok') break;
    if (Date.now() > deadline) throw new Error('Engine job timed out');
  }

  const csv = await (await engine('GET', `/api/v1/jobs/${created.id}/download`)).text();
  return parseCsv(csv);
}

async function isCancelRequested(db, jobId) {
  const { data } = await db.from('parse_jobs').select('cancel_requested').eq('id', jobId).maybeSingle();
  return Boolean(data?.cancel_requested);
}

/** Saves drafts. A listing already known from another job is skipped, not duplicated. */
async function saveResults(db, results) {
  if (!results.length) return 0;
  const { data, error } = await db
    .from('parse_results')
    .upsert(results.slice(0, MAX_RESULTS_PER_RUN), { onConflict: 'source,external_id', ignoreDuplicates: true })
    .select('id');
  if (error) throw error;
  return data?.length ?? 0;
}

async function finishJob(db, jobId, status, error = null) {
  const { error: updateError } = await db
    .from('parse_jobs')
    .update({ status, error, finished_at: new Date().toISOString() })
    .eq('id', jobId);
  if (updateError) console.error('[parse-worker] Could not update the job:', updateError.message);
}

/** Runs every category in every tile. Stops early on cancel, or after repeated engine failures. */
export async function runJob(db, job) {
  const tiles = planTiles({ centerLat: job.center_lat, centerLng: job.center_lng, radiusM: job.radius_m });
  const total = tiles.length * job.categories.length;
  await db.from('parse_jobs').update({ progress_total: total }).eq('id', job.id);

  let done = 0;
  let found = 0;
  let failures = 0;
  for (const category of job.categories) {
    for (const tile of tiles) {
      if (await isCancelRequested(db, job.id)) {
        await finishJob(db, job.id, 'cancelled');
        return;
      }
      try {
        const rows = await searchTile({ keyword: category, tile });
        const results = rows
          .map(row => rowToResult(row, { category, job, includePhotos: job.include_photos }))
          .filter(Boolean);
        found += await saveResults(db, results);
        failures = 0;
      } catch (error) {
        failures += 1;
        console.error(`[parse-worker] ${category} at ${tile.lat.toFixed(4)},${tile.lng.toFixed(4)} failed:`, error.message);
        if (failures >= MAX_CONSECUTIVE_FAILURES) {
          await finishJob(db, job.id, 'failed', `Зупинено після ${failures} помилок: ${error.message}`.slice(0, 500));
          return;
        }
      }
      done += 1;
      await db.from('parse_jobs').update({ progress_done: done, found_count: found }).eq('id', job.id);
    }
  }
  await finishJob(db, job.id, 'done');
}

/** Moves one queued job to running. The guard on status makes this safe against a second worker. */
async function claimNextJob(db) {
  const { data: next } = await db
    .from('parse_jobs')
    .select('id')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!next) return null;
  const { data } = await db
    .from('parse_jobs')
    .update({ status: 'running', started_at: new Date().toISOString(), progress_done: 0, found_count: 0, error: null })
    .eq('id', next.id)
    .eq('status', 'queued')
    .select('*')
    .maybeSingle();
  return data ?? null;
}

/** A worker that stopped mid-job leaves it 'running'. Mark those failed so the queue moves on. */
async function failInterruptedJobs(db) {
  await db
    .from('parse_jobs')
    .update({ status: 'failed', error: 'Воркер зупинився під час завдання.', finished_at: new Date().toISOString() })
    .eq('status', 'running');
}

export async function startWorker() {
  const db = supabaseAdmin();
  if (!db) {
    console.error('[parse-worker] Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }
  await failInterruptedJobs(db);
  console.log(`[parse-worker] Waiting for jobs. Engine: ${ENGINE_URL}`);
  for (;;) {
    const job = await claimNextJob(db).catch(error => {
      console.error('[parse-worker] Could not claim a job:', error.message);
      return null;
    });
    if (!job) {
      await sleep(IDLE_INTERVAL_MS);
      continue;
    }
    console.log(`[parse-worker] Job ${job.id} «${job.name}» started.`);
    try {
      await runJob(db, job);
    } catch (error) {
      console.error(`[parse-worker] Job ${job.id} crashed:`, error.message);
      await finishJob(db, job.id, 'failed', String(error.message).slice(0, 500));
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startWorker();
}
