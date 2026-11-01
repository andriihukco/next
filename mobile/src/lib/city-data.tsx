import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import { useLiveVehicles } from "../hooks/use-live-vehicles";
import { useAirAlert } from "../hooks/use-air-alert";
import { useShelters } from "../hooks/use-shelters";
import { useStops } from "../hooks/use-stops";
import { useDevSim } from "./dev-sim";
import { nearestShelter } from "./shelters";
import { fetchPlacesIn, type CityPlace } from "./places-api";
import type { Shelter, AirAlert } from "./alerts-api";
import type { Stop, Vehicle } from "./transit-types";

export type Point = { latitude: number; longitude: number };
export type Region = Point & { latitudeDelta: number; longitudeDelta: number };

export const LVIV_REGION: Region = { latitude: 49.8419, longitude: 24.0315, latitudeDelta: 0.06, longitudeDelta: 0.06 };

/** What the map should do when it is shown next: center on a point and highlight a selection. */
export type MapFocus = { point: Point; selection?: { kind: "vehicle" | "stop" | "place" | "shelter"; id: string } };

const PLACES_MAX_DELTA = 0.08; // Places load only when zoomed in enough to be useful.
const PLACES_DEBOUNCE_MS = 500;

type CityData = {
  vehicles: Vehicle[];
  simulated: boolean;
  useLiveFeed: () => void;
  stops: Stop[];
  alert: AirAlert | null;
  shelters: Shelter[];
  sheltersOn: boolean;
  nearestShelter: { shelter: Shelter; meters: number } | null;
  user: Point | null;
  /** Asks for location on demand. Returns the point, or null when the user said no. */
  locate: () => Promise<Point | null>;
  region: Region;
  setRegion: (region: Region) => void;
  places: CityPlace[];
  /** Distances are measured from the user when known, else from the map center. */
  origin: Point;
  mapFocus: MapFocus | null;
  showOnMap: (focus: MapFocus) => void;
  clearMapFocus: () => void;
};

const Context = createContext<CityData | null>(null);

/** Live city data shared by every tab and page: one feed, one location, one place query. */
export function CityDataProvider({ children }: { children: ReactNode }) {
  const sim = useDevSim();
  const live = useLiveVehicles();
  // Simulated transport replaces the feed while simulation is on (dev tools only).
  const vehicles = sim.simulate ? sim.vehicles : live.vehicles;
  const stops = useStops();
  const liveAlert = useAirAlert();
  const alert = sim.alert ?? liveAlert;
  const shelters = useShelters();
  const [user, setUser] = useState<Point | null>(null);
  const [region, setRegion] = useState<Region>(LVIV_REGION);
  const [places, setPlaces] = useState<CityPlace[]>([]);
  const [mapFocus, setMapFocus] = useState<MapFocus | null>(null);

  // Location only if it was granted before; asking happens on a tap (DESIGN.md §10).
  useEffect(() => {
    let active = true;
    void Location.getForegroundPermissionsAsync().then(async ({ granted }) => {
      if (!active || !granted) return;
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (active) setUser({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    });
    return () => {
      active = false;
    };
  }, []);

  const locate = useCallback(async (): Promise<Point | null> => {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) {
      Alert.alert("Геолокацію вимкнено", "Дозвольте доступ до місцезнаходження в налаштуваннях телефона.");
      return null;
    }
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    setUser(point);
    return point;
  }, []);

  // Places for the map area, debounced while the user pans.
  useEffect(() => {
    if (region.latitudeDelta > PLACES_MAX_DELTA) {
      setPlaces([]);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      fetchPlacesIn({
        south: region.latitude - region.latitudeDelta / 2,
        north: region.latitude + region.latitudeDelta / 2,
        west: region.longitude - region.longitudeDelta / 2,
        east: region.longitude + region.longitudeDelta / 2,
      })
        .then((next) => {
          if (active) setPlaces(next);
        })
        .catch(() => {
          if (active) setPlaces([]);
        });
    }, PLACES_DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta]);

  const nearest = useMemo(() => nearestShelter(shelters, user), [shelters, user]);

  const value = useMemo<CityData>(
    () => ({
      vehicles,
      simulated: sim.simulate,
      useLiveFeed: () => sim.setSimulate(false),
      stops,
      alert,
      shelters,
      sheltersOn: alert?.status === "active",
      nearestShelter: nearest,
      user,
      locate,
      region,
      setRegion,
      places,
      origin: user ?? { latitude: region.latitude, longitude: region.longitude },
      mapFocus,
      showOnMap: setMapFocus,
      clearMapFocus: () => setMapFocus(null),
    }),
    [vehicles, sim, stops, alert, shelters, nearest, user, locate, region, places, mapFocus],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useCityData(): CityData {
  const value = useContext(Context);
  if (!value) throw new Error("useCityData needs CityDataProvider.");
  return value;
}
