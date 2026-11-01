import { useEffect, useMemo, useState, type RefObject } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import { minutesAway } from "../lib/app-formatters";
import type { Stop, Vehicle } from "../lib/app-types";

export type ElevationStatus = "idle" | "loading" | "ready" | "unavailable";

/** Polls terrain elevation under the selected stop until the DEM tile has loaded (max 3 s). */
function useStopElevation(
  mapRef: RefObject<MapLibreMap | null>,
  mapReady: boolean,
  stop: Stop | null,
  terrainEnabled: boolean,
) {
  const [elevation, setElevation] = useState<number | null>(null);
  const [status, setStatus] = useState<ElevationStatus>("idle");

  useEffect(() => {
    setElevation(null);
    if (!stop || !terrainEnabled || !mapReady) {
      setStatus("idle");
      return;
    }
    const map = mapRef.current;
    if (!map) return;
    setStatus("loading");
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      const value = map.queryTerrainElevation([stop.lng, stop.lat]);
      if (value !== null && Number.isFinite(value)) {
        setElevation(value);
        setStatus("ready");
        window.clearInterval(timer);
      } else if (attempts >= 10) {
        setStatus("unavailable");
        window.clearInterval(timer);
      }
    }, 300);
    return () => window.clearInterval(timer);
  }, [mapReady, mapRef, stop, terrainEnabled]);

  return { elevation, status };
}

const MAX_ARRIVALS = 6;

/** Everything the stop inspector shows that is derived: elevation, nearest arrivals, distance from the user. */
export function useStopDetails(
  mapRef: RefObject<MapLibreMap | null>,
  mapReady: boolean,
  stop: Stop | null,
  terrainEnabled: boolean,
  vehicles: Vehicle[],
  userLocation: [number, number] | null,
) {
  const elevation = useStopElevation(mapRef, mapReady, stop, terrainEnabled);
  const arrivals = useMemo(
    () =>
      stop
        ? vehicles
            .filter((vehicle) => stop.routes.includes(vehicle.route))
            .map((vehicle) => ({ vehicle, minutes: minutesAway(vehicle, stop) }))
            .sort((a, b) => a.minutes - b.minutes)
            .slice(0, MAX_ARRIVALS)
        : [],
    [stop, vehicles],
  );
  const distance = useMemo(() => {
    if (!stop || !userLocation) return null;
    return new maplibregl.LngLat(userLocation[0], userLocation[1]).distanceTo(
      new maplibregl.LngLat(stop.lng, stop.lat),
    );
  }, [stop, userLocation]);
  return { ...elevation, arrivals, distance };
}
