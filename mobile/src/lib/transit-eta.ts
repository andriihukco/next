import { distanceKm } from "./geo";
import type { Stop, Vehicle } from "./transit-types";

/**
 * Same estimate as the web app's `minutesAway`: straight-line distance over the
 * vehicle's speed (floored at 12). It is an estimate from GPS, not a timetable.
 */
export function minutesAway(vehicle: Vehicle, stop: Stop): number {
  const meters =
    distanceKm(
      { latitude: vehicle.lat, longitude: vehicle.lng },
      { latitude: stop.lat, longitude: stop.lng },
    ) * 1000;
  return Math.max(1, Math.round(meters / Math.max(vehicle.speed, 12) / 60));
}

export type Arrival = { vehicle: Vehicle; minutes: number };

/** Next vehicles that serve this stop, soonest first. */
export function arrivalsAt(stop: Stop, vehicles: Vehicle[], limit = 8): Arrival[] {
  const serves = new Set(stop.routes);
  return vehicles
    .filter((vehicle) => serves.has(vehicle.route))
    .map((vehicle) => ({ vehicle, minutes: minutesAway(vehicle, stop) }))
    .sort((a, b) => a.minutes - b.minutes)
    .slice(0, limit);
}
