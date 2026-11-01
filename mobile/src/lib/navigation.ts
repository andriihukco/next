import { router } from "expo-router";
import type { CityPlace } from "./places-api";
import { getSheetSnap, requestSheet } from "./sheet-store";

// One place for the routes every screen links to (design/navigation.md).

/** A page pushed while the sheet is minimised opens the sheet, so the page is visible. */
const reveal = (): void => {
  if (getSheetSnap() === "minimised") requestSheet("half");
};

export const openVehicle = (id: string): void => {
  reveal();
  router.push({ pathname: "/vehicle/[id]", params: { id } });
};
export const openStop = (id: string): void => {
  reveal();
  router.push({ pathname: "/stop/[id]", params: { id } });
};
export const openShelter = (id: string): void => {
  reveal();
  router.push({ pathname: "/shelter/[id]", params: { id } });
};
export const openPlace = (place: CityPlace): void => {
  reveal();
  router.push({ pathname: "/place", params: { place: JSON.stringify(place) } });
};
export const openDirections = (place: Pick<CityPlace, "name" | "lat" | "lng">): void =>
  router.push({ pathname: "/directions", params: { name: place.name, lat: String(place.lat), lng: String(place.lng) } });
export const openProfile = (): void => {
  reveal();
  router.push("/profile");
};
/** The map is behind every page: close the pages of the sheet and minimise it, so the map shows. */
export const goToMap = (): void => {
  router.dismissAll();
  requestSheet("minimised");
};
