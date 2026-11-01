import { useEffect, useRef, useState } from "react";
import type { AppView, DetailReturnView, Stop, Vehicle, VehicleType } from "../lib/app-types";
import type { CityPlace } from "../lib/city-places";

export type TransitFlow = VehicleType | null | "menu";

/** What the inspector shows. Opening one detail always closes the others. */
export type DetailTarget =
  | { vehicle: Vehicle }
  | { stop: Stop }
  | { place: CityPlace | null };

/** Active view and the open detail (vehicle, stop, place, or the transit flow). */
export function useSelection(devToolsActive: boolean) {
  const [activeView, setActiveView] = useState<AppView>("city");
  const activeViewRef = useRef<AppView>("city");
  const [detailReturnView, setDetailReturnView] = useState<DetailReturnView>("map");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<CityPlace | null>(null);
  const [transitFlow, setTransitFlow] = useState<TransitFlow>(null);

  useEffect(() => {
    activeViewRef.current = activeView;
  }, [activeView]);

  // The developer tools live on the `/dev` route: open the map so the panel is reachable right away.
  useEffect(() => {
    if (!devToolsActive) return;
    if (activeViewRef.current === "city") setActiveView("map");
  }, [devToolsActive]);

  /** Where «Назад» returns to when the detail was opened from the current view. */
  const currentReturnView = (): DetailReturnView =>
    activeViewRef.current === "city" ? "city" : "map";

  const showDetail = (target: DetailTarget, returnView: DetailReturnView): void => {
    setDetailReturnView(returnView);
    setSelectedVehicle("vehicle" in target ? target.vehicle : null);
    setSelectedStop("stop" in target ? target.stop : null);
    setSelectedPlace("place" in target ? target.place : null);
  };

  const closeDetails = (): void => {
    setSelectedVehicle(null);
    setSelectedStop(null);
    setSelectedPlace(null);
  };

  const inspectorOpen = Boolean(transitFlow || selectedVehicle || selectedStop || selectedPlace);

  return {
    activeView,
    activeViewRef,
    setActiveView,
    detailReturnView,
    selectedVehicle,
    setSelectedVehicle,
    selectedStop,
    setSelectedStop,
    selectedPlace,
    setSelectedPlace,
    transitFlow,
    setTransitFlow,
    currentReturnView,
    showDetail,
    closeDetails,
    inspectorOpen,
  };
}
