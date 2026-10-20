import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import protobuf from 'protobufjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3001) || 3001;

// Load static route and trip dictionaries
const routeMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'src_routes_map.json'), 'utf8'));
const tripMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'src_trip_to_route.json'), 'utf8'));

function normalizeRoute(shortName, longName, routeType) {
  let s = (shortName || '').trim();
  let type = 'bus';
  
  if (s.startsWith('Тр') || s.startsWith('тр')) {
    type = 'trolleybus';
    s = s.slice(2);
  } else if (s.startsWith('Т') || s.startsWith('т')) {
    type = 'tram';
    s = s.slice(1);
  } else if (s.startsWith('А') || s.startsWith('а') || s.startsWith('A') || s.startsWith('a')) {
    type = 'bus';
    s = s.slice(1);
  }

  if (routeType === '0') type = 'tram';
  else if (routeType === '800') type = 'trolleybus';

  // Strip leading zero: 01 -> 1, 09 -> 9, 08а -> 8A
  if (s.startsWith('0')) s = s.slice(1);

  // Special Lviv mappings to match municipal eWay names
  if (s === '47') s = '47A';
  if (s === '8а' || s === '8А' || s === '8a') s = '8A';
  if (s === '39а' || s === '39А' || s === '39a') s = '39A';

  return { route: s.toUpperCase(), type, destination: (longName || '').trim() };
}

const protoDef = `
syntax = "proto2";
package transit_realtime;

message FeedMessage {
  required FeedHeader header = 1;
  repeated FeedEntity entity = 2;
}

message FeedHeader {
  required string gtfs_realtime_version = 1;
  optional uint64 timestamp = 2;
}

message FeedEntity {
  required string id = 1;
  optional VehiclePosition vehicle = 4;
}

message VehiclePosition {
  optional TripDescriptor trip = 1;
  optional Position position = 2;
  optional VehicleDescriptor vehicle = 8;
  optional uint64 timestamp = 5;
}

message TripDescriptor {
  optional string trip_id = 1;
  optional string route_id = 5;
}

message Position {
  required float latitude = 1;
  required float longitude = 2;
  optional float bearing = 3;
  optional float speed = 5;
}

message VehicleDescriptor {
  optional string id = 1;
  optional string label = 2;
  optional string license_plate = 3;
}
`;

const root = protobuf.parse(protoDef).root;
const FeedMessage = root.lookupType('transit_realtime.FeedMessage');

let cachedVehicles = [];
let lastFetch = 0;
const tripShapes = new Map();
const stopsById = new Map();
const tripStopIds = new Map();
const tripStopIndexCache = new Map();
const MATCH_MAX_KM = 0.12;
let cachedStops = [];
let cachedShelters = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data/shelters.json'), 'utf8')
);
const buildingCache = new Map();
const ALERTS_URL = process.env.ALERTS_URL || 'https://api.alerts.in.ua/v3/alerts/active.md';
const LVIV_BOunDS = '49.70,23.75,49.98,24.35';
let cachedAirAlert = {
  status: 'unknown',
  level: null,
  since: null,
  sinceText: null,
  areasAffected: [],
  threats: [],
  reportAt: null,
  updatedAt: 0,
  source: 'alerts.in.ua'
};

function mapMatchPoint(lat, lng, points) {
  if (!points || points.length < 2) return { lat, lng, matched: false };
  let nearest = null;
  let nearestDistance = Infinity;
  for (let index = 1; index < points.length; index += 1) {
    const [lat1, lng1] = points[index - 1];
    const [lat2, lng2] = points[index];
    const x = lng * 73;
    const y = lat * 111;
    const ax = lng1 * 73;
    const ay = lat1 * 111;
    const bx = lng2 * 73;
    const by = lat2 * 111;
    const lengthSquared = (bx - ax) ** 2 + (by - ay) ** 2;
    const progress = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / lengthSquared));
    const candidate = { lat: lat1 + (lat2 - lat1) * progress, lng: lng1 + (lng2 - lng1) * progress };
    const distance = Math.hypot((candidate.lat - lat) * 111, (candidate.lng - lng) * 73);
    if (distance < nearestDistance) { nearest = candidate; nearestDistance = distance; }
  }
  return nearest && nearestDistance <= 0.12 ? { ...nearest, matched: true } : { lat, lng, matched: false };
}

function buildingHeight(tags) {
  const explicit = Number.parseFloat(tags.height);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const levels = Number.parseInt(tags['building:levels'], 10);
  return Number.isFinite(levels) && levels > 0 ? levels * 3 : 9;
}

async function loadBuildings(south, west, north, east) {
  const key = [south, west, north, east].map(value => value.toFixed(3)).join(',');
  const cached = buildingCache.get(key);
  if (cached && Date.now() - cached.updatedAt < 30 * 60 * 1000) return cached.data;
  const query = `[out:json][timeout:25];way["building"](${south},${west},${north},${east});out geom tags;`;
  const payload = await requestOverpass(query);
  const data = {
    type: 'FeatureCollection',
    features: payload.elements.flatMap(element => {
      const coordinates = (element.geometry || []).map(point => [point.lon, point.lat]);
      if (coordinates.length < 4) return [];
      const tags = element.tags || {};
      return [{ type: 'Feature', properties: { height: buildingHeight(tags), minHeight: Number.parseFloat(tags.min_height) || 0, estimated: !tags.height }, geometry: { type: 'Polygon', coordinates: [coordinates] } }];
    })
  };
  buildingCache.set(key, { updatedAt: Date.now(), data });
  return data;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        value += char;
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(value);
      value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value);
      if (row.some(cell => cell.length > 0)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  row.push(value);
  if (row.some(cell => cell.length > 0)) rows.push(row);
  const [headers, ...records] = rows;
  return records.map(record => Object.fromEntries(headers.map((header, index) => [header, record[index] || ''])));
}

function unzipEntries(zip) {
  const end = zip.lastIndexOf(Buffer.from('PK\x05\x06'));
  if (end < 0) throw new Error('GTFS archive directory is missing');

  const entryCount = zip.readUInt16LE(end + 10);
  let offset = zip.readUInt32LE(end + 16);
  const entries = new Map();

  for (let entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
    if (zip.readUInt32LE(offset) !== 0x02014b50) throw new Error('Invalid GTFS archive entry');
    const compression = zip.readUInt16LE(offset + 10);
    const compressedSize = zip.readUInt32LE(offset + 20);
    const nameLength = zip.readUInt16LE(offset + 28);
    const extraLength = zip.readUInt16LE(offset + 30);
    const commentLength = zip.readUInt16LE(offset + 32);
    const localOffset = zip.readUInt32LE(offset + 42);
    const name = zip.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
    const localNameLength = zip.readUInt16LE(localOffset + 26);
    const localExtraLength = zip.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = zip.subarray(dataStart, dataStart + compressedSize);
    const data = compression === 0 ? compressed : zlib.inflateRawSync(compressed);
    entries.set(name, data.toString('utf8'));
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

function requestBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if ((res.statusCode || 500) >= 400) {
        reject(new Error(`External data request failed with ${res.statusCode}`));
        res.resume();
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function requestAlertText(url = ALERTS_URL) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 un/1.0' },
    redirect: 'follow',
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) {
    throw new Error(`Alert status request failed with ${response.status}`);
  }
  return response.text();
}

// The public alerts.in.ua situation report is a Markdown document with numbered
// sections. Parsing the sections keeps the Lviv entry apart from the regional
// history further down, which used to make a clear Lviv look like an active alert.
const LVIV_MATCH = /львів|lviv|дрогобич|стрий|самбір|червоноград|золочів|яворів/i;
const MONTH_NAMES = {
  Jan: 'січня', Feb: 'лютого', Mar: 'березня', Apr: 'квітня', May: 'травня', Jun: 'червня',
  Jul: 'липня', Aug: 'серпня', Sep: 'вересня', Oct: 'жовтня', Nov: 'листопада', Dec: 'грудня'
};
const MONTH_NUMBERS = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
};

function reportSections(document) {
  const sections = new Map();
  for (const part of document.split(/\n(?=##\s)/)) {
    const heading = part.match(/^##\s+(.+)/);
    if (!heading) continue;
    sections.set(heading[1].trim(), part);
  }
  return sections;
}

function sectionBody(sections, prefix) {
  for (const [heading, body] of sections) {
    if (heading.startsWith(prefix)) return body;
  }
  return '';
}

function reportClock(document) {
  const match = document.match(/Europe\/Kyiv,\s*(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2}:\d{2})/);
  if (!match) return null;
  return {
    iso: `${match[1]}-${match[2]}-${match[3]}T${match[4]}+03:00`,
    day: Number(match[3]),
    month: Number(match[2])
  };
}

function parseSince(block, clock) {
  // Alerts that started today are reported as "since 14:45" without a date.
  const timeOnly = block.match(/since (\d{2}:\d{2})/);
  const match = block.match(/since ([A-Z][a-z]{2}) (\d{1,2}), (\d{2}:\d{2})/) ||
    (timeOnly ? [timeOnly[0], null, null, timeOnly[1]] : null);
  if (!match) return { since: null, sinceText: null };
  if (!match[1]) return { since: match[3], sinceText: `з ${match[3]}` };
  const [, monthName, dayText, time] = match;
  const day = Number(dayText);
  const month = MONTH_NUMBERS[monthName];
  if (!month) return { since: null, sinceText: `з ${time}` };
  const sinceText = clock && clock.day === day && clock.month === month
    ? `з ${time}`
    : `з ${day} ${MONTH_NAMES[monthName] || monthName}, ${time}`;
  return { since: `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')} ${time}`, sinceText };
}

function parseAffectedAreas(block) {
  const match = block.match(/areas affected:\s*([\s\S]+?)(?:\s*\[|$)/);
  if (!match) return [];
  return [...match[1].matchAll(/\(([^)]+)\)/g)]
    .map(entry => entry[1].trim())
    .filter(name => name.length > 0);
}

function parseThreats(threatSection) {
  const threats = [];
  for (const line of threatSection.split('\n')) {
    const match = line.match(/^-\s+\*\*(\d{2}:\d{2})\s+—\s+([^*]+)\*\*\s+over\s+(.+?)\s+—\s*([\s\S]*)$/);
    if (!match) continue;
    const [, time, kindRaw, placeRaw, noteRaw] = match;
    const kind = /drone|uav|бпла|shahed|герань/i.test(`${kindRaw} ${noteRaw}`)
      ? 'drone'
      : /bomb|каб|авіабомб|kab/i.test(`${kindRaw} ${noteRaw}`)
        ? 'bomb'
        : 'other';
    const place = placeRaw.replace(/\s+/g, ' ').trim();
    const placeUk = (place.match(/\(([^)]*[А-Яа-яІіЇїЄєҐґ][^)]*)\)/) || [])[1] || place;
    const note = noteRaw.replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '').replace(/\s+/g, ' ').trim();
    threats.push({
      time,
      kind,
      kindLabel: kind === 'drone' ? 'Ударні БпЛА' : kind === 'bomb' ? 'Керовані авіабомби' : 'Загроза',
      place,
      placeUk,
      note
    });
  }
  return threats;
}

function parseLvivAirAlert(document) {
  const sections = reportSections(document);
  const clock = reportClock(document);
  const statusBlock = sectionBody(sections, '3.')
    .split(/\n\n/)
    .find(block => /^\*\*[^*]*(?:Львівська область|Lvivska oblast)/m.test(block));
  const threats = parseThreats(sectionBody(sections, '4.'))
    .filter(threat => LVIV_MATCH.test(threat.place) || LVIV_MATCH.test(threat.note))
    .slice(0, 6);
  const reportAt = clock ? clock.iso : null;

  if (!statusBlock) {
    return { status: 'clear', level: null, since: null, sinceText: null, areasAffected: [], threats, reportAt };
  }

  const levelMatch = statusBlock.match(/\[(red|yellow)/i) || statusBlock.match(/Alert level:\s*(red|yellow)/i);
  return {
    status: 'active',
    level: levelMatch ? levelMatch[1].toLowerCase() : 'red',
    ...parseSince(statusBlock, clock),
    areasAffected: parseAffectedAreas(statusBlock),
    threats,
    reportAt
  };
}

async function loadAirAlert() {
  try {
    const document = await requestAlertText();
    cachedAirAlert = { ...parseLvivAirAlert(document), updatedAt: Date.now(), source: 'alerts.in.ua' };
  } catch (error) {
    console.error('[alerts.in.ua] Alert load error:', error);
    cachedAirAlert = { ...cachedAirAlert, status: cachedAirAlert.updatedAt ? cachedAirAlert.status : 'unknown' };
  }
}

function requestOverpass(query) {
  return new Promise((resolve, reject) => {
    const request = https.request('https://overpass.osm.ch/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(`data=${encodeURIComponent(query)}`), 'User-Agent': 'un/1.0 (local transit map)' }
    }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        if ((response.statusCode || 500) >= 400) {
          reject(new Error(`OpenStreetMap request failed with ${response.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on('error', reject);
    request.write(`data=${encodeURIComponent(query)}`);
    request.end();
  });
}

async function loadRouteShapes() {
  try {
    const entries = unzipEntries(await requestBuffer('https://track.ua-gis.com/gtfs/lviv/static.zip'));
    const trips = parseCsv(entries.get('trips.txt') || '');
    const shapes = parseCsv(entries.get('shapes.txt') || '');
    const stops = parseCsv(entries.get('stops.txt') || '');
    const stopTimes = parseCsv(entries.get('stop_times.txt') || '');
    const pointsByShape = new Map();
    const routesByStop = new Map();
    const routeByTrip = new Map();

    for (const trip of trips) {
      const info = routeMap[trip.route_id];
      if (info) routeByTrip.set(trip.trip_id, normalizeRoute(info.shortName, info.longName, info.type).route);
    }

    for (const stop of stops) {
      if (!Number.isFinite(Number(stop.stop_lat)) || !Number.isFinite(Number(stop.stop_lon))) continue;
      stopsById.set(stop.stop_id, {
        name: stop.stop_name || 'Зупинка без назви',
        lat: Number(stop.stop_lat),
        lng: Number(stop.stop_lon),
      });
    }

    const stopSequencesByTrip = new Map();
    for (const stopTime of stopTimes) {
      const sequence = stopSequencesByTrip.get(stopTime.trip_id) || [];
      sequence.push([Number(stopTime.stop_sequence), stopTime.stop_id]);
      stopSequencesByTrip.set(stopTime.trip_id, sequence);
    }
    for (const [tripId, sequence] of stopSequencesByTrip) {
      tripStopIds.set(tripId, sequence.sort((a, b) => a[0] - b[0]).map(([, stopId]) => stopId));
    }

    for (const stopTime of stopTimes) {
      const route = routeByTrip.get(stopTime.trip_id);
      if (!route) continue;
      const routes = routesByStop.get(stopTime.stop_id) || new Set();
      routes.add(route);
      routesByStop.set(stopTime.stop_id, routes);
    }

    cachedStops = stops
      .filter(stop => Number.isFinite(Number(stop.stop_lat)) && Number.isFinite(Number(stop.stop_lon)))
      .map(stop => ({
        id: stop.stop_id,
        name: stop.stop_name || 'Зупинка без назви',
        lat: Number(stop.stop_lat),
        lng: Number(stop.stop_lon),
        routes: [...(routesByStop.get(stop.stop_id) || new Set())].sort((left, right) => left.localeCompare(right, 'uk', { numeric: true }))
      }))
      .filter(stop => stop.routes.length > 0);

    for (const point of shapes) {
      const points = pointsByShape.get(point.shape_id) || [];
      points.push([Number(point.shape_pt_lat), Number(point.shape_pt_lon), Number(point.shape_pt_sequence)]);
      pointsByShape.set(point.shape_id, points);
    }

    for (const trip of trips) {
      const points = pointsByShape.get(trip.shape_id);
      if (!points) continue;
      tripShapes.set(trip.trip_id, points.sort((a, b) => a[2] - b[2]).map(([lat, lng]) => [lat, lng]));
    }

    console.log(`[Lviv GTFS] Loaded ${tripShapes.size} trip shapes and ${cachedStops.length} stops`);
  } catch (error) {
    console.error('[Lviv GTFS] Shape load error:', error);
  }
}

// Planar approximation in kilometres, the same scale as mapMatchPoint.
function cumulativeShapeLengths(points) {
  const cumulative = [0];
  for (let index = 1; index < points.length; index += 1) {
    const [lat1, lng1] = points[index - 1];
    const [lat2, lng2] = points[index];
    const length = Math.hypot((lng2 - lng1) * 73, (lat2 - lat1) * 111);
    cumulative.push(cumulative[index - 1] + length);
  }
  return cumulative;
}

// Returns the distance along the shape of the point nearest to lat/lng, and how far it is from the shape.
function projectOntoShape(lat, lng, points, cumulative) {
  let best = { arc: 0, distance: Infinity };
  const x = lng * 73;
  const y = lat * 111;
  for (let index = 1; index < points.length; index += 1) {
    const [lat1, lng1] = points[index - 1];
    const [lat2, lng2] = points[index];
    const ax = lng1 * 73;
    const ay = lat1 * 111;
    const bx = lng2 * 73;
    const by = lat2 * 111;
    const lengthSquared = (bx - ax) ** 2 + (by - ay) ** 2;
    const progress = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / lengthSquared));
    const distance = Math.hypot(ax + (bx - ax) * progress - x, ay + (by - ay) * progress - y);
    if (distance < best.distance) {
      const segmentLength = cumulative[index] - cumulative[index - 1];
      best = { arc: cumulative[index - 1] + segmentLength * progress, distance };
    }
  }
  return best;
}

// Stops of a trip in running order, each with its distance along the trip shape. Built once per trip.
function tripStopIndex(tripId) {
  if (tripStopIndexCache.has(tripId)) return tripStopIndexCache.get(tripId);
  const shape = tripShapes.get(tripId);
  const stopIds = tripStopIds.get(tripId);
  if (!shape || !stopIds) return null;
  const cumulative = cumulativeShapeLengths(shape);
  const stops = stopIds
    .map(stopId => stopsById.get(stopId))
    .filter(Boolean)
    .map(stop => ({ name: stop.name, arc: projectOntoShape(stop.lat, stop.lng, shape, cumulative).arc }));
  const index = { shape, cumulative, stops };
  tripStopIndexCache.set(tripId, index);
  return index;
}

// Name of the first stop the vehicle has not yet passed on its trip; null when unknown or at the end of the route.
function nextStopName(tripId, lat, lng) {
  const index = tripId ? tripStopIndex(tripId) : null;
  if (!index) return null;
  const position = projectOntoShape(lat, lng, index.shape, index.cumulative);
  if (position.distance > MATCH_MAX_KM) return null;
  return index.stops.find(stop => stop.arc > position.arc)?.name ?? null;
}

function fetchLiveVehicles() {
  return new Promise((resolve) => {
    https.get('https://track.ua-gis.com/gtfs/lviv/vehicle_position', (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const buf = Buffer.concat(chunks);
          const msg = FeedMessage.decode(buf);
          const vehicles = [];

          for (const ent of msg.entity) {
            if (!ent.vehicle || !ent.vehicle.position) continue;
            const v = ent.vehicle;
            const tripId = v.trip && v.trip.tripId;
            const rawRouteId = (v.trip && v.trip.routeId) || (tripId && tripMap[tripId]);
            const rInfo = rawRouteId && routeMap[rawRouteId];

            const lat = v.position.latitude;
            const lng = v.position.longitude;
            if (lat < 49.65 || lat > 49.98 || lng < 23.75 || lng > 24.35) continue;

            const normalized = rInfo 
              ? normalizeRoute(rInfo.shortName, rInfo.longName, rInfo.type)
              : { route: rawRouteId || '?', type: 'bus', destination: 'Львів' };

            const matched = mapMatchPoint(lat, lng, tripShapes.get(tripId));
            vehicles.push({
              id: ent.id,
              tripId: tripId || '',
              route: normalized.route,
              destination: normalized.destination,
              type: normalized.type,
              lat: matched.lat,
              lng: matched.lng,
              mapMatched: matched.matched,
              nextStop: nextStopName(tripId, lat, lng),
              speed: Math.round((v.position.speed || 0) * 3.6),
              bearing: Math.round(v.position.bearing || 0),
              plate: (v.vehicle && (v.vehicle.licensePlate || v.vehicle.id)) || '---',
              lowFloor: (v.vehicle && v.vehicle.label === 'low_floor') || false,
              timestamp: v.timestamp ? Number(v.timestamp) : Math.floor(Date.now() / 1000)
            });
          }

          cachedVehicles = vehicles;
          lastFetch = Date.now();
          resolve(vehicles);
        } catch (err) {
          console.error('[Lviv API] Parse error:', err);
          resolve(cachedVehicles);
        }
      });
    }).on('error', (err) => {
      console.error('[Lviv API] Fetch error:', err);
      resolve(cachedVehicles);
    });
  });
}

// Initial fetch & loop every 2.5s
fetchLiveVehicles();
loadRouteShapes();
loadAirAlert();
setInterval(fetchLiveVehicles, 2500);
setInterval(loadAirAlert, 30 * 1000);

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/vehicles') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      count: cachedVehicles.length,
      updatedAt: lastFetch,
      data: cachedVehicles
    }));
    return;
  }

  if (req.url === '/api/stops') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', count: cachedStops.length, data: cachedStops }));
    return;
  }

  if (req.url === '/api/air-alert') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ data: cachedAirAlert }));
    return;
  }

  if (req.url === '/api/shelters') {
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

  if (req.url?.startsWith('/api/buildings')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
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

  if (req.url?.startsWith('/api/routes/')) {
    const tripId = decodeURIComponent(req.url.slice('/api/routes/'.length));
    const points = tripShapes.get(tripId);
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
});

server.listen(PORT, () => {
  console.log(`🚀 Lviv Real-Time Transit Data Service running on http://localhost:${PORT}`);
});
