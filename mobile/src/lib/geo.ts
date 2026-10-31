export type LatLng = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export type Track = {
  points: LatLng[];
  /** Cumulative distance from the start to each point, in km. cumulative[0] === 0. */
  cumulative: number[];
  lengthKm: number;
};

export function buildTrack(coordinates: readonly (readonly [number, number])[]): Track {
  const points = coordinates.map(([latitude, longitude]) => ({ latitude, longitude }));
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    cumulative.push(cumulative[i - 1] + distanceKm(points[i - 1], points[i]));
  }
  return { points, cumulative, lengthKm: cumulative[cumulative.length - 1] ?? 0 };
}

/** Position and bearing (degrees, 0 = north) at `km` along the track. */
export function pointAt(track: Track, km: number): { coordinate: LatLng; heading: number } {
  const { points, cumulative } = track;
  const target = Math.min(Math.max(km, 0), track.lengthKm);
  let i = 1;
  while (i < cumulative.length - 1 && cumulative[i] < target) i++;
  const from = points[i - 1];
  const to = points[i];
  const span = cumulative[i] - cumulative[i - 1];
  const t = span === 0 ? 0 : (target - cumulative[i - 1]) / span;
  const coordinate = {
    latitude: from.latitude + (to.latitude - from.latitude) * t,
    longitude: from.longitude + (to.longitude - from.longitude) * t,
  };
  const dLng = toRad(to.longitude - from.longitude);
  const y = Math.sin(dLng) * Math.cos(toRad(to.latitude));
  const x =
    Math.cos(toRad(from.latitude)) * Math.sin(toRad(to.latitude)) -
    Math.sin(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.cos(dLng);
  const heading = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return { coordinate, heading };
}

/** The part of the track walked so far, ending exactly at `km`. */
export function walkedPath(track: Track, km: number): LatLng[] {
  const end = pointAt(track, km).coordinate;
  const path: LatLng[] = [];
  for (let i = 0; i < track.points.length; i++) {
    if (track.cumulative[i] >= km) break;
    path.push(track.points[i]);
  }
  path.push(end);
  return path;
}
