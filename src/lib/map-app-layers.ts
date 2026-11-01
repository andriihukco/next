import type * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import { resolveColor } from "./design-colors";
import { snapshotMapPalette } from "./map-theme";
import type { TransportLayer } from "./map-layers";
import { CITY_PLACE_CATEGORY_COLORS, type CityPlaceCategory } from "./city-places";
import { cityPlaceGroupCategories, cityPlaceGroups } from "./city-place-categories";
import { TRANSIT_TYPE_COLORS as COLORS } from "./fleet";
import { cityPlacePinImage, pinImageId } from "./map-pins";
import { addBuildingExtrusions, addTerrain, paintBaseStyle } from "./map-base-style";
import type { Building3DLayer } from "./building-3d-layer";
import type { Vehicle3DLayer } from "./vehicle-3d-layer";
import {
  cityPlaceFeatures,
  routeFeatures,
  shelterFeatures,
  stopFeatures,
  vehicleFeatures,
} from "./map-features";

const BRAND_BLUE = "var(--brand-blue)";

/** One clustered source per place group, so a cluster never mixes groups (DESIGN.md §5, map layers). */
export const placeSourceId = (groupId: string): string => `wayme-places-${groupId}`;
export const placeLayerId = (groupId: string, kind: PlaceLayerKind): string => `wayme-places-${groupId}-${kind}`;

type PlaceLayerKind = "clusters" | "cluster-count" | "points" | "labels";
const PLACE_LAYER_KINDS: PlaceLayerKind[] = ["clusters", "cluster-count", "points", "labels"];

/** Layers the user can click: vehicles, stops, and city places with their clusters. */
export const INTERACTIVE_LAYERS = [
  "wayme-vehicles-circles",
  "wayme-stops-icons",
  "wayme-stops-labels",
  ...cityPlaceGroups.flatMap((group) => PLACE_LAYER_KINDS.map((kind) => placeLayerId(group.id, kind))),
];

/** Layers behind each transport toggle. The 3D vehicles hide with the 2D ones. */
export const TRANSPORT_LAYER_IDS: Record<TransportLayer, string[]> = {
  vehicles: ["wayme-vehicles-circles", "wayme-vehicles-badge", "wayme-vehicles-label", "un-vehicles-3d"],
  stops: ["wayme-stops-icons", "wayme-stops-labels"],
};

/** The 3D layers are null when three.js could not load; the 2D map still works. */
export type AppLayers = {
  vehicle3D: Vehicle3DLayer | null;
  building3D: Building3DLayer | null;
};

function addAppSources(map: MapLibreMap): void {
  map.addSource("wayme-vehicles", { type: "geojson", data: vehicleFeatures([]) });
  map.addSource("wayme-stops", { type: "geojson", data: stopFeatures([]) });
  for (const group of cityPlaceGroups) {
    map.addSource(placeSourceId(group.id), {
      type: "geojson",
      data: cityPlaceFeatures([]),
      cluster: true,
      clusterMaxZoom: 16,
      clusterRadius: 56,
    });
  }
  map.addSource("wayme-route", { type: "geojson", lineMetrics: true, data: routeFeatures() });
  map.addSource("wayme-location", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  map.addSource("wayme-shelters", { type: "geojson", data: shelterFeatures([]) });
}

/**
 * Draws one pin image per place category. A category whose pin fails falls back to
 * another category's pin so the layer never asks for a missing image.
 * Returns false when the map was replaced while the images were drawing.
 */
async function addPinImages(map: MapLibreMap, isCurrent: () => boolean): Promise<boolean> {
  const placeCategories = Object.keys(CITY_PLACE_CATEGORY_COLORS) as CityPlaceCategory[];
  const add = (category: CityPlaceCategory, normal: ImageData, active: ImageData): void => {
    map.addImage(pinImageId(category), normal, { pixelRatio: 2 });
    map.addImage(pinImageId(category, true), active, { pixelRatio: 2 });
  };
  let fallbackPin: { normal: ImageData; active: ImageData } | undefined;
  try {
    const normal = await cityPlacePinImage("other");
    fallbackPin = { normal, active: await cityPlacePinImage("other", true) };
  } catch (error) {
    console.error("Could not create the fallback map pin.", error);
  }
  if (!isCurrent()) return false;
  const missingPinCategories: CityPlaceCategory[] = [];
  for (const category of placeCategories) {
    try {
      const normal = await cityPlacePinImage(category);
      const active = await cityPlacePinImage(category, true);
      add(category, normal, active);
      fallbackPin ??= { normal, active };
    } catch (error) {
      console.error(`Could not create the ${category} map pin.`, error);
      if (fallbackPin) add(category, fallbackPin.normal, fallbackPin.active);
      else missingPinCategories.push(category);
    }
    if (!isCurrent()) return false;
  }
  if (fallbackPin) {
    for (const category of missingPinCategories) {
      add(category, fallbackPin.normal, fallbackPin.active);
    }
  } else if (missingPinCategories.length > 0) {
    console.error(`Could not create map pins for: ${missingPinCategories.join(", ")}.`);
  }
  return true;
}

// Each pin image is looked up by category; a selected place uses its active image.
function cityPlaceIconExpression(): maplibregl.ExpressionSpecification {
  const placeCategories = Object.keys(CITY_PLACE_CATEGORY_COLORS) as CityPlaceCategory[];
  const pinExpression = (active: boolean): maplibregl.ExpressionSpecification => {
    const branches = placeCategories
      .filter((category) => category !== "other")
      .flatMap((category): [string, string] => [category, pinImageId(category, active)]);
    const match: unknown[] = ["match", ["get", "category"], ...branches, pinImageId("other", active)];
    return match as unknown as maplibregl.ExpressionSpecification;
  };
  return ["case", ["==", ["get", "selected"], true], pinExpression(true), pinExpression(false)];
}

function addRouteAndStopLayers(map: MapLibreMap): void {
  map.addLayer({
    id: "wayme-route-outline",
    type: "line",
    source: "wayme-route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": resolveColor("var(--card)"), "line-width": 10, "line-opacity": 0.88 },
  });
  map.addLayer({
    id: "wayme-route-line",
    type: "line",
    source: "wayme-route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": resolveColor("var(--map-route)"), "line-width": 5, "line-opacity": 0.95 },
  });
  map.addLayer({
    id: "wayme-stops-icons",
    type: "symbol",
    source: "wayme-stops",
    minzoom: 13,
    layout: {
      "icon-image": "wayme-place-transport",
      "icon-size": ["interpolate", ["linear"], ["zoom"], 13, 0.48, 17, 0.68],
      "icon-anchor": "bottom",
      "icon-allow-overlap": false,
      "icon-ignore-placement": false,
    },
  });
  map.addLayer({
    id: "wayme-stops-labels",
    type: "symbol",
    source: "wayme-stops",
    minzoom: 16,
    layout: {
      "text-field": ["get", "name"],
      "text-size": 11,
      "text-offset": [0, 1.8],
      "text-font": ["Noto Sans Regular"],
    },
    paint: {
      "text-color": resolveColor("var(--map-label)"),
      "text-halo-color": resolveColor("var(--card)"),
      "text-halo-width": 1.5,
    },
  });
}

/** Group color for its cluster bubbles: the first category's pin color. */
function placeGroupColor(groupId: string): string {
  const first = cityPlaceGroupCategories(groupId)[0]?.id ?? "other";
  return CITY_PLACE_CATEGORY_COLORS[first];
}

function addPlaceLayers(map: MapLibreMap): void {
  for (const group of cityPlaceGroups) {
    const source = placeSourceId(group.id);
    map.addLayer({
      id: placeLayerId(group.id, "clusters"),
      type: "circle",
      source,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": resolveColor(placeGroupColor(group.id)),
        "circle-radius": ["step", ["get", "point_count"], 15, 20, 19, 80, 24],
        "circle-stroke-color": resolveColor("var(--card)"),
        "circle-stroke-width": 2,
      },
    });
    map.addLayer({
      id: placeLayerId(group.id, "cluster-count"),
      type: "symbol",
      source,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": 12,
        "text-font": ["Noto Sans Bold"],
      },
      paint: { "text-color": resolveColor("var(--card)") },
    });
    map.addLayer({
      id: placeLayerId(group.id, "points"),
      type: "symbol",
      source,
      filter: ["!", ["has", "point_count"]],
      layout: {
        "icon-image": cityPlaceIconExpression(),
        "icon-size": ["interpolate", ["linear"], ["zoom"], 12, 0.82, 17, 1.08],
        "icon-anchor": "bottom",
        "icon-allow-overlap": false,
        "icon-ignore-placement": false,
      },
    });
    map.addLayer({
      id: placeLayerId(group.id, "labels"),
      type: "symbol",
      source,
      minzoom: 15,
      filter: ["!", ["has", "point_count"]],
      layout: {
        "text-field": ["get", "name"],
        "text-size": 10,
        "text-offset": [0, 1.8],
        "text-font": ["Noto Sans Regular"],
        "text-max-width": 12,
        "text-optional": true,
      },
      paint: {
        "text-color": resolveColor("var(--map-label-strong)"),
        "text-halo-color": resolveColor("var(--card)"),
        "text-halo-width": 1.5,
      },
    });
  }
}

function addShelterLayers(map: MapLibreMap): void {
  map.addLayer({
    id: "wayme-shelters-circles",
    type: "circle",
    source: "wayme-shelters",
    layout: { visibility: "none" },
    paint: {
      "circle-radius": ["case", ["get", "nearest"], 11, 7],
      "circle-color": [
        "case",
        ["get", "nearest"],
        resolveColor("var(--map-marker-alert)"),
        ["get", "readyOrRecommended"],
        resolveColor("var(--map-marker-teal)"),
        resolveColor("var(--map-marker-muted)"),
      ],
      "circle-stroke-color": resolveColor("var(--card)"),
      "circle-stroke-width": ["case", ["get", "nearest"], 3, 2],
    },
  });
  map.addLayer({
    id: "wayme-shelters-labels",
    type: "symbol",
    source: "wayme-shelters",
    minzoom: 14,
    filter: ["==", ["get", "nearest"], true],
    layout: {
      visibility: "none",
      "text-field": ["get", "address"],
      "text-size": 11,
      "text-offset": [0, 1.35],
      "text-font": ["Noto Sans Bold"],
      "text-allow-overlap": true,
    },
    paint: {
      "text-color": resolveColor("var(--map-label-alert)"),
      "text-halo-color": resolveColor("var(--card)"),
      "text-halo-width": 2,
    },
  });
}

// three.js is large, so the 3D layers load here, after the map and the app shell are up.
async function load3DLayers(onSelectVehicle: (id: string) => void): Promise<AppLayers> {
  try {
    const [{ createBuilding3DLayer }, { createVehicle3DLayer }] = await Promise.all([
      import("./building-3d-layer"),
      import("./vehicle-3d-layer"),
    ]);
    return { building3D: createBuilding3DLayer(), vehicle3D: createVehicle3DLayer({ onSelect: onSelectVehicle }) };
  } catch (error) {
    console.error("3D layers are unavailable; showing the 2D map.", error);
    return { building3D: null, vehicle3D: null };
  }
}

function addVehicleLayers(map: MapLibreMap, layers: AppLayers): AppLayers {
  map.addLayer({
    id: "wayme-vehicles-circles",
    type: "circle",
    source: "wayme-vehicles",
    paint: {
      "circle-radius": 18,
      "circle-color": resolveColor("var(--card)"),
      "circle-opacity": 0.03,
      "circle-stroke-opacity": 0.05,
      "circle-stroke-width": 0,
    },
  });
  if (layers.building3D) map.addLayer(layers.building3D);
  if (layers.vehicle3D) map.addLayer(layers.vehicle3D);
  // DOM-free route labels: a colored badge and its route number, drawn by MapLibre above the models.
  map.addLayer({
    id: "wayme-vehicles-badge",
    type: "circle",
    source: "wayme-vehicles",
    minzoom: 14,
    paint: {
      "circle-radius": ["case", ["get", "selected"], 13, 11],
      "circle-color": [
        "match",
        ["get", "type"],
        "bus", resolveColor(COLORS.bus),
        "tram", resolveColor(COLORS.tram),
        "trolleybus", resolveColor(COLORS.trolleybus),
        resolveColor(COLORS.taxi),
      ],
      "circle-stroke-color": resolveColor("var(--card)"),
      "circle-stroke-width": 2,
    },
  });
  map.addLayer({
    id: "wayme-vehicles-label",
    type: "symbol",
    source: "wayme-vehicles",
    minzoom: 14,
    layout: {
      "text-field": ["get", "route"],
      "text-font": ["Noto Sans Bold"],
      "text-size": 12,
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: { "text-color": resolveColor("var(--card)") },
  });
  map.addLayer({
    id: "wayme-location-circle",
    type: "circle",
    source: "wayme-location",
    paint: {
      "circle-radius": 8,
      "circle-color": resolveColor(BRAND_BLUE),
      "circle-stroke-color": resolveColor("var(--card)"),
      "circle-stroke-width": 3,
    },
  });
  return layers;
}

/**
 * Adds every app source and layer to a freshly loaded map, in paint order.
 * Returns null when the map was replaced before setup finished.
 */
export async function installAppLayers(
  map: MapLibreMap,
  options: { isCurrent: () => boolean; onSelectVehicle: (id: string) => void },
): Promise<AppLayers | null> {
  snapshotMapPalette();
  addAppSources(map);
  const layersReady = load3DLayers(options.onSelectVehicle);
  if (!(await addPinImages(map, options.isCurrent))) return null;
  const layers = await layersReady;
  if (!options.isCurrent()) return null;
  paintBaseStyle(map);
  addBuildingExtrusions(map);
  addTerrain(map);
  addRouteAndStopLayers(map);
  addPlaceLayers(map);
  addShelterLayers(map);
  return addVehicleLayers(map, layers);
}
