/** GeoJSON builders and map source helpers for vehicles, stops, shelters, places and routes. */
import * as maplibregl from "maplibre-gl";
import { GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import type { FeatureCollection, LineString, Point, Position } from "geojson";
import type { CityPlace } from "./city-places";
import type { Shelter, Stop, Vehicle } from "./app-types";

export type VehicleFeatureProperties = Pick<
  Vehicle,
  "id" | "route" | "plate" | "type"
> & { selected: boolean };
export type StopFeatureProperties = Pick<Stop, "id" | "name">;
export type ShelterFeatureProperties = Pick<Shelter, "id" | "address"> & {
  nearest: boolean;
  readyOrRecommended: boolean;
};
export type CityPlaceFeatureProperties = Pick<
  CityPlace,
  "id" | "name" | "category" | "categoryLabel" | "address"
> & { selected: boolean };

export const vehicleFeatures = (
  vehicles: Vehicle[],
  selectedId?: string,
): FeatureCollection<Point, VehicleFeatureProperties> => ({
  type: "FeatureCollection",
  features: vehicles.map((vehicle) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [vehicle.lng, vehicle.lat] },
    properties: {
      id: vehicle.id,
      route: vehicle.route,
      plate: vehicle.plate,
      type: vehicle.type,
      selected: vehicle.id === selectedId,
    },
  })),
});

export const stopFeatures = (
  stops: Stop[],
): FeatureCollection<Point, StopFeatureProperties> => ({
  type: "FeatureCollection",
  features: stops.map((stop) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [stop.lng, stop.lat] },
    properties: { id: stop.id, name: stop.name },
  })),
});

export const shelterFeatures = (
  shelters: Shelter[],
  nearestId?: string,
): FeatureCollection<Point, ShelterFeatureProperties> => ({
  type: "FeatureCollection",
  features: shelters.map((shelter) => {
    const status = shelter.status.trim().toLocaleLowerCase("uk-UA");
    return {
      type: "Feature",
      geometry: { type: "Point", coordinates: [shelter.lng, shelter.lat] },
      properties: {
        id: shelter.id,
        address: shelter.address,
        nearest: shelter.id === nearestId,
        readyOrRecommended:
          shelter.access24_7 &&
          (status === "готове" || status.startsWith("рекомендоване")),
      },
    };
  }),
});

export const cityPlaceFeatures = (
  places: CityPlace[],
  selectedId?: string,
): FeatureCollection<Point, CityPlaceFeatureProperties> => ({
  type: "FeatureCollection",
  features: places.map((place) => ({
    type: "Feature",
    id: place.id,
    geometry: { type: "Point", coordinates: [place.lng, place.lat] },
    properties: {
      id: place.id,
      name: place.name,
      category: place.category,
      categoryLabel: place.categoryLabel,
      address: place.address,
      selected: place.id === selectedId,
    },
  })),
});

export const routeFeatures = (
  coordinates: Position[] = [],
): FeatureCollection<LineString> => ({
  type: "FeatureCollection",
  features:
    coordinates.length > 1
      ? [
          {
            type: "Feature",
            geometry: { type: "LineString", coordinates },
            properties: {},
          },
        ]
      : [],
});

export const updateGeoJSONSource = (
  map: MapLibreMap,
  id: string,
  data: FeatureCollection,
): void => {
  const source = map.getSource(id);
  if (source instanceof GeoJSONSource) source.setData(data);
};

export const animateRouteProgress = (
  map: MapLibreMap,
  coordinates: [number, number][],
  color: string,
): (() => void) => {
  if (coordinates.length < 2) return () => {};
  const distances = [0];
  for (let index = 1; index < coordinates.length; index += 1) {
    const previous = coordinates[index - 1];
    const current = coordinates[index];
    distances.push(
      distances[index - 1] +
        new maplibregl.LngLat(previous[0], previous[1]).distanceTo(
          new maplibregl.LngLat(current[0], current[1]),
        ),
    );
  }
  const routeLength = distances[distances.length - 1];
  if (!routeLength) return () => {};

  const element = document.createElement("span");
  element.className = "route-progress-marker";
  element.setAttribute("aria-hidden", "true");
  element.style.setProperty("--route-color", color);
  const marker = new maplibregl.Marker({ element, anchor: "center" })
    .setLngLat(coordinates[0])
    .addTo(map);
  const startedAt = performance.now();
  let frame = 0;
  const advance = (now: number): void => {
    const distance = (((now - startedAt) * 9) / 1000) % routeLength;
    let segment = distances.findIndex(
      (value, index) => index > 0 && value >= distance,
    );
    if (segment < 1) segment = coordinates.length - 1;
    const segmentStart = distances[segment - 1];
    const segmentLength = distances[segment] - segmentStart;
    const progress =
      segmentLength > 0 ? (distance - segmentStart) / segmentLength : 0;
    const [startLng, startLat] = coordinates[segment - 1];
    const [endLng, endLat] = coordinates[segment];
    marker.setLngLat([
      startLng + (endLng - startLng) * progress,
      startLat + (endLat - startLat) * progress,
    ]);
    frame = window.requestAnimationFrame(advance);
  };
  frame = window.requestAnimationFrame(advance);

  return () => {
    window.cancelAnimationFrame(frame);
    marker.remove();
  };
};
