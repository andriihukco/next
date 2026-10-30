import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { MaterialIcon } from "./ui/material-icon";
import { Button } from "./ui/button";
import { IconButton } from "./ui/icon-button";
import { Toggle } from "./ui/toggle";
import {
  ARRIVED_M,
  NAV_MODES,
  OFF_ROUTE_M,
  arrivalClock,
  distanceToNextStep,
  fetchNavRoute,
  formatDistance,
  formatDuration,
  locateOnRoute,
  type LatLng,
  type ManeuverKind,
  type NavMode,
  type NavRoute,
  type RouteProgress,
} from "../lib/navigation";
import "./navigation-panel.css";

export type NavDestination = { name: string; lat: number; lng: number };

type Props = {
  map: MapLibreMap | null;
  destination: NavDestination;
  onClose: () => void;
};

const MODE_ICON: Record<NavMode, string> = { walk: "directions_walk", run: "directions_run", drive: "directions_car" };
const MANEUVER_ICON: Record<ManeuverKind, string> = {
  start: "my_location",
  arrive: "flag",
  straight: "straight",
  left: "turn_left",
  right: "turn_right",
  "slight-left": "turn_slight_left",
  "slight-right": "turn_slight_right",
  "sharp-left": "turn_sharp_left",
  "sharp-right": "turn_sharp_right",
  uturn: "u_turn_left",
  roundabout: "roundabout_right",
  merge: "merge",
  ramp: "fork_right",
  ferry: "directions_boat",
};

const REROUTE_COOLDOWN_MS = 15000;
const ROUTE_SOURCE = "nav-route";
const USER_SOURCE = "nav-user";

const toLatLng = (lat: number, lng: number): LatLng => ({ latitude: lat, longitude: lng });
const readToken = (name: string, fallback: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/** Adds the route and user-position layers once. Safe to call repeatedly. */
function ensureLayers(map: MapLibreMap): void {
  if (!map.getSource(ROUTE_SOURCE)) {
    map.addSource(ROUTE_SOURCE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    map.addLayer({
      id: "nav-route-casing",
      type: "line",
      source: ROUTE_SOURCE,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": readToken("--card", "#ffffff"), "line-width": 9 },
    });
    map.addLayer({
      id: "nav-route-line",
      type: "line",
      source: ROUTE_SOURCE,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": readToken("--map-route", "#1688ef"), "line-width": 5 },
    });
  }
  if (!map.getSource(USER_SOURCE)) {
    map.addSource(USER_SOURCE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    map.addLayer({
      id: "nav-user",
      type: "circle",
      source: USER_SOURCE,
      paint: {
        "circle-radius": 8,
        "circle-color": readToken("--map-route", "#1688ef"),
        "circle-stroke-width": 3,
        "circle-stroke-color": readToken("--card", "#ffffff"),
      },
    });
  }
}

function setSourceData(map: MapLibreMap, id: string, coordinates: [number, number][] | null, point = false): void {
  const source = map.getSource(id) as GeoJSONSource | undefined;
  if (!source) return;
  if (!coordinates || coordinates.length === 0) {
    source.setData({ type: "FeatureCollection", features: [] });
    return;
  }
  const geometry = point
    ? { type: "Point" as const, coordinates: coordinates[0] }
    : { type: "LineString" as const, coordinates };
  source.setData({ type: "Feature", properties: {}, geometry });
}

/** Turn-by-turn panel for walk, run and drive. Draws the route on the map and follows the rider. */
export function NavigationPanel({ map, destination, onClose }: Props) {
  const [mode, setMode] = useState<NavMode>("walk");
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<NavRoute | null>(null);
  const [status, setStatus] = useState<"locating" | "loading" | "ready" | "error">("locating");
  const [message, setMessage] = useState("");
  const [navigating, setNavigating] = useState(false);
  const [position, setPosition] = useState<LatLng | null>(null);
  const [progress, setProgress] = useState<RouteProgress | null>(null);
  const [arrived, setArrived] = useState(false);
  const lastRerouteAt = useRef(0);

  // Locate the rider once; navigation keeps the position fresh.
  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      setMessage("Геолокація недоступна у цьому браузері.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (update) => setOrigin(toLatLng(update.coords.latitude, update.coords.longitude)),
      () => {
        setStatus("error");
        setMessage("Дозвольте доступ до геолокації, щоб побудувати маршрут від вашої позиції.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, []);

  // Plan the route from the origin. The origin moves only on a reroute.
  useEffect(() => {
    if (!origin) return;
    const controller = new AbortController();
    setStatus("loading");
    setMessage("");
    fetchNavRoute(origin, toLatLng(destination.lat, destination.lng), mode, controller.signal)
      .then((result) => {
        setRoute(result);
        setStatus("ready");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setStatus("error");
        setMessage("Не вдалося побудувати маршрут. Спробуйте пізніше.");
      });
    return () => controller.abort();
  }, [origin, mode, destination.lat, destination.lng]);

  // Draw the route and fit it on screen when it is planned, and clean up on close.
  useEffect(() => {
    if (!map) return;
    const draw = () => {
      ensureLayers(map);
      setSourceData(map, ROUTE_SOURCE, route ? route.coordinates.map((p) => [p.longitude, p.latitude]) : null);
      if (route && !navigating && route.coordinates.length > 1) {
        const lngs = route.coordinates.map((p) => p.longitude);
        const lats = route.coordinates.map((p) => p.latitude);
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: { top: 96, bottom: 96, left: 420, right: 96 }, duration: 600, maxZoom: 17 },
        );
      }
    };
    if (map.isStyleLoaded()) draw();
    else map.once("load", draw);
  }, [map, route, navigating]);

  useEffect(() => {
    if (!map) return;
    return () => {
      for (const id of ["nav-route-line", "nav-route-casing", "nav-user"]) {
        if (map.getLayer(id)) map.removeLayer(id);
      }
      for (const id of [ROUTE_SOURCE, USER_SOURCE]) {
        if (map.getSource(id)) map.removeSource(id);
      }
    };
  }, [map]);

  // Live position while navigating.
  useEffect(() => {
    if (!navigating || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (update) => setPosition(toLatLng(update.coords.latitude, update.coords.longitude)),
      () => setMessage("Немає сигналу геолокації."),
      { enableHighAccuracy: true, maximumAge: 1000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [navigating]);

  // Match the position to the route, follow the rider on the map, and reroute when off route.
  useEffect(() => {
    if (!navigating || !route || !position) return;
    const next = locateOnRoute(route, position);
    setProgress(next);
    if (map) {
      setSourceData(map, USER_SOURCE, [[position.longitude, position.latitude]], true);
      map.easeTo({ center: [position.longitude, position.latitude], duration: 600 });
    }
    if (next.remainingM <= ARRIVED_M) {
      setArrived(true);
      return;
    }
    const cooled = Date.now() - lastRerouteAt.current > REROUTE_COOLDOWN_MS;
    if (next.offRouteM > OFF_ROUTE_M && cooled) {
      lastRerouteAt.current = Date.now();
      setOrigin(position);
    }
  }, [navigating, route, position, map]);

  const startNavigation = () => {
    if (!origin) return;
    setArrived(false);
    setProgress(null);
    setPosition(origin);
    setNavigating(true);
  };
  const stopNavigation = () => {
    setNavigating(false);
    setPosition(null);
    setProgress(null);
    setArrived(false);
  };

  const stepIndex = progress?.stepIndex ?? 0;
  const upcoming = route ? (route.steps[stepIndex + 1] ?? route.steps[stepIndex]) : undefined;
  const toUpcoming = route && progress ? distanceToNextStep(route, progress) : 0;
  const ready = status === "ready" && route !== null;

  return (
    <section className="nav-panel" aria-label="Навігація">
      {navigating ? (
        <div className="nav-banner" role="status" aria-live="polite">
          {arrived ? (
            <strong className="nav-banner-title">Ви на місці</strong>
          ) : (
            <>
              <span className="nav-banner-icon" aria-hidden="true">
                <MaterialIcon name={MANEUVER_ICON[upcoming?.kind ?? "straight"]} size={32} />
              </span>
              <span className="nav-banner-copy">
                <span className="nav-banner-distance">{route && progress ? formatDistance(toUpcoming) : "—"}</span>
                <span className="nav-banner-title">{upcoming?.instruction || "Продовжуйте рух"}</span>
              </span>
            </>
          )}
        </div>
      ) : null}

      <header className="nav-head">
        <div className="nav-title">
          <span className="nav-eyebrow">Маршрут до</span>
          <strong>{destination.name}</strong>
        </div>
        <IconButton label="Закрити навігацію" onClick={onClose} variant="ghost">
          <MaterialIcon name="close" size={20} />
        </IconButton>
      </header>

      <div className="nav-modes" role="group" aria-label="Спосіб пересування">
        {NAV_MODES.map((item) => (
          <Toggle
            key={item.id}
            variant="pill"
            size="sm"
            pressed={mode === item.id}
            disabled={navigating}
            onPressedChange={() => setMode(item.id)}
          >
            <MaterialIcon name={MODE_ICON[item.id]} size={16} />
            {item.label}
          </Toggle>
        ))}
      </div>

      <div className="nav-summary" aria-live="polite">
        {ready && navigating && progress ? (
          <>
            <strong className="nav-eta">{formatDuration(progress.remainingS)}</strong>
            <span className="nav-meta">
              {formatDistance(progress.remainingM)} · о {arrivalClock(progress.remainingS)}
            </span>
          </>
        ) : ready && route ? (
          <>
            <strong className="nav-eta">{formatDuration(route.durationS)}</strong>
            <span className="nav-meta">
              {formatDistance(route.distanceM)} · о {arrivalClock(route.durationS)} · оцінка OpenStreetMap
            </span>
          </>
        ) : (
          <span className="nav-meta">{message || "Визначаємо вашу позицію…"}</span>
        )}
      </div>

      <div className="nav-actions">
        {navigating ? (
          <Button variant="destructive" onClick={stopNavigation}>
            {arrived ? "Готово" : "Завершити"}
          </Button>
        ) : (
          <Button onClick={startNavigation} disabled={!ready}>
            <MaterialIcon name="navigation" size={18} />
            Почати
          </Button>
        )}
      </div>

      {!navigating && ready && route ? (
        <ol className="nav-steps">
          {route.steps.map((step, index) => (
            <li key={`${index}-${step.startIndex}`} className="nav-step">
              <span className="nav-step-icon" aria-hidden="true">
                <MaterialIcon name={MANEUVER_ICON[step.kind]} size={20} />
              </span>
              <span className="nav-step-text">{step.instruction || "Продовжуйте рух"}</span>
              {step.distanceM > 0 ? <span className="nav-step-distance">{formatDistance(step.distanceM)}</span> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
