import { useEffect, useRef, useState, type RefObject } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { CENTER, LVIV_REGION_BOUNDS, MAP_STYLE } from "../lib/app-constants";
import { installAppLayers } from "../lib/map-app-layers";
import { recolorMapForTheme } from "../lib/map-theme";
import { useResolvedTheme } from "../lib/use-theme";
import type { Building3DLayer } from "../lib/building-3d-layer";
import type { Vehicle3DLayer } from "../lib/vehicle-3d-layer";
import { useLatest } from "./use-latest";

// MapLibre looks for its worker next to its own bundle chunk, where the build does not emit it.
maplibregl.setWorkerUrl(maplibreWorkerUrl);

type CityMapHandlers = {
  /** Reads places from the visible tiles. Called on idle and, throttled, while moving. */
  onViewportChange: () => void;
  onSelectVehicle: (id: string) => void;
};

/** Creates the MapLibre map once, installs the app layers, and owns camera and terrain state. */
export function useCityMap(mapNode: RefObject<HTMLDivElement | null>, handlers: CityMapHandlers) {
  const mapRef = useRef<MapLibreMap | null>(null);
  const vehicle3DLayerRef = useRef<Vehicle3DLayer | null>(null);
  const building3DLayerRef = useRef<Building3DLayer | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapPitch, setMapPitch] = useState(60);
  const [mapBearing, setMapBearing] = useState(0);
  const [terrainEnabled, setTerrainEnabled] = useState(false);
  const handlersRef = useLatest(handlers);

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapNode.current,
      style: MAP_STYLE,
      center: CENTER,
      zoom: 14.6,
      minZoom: 8,
      maxZoom: 19,
      maxBounds: LVIV_REGION_BOUNDS,
      pitch: 60,
      bearing: -12,
      maxPitch: 75,
      attributionControl: {},
    });
    const refreshPlaces = (): void => handlersRef.current.onViewportChange();
    let lastRefresh = 0;
    let refreshTimer: number | null = null;
    const refreshWhileMoving = (): void => {
      const now = Date.now();
      const elapsed = now - lastRefresh;
      if (elapsed >= 250) {
        lastRefresh = now;
        refreshPlaces();
        return;
      }
      if (refreshTimer !== null) return;
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null;
        lastRefresh = Date.now();
        refreshPlaces();
      }, 250 - elapsed);
    };
    const updatePitch = (): void => setMapPitch(map.getPitch());
    map.on("pitch", updatePitch);
    map.on("rotate", () => setMapBearing(map.getBearing()));
    map.on("idle", refreshPlaces);
    map.on("move", refreshWhileMoving);
    map.once("load", async () => {
      const layers = await installAppLayers(map, {
        isCurrent: () => mapRef.current === map,
        onSelectVehicle: (id) => handlersRef.current.onSelectVehicle(id),
      });
      if (!layers) return;
      building3DLayerRef.current = layers.building3D;
      vehicle3DLayerRef.current = layers.vehicle3D;
      setMapReady(true);
    });
    map.on("error", ({ error }) => {
      console.error("Map rendering error", error);
    });
    mapRef.current = map;
    return () => {
      map.off("pitch", updatePitch);
      map.off("move", refreshWhileMoving);
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
      map.remove();
      mapRef.current = null;
      vehicle3DLayerRef.current = null;
      building3DLayerRef.current = null;
      setMapReady(false);
    };
  }, [handlersRef, mapNode]);

  const resolvedTheme = useResolvedTheme();
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    recolorMapForTheme(map);
  }, [resolvedTheme, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.getSource("wayme-dem")) return;
    map.setTerrain(terrainEnabled ? { source: "wayme-dem", exaggeration: 1 } : null);
    map.setLayoutProperty(
      "wayme-terrain-hillshade",
      "visibility",
      terrainEnabled && mapPitch < 0.5 ? "visible" : "none",
    );
  }, [mapPitch, mapReady, terrainEnabled]);

  const resetOrientation = (): void => {
    mapRef.current?.easeTo({ bearing: 0, roll: 0, duration: 250 });
  };
  /** Turns the bearing and tilts the pitch by degrees. Pitch stays within 0 and the map's max pitch. */
  const orbit = (bearingDelta: number, pitchDelta: number, duration: number): void => {
    const map = mapRef.current;
    if (!map) return;
    const pitch = Math.min(Math.max(map.getPitch() + pitchDelta, 0), map.getMaxPitch());
    map.easeTo({ bearing: map.getBearing() + bearingDelta, pitch, duration });
  };
  const toggleMapMode = (): void => {
    const pitch = mapPitch >= 0.5 ? 0 : 60;
    setMapPitch(pitch);
    mapRef.current?.easeTo({ pitch, ...(pitch === 0 ? { bearing: 0 } : {}), duration: 400 });
  };

  return {
    mapRef,
    vehicle3DLayerRef,
    building3DLayerRef,
    mapReady,
    mapPitch,
    mapBearing,
    terrainEnabled,
    setTerrainEnabled,
    resetOrientation,
    orbit,
    toggleMapMode,
  };
}
