import { API_BASE_URL } from "./config";

export type AirAlertThreat = {
  time: string;
  kind: "drone" | "bomb" | "other";
  kindLabel: string;
  place: string;
  placeUk: string;
  note: string;
};

/** Mirrors `AirAlert` in src/App.tsx of the web app. */
export type AirAlert = {
  status: "active" | "clear" | "unknown";
  level: "red" | "yellow" | null;
  since?: string | null;
  sinceText?: string | null;
  areasAffected?: string[];
  threats?: AirAlertThreat[];
  reportAt?: string | null;
  updatedAt: number;
  source: string;
};

/** Mirrors `Shelter` in src/types/domain.ts of the web app. */
export type Shelter = {
  id: string;
  settlement: string;
  address: string;
  district: string;
  objectType: string;
  status: string;
  access24_7: boolean;
  capacity: number | null;
  lat: number;
  lng: number;
};

export async function fetchAirAlert(signal?: AbortSignal): Promise<AirAlert | null> {
  const response = await fetch(`${API_BASE_URL}/api/air-alert`, { signal });
  if (!response.ok) throw new Error(`air-alert returned ${response.status}`);
  const payload = (await response.json()) as { data?: AirAlert };
  return payload.data ?? null;
}

export async function fetchShelters(signal?: AbortSignal): Promise<Shelter[]> {
  const response = await fetch(`${API_BASE_URL}/api/shelters`, { signal });
  if (!response.ok) throw new Error(`shelters returned ${response.status}`);
  const payload = (await response.json()) as { data?: Shelter[] };
  return Array.isArray(payload.data) ? payload.data : [];
}
