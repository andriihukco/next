import { useRef, type Dispatch, type RefObject, type SetStateAction } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { NavDestination } from "../components/navigation-panel";
import type { Vehicle } from "../lib/app-types";
import { CITY_PLACE_CATEGORY_COLORS, type CityPlace } from "../lib/city-places";
import { createPlaceMarker } from "../lib/map-pins";
import type { useSelection } from "./use-selection";

export const MY_LOCATION = "Моє місцезнаходження";

type AppNavigationInput = {
  mapRef: RefObject<MapLibreMap | null>;
  selection: ReturnType<typeof useSelection>;
  places: CityPlace[];
  vehicles: Vehicle[];
  followVehicle: (id: string) => void;
  requestLocation: () => void;
  clearBuildingPreview: () => void;
  setCityPageOpen: (open: boolean) => void;
  setWaypoints: Dispatch<SetStateAction<string[]>>;
  setNavDestination: (destination: NavDestination | null) => void;
  /** Lowers the mobile sheet so a pinned destination stays visible. */
  lowerSheet: () => void;
};

/** Moves between list, map and detail: every "open X" action goes through here. */
export function useAppNavigation(input: AppNavigationInput) {
  const { mapRef, selection } = input;
  const cityMarkerRef = useRef<maplibregl.Marker | null>(null);

  const flyTo = (center: [number, number], zoom: number, duration?: number): void => {
    mapRef.current?.flyTo({ center, zoom, ...(duration === undefined ? {} : { duration }) });
  };
  const currentZoom = (): number => mapRef.current?.getZoom() ?? 0;

  const focusVehicle = (vehicle: Vehicle): void => {
    selection.showDetail({ vehicle }, selection.currentReturnView());
    selection.setActiveView("map");
    input.followVehicle(vehicle.id);
    flyTo([vehicle.lng, vehicle.lat], Math.max(currentZoom(), 17), 900);
  };
  const openPlace = (place: CityPlace, fly: boolean): void => {
    selection.showDetail({ place }, selection.currentReturnView());
    selection.setActiveView("map");
    if (fly) flyTo([place.lng, place.lat], Math.max(currentZoom(), 16), 450);
  };
  const returnFromInspector = (): void => {
    selection.closeDetails();
    input.clearBuildingPreview();
    selection.setTransitFlow(null);
    selection.setActiveView(selection.detailReturnView);
  };

  /** Pins a place from a list on the map and opens its detail when the place is known. */
  const showCityPlace = (coordinates: [number, number], placeName: string): void => {
    const map = mapRef.current;
    if (!map) return;
    const place = input.places.find(
      (candidate) =>
        candidate.name === placeName ||
        (Math.abs(candidate.lng - coordinates[0]) < 0.0001 && Math.abs(candidate.lat - coordinates[1]) < 0.0001),
    );
    cityMarkerRef.current?.remove();
    cityMarkerRef.current = new maplibregl.Marker({
      element: createPlaceMarker(placeName, CITY_PLACE_CATEGORY_COLORS[place?.category ?? "other"]),
      anchor: "bottom",
    })
      .setLngLat(coordinates)
      .addTo(map);
    selection.showDetail({ place: place ?? null }, selection.currentReturnView());
    selection.setTransitFlow(null);
    selection.setActiveView("map");
    flyTo(coordinates, 16, 650);
  };
  // "Маршрут" from any detail page: pin the destination and open the planner with it.
  const openDirections = (coordinates: [number, number], placeName: string): void => {
    showCityPlace(coordinates, placeName);
    selection.setSelectedPlace(null);
    input.setCityPageOpen(false);
    input.setWaypoints((current) => [current[0] || MY_LOCATION, placeName]);
    // [lng, lat] from MapLibre, so the panel gets the destination in lat/lng order.
    input.setNavDestination({ name: placeName, lat: coordinates[1], lng: coordinates[0] });
    input.lowerSheet();
  };
  const showTransitVehicle = (vehicleId: string): void => {
    // Special signal from the Nearby tab when the user hasn't granted location yet.
    if (vehicleId === "__locate__") {
      input.requestLocation();
      return;
    }
    const vehicle = input.vehicles.find((candidate) => candidate.id === vehicleId);
    if (!vehicle) {
      console.error(`Could not find transit vehicle ${vehicleId}.`);
      return;
    }
    selection.showDetail({ vehicle }, "city");
    selection.setTransitFlow(null);
    selection.setActiveView("map");
    flyTo([vehicle.lng, vehicle.lat], 15, 450);
  };

  return { flyTo, focusVehicle, openPlace, returnFromInspector, showCityPlace, openDirections, showTransitVehicle };
}
