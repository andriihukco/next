// Turn-by-turn routing for walk, run and drive, shared by the web app and the Expo app.
// Routes come from Valhalla (OpenStreetMap data, no API key). The public demo server is
// fair-use only: a production app needs its own Valhalla instance or a provider key.

export type NavMode = "walk" | "run" | "drive";

export type LatLng = { latitude: number; longitude: number };

/** Semantic turn kinds. Each platform maps them to its own icon set. */
export type ManeuverKind =
  | "start"
  | "arrive"
  | "straight"
  | "left"
  | "right"
  | "slight-left"
  | "slight-right"
  | "sharp-left"
  | "sharp-right"
  | "uturn"
  | "roundabout"
  | "merge"
  | "ramp"
  | "ferry";

export type NavStep = {
  kind: ManeuverKind;
  instruction: string;
  distanceM: number;
  durationS: number;
  /** Index into `NavRoute.coordinates` where this step begins. */
  startIndex: number;
  /** Distance along the route, in meters, where this step begins. */
  startDistanceM: number;
};

export type NavRoute = {
  mode: NavMode;
  distanceM: number;
  durationS: number;
  coordinates: LatLng[];
  /** `cumulativeM[i]` is the distance from the start to `coordinates[i]`. */
  cumulativeM: number[];
  steps: NavStep[];
};

export type RouteProgress = {
  /** Distance travelled along the route, in meters. */
  traveledM: number;
  /** Distance from the rider to the closest point on the route, in meters. */
  offRouteM: number;
  /** Index of the step the rider is on. */
  stepIndex: number;
  remainingM: number;
  remainingS: number;
};

export const NAV_MODES: { id: NavMode; label: string }[] = [
  { id: "walk", label: "Пішки" },
  { id: "run", label: "Біжи" },
  { id: "drive", label: "Авто" },
];

const ENDPOINT = "https://valhalla1.openstreetmap.de/route";

// Running is pedestrian routing at a jogging pace (about 10 km/h).
const COSTING: Record<NavMode, { costing: "pedestrian" | "auto"; options?: object }> = {
  walk: { costing: "pedestrian", options: { pedestrian: { walking_speed: 5 } } },
  run: { costing: "pedestrian", options: { pedestrian: { walking_speed: 10 } } },
  drive: { costing: "auto" },
};

/** Valhalla maneuver type codes, grouped into the kinds above. */
const MANEUVER_KIND: Record<number, ManeuverKind> = {
  1: "start",
  2: "right",
  3: "left",
  4: "arrive",
  5: "arrive",
  6: "arrive",
  10: "slight-right",
  11: "right",
  12: "sharp-right",
  13: "uturn",
  14: "uturn",
  15: "sharp-left",
  16: "left",
  17: "slight-left",
  18: "ramp",
  19: "ramp",
  20: "ramp",
  21: "ramp",
  22: "ramp",
  24: "slight-right",
  25: "slight-left",
  26: "merge",
  27: "roundabout",
  28: "roundabout",
  29: "ferry",
  30: "ferry",
};

const EARTH_RADIUS_M = 6371000;

/** Decodes a Valhalla polyline (precision 6) into lat/lng points. */
export function decodePolyline6(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const readValue = (): number => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < encoded.length) {
    lat += readValue();
    lng += readValue();
    points.push({ latitude: lat / 1e6, longitude: lng / 1e6 });
  }
  return points;
}

export function haversineM(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

function cumulativeDistances(coordinates: LatLng[]): number[] {
  const cumulative = [0];
  for (let i = 1; i < coordinates.length; i++) {
    cumulative.push(cumulative[i - 1] + haversineM(coordinates[i - 1], coordinates[i]));
  }
  return cumulative;
}

export type ValhallaResponse = {
  trip: {
    summary: { time: number; length: number };
    legs: {
      shape: string;
      maneuvers: {
        type: number;
        instruction?: string;
        length: number;
        time: number;
        begin_shape_index: number;
      }[];
    }[];
  };
};

export async function fetchNavRoute(
  from: LatLng,
  to: LatLng,
  mode: NavMode,
  signal?: AbortSignal,
): Promise<NavRoute> {
  const { costing, options } = COSTING[mode];
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      locations: [
        { lat: from.latitude, lon: from.longitude },
        { lat: to.latitude, lon: to.longitude },
      ],
      costing,
      ...(options ? { costing_options: options } : {}),
      directions_options: { units: "kilometers", language: "uk-UA" },
    }),
    signal,
  });
  if (!response.ok) throw new Error(`Routing returned ${response.status}`);
  return parseNavRoute((await response.json()) as ValhallaResponse, mode);
}

/** Turns a Valhalla response into a route with per-step start distances. Exported for tests. */
export function parseNavRoute(payload: ValhallaResponse, mode: NavMode): NavRoute {
  const coordinates: LatLng[] = [];
  const pending: Omit<NavStep, "startDistanceM">[] = [];

  for (const leg of payload.trip.legs) {
    // Each leg starts where the previous one ended, so drop the duplicated first point.
    const offset = coordinates.length ? coordinates.length - 1 : 0;
    const shape = decodePolyline6(leg.shape);
    coordinates.push(...(offset ? shape.slice(1) : shape));
    for (const maneuver of leg.maneuvers) {
      pending.push({
        kind: MANEUVER_KIND[maneuver.type] ?? "straight",
        instruction: maneuver.instruction ?? "",
        distanceM: maneuver.length * 1000,
        durationS: maneuver.time,
        startIndex: Math.min(offset + maneuver.begin_shape_index, coordinates.length - 1),
      });
    }
  }

  const cumulativeM = cumulativeDistances(coordinates);
  const steps: NavStep[] = pending.map((step) => ({
    ...step,
    startDistanceM: cumulativeM[step.startIndex] ?? 0,
  }));

  return {
    mode,
    distanceM: payload.trip.summary.length * 1000,
    durationS: payload.trip.summary.time,
    coordinates,
    cumulativeM,
    steps,
  };
}

/**
 * Projects a position onto the route. Uses a local flat approximation per segment,
 * which is accurate for the few kilometres a route covers.
 */
export function locateOnRoute(route: NavRoute, point: LatLng): RouteProgress {
  const { coordinates, cumulativeM } = route;
  const cosLat = Math.cos((point.latitude * Math.PI) / 180);
  const toXY = (p: LatLng) => ({ x: (p.longitude - point.longitude) * cosLat, y: p.latitude - point.latitude });

  let bestOff = Infinity;
  let bestTraveled = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const a = toXY(coordinates[i]);
    const b = toXY(coordinates[i + 1]);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / lenSq));
    const px = a.x + dx * t;
    const py = a.y + dy * t;
    const off = haversineM(point, { latitude: point.latitude + py, longitude: point.longitude + px / cosLat });
    if (off < bestOff) {
      bestOff = off;
      const segmentLength = cumulativeM[i + 1] - cumulativeM[i];
      bestTraveled = cumulativeM[i] + segmentLength * t;
    }
  }

  const total = route.distanceM || cumulativeM[cumulativeM.length - 1] || 0;
  const traveledM = Math.min(total, Math.max(0, bestTraveled));
  const remainingM = Math.max(0, total - traveledM);
  const remainingS = total > 0 ? route.durationS * (remainingM / total) : 0;

  let stepIndex = 0;
  route.steps.forEach((step, index) => {
    if (step.startDistanceM <= traveledM + 1) stepIndex = index;
  });

  return {
    traveledM,
    offRouteM: Number.isFinite(bestOff) ? bestOff : 0,
    stepIndex,
    remainingM,
    remainingS,
  };
}

/** Distance from the rider to the start of the next step, in meters. */
export function distanceToNextStep(route: NavRoute, progress: RouteProgress): number {
  const next = route.steps[progress.stepIndex + 1];
  if (!next) return progress.remainingM;
  return Math.max(0, next.startDistanceM - progress.traveledM);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(0, Math.round(meters / 5) * 5)} м`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} км`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} хв`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} год ${rest} хв` : `${hours} год`;
}

/** Local clock time when the trip ends, as HH:MM. */
export function arrivalClock(seconds: number, now = new Date()): string {
  const arrival = new Date(now.getTime() + seconds * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(arrival.getHours())}:${pad(arrival.getMinutes())}`;
}

/** A rider further than this from the route triggers a new route. */
export const OFF_ROUTE_M = 50;
/** Within this distance of the destination the trip counts as finished. */
export const ARRIVED_M = 25;
