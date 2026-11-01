// Planar map matching for Lviv: 1° latitude ≈ 111 km, 1° longitude ≈ 73 km at 49.8° N.

export const MATCH_MAX_KM = 0.12;

export function mapMatchPoint(lat, lng, points) {
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

// Planar approximation in kilometres, the same scale as mapMatchPoint.
export function cumulativeShapeLengths(points) {
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
export function projectOntoShape(lat, lng, points, cumulative) {
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
