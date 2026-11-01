import { useEffect, type RefObject } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { apiUrl } from "../lib/api";
import { resolveColor } from "../lib/design-colors";
import type { AirAlert, Shelter, Stop, Vehicle } from "../lib/app-types";
import { isNumber } from "../lib/app-validators";
import type { Building3DLayer, BuildingModelData } from "../lib/building-3d-layer";
import type { CityPlace, CityPlaceCategory } from "../lib/city-places";
import { createFixtureRoute } from "../lib/dev-fixtures";
import { TRANSIT_TYPE_COLORS as COLORS } from "../lib/fleet";
import {
  animateRouteProgress,
  cityPlaceFeatures,
  routeFeatures,
  shelterFeatures,
  stopFeatures,
  updateGeoJSONSource,
  vehicleFeatures,
} from "../lib/map-features";
import type { Vehicle3DLayer } from "../lib/vehicle-3d-layer";

type MapSyncInput = {
  mapRef: RefObject<MapLibreMap | null>;
  mapReady: boolean;
  vehicle3DLayerRef: RefObject<Vehicle3DLayer | null>;
  building3DLayerRef: RefObject<Building3DLayer | null>;
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  stops: Stop[];
  mapPlaces: CityPlace[];
  layerCategories: Set<CityPlaceCategory>;
  selectedPlaceId: string | undefined;
  userLocation: [number, number] | null;
  shelters: Shelter[];
  nearestShelterId: string | undefined;
  airAlertStatus: AirAlert["status"];
  buildingModels: BuildingModelData[];
  buildingModelPreview: BuildingModelData | null;
};

async function loadRouteShape(tripId: string, fixtureRouteId?: string): Promise<[number, number][]> {
  if (fixtureRouteId) {
    return createFixtureRoute({ fixtureRouteId }).map(([lat, lng]) => [lng, lat]);
  }
  const response = await fetch(apiUrl(`/api/routes/${encodeURIComponent(tripId)}`));
  if (!response.ok) throw new Error(`Route API returned ${response.status}.`);
  const payload = (await response.json()) as { data?: [number, number][] };
  if (
    !Array.isArray(payload.data) ||
    payload.data.length < 2 ||
    !payload.data.every(
      (point) => Array.isArray(point) && point.length >= 2 && isNumber(point[0]) && isNumber(point[1]),
    )
  ) {
    throw new Error("Route API returned invalid route coordinates.");
  }
  return payload.data.map(([lat, lng]): [number, number] => [lng, lat]);
}

/** Pushes app state into the map sources and 3D layers. Each source updates only when its data changes. */
export function useMapSync(input: MapSyncInput): void {
  const { mapRef, mapReady, vehicle3DLayerRef, building3DLayerRef, vehicles, selectedVehicle } = input;
  const selectedVehicleId = selectedVehicle?.id;

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    // While a vehicle is selected, only that vehicle stays on the map.
    const mapVehicles = selectedVehicleId
      ? vehicles.filter((vehicle) => vehicle.id === selectedVehicleId)
      : vehicles;
    vehicle3DLayerRef.current?.setVehicles(
      mapVehicles
        .filter((vehicle): vehicle is typeof vehicle & { type: "tram" | "trolleybus" | "bus" } =>
          vehicle.type === "bus" || vehicle.type === "tram" || vehicle.type === "trolleybus",
        )
        .map((vehicle) => ({
          id: vehicle.id,
          type: vehicle.type,
          route: vehicle.route,
          destination: vehicle.destination,
          lat: vehicle.lat,
          lng: vehicle.lng,
          bearing: vehicle.bearing,
          plate: vehicle.plate,
          stopName: vehicle.nextStop ?? null,
          selected: vehicle.id === selectedVehicleId,
        })),
    );
    updateGeoJSONSource(map, "wayme-vehicles", vehicleFeatures(mapVehicles, selectedVehicleId));
  }, [mapRef, mapReady, selectedVehicleId, vehicle3DLayerRef, vehicles]);

  const { buildingModels, buildingModelPreview } = input;
  useEffect(() => {
    if (!mapReady) return;
    const layer = building3DLayerRef.current;
    if (!layer) return;
    layer.setModels(
      buildingModelPreview
        ? [...buildingModels.filter((model) => model.id !== buildingModelPreview.id), buildingModelPreview]
        : buildingModels,
    );
  }, [building3DLayerRef, buildingModelPreview, buildingModels, mapReady]);

  const { stops } = input;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    updateGeoJSONSource(map, "wayme-stops", stopFeatures(stops));
  }, [mapRef, mapReady, stops]);

  const { mapPlaces, layerCategories, selectedPlaceId } = input;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const visible =
      layerCategories.size > 0 ? mapPlaces.filter((place) => layerCategories.has(place.category)) : mapPlaces;
    updateGeoJSONSource(map, "wayme-city-places", cityPlaceFeatures(visible, selectedPlaceId));
  }, [layerCategories, mapPlaces, mapReady, mapRef, selectedPlaceId]);

  const { userLocation } = input;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !userLocation) return;
    updateGeoJSONSource(map, "wayme-location", {
      type: "FeatureCollection",
      features: [{ type: "Feature", geometry: { type: "Point", coordinates: userLocation }, properties: {} }],
    });
  }, [mapReady, mapRef, userLocation]);

  const { shelters, nearestShelterId, airAlertStatus } = input;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    updateGeoJSONSource(map, "wayme-shelters", shelterFeatures(shelters, nearestShelterId));
    const visibility = airAlertStatus === "active" ? "visible" : "none";
    map.setLayoutProperty("wayme-shelters-circles", "visibility", visibility);
    map.setLayoutProperty("wayme-shelters-labels", "visibility", visibility);
  }, [airAlertStatus, mapReady, mapRef, nearestShelterId, shelters]);

  // The route depends on the trip, not on the live position, so polling does not reload it.
  const tripId = selectedVehicle?.tripId;
  const fixtureRouteId = selectedVehicle?.fixtureRouteId;
  const vehicleType = selectedVehicle?.type;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    updateGeoJSONSource(map, "wayme-route", routeFeatures());
    if (!tripId || !vehicleType) return;
    let active = true;
    let stopAnimation = (): void => {};
    loadRouteShape(tripId, fixtureRouteId)
      .then((coordinates) => {
        if (coordinates.length < 2) throw new Error("Route shape contains fewer than two coordinates.");
        if (!active || !mapRef.current) return;
        updateGeoJSONSource(map, "wayme-route", routeFeatures(coordinates));
        // MapLibre paint needs a concrete color; the DOM progress marker can keep the CSS variable.
        map.setPaintProperty("wayme-route-line", "line-color", resolveColor(COLORS[vehicleType]));
        stopAnimation = animateRouteProgress(map, coordinates, COLORS[vehicleType]);
      })
      .catch((error: unknown) => {
        console.error("Route shape is unavailable", error);
      });
    return () => {
      active = false;
      stopAnimation();
    };
  }, [fixtureRouteId, mapReady, mapRef, tripId, vehicleType]);
}
