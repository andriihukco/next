import { useEffect, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { Vehicle } from "../lib/app-types";

/**
 * Keeps the open vehicle in sync with live positions and, while following,
 * keeps the camera on it. A user drag stops following.
 */
export function useVehicleFollow(
  mapRef: RefObject<MapLibreMap | null>,
  mapReady: boolean,
  vehicles: Vehicle[],
  selectedVehicle: Vehicle | null,
  setSelectedVehicle: Dispatch<SetStateAction<Vehicle | null>>,
) {
  const [followVehicleId, setFollowVehicleId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedVehicle((current) =>
      current ? (vehicles.find((vehicle) => vehicle.id === current.id) ?? current) : current,
    );
  }, [setSelectedVehicle, vehicles]);

  useEffect(() => {
    if (!selectedVehicle) setFollowVehicleId(null);
  }, [selectedVehicle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !followVehicleId) return;
    const vehicle = vehicles.find((candidate) => candidate.id === followVehicleId);
    if (!vehicle) return;
    map.easeTo({ center: [vehicle.lng, vehicle.lat], duration: 700 });
  }, [followVehicleId, mapReady, mapRef, vehicles]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const stopFollowing = (): void => setFollowVehicleId(null);
    map.on("dragstart", stopFollowing);
    return () => {
      map.off("dragstart", stopFollowing);
    };
  }, [mapReady, mapRef]);

  const isFollowing = selectedVehicle !== null && followVehicleId === selectedVehicle.id;

  const toggleFollow = (): void => {
    if (!selectedVehicle) return;
    if (isFollowing) {
      setFollowVehicleId(null);
      return;
    }
    setFollowVehicleId(selectedVehicle.id);
    mapRef.current?.easeTo({ center: [selectedVehicle.lng, selectedVehicle.lat], duration: 600 });
  };
  const zoomTo = (vehicle: Vehicle, zoom: number): void => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ center: [vehicle.lng, vehicle.lat], zoom: Math.max(map.getZoom(), zoom), duration: 700 });
  };

  return { isFollowing, toggleFollow, zoomTo, follow: setFollowVehicleId };
}
