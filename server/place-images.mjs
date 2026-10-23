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
const POLL_INTERVAL_MS = 5000;
const JOB_TIMEOUT_MS = 180000;
const NEGATIVE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_LOOKUPS_PER_MINUTE = 30;
const MAX_QUEUE = 200;

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
      const url = typeof item === 'string' ? item : item?.image ?? item?.url ?? item?.src;
      if (isHttpsUrl(url)) urls.push(url);
    }
  } else {
    for (const match of String(row.images || '').matchAll(/https:\/\/[^\s"',\]]+/g)) {
      urls.push(match[0]);
    }
  }
  return [...new Set(urls)].slice(0, MAX_IMAGES);
}

export function createPlaceImageService({ baseUrl, cachePath, log = console }) {
  let cache = {};
  try {
    cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  } catch {
    cache = {};
  }

  const inFlight = new Map();
  const recentStarts = [];
  let queueTail = Promise.resolve();
  let queued = 0;

  function persist() {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
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

  async function runScrape(place) {
    const keyword = [place.name, place.address].filter(Boolean).join(' ');
    const created = await (await engine('POST', '/api/v1/jobs', {
      name: `place-image-${place.id}`.slice(0, 60),
      keywords: [keyword],
      lang: 'en',
      zoom: 17,
      lat: String(place.lat),
      lon: String(place.lng),
      fast_mode: true,
      radius: 200,
      depth: 1,
      email: false,
      max_time: 120,
    })).json();

    const deadline = Date.now() + JOB_TIMEOUT_MS;
    for (;;) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      const job = await (await engine('GET', `/api/v1/jobs/${created.id}`)).json();
      if (job.Status === 'failed') throw new Error('Engine job failed');
      if (job.Status === 'ok') break;
      if (Date.now() > deadline) throw new Error('Engine job timed out');
    }

    const csv = await (await engine('GET', `/api/v1/jobs/${created.id}/download`)).text();
    return parseCsv(csv);
  }

  async function lookup(place) {
    const rows = await runScrape(place);
    const match = pickMatch(place, rows);
    const now = Date.now();
    if (!match) {
      cache[place.id] = { status: 'none', checkedAt: now };
    } else {
      const images = extractImages(match);
      cache[place.id] = {
        status: images.length ? 'ok' : 'none',
        imageUrl: images[0],
        images,
        listingTitle: match.title,
        checkedAt: now,
      };
    }
    persist();
    return cache[place.id];
  }

  function cachedResult(id) {
    const entry = cache[id];
    if (!entry) return null;
    if (entry.status === 'none' && Date.now() - entry.checkedAt > NEGATIVE_TTL_MS) return null;
    return entry;
  }

  function budgetAllows() {
    const cutoff = Date.now() - 60000;
    while (recentStarts.length && recentStarts[0] < cutoff) recentStarts.shift();
    return recentStarts.length < MAX_LOOKUPS_PER_MINUTE;
  }

  /**
   * Resolve a place's photos. Returns `{ status: 'ok' | 'none', ... }` from the
   * cache, `{ status: 'pending' }` while a lookup runs, or
   * `{ status: 'unavailable' }` when the engine cannot be reached or the budget
   * is spent.
   */
  async function get(place) {
    const cached = cachedResult(place.id);
    if (cached) return cached;
    if (inFlight.has(place.id)) return { status: 'pending' };
    if (queued >= MAX_QUEUE || !budgetAllows()) return { status: 'unavailable' };

    recentStarts.push(Date.now());
    queued++;
    const task = queueTail.then(() => lookup(place));
    queueTail = task.catch(() => {});
    inFlight.set(place.id, task);
    task
      .catch(error => {
        log.error?.(`[PlaceImages] Lookup failed for ${place.name}:`, error.message);
      })
      .finally(() => {
        queued--;
        inFlight.delete(place.id);
      });
    return { status: 'pending' };
  }

  return { get };
}
