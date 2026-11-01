import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPlaceImageService } from './place-images.mjs';
import { signInWithTelegram } from './auth-telegram.mjs';
import { deleteAccount } from './account.mjs';
import { dispatchAirAlertPush, sendTestPush } from './push.mjs';
import { getAirAlert, loadAirAlert } from './feeds/air-alert.mjs';
import { loadBuildings } from './feeds/buildings.mjs';
import { getStops, getTripShape, loadRouteShapes } from './feeds/gtfs-static.mjs';
import { fetchLiveVehicles, getVehicles } from './feeds/vehicles.mjs';
import { readJsonBody, sendJson } from './lib/http.mjs';

/*
 * HTTP entry for every /api/* route, shared by the local server (server.js) and
 * the Vercel function (api/[...path].js). Feeds live in ./feeds, pure helpers in ./lib.
 */

const __filename = fileURLToPath(import.meta.url);
// Data files live at the repository root, one level above this module.
const ROOT = path.join(path.dirname(__filename), '..');

// Photos for places come from the local Google Maps scraper engine (Docker).
// When it is not running, /api/place-images answers `unavailable`.
const placeImages = createPlaceImageService({
  baseUrl: process.env.SCRAPER_BASE_URL || 'http://127.0.0.1:8080',
  cachePath: path.join(ROOT, 'data', 'place-images.json'),
});

const cachedShelters = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data/shelters.json'), 'utf8')
);

// Serverless instances have no background loop, so each feed refreshes on demand
// once its copy is older than ttlMs. A load that returns false is retried next time.
function onDemand(load, ttlMs) {
  let loadedAt = 0;
  let pending = null;
  return () => {
    if (Date.now() - loadedAt < ttlMs) return Promise.resolve();
    pending ??= load()
      .then(result => { if (result !== false) loadedAt = Date.now(); })
      .finally(() => { pending = null; });
    return pending;
  };
}

const refreshShapes = onDemand(loadRouteShapes, 6 * 60 * 60 * 1000);
const refreshVehicles = onDemand(async () => { await refreshShapes(); await fetchLiveVehicles(); }, 2500);
const refreshAirAlert = onDemand(loadAirAlert, 30 * 1000);

/** Keeps every feed warm in a long-running process (local `npm run server`). */
export function startPolling() {
  void refreshVehicles();
  void refreshAirAlert();
  setInterval(refreshVehicles, 2500);
  setInterval(async () => {
    await refreshAirAlert();
    if (process.env.PUSH_DISPATCH_IN_PROCESS === 'true') await dispatchAirAlertPush(getAirAlert());
  }, 30 * 1000);
}

export async function handleApiRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', 'http://localhost');
  const pathname = url.pathname.replace(/\/+$/, '');

  if (pathname === '/api/auth/telegram' && req.method === 'POST') {
    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { error: 'Invalid request body' });
      return;
    }
    const result = await signInWithTelegram(payload);
    sendJson(res, result.status, result.body, { 'Cache-Control': 'no-store' });
    return;
  }

  if (pathname === '/api/account/delete' && req.method === 'POST') {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const result = await deleteAccount(token);
    sendJson(res, result.status, result.body, { 'Cache-Control': 'no-store' });
    return;
  }

  if (pathname === '/api/push/test' && req.method === 'POST') {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const result = await sendTestPush(token);
    sendJson(res, result.status, result.body, { 'Cache-Control': 'no-store' });
    return;
  }

  if (pathname === '/api/cron/air-alert') {
    // Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; any other scheduler must do the same.
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
      sendJson(res, 401, { error: 'Unauthorized' });
      return;
    }
    await refreshAirAlert();
    const result = await dispatchAirAlertPush(getAirAlert());
    sendJson(res, 200, result, { 'Cache-Control': 'no-store' });
    return;
  }

  if (pathname === '/api/vehicles') {
    await refreshVehicles();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const { vehicles, updatedAt } = getVehicles();
    res.end(JSON.stringify({
      status: 'ok',
      count: vehicles.length,
      updatedAt,
      data: vehicles
    }));
    return;
  }

  if (pathname === '/api/stops') {
    await refreshShapes();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', count: getStops().length, data: getStops() }));
    return;
  }

  if (pathname === '/api/air-alert') {
    await refreshAirAlert();
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ data: getAirAlert() }));
    return;
  }

  if (pathname === '/api/shelters') {
    if (!cachedShelters.length) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Shelter data is temporarily unavailable' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' });
    res.end(JSON.stringify({
      count: cachedShelters.length,
      data: cachedShelters
    }));
    return;
  }

  if (pathname === '/api/place-images') {
    const id = url.searchParams.get('id') || '';
    const name = (url.searchParams.get('name') || '').trim();
    const address = (url.searchParams.get('address') || '').trim().slice(0, 200);
    const lat = Number(url.searchParams.get('lat'));
    const lng = Number(url.searchParams.get('lng'));
    if (!id || id.length > 200 || !name || name.length > 200 || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'id, name, lat and lng are required' }));
      return;
    }
    const result = await placeImages.get({ id, name, address, lat, lng });
    res.writeHead(result.status === 'pending' ? 202 : 200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(result));
    return;
  }

  if (pathname === '/api/buildings') {
    const values = ['south', 'west', 'north', 'east'].map(name => Number(url.searchParams.get(name)));
    const [south, west, north, east] = values;
    if (!values.every(Number.isFinite) || south >= north || west >= east || north - south > 0.06 || east - west > 0.08) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'A compact valid map bounds is required' }));
      return;
    }
    try {
      const data = await loadBuildings(south, west, north, east);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' });
      res.end(JSON.stringify(data));
    } catch (error) {
      console.error('[OpenStreetMap] Building load error:', error);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Building data is temporarily unavailable' }));
    }
    return;
  }

  if (pathname.startsWith('/api/routes/')) {
    await refreshShapes();
    const tripId = decodeURIComponent(pathname.slice('/api/routes/'.length));
    const points = getTripShape(tripId);
    if (!points) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Route shape is not available yet' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: points }));
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
}
