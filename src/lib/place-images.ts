import { useEffect, useState } from "react";
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

export type PlacePhotoState =
  | { status: "loading" }
  | { status: "ok"; imageUrl: string }
  | { status: "none" };

/**
 * Photo for a list card. Uses the OSM photo when there is one, otherwise asks
 * the server once `enabled` is true (the card is in view). Stays `loading`
 * until an answer arrives, then becomes `ok` or `none` (the empty state).
 */
export function usePlacePhoto(place: CityPlace | undefined, enabled: boolean): PlacePhotoState {
  const [fetched, setFetched] = useState<{ id: string; result: PlaceImageResult } | null>(null);

  useEffect(() => {
    if (!place || !enabled || place.imageUrl || resolved.has(place.id)) return;
    const controller = new AbortController();
    fetchPlaceImages(place, controller.signal)
      .then((result) => setFetched({ id: place.id, result }))
      .catch(() => {});
    return () => controller.abort();
  }, [place, enabled]);

  if (!place) return { status: "none" };
  if (place.imageUrl) return { status: "ok", imageUrl: place.imageUrl };
  const result =
    resolved.get(place.id) ?? (fetched?.id === place.id ? fetched.result : undefined);
  if (result?.status === "ok") return { status: "ok", imageUrl: result.imageUrl };
  if (result && result.status !== "pending") return { status: "none" };
  return { status: "loading" };
}
