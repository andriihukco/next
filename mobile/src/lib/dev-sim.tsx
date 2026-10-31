import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { WALK_TRACK } from "../data/walk-track";
import type { AirAlert } from "./alerts-api";
import type { Vehicle, VehicleType } from "./transit-types";

/**
 * Dev-only simulation. Fake vehicles and a fake air alert let you test the map without live data.
 * Everything here is labelled «Симуляція» in the UI. It is only reachable in development builds.
 */
type SimValue = {
  simulate: boolean;
  vehicles: Vehicle[];
  alertOn: boolean;
  alert: AirAlert | null;
  devToolsOpen: boolean;
  openDevTools: () => void;
  closeDevTools: () => void;
  setSimulate: (on: boolean) => void;
  setAlertOn: (on: boolean) => void;
  spawn: (type: VehicleType | "random", count: number) => void;
  clearVehicles: () => void;
};

const Ctx = createContext<SimValue | null>(null);

const ROUTES: Record<VehicleType, string[]> = {
  bus: ["1", "3", "9", "22", "25", "А25", "А01"],
  tram: ["1", "4", "6", "8", "9"],
  trolleybus: ["3", "7", "22", "31"],
  taxi: ["Таксі"],
};
const DESTINATIONS = ["пл. Галицька", "вул. Городоцька", "ТРЦ Forum", "вокзал", "пл. Ринок", "Знесення"];

/** A random spot on the walk track (real road points) with a small offset, so markers sit near roads. */
function randomSpot(): { lat: number; lng: number } {
  const [lat, lng] = WALK_TRACK.coordinates[Math.floor(Math.random() * WALK_TRACK.coordinates.length)];
  return { lat: lat + (Math.random() - 0.5) * 0.002, lng: lng + (Math.random() - 0.5) * 0.002 };
}

let nextId = 1;
function fakeVehicle(type: VehicleType): Vehicle {
  const route = ROUTES[type][Math.floor(Math.random() * ROUTES[type].length)];
  const spot = randomSpot();
  const id = `sim-${nextId++}`;
  return {
    id,
    tripId: `sim-trip-${id}`,
    route,
    destination: DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)],
    type,
    lat: spot.lat,
    lng: spot.lng,
    speed: Math.round(Math.random() * 30),
    bearing: Math.round(Math.random() * 359),
    plate: `SIM-${String(nextId).padStart(4, "0")}`,
    lowFloor: Math.random() > 0.5,
    mapMatched: false,
  };
}

const SIM_ALERT: AirAlert = {
  status: "active",
  level: "red",
  sinceText: "Симуляція тривоги",
  areasAffected: ["Львівщина (симуляція)"],
  threats: [],
  reportAt: null,
  updatedAt: 0,
  source: "симуляція",
};

export function DevSimProvider({ children }: { children: ReactNode }) {
  const [simulate, setSimulateState] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alertOn, setAlertOnState] = useState(false);
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  const openDevTools = useCallback(() => {
    if (__DEV__) setDevToolsOpen(true);
  }, []);
  const closeDevTools = useCallback(() => setDevToolsOpen(false), []);
  const setSimulate = useCallback((on: boolean) => setSimulateState(on), []);
  const setAlertOn = useCallback((on: boolean) => setAlertOnState(on), []);

  const spawn = useCallback((type: VehicleType | "random", count: number) => {
    const types: VehicleType[] = ["bus", "tram", "trolleybus", "taxi"];
    const added = Array.from({ length: count }, () =>
      fakeVehicle(type === "random" ? types[Math.floor(Math.random() * types.length)] : type),
    );
    setVehicles((current) => [...current, ...added]);
    setSimulateState(true);
  }, []);

  const clearVehicles = useCallback(() => setVehicles([]), []);

  const value = useMemo<SimValue>(
    () => ({
      simulate,
      vehicles,
      alertOn,
      alert: alertOn ? SIM_ALERT : null,
      devToolsOpen,
      openDevTools,
      closeDevTools,
      setSimulate,
      setAlertOn,
      spawn,
      clearVehicles,
    }),
    [simulate, vehicles, alertOn, devToolsOpen, openDevTools, closeDevTools, setSimulate, setAlertOn, spawn, clearVehicles],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDevSim(): SimValue {
  const value = useContext(Ctx);
  if (!value) throw new Error("useDevSim must be used inside DevSimProvider");
  return value;
}
