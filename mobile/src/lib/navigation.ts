import { router } from "expo-router";
import type { CityPlace } from "./places-api";

// One place for the routes every screen links to (design/navigation.md).

export const openVehicle = (id: string): void => router.push({ pathname: "/vehicle/[id]", params: { id } });
export const openStop = (id: string): void => router.push({ pathname: "/stop/[id]", params: { id } });
export const openShelter = (id: string): void => router.push({ pathname: "/shelter/[id]", params: { id } });
export const openPlace = (place: CityPlace): void =>
  router.push({ pathname: "/place", params: { place: JSON.stringify(place) } });
export const openDirections = (place: Pick<CityPlace, "name" | "lat" | "lng">): void =>
  router.push({ pathname: "/directions", params: { name: place.name, lat: String(place.lat), lng: String(place.lng) } });
export const openProfile = (): void => router.push("/profile");
/** The map is the first tab; `navigate` returns to it instead of stacking another copy. */
export const goToMap = (): void => router.navigate("/");
