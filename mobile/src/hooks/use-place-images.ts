import { useEffect, useState } from "react";
import { API_BASE_URL } from "../lib/config";
import type { CityPlace } from "../lib/places-api";

/**
 * Photos, hours and reviews for a place, from the server's scraper-backed lookup
 * (`/api/place-images`). The server answers `pending` while it scrapes, so this
 * polls until it has an answer or gives up.
 */

export type PlaceReview = {
  author: string;
  rating?: number;
  text: string;
  when: string;
};

export type PlaceDetails = {
  category?: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  openHours: { day: string; hours: string }[];
  reviews: PlaceReview[];
  menuLink?: string;
};

export type PlaceImageResult =
  | { status: "ok"; imageUrl?: string; images: string[]; details?: PlaceDetails }
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
  return `${API_BASE_URL}/api/place-images?${params.toString()}`;
}

async function requestImages(place: CityPlace, signal: AbortSignal): Promise<PlaceImageResult> {
  const response = await fetch(placeImagesUrl(place), { signal });
  if (!response.ok && response.status !== 202) return { status: "unavailable" };
  return (await response.json()) as PlaceImageResult;
}

/** Null while the lookup runs; the result once the server has one. */
export function usePlaceImages(place: CityPlace | null): PlaceImageResult | null {
  const [result, setResult] = useState<PlaceImageResult | null>(() => (place ? resolved.get(place.id) ?? null : null));

  useEffect(() => {
    if (!place) {
      setResult(null);
      return;
    }
    const cached = resolved.get(place.id);
    if (cached) {
      setResult(cached);
      return;
    }
    const controller = new AbortController();
    setResult(null);

    const poll = async (attempt: number): Promise<void> => {
      try {
        const next = await requestImages(place, controller.signal);
        if (controller.signal.aborted) return;
        if (next.status === "pending" && attempt < MAX_POLLS) {
          setTimeout(() => void poll(attempt + 1), POLL_DELAY_MS);
          return;
        }
        if (next.status !== "pending") resolved.set(place.id, next);
        setResult(next.status === "pending" ? { status: "unavailable" } : next);
      } catch {
        if (!controller.signal.aborted) setResult({ status: "unavailable" });
      }
    };
    void poll(0);

    return () => controller.abort();
  }, [place?.id]);

  return result;
}
