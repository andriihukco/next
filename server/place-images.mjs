/**
 * Place photo lookup backed by the local google-maps-scraper engine
 * (https://github.com/Mahanaicoach/google-maps-scraper-kit, engine
 * gosom/google-maps-scraper). The engine runs in Docker on 127.0.0.1:8080.
 *
 * A lookup creates a one-result job around the place's name and coordinates,
 * polls it, downloads the CSV, and keeps the `thumbnail` and `images` of the
 * listing that matches the place. Results are cached in data/place-images.json
 * so each place costs at most one scrape.
 *
 * Lookups are slow (tens of seconds), so callers get `pending` at once and ask
 * again later. Only one job runs at a time.
 */
import fs from 'fs';
import path from 'path';

const MATCH_RADIUS_METERS = 150;
const MAX_IMAGES = 6;
const MAX_REVIEWS = 5;
const POLL_INTERVAL_MS = 5000;
const BATCH_TIMEOUT_MS = 480000;
const BATCH_MAX_TIME_S = 420;
const BATCH_WINDOW_MS = 3000;
const MAX_BATCH = 25;
const NEGATIVE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_LOOKUPS_PER_MINUTE = 30;
const MAX_QUEUE = 200;
// Bump when the stored shape or the matching changes, so old results are looked up again.
const CACHE_VERSION = 2;
const FAILURE_BACKOFF_MS = 30 * 1000;

/** Parse RFC 4180 CSV into an array of row objects keyed by header. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header = [], ...body] = rows.filter(cells => cells.some(cell => cell !== ''));
  return body.map(cells => Object.fromEntries(header.map((name, index) => [name, cells[index] ?? ''])));
}

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function distanceMeters(aLat, aLng, bLat, bLng) {
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function namesMatch(placeName, listingName) {
  const a = normalizeName(placeName);
  const b = normalizeName(listingName);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

/**
 * Choose the scraped listing that is the place: same name, close by.
 * Returns null when no listing is confidently the place.
 */
export function pickMatch(place, rows) {
  let best = null;
  for (const row of rows) {
    if (!namesMatch(place.name, row.title)) continue;
    const lat = Number(row.latitude);
    const lng = Number(row.longitude);
    const distance = Number.isFinite(lat) && Number.isFinite(lng)
      ? distanceMeters(place.lat, place.lng, lat, lng)
      : Infinity;
    if (distance > MATCH_RADIUS_METERS) continue;
    if (!best || distance < best.distance) best = { row, distance };
  }
  return best?.row ?? null;
}

function isHttpsUrl(value) {
  return typeof value === 'string' && /^https:\/\//.test(value);
}

/**
 * The engine writes `images` as a JSON array of objects, so read the URL from
 * each object. Fall back to scanning the raw text for URLs when it is not JSON.
 */
export function extractImages(row) {
  const urls = [];
  if (isHttpsUrl(row.thumbnail)) urls.push(row.thumbnail);
  let parsed = null;
  try {
    parsed = JSON.parse(row.images || 'null');
  } catch {
    parsed = null;
  }
  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      const url = typeof item === 'string' ? item : item?.Image ?? item?.image ?? item?.url ?? item?.src;
      if (isHttpsUrl(url)) urls.push(url);
    }
  } else {
    for (const match of String(row.images || '').matchAll(/https:\/\/[^\s"',\]]+/g)) {
      urls.push(match[0]);
    }
  }
  return [...new Set(urls)].slice(0, MAX_IMAGES);
}

function parseJson(value) {
  try {
    return JSON.parse(value || 'null');
  } catch {
    return null;
  }
}

/** The engine writes `complete_address` as a JSON object; join its parts. */
function formatAddress(row) {
  const parts = parseJson(row.complete_address);
  if (parts && typeof parts === 'object') {
    return [parts.street, parts.city, parts.postal_code].filter(Boolean).join(', ');
  }
  return row.address || '';
}

/** Contact, hours, rating and reviews from the matched listing. */
export function extractDetails(row) {
  const hours = parseJson(row.open_hours);
  const reviews = parseJson(row.user_reviews);
  const menu = parseJson(row.menu);
  return {
    category: row.category || undefined,
    address: formatAddress(row) || undefined,
    phone: row.phone || undefined,
    website: row.website || undefined,
    rating: Number(row.review_rating) || undefined,
    reviewCount: Number(row.review_count) || undefined,
    openHours: hours && typeof hours === 'object'
      ? Object.entries(hours).map(([day, slots]) => ({ day, hours: Array.isArray(slots) ? slots.join(', ') : String(slots) }))
      : [],
    reviews: (Array.isArray(reviews) ? reviews : []).slice(0, MAX_REVIEWS).map(review => ({
      author: review.Name || '',
      rating: Number(review.Rating) || undefined,
      text: review.Description || '',
      when: review.When || '',
    })),
    menuLink: menu?.link || undefined,
  };
}

export function createPlaceImageService({ baseUrl, cachePath, log = console }) {
  let cache = {};
  try {
    cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  } catch {
    cache = {};
  }

  // Places waiting for the next batch, and places in a batch that is queued or running.
  const waiting = new Map();
  const inBatch = new Set();
  const recentStarts = [];
  // After a failed batch, answer `unavailable` for a while instead of making
  // every card poll for minutes against an engine that is not running.
  let backoffUntil = 0;
  let queueTail = Promise.resolve();
  let flushTimer = null;

  function persist() {
    try {
      fs.mkdirSync(path.dirname(cachePath), { recursive: true });
      fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
    } catch (error) {
      // Serverless file systems are read-only; the in-memory cache still serves this instance.
      log.error('[place-images] Could not save the cache.', error);
    }
  }

  async function engine(method, route, body) {
    const response = await fetch(`${baseUrl}${route}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Engine ${method} ${route} returned ${response.status}`);
    return response;
  }

  /**
   * One engine job for many places: every place is a keyword, and the search
   * centre and radius cover all of them. Each place is then matched by name and
   * distance from the rows, so one job answers the whole batch.
   */
  function batchBody(places) {
    const lat = places.reduce((sum, place) => sum + place.lat, 0) / places.length;
    const lng = places.reduce((sum, place) => sum + place.lng, 0) / places.length;
    const reach = Math.max(...places.map(place => distanceMeters(lat, lng, place.lat, place.lng)));
    return {
      name: `place-images-${Date.now()}`.slice(0, 60),
      keywords: places.map(place => [place.name, place.address].filter(Boolean).join(' ')),
      lang: 'en',
      zoom: 17,
      lat: String(lat),
      lon: String(lng),
      fast_mode: false,
      radius: Math.ceil(Math.max(1000, reach + 500)),
      depth: 1,
      email: false,
      max_time: BATCH_MAX_TIME_S,
    };
  }

  async function runBatch(places) {
    const created = await (await engine('POST', '/api/v1/jobs', batchBody(places))).json();

    const deadline = Date.now() + BATCH_TIMEOUT_MS;
    for (;;) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      const job = await (await engine('GET', `/api/v1/jobs/${created.id}`)).json();
      if (job.Status === 'failed') throw new Error('Engine job failed');
      if (job.Status === 'ok') break;
      if (Date.now() > deadline) throw new Error('Engine job timed out');
    }

    const csv = await (await engine('GET', `/api/v1/jobs/${created.id}/download`)).text();
    const rows = parseCsv(csv);
    const now = Date.now();
    for (const place of places) {
      const match = pickMatch(place, rows);
      if (!match) {
        cache[place.id] = { status: 'none', version: CACHE_VERSION, checkedAt: now };
        continue;
      }
      const images = extractImages(match);
      cache[place.id] = {
        status: 'ok',
        version: CACHE_VERSION,
        imageUrl: images[0],
        images,
        details: extractDetails(match),
        listingTitle: match.title,
        checkedAt: now,
      };
    }
    persist();
  }

  function flush() {
    flushTimer = null;
    const places = [...waiting.values()].slice(0, MAX_BATCH);
    for (const place of places) {
      waiting.delete(place.id);
      inBatch.add(place.id);
    }
    if (!places.length) return;

    const task = queueTail.then(() => runBatch(places));
    queueTail = task.catch(() => {});
    task
      .catch(error => {
        backoffUntil = Date.now() + FAILURE_BACKOFF_MS;
        log.error?.(`[PlaceImages] Batch of ${places.length} failed:`, error.message);
      })
      .finally(() => {
        for (const place of places) inBatch.delete(place.id);
        if (waiting.size) scheduleFlush(BATCH_WINDOW_MS);
      });
    if (waiting.size) scheduleFlush(BATCH_WINDOW_MS);
  }

  function scheduleFlush(delay) {
    if (flushTimer) return;
    flushTimer = setTimeout(flush, delay);
  }

  function cachedResult(id) {
    const entry = cache[id];
    if (!entry || entry.version !== CACHE_VERSION) return null;
    if (entry.status === 'none' && Date.now() - entry.checkedAt > NEGATIVE_TTL_MS) return null;
    return entry;
  }

  function budgetAllows() {
    const cutoff = Date.now() - 60000;
    while (recentStarts.length && recentStarts[0] < cutoff) recentStarts.shift();
    return recentStarts.length < MAX_LOOKUPS_PER_MINUTE;
  }

  /**
   * Resolve a place's photos and listing details. Returns `{ status: 'ok' | 'none', ... }`
   * from the cache, `{ status: 'pending' }` while its batch runs, or
   * `{ status: 'unavailable' }` when the engine is backing off or the budget is spent.
   * Places asked for within the batch window share one engine job.
   */
  async function get(place) {
    const cached = cachedResult(place.id);
    if (cached) return cached;
    if (waiting.has(place.id) || inBatch.has(place.id)) return { status: 'pending' };
    if (Date.now() < backoffUntil || waiting.size + inBatch.size >= MAX_QUEUE || !budgetAllows()) {
      return { status: 'unavailable' };
    }

    recentStarts.push(Date.now());
    waiting.set(place.id, place);
    if (waiting.size >= MAX_BATCH) {
      clearTimeout(flushTimer);
      flushTimer = null;
      flush();
    } else {
      scheduleFlush(BATCH_WINDOW_MS);
    }
    return { status: 'pending' };
  }

  return { get };
}
