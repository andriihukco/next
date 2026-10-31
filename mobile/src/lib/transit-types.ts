export type VehicleType = "bus" | "tram" | "trolleybus" | "taxi";

/** Mirrors `Vehicle` in src/types/domain.ts of the web app. */
export type Vehicle = {
  id: string;
  tripId: string;
  route: string;
  destination: string;
  type: VehicleType;
  lat: number;
  lng: number;
  speed: number;
  bearing: number;
  plate: string;
  lowFloor: boolean;
  mapMatched: boolean;
};

/** Mirrors `Stop` in src/types/domain.ts of the web app. */
export type Stop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  routes: string[];
};

/** Colors from src/lib/fleet.ts (web). */
export const FLEET_COLORS: Record<VehicleType, string> = {
  bus: "#22c55e",
  tram: "#f97316",
  trolleybus: "#3b82f6",
  taxi: "#eab308",
};

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  bus: "Автобус",
  tram: "Трамвай",
  trolleybus: "Тролейбус",
  taxi: "Таксі",
};
