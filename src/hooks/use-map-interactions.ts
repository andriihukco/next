import { useEffect, type RefObject } from "react";
import { GeoJSONSource, type Map as MapLibreMap, type MapGeoJSONFeature, type MapMouseEvent, type Point as ScreenPoint } from "maplibre-gl";
import type { Point } from "geojson";
import type { Stop, Vehicle } from "../lib/app-types";
import { cityBuildingFromMapFeature, type CityPlace } from "../lib/city-places";
import { INTERACTIVE_LAYERS, placeLayerId } from "../lib/map-app-layers";
import { useLatest } from "./use-latest";

/** Group id of a place layer, or null for any other layer. Group ids have no hyphens. */
function placeGroupOfLayer(layerId: string): string | null {
  const match = /^wayme-places-([a-z]+)-/.exec(layerId);
  return match ? match[1] : null;
}

type MapInteractionTargets = {
  places: CityPlace[];
  vehicles: Vehicle[];
  stops: Stop[];
  onSelectPlace: (place: CityPlace) => void;
  onSelectBuilding: (place: CityPlace) => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onSelectStop: (stop: Stop) => void;
};

const TAP_RADIUS_PX = 12;

function findInteractiveFeature(map: MapLibreMap, point: ScreenPoint): MapGeoJSONFeature | undefined {
  const exact = map.queryRenderedFeatures(point, { layers: INTERACTIVE_LAYERS });
  if (exact.length) return exact[0];
  // Small pins are hard to hit on touch screens, so pick the closest feature within a radius.
  const nearby = map.queryRenderedFeatures(
    [
      [point.x - TAP_RADIUS_PX, point.y - TAP_RADIUS_PX],
      [point.x + TAP_RADIUS_PX, point.y + TAP_RADIUS_PX],
    ],
    { layers: INTERACTIVE_LAYERS },
  );
  const distance = (feature: MapGeoJSONFeature): number => {
    if (feature.geometry.type !== "Point") return Infinity;
    const [lng, lat] = feature.geometry.coordinates;
    if (typeof lng !== "number" || typeof lat !== "number") return Infinity;
    const projected = map.project([lng, lat]);
    return Math.hypot(projected.x - point.x, projected.y - point.y);
  };
  return nearby.sort((left, right) => distance(left) - distance(right))[0];
}

/** Click and hover on the map: vehicles, stops, places, clusters, and plain OSM buildings. */
export function useMapInteractions(
  mapRef: RefObject<MapLibreMap | null>,
  mapReady: boolean,
  targets: MapInteractionTargets,
): void {
  const latest = useLatest(targets);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const handleClick = (event: MapMouseEvent): void => {
      const feature = findInteractiveFeature(map, event.point);
      const current = latest.current;
      if (!feature) {
        const buildingFeature = map
          .queryRenderedFeatures(event.point)
          .find((candidate) => candidate.sourceLayer === "building");
        const place = buildingFeature ? cityBuildingFromMapFeature(buildingFeature) : null;
        if (place) current.onSelectBuilding(place);
        return;
      }
      if (!feature.properties) return;
      const layerId = feature.layer.id;
      const placeGroup = placeGroupOfLayer(layerId);
      if (placeGroup && (layerId === placeLayerId(placeGroup, "clusters") || layerId === placeLayerId(placeGroup, "cluster-count"))) {
        // A cluster belongs to the source of its group; feature.source names that source.
        const source = map.getSource(feature.source);
        if (!(source instanceof GeoJSONSource)) return;
        void source
          .getClusterExpansionZoom(Number(feature.properties.cluster_id))
          .then((zoom) => {
            map.easeTo({
              center: (feature.geometry as Point).coordinates as [number, number],
              zoom,
              duration: 300,
            });
          })
          .catch((error: unknown) => {
            console.error("Could not expand the map place cluster.", error);
          });
        return;
      }
      const { id } = feature.properties;
      if (placeGroup) {
        const place = current.places.find((candidate) => candidate.id === id);
        if (place) current.onSelectPlace(place);
        return;
      }
      if (layerId.startsWith("wayme-vehicles")) {
        const vehicle = current.vehicles.find((candidate) => candidate.id === id);
        if (vehicle) current.onSelectVehicle(vehicle);
        return;
      }
      if (layerId.startsWith("wayme-stops")) {
        const stop = current.stops.find((candidate) => candidate.id === id);
        if (stop) current.onSelectStop(stop);
      }
    };
    const handleMove = (event: MapMouseEvent): void => {
      map.getCanvas().style.cursor = findInteractiveFeature(map, event.point) ? "pointer" : "";
    };
    map.on("click", handleClick);
    map.on("mousemove", handleMove);
    return () => {
      map.off("click", handleClick);
      map.off("mousemove", handleMove);
    };
  }, [latest, mapReady, mapRef]);
}
