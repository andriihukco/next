import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cumulativeShapeLengths, MATCH_MAX_KM, projectOntoShape } from '../lib/geo.mjs';
import { normalizeRoute, parseCsv, unzipEntries } from '../lib/gtfs-parse.mjs';
import { requestBuffer } from '../lib/http.mjs';

// Data files live at the repository root, two levels above this module.
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Static route and trip dictionaries
export const routeMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'src_routes_map.json'), 'utf8'));
export const tripMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'src_trip_to_route.json'), 'utf8'));

const tripShapes = new Map();
const stopsById = new Map();
const tripStopIds = new Map();
const tripStopIndexCache = new Map();
let cachedStops = [];

/** Stops with at least one route, for `/api/stops`. */
export function getStops() {
  return cachedStops;
}

/** Shape of a trip as [lat, lng] points, or undefined before the GTFS archive loads. */
export function getTripShape(tripId) {
  return tripShapes.get(tripId);
}

export async function loadRouteShapes() {
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
    return false;
  }
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
export function nextStopName(tripId, lat, lng) {
  const index = tripId ? tripStopIndex(tripId) : null;
  if (!index) return null;
  const position = projectOntoShape(lat, lng, index.shape, index.cumulative);
  if (position.distance > MATCH_MAX_KM) return null;
  return index.stops.find(stop => stop.arc > position.arc)?.name ?? null;
}
