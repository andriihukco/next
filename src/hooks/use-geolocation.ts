import { useMemo, useState, type RefObject } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { Shelter } from "../lib/app-types";

/** The user's location on request, and the nearest shelter that is open around the clock. */
export function useGeolocation(mapRef: RefObject<MapLibreMap | null>, shelters: Shelter[]) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const requestLocation = (): void => {
    if (!navigator.geolocation) {
      setLocationError("Цей браузер не підтримує визначення місцезнаходження.");
      return;
    }
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const map = mapRef.current;
        if (!map) return;
        const point: [number, number] = [position.coords.longitude, position.coords.latitude];
        setUserLocation(point);
        map.flyTo({ center: point, zoom: 15, duration: 500 });
      },
      (error) => {
        setLocationError(
          error.code === 1
            ? "Дозвольте доступ до геолокації в налаштуваннях браузера."
            : "Не вдалося визначити місце. Спробуйте ще раз.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
    );
  };

  const nearestShelter = useMemo(() => {
    if (!userLocation) return null;
    const location = new maplibregl.LngLat(userLocation[0], userLocation[1]);
    return (
      shelters
        .filter((shelter) => {
          const status = shelter.status.trim().toLocaleLowerCase("uk-UA");
          return shelter.access24_7 && (status === "готове" || status.startsWith("рекомендоване"));
        })
        .map((shelter) => ({
          ...shelter,
          distanceMeters: location.distanceTo(new maplibregl.LngLat(shelter.lng, shelter.lat)),
        }))
        .sort((left, right) => left.distanceMeters - right.distanceMeters)[0] ?? null
    );
  }, [shelters, userLocation]);

  return {
    userLocation,
    locationError,
    clearLocationError: () => setLocationError(null),
    requestLocation,
    nearestShelter,
  };
}
