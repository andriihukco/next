import { API_BASE_URL } from "./config";
import type { Stop, Vehicle } from "./transit-types";

type Envelope<T> = { status?: string; data?: T };

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return (await response.json()) as T;
}

export async function fetchVehicles(signal?: AbortSignal): Promise<Vehicle[]> {
  const payload = await getJson<Envelope<Vehicle[]>>("/api/vehicles", signal);
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function fetchStops(signal?: AbortSignal): Promise<Stop[]> {
  const payload = await getJson<Envelope<Stop[]>>("/api/stops", signal);
  return Array.isArray(payload.data) ? payload.data : [];
}

/** Route shape as [lat, lng] pairs. Returns null when the trip is no longer in the feed. */
export async function fetchRouteShape(
  tripId: string,
  signal?: AbortSignal,
): Promise<{ latitude: number; longitude: number }[] | null> {
  try {
    const payload = await getJson<Envelope<[number, number][]>>(
      `/api/routes/${encodeURIComponent(tripId)}`,
      signal,
    );
    if (!Array.isArray(payload.data) || payload.data.length < 2) return null;
    return payload.data.map(([latitude, longitude]) => ({ latitude, longitude }));
  } catch {
    return null;
  }
}
