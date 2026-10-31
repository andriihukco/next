import { distanceKm } from "./geo";
import type { Shelter } from "./alerts-api";

/** Same rule as the web app: open 24/7, and ready or recommended for sheltering. */
export function isRecommendedShelter(shelter: Shelter): boolean {
  const status = shelter.status.trim().toLocaleLowerCase("uk-UA");
  return shelter.access24_7 && (status === "готове" || status.startsWith("рекомендоване"));
}

/** Closest recommended shelter to the user, with its distance in metres. */
export function nearestShelter(
  shelters: Shelter[],
  user: { latitude: number; longitude: number } | null,
): { shelter: Shelter; meters: number } | null {
  if (!user) return null;
  let best: { shelter: Shelter; meters: number } | null = null;
  for (const shelter of shelters) {
    if (!isRecommendedShelter(shelter)) continue;
    const meters =
      distanceKm(user, { latitude: shelter.lat, longitude: shelter.lng }) * 1000;
    if (!best || meters < best.meters) best = { shelter, meters };
  }
  return best;
}
