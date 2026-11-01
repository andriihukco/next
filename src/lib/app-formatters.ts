/** Labels, distances, and place info rows shown in the city UI. */
import * as maplibregl from "maplibre-gl";
import type { CityPlace } from "./city-places";
import type { InfoRow } from "../components/entity-detail";
import type { Stop, Vehicle, VehicleType } from "./app-types";

export const label = (type: VehicleType): string =>
  type === "tram" ? "Трамвай" : type === "trolleybus" ? "Тролейбус" : "Автобус";
export const PLACE_INFO_ICONS: Record<string, string> = {
  "Адреса": "location_on",
  "Години роботи": "schedule",
  "Висота": "height",
  "Поверхи": "layers",
  "Оператор": "business",
  "Телефон": "call",
};

/** Source tags as quick facts. Website and phone are handled by the detail layout. */
export function placeInfoRows(place: CityPlace): InfoRow[] {
  return Object.entries(place.details)
    .filter(([label]) => label !== "Сайт" && label !== "Телефон")
    .map(([label, value]) => ({
      icon: PLACE_INFO_ICONS[label] ?? "info",
      label,
      value,
    }));
}

export const minutesAway = (vehicle: Vehicle, stop: Stop): number =>
  Math.max(
    1,
    Math.round(
      new maplibregl.LngLat(vehicle.lng, vehicle.lat).distanceTo(
        new maplibregl.LngLat(stop.lng, stop.lat),
      ) /
        Math.max(vehicle.speed, 12) /
        60,
    ),
  );
export const formatDistance = (meters: number): string =>
  meters >= 1000
    ? `${new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(meters / 1000)} км`
    : `${Math.round(meters / 10) * 10} м`;

export const safeStopWebsite = (value?: string): string | null => {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
};
