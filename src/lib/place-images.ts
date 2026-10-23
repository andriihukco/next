import { apiUrl } from "./api";
import type { CityPlace } from "./city-places";

/**
 * Photos for a place, from the server's scraper-backed lookup
 * (`/api/place-images`). The server answers `pending` while it scrapes, so
 * this polls until it has an answer or gives up.
 */

export type PlaceImageResult =
  | { status: "ok"; imageUrl: string; images: string[] }
  | { status: "none" }
  | { status: "pending" }
  | { status: "unavailable" };

const POLL_DELAY_MS = 6000;
const MAX_POLLS = 20;

const resolved = new Map<string, PlaceImageResult>();

function placeImagesUrl(place: CityPlace): string {
  const params = new URLSearchParams({
    id: place.id,
    name: place.name,
    address: place.address,
    lat: String(place.lat),
    lng: String(place.lng),
  });
  return apiUrl(`/api/place-images?${params.toString()}`);
}

/**
 * Resolve the photos for a place. Resolves to `unavailable` when the server
 * cannot scrape, so the UI falls back to the category icon.
 */
export async function fetchPlaceImages(
  place: CityPlace,
  signal: AbortSignal,
): Promise<PlaceImageResult> {
  const known = resolved.get(place.id);
  if (known) return known;

  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    const response = await fetch(placeImagesUrl(place), { signal });
    if (!response.ok && response.status !== 202) return { status: "unavailable" };
    const result = (await response.json()) as PlaceImageResult;
    if (result.status !== "pending") {
      if (result.status !== "unavailable") resolved.set(place.id, result);
      return result;
    }
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(resolve, POLL_DELAY_MS);
      signal.addEventListener(
        "abort",
        () => {
          window.clearTimeout(timer);
          reject(new DOMException("Aborted", "AbortError"));
        },
        { once: true },
      );
    });
  }
  return { status: "unavailable" };
}
