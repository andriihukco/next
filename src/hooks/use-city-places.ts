import { useEffect, useRef, useState, type RefObject } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { readAdminOverride } from "../lib/admin-overrides";
import type { AppView } from "../lib/app-types";
import { isArrayOf, isCityEvent, isCityPlace } from "../lib/app-validators";
import { sampleEvents } from "../lib/features";
import type { CityEvent } from "../lib/listing-types";
import { cityPlacesFromMapFeatures, type CityPlace } from "../lib/city-places";
import { useLatest } from "./use-latest";
import type { LoadStatus } from "./use-transit-feed";


/**
 * Places read from the visible OSM tiles. The city guide and the map pins both read this list;
 * the map applies its own layer filter (src/lib/map-layers.ts). Events stay here until they get their own source;
 * until then only development builds have (sample) events.
 */
export function useCityPlaces(
  mapRef: RefObject<MapLibreMap | null>,
  activeView: AppView,
  activeViewRef: RefObject<AppView>,
) {
  const [cityPlaces, setCityPlacesState] = useState<CityPlace[]>(() =>
    readAdminOverride("places", [], isArrayOf(isCityPlace)),
  );
  // Mirrors `cityPlaces` so the map's idle listener compares against the latest list.
  const cityPlacesRef = useRef(cityPlaces);
  const [eventData, setEventData] = useState<CityEvent[]>(() =>
    readAdminOverride("events", sampleEvents, isArrayOf(isCityEvent)),
  );
  const [cityPlacesStatus, setCityPlacesStatus] = useState<LoadStatus>("loading");
  const [cityPlacesError, setCityPlacesError] = useState("");

  const setCityPlaces = (places: CityPlace[]): void => {
    cityPlacesRef.current = places;
    setCityPlacesState(places);
  };

  const refreshCityPlaces = (): void => {
    if (activeViewRef.current !== "city") return;
    const map = mapRef.current;
    if (!map) return;
    if (!map.getSource("openmaptiles")) {
      setCityPlacesStatus("error");
      setCityPlacesError("Джерело місць не доступне у стилі карти.");
      return;
    }
    if (!map.isSourceLoaded("openmaptiles")) {
      setCityPlacesStatus("loading");
      return;
    }
    try {
      const bounds = map.getBounds();
      const features = map.querySourceFeatures("openmaptiles", { sourceLayer: "poi" }).filter((feature) => {
        if (feature.geometry.type !== "Point") return false;
        const [lng, lat] = feature.geometry.coordinates;
        return typeof lng === "number" && typeof lat === "number" && bounds.contains([lng, lat]);
      });
      const nextPlaces = readAdminOverride("places", cityPlacesFromMapFeatures(features), isArrayOf(isCityPlace));
      // An empty view clears the pins too; keeping the old ones showed places from another area.
      if (JSON.stringify(nextPlaces) !== JSON.stringify(cityPlacesRef.current)) {
        setCityPlaces(nextPlaces);
      }
      setCityPlacesStatus("ready");
      setCityPlacesError("");
    } catch (error) {
      console.error("Could not read places from the visible map tiles.", error);
      setCityPlacesStatus("error");
      setCityPlacesError("Не вдалося прочитати місця з даних карти.");
    }
  };

  // Coming back to the city view re-reads the places that are now visible.
  const refreshRef = useLatest(refreshCityPlaces);
  useEffect(() => {
    if (activeView === "city") refreshRef.current();
  }, [activeView, refreshRef]);

  return {
    cityPlaces,
    setCityPlaces,
    cityPlacesStatus,
    cityPlacesError,
    refreshCityPlaces,
    eventData,
    setEventData,
  };
}
