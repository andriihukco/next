import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import { MAP_HTML } from "./map/map-html";
import type { CityPlace } from "../lib/places-api";
import type { Shelter } from "../lib/alerts-api";
import type { Stop, Vehicle } from "../lib/transit-types";
import { FLEET_COLORS } from "../lib/transit-types";
import { arrivalsAt } from "../lib/transit-eta";

/** Map viewport: centre and span in degrees, used by the places query. */
export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export const LVIV_REGION: MapRegion = {
  latitude: 49.8419,
  longitude: 24.0315,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

export type Selection =
  | { kind: "vehicle"; id: string }
  | { kind: "stop"; id: string }
  | { kind: "place"; id: string }
  | { kind: "shelter"; id: string };

type Props = {
  vehicles: Vehicle[];
  stops: Stop[];
  places: CityPlace[];
  shelters: Shelter[];
  showShelters: boolean;
  nearestShelterId: string | null;
  selection: Selection | null;
  routeShape: { latitude: number; longitude: number }[] | null;
  userLocation: { latitude: number; longitude: number } | null;
  /** Changing this value (a new object) flies the camera to the point. */
  focus: { latitude: number; longitude: number } | null;
  onSelect: (selection: Selection | null) => void;
  onRegionChangeComplete: (region: MapRegion) => void;
};

type ToMap = Record<string, unknown>;
type FromMap =
  | { type: "ready" }
  | { type: "region"; latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }
  | { type: "select"; kind: Selection["kind"]; id: string }
  | { type: "deselect" }
  | { type: "error"; message: string };

/**
 * MapLibre GL JS in a WebView, with the same OpenFreeMap style as the web app (3D buildings included).
 * Works in Expo Go: no native build needed.
 */
export function CityMap({
  vehicles,
  stops,
  places,
  shelters,
  showShelters,
  nearestShelterId,
  selection,
  routeShape,
  userLocation,
  focus,
  onSelect,
  onRegionChangeComplete,
}: Props) {
  const webRef = useRef<{ postMessage: (message: string) => void } | null>(null);
  const [ready, setReady] = useState(false);

  const send = useCallback((message: ToMap) => {
    webRef.current?.postMessage(JSON.stringify(message));
  }, []);

  useEffect(() => {
    if (ready) {
      send({
        vehicles: vehicles.map(({ id, route, type, lat, lng, destination, plate, bearing }) => ({
          id, route, type, lat, lng, destination, plate, bearing,
        })),
      });
    }
  }, [ready, vehicles, send]);

  // Stops and shelters are large and change rarely, so they are sent once per ready page.
  useEffect(() => {
    if (ready) send({ stops: stops.map(({ id, lat, lng }) => ({ id, lat, lng })) });
  }, [ready, stops, send]);

  useEffect(() => {
    if (ready) send({ shelters: shelters.map(({ id, lat, lng }) => ({ id, lat, lng })) });
  }, [ready, shelters, send]);

  useEffect(() => {
    if (ready) send({ places: places.map(({ id, lat, lng }) => ({ id, lat, lng })) });
  }, [ready, places, send]);

  useEffect(() => {
    if (ready) send({ selectedId: selection?.kind === "vehicle" ? selection.id : null });
  }, [ready, selection, send]);

  useEffect(() => {
    if (ready) send({ showShelters });
  }, [ready, showShelters, send]);

  useEffect(() => {
    if (ready) send({ nearestShelterId });
  }, [ready, nearestShelterId, send]);

  useEffect(() => {
    if (!ready) return;
    const type = selection?.kind === "vehicle" ? vehicles.find((v) => v.id === selection.id)?.type : undefined;
    send({
      route: routeShape ? routeShape.map((p) => [p.latitude, p.longitude]) : null,
      routeColor: FLEET_COLORS[type ?? "bus"],
    });
  }, [ready, routeShape, selection, vehicles, send]);

  useEffect(() => {
    if (ready) send({ user: userLocation });
  }, [ready, userLocation, send]);

  // Stops of the selected vehicle's route, drawn along the route.
  const routeStops = useMemo(() => {
    if (selection?.kind !== "vehicle") return [];
    const vehicle = vehicles.find((v) => v.id === selection.id);
    if (!vehicle) return [];
    return stops
      .filter((stop) => stop.routes.includes(vehicle.route))
      .map(({ id, name, lat, lng }) => ({ id, name, lat, lng }));
  }, [selection, vehicles, stops]);

  useEffect(() => {
    if (ready) send({ routeStops });
  }, [ready, routeStops, send]);

  // Tooltip above the selected stop: its next arrival.
  const tooltip = useMemo(() => {
    if (selection?.kind !== "stop") return null;
    const stop = stops.find((s) => s.id === selection.id);
    if (!stop) return null;
    const next = arrivalsAt(stop, vehicles, 1)[0];
    return {
      lat: stop.lat,
      lng: stop.lng,
      title: stop.name,
      subtitle: next ? `${next.vehicle.route} · ~${next.minutes} хв` : "Зараз немає транспорту",
    };
  }, [selection, stops, vehicles]);

  useEffect(() => {
    if (ready) send({ tooltip });
  }, [ready, tooltip, send]);

  useEffect(() => {
    if (ready && focus) send({ flyTo: [focus.latitude, focus.longitude] });
  }, [ready, focus, send]);

  const onMessage = (event: WebViewMessageEvent) => {
    const message = JSON.parse(event.nativeEvent.data) as FromMap;
    switch (message.type) {
      case "ready":
        setReady(true);
        break;
      case "region":
        onRegionChangeComplete({
          latitude: message.latitude,
          longitude: message.longitude,
          latitudeDelta: message.latitudeDelta,
          longitudeDelta: message.longitudeDelta,
        });
        break;
      case "select":
        onSelect({ kind: message.kind, id: message.id });
        break;
      case "deselect":
        onSelect(null);
        break;
      case "error":
        console.warn("Map error:", message.message);
        break;
    }
  };

  return (
    <WebView
      ref={(instance: unknown) => {
        webRef.current = instance as { postMessage: (message: string) => void } | null;
      }}
      style={styles.map}
      source={{ html: MAP_HTML }}
      originWhitelist={["*"]}
      onMessage={onMessage}
      scrollEnabled={false}
      bounces={false}
      allowsInlineMediaPlayback
    />
  );
}

const styles = StyleSheet.create({
  map: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#f8faf9" },
});
