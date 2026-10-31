import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import { MaterialIcons } from "@expo/vector-icons";
import { RouteMap } from "../components/map/route-map";
import { GlassSurface } from "../components/glass-surface";
import { useLiveVehicles } from "../hooks/use-live-vehicles";
import { useStops } from "../hooks/use-stops";
import { useDevSim } from "../lib/dev-sim";
import { arrivalsAt } from "../lib/transit-eta";
import { distanceKm } from "../lib/geo";
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
} from "../../../src/lib/navigation";
import type { Stop } from "../lib/transit-types";
import { colors, fonts, HIT_SLOP, MIN_TOUCH, radius } from "../lib/theme";

type Mode = NavMode | "transit";

const MODE_ICON: Record<Mode, keyof typeof MaterialIcons.glyphMap> = {
  walk: "directions-walk",
  run: "directions-run",
  drive: "directions-car",
  transit: "directions-transit",
};
const MODE_COLOR: Record<Mode, string> = {
  walk: colors.routeWalked,
  run: colors.routeWalked,
  drive: colors.walker,
  transit: colors.routeWalked,
};
const MANEUVER_ICON: Record<ManeuverKind, keyof typeof MaterialIcons.glyphMap> = {
  start: "my-location",
  arrive: "flag",
  straight: "straight",
  left: "turn-left",
  right: "turn-right",
  "slight-left": "turn-slight-left",
  "slight-right": "turn-slight-right",
  "sharp-left": "turn-sharp-left",
  "sharp-right": "turn-sharp-right",
  uturn: "u-turn-left",
  roundabout: "rotate-right",
  merge: "call-merge",
  ramp: "call-split",
  ferry: "directions-boat",
};

const MODE_ITEMS: { id: Mode; label: string }[] = [...NAV_MODES, { id: "transit", label: "Транспорт" }];
const LVIV_CENTRE: LatLng = { latitude: 49.8419, longitude: 24.0315 };
const NEAR_STOP_KM = 0.8;
const REROUTE_COOLDOWN_MS = 15000;

function nearestStop(stops: Stop[], point: LatLng): Stop | null {
  let best: { stop: Stop; km: number } | null = null;
  for (const stop of stops) {
    const km = distanceKm(point, { latitude: stop.lat, longitude: stop.lng });
    if (km <= NEAR_STOP_KM && (!best || km < best.km)) best = { stop, km };
  }
  return best?.stop ?? null;
}

/** Directions and turn-by-turn navigation for walk, run and drive, plus a transit option built from live stops. */
export default function DirectionsScreen() {
  const params = useLocalSearchParams<{ name?: string; lat?: string; lng?: string }>();
  const destination: LatLng = useMemo(
    () => ({ latitude: Number(params.lat ?? LVIV_CENTRE.latitude), longitude: Number(params.lng ?? LVIV_CENTRE.longitude) }),
    [params.lat, params.lng],
  );
  const title = params.name ?? "Місце";

  const [origin, setOrigin] = useState<LatLng>(LVIV_CENTRE);
  const [originIsReal, setOriginIsReal] = useState(false);
  const [mode, setMode] = useState<Mode>("walk");
  const [route, setRoute] = useState<NavRoute | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const [navigating, setNavigating] = useState(false);
  const [position, setPosition] = useState<LatLng | null>(null);
  const [progress, setProgress] = useState<RouteProgress | null>(null);
  const [arrived, setArrived] = useState(false);
  const lastRerouteAt = useRef(0);

  const stops = useStops();
  const sim = useDevSim();
  const live = useLiveVehicles();
  const vehicles = sim.simulate ? sim.vehicles : live.vehicles;

  useEffect(() => {
    void Location.getForegroundPermissionsAsync().then(async ({ granted }) => {
      if (!granted) return;
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setOrigin({ latitude: current.coords.latitude, longitude: current.coords.longitude });
      setOriginIsReal(true);
    });
  }, []);

  // Plan a route from the origin. The origin moves only when the planner starts or reroutes.
  useEffect(() => {
    if (mode === "transit") {
      setRoute(null);
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    fetchNavRoute(origin, destination, mode, controller.signal)
      .then((result) => {
        setRoute(result);
        setStatus("idle");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });
    return () => controller.abort();
  }, [mode, origin, destination]);

  // Live position while navigating. Permission is checked before navigation can start.
  useEffect(() => {
    if (!navigating) return;
    let active = true;
    let subscription: Location.LocationSubscription | null = null;
    void Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 3, timeInterval: 1000 },
      (update) => {
        if (active) setPosition({ latitude: update.coords.latitude, longitude: update.coords.longitude });
      },
    ).then((sub) => {
      if (active) subscription = sub;
      else sub.remove();
    });
    return () => {
      active = false;
      subscription?.remove();
    };
  }, [navigating]);

  // Match the position to the route; reroute when the rider leaves it.
  useEffect(() => {
    if (!navigating || !route || !position) return;
    const next = locateOnRoute(route, position);
    setProgress(next);
    if (next.remainingM <= ARRIVED_M) {
      setArrived(true);
      return;
    }
    const cooled = Date.now() - lastRerouteAt.current > REROUTE_COOLDOWN_MS;
    if (next.offRouteM > OFF_ROUTE_M && cooled) {
      lastRerouteAt.current = Date.now();
      setOrigin(position);
    }
  }, [navigating, route, position]);

  const startNavigation = () => {
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

  // Transit: walk to the nearest stop, take a line, walk from its stop to the destination.
  const boardStop = useMemo(() => nearestStop(stops, origin), [stops, origin]);
  const exitStop = useMemo(() => nearestStop(stops, destination), [stops, destination]);
  const [transitLegs, setTransitLegs] = useState<{ toStop: NavRoute | null; fromStop: NavRoute | null }>({ toStop: null, fromStop: null });
  useEffect(() => {
    if (mode !== "transit") return;
    const controller = new AbortController();
    Promise.all([
      boardStop ? fetchNavRoute(origin, { latitude: boardStop.lat, longitude: boardStop.lng }, "walk", controller.signal) : null,
      exitStop ? fetchNavRoute({ latitude: exitStop.lat, longitude: exitStop.lng }, destination, "walk", controller.signal) : null,
    ])
      .then(([toStop, fromStop]) => setTransitLegs({ toStop, fromStop }))
      .catch(() => setTransitLegs({ toStop: null, fromStop: null }));
    return () => controller.abort();
  }, [mode, boardStop, exitStop, origin, destination]);

  const lines = boardStop ? arrivalsAt(boardStop, vehicles) : [];
  const shownRoute = mode === "transit" ? transitLegs.toStop : route;
  const mapRoute = shownRoute?.coordinates ?? null;
  const routeColor = MODE_COLOR[mode];

  const stepIndex = progress?.stepIndex ?? 0;
  const upcoming = route ? (route.steps[stepIndex + 1] ?? route.steps[stepIndex]) : undefined;
  const toUpcoming = route && progress ? distanceToNextStep(route, progress) : 0;

  if (navigating) {
    return (
      <View style={styles.screen}>
        <View style={styles.map}>
          <RouteMap route={mapRoute} routeColor={routeColor} origin={position ?? origin} />
        </View>

        <GlassSurface style={styles.banner}>
          {arrived ? (
            <Text style={styles.bannerTitle}>Ви на місці</Text>
          ) : (
            <>
              <View style={styles.bannerIcon}>
                <MaterialIcons name={MANEUVER_ICON[upcoming?.kind ?? "straight"]} size={34} color="#ffffff" />
              </View>
              <View style={styles.bannerCopy}>
                <Text style={styles.bannerDistance}>{route && progress ? formatDistance(toUpcoming) : "—"}</Text>
                <Text style={styles.bannerTitle} numberOfLines={2}>{upcoming?.instruction || "Продовжуйте рух"}</Text>
              </View>
            </>
          )}
        </GlassSurface>

        <GlassSurface style={styles.navBar}>
          <View style={styles.navStats}>
            <Text style={styles.etaValue}>{progress ? formatDuration(progress.remainingS) : "—"}</Text>
            <Text style={styles.caption}>
              {progress ? `${formatDistance(progress.remainingM)} · о ${arrivalClock(progress.remainingS)}` : "Визначаємо вашу позицію…"}
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Завершити навігацію" onPress={stopNavigation} style={styles.endButton}>
            <Text style={styles.endButtonText}>{arrived ? "Готово" : "Завершити"}</Text>
          </Pressable>
        </GlassSurface>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.map}>
        <RouteMap route={mapRoute} routeColor={routeColor} origin={origin} />
        <Pressable accessibilityRole="button" accessibilityLabel="Назад" hitSlop={HIT_SLOP} onPress={() => router.back()} style={styles.back}>
          <GlassSurface style={styles.backSurface}>
            <MaterialIcons name="chevron-left" size={26} color={colors.foreground} />
          </GlassSurface>
        </Pressable>
      </View>

      <GlassSurface style={styles.sheet}>
        <Text style={styles.destination} numberOfLines={1}>{title}</Text>
        <Text style={styles.caption}>{originIsReal ? "Від вашої позиції" : "Від центру міста (немає геолокації)"}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modes}>
          {MODE_ITEMS.map((item) => {
            const active = mode === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.label}
                onPress={() => setMode(item.id)}
                style={[styles.mode, active && styles.modeActive]}
              >
                <MaterialIcons name={MODE_ICON[item.id]} size={18} color={active ? "#ffffff" : colors.foreground} />
                <Text style={[styles.modeText, active && styles.modeTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {mode !== "transit" ? (
          <>
            <View style={styles.eta}>
              {status === "loading" ? <Text style={styles.caption}>Рахуємо маршрут…</Text> : null}
              {status === "error" ? <Text style={styles.caption}>Не вдалося побудувати маршрут. Спробуйте пізніше.</Text> : null}
              {route && status === "idle" ? (
                <>
                  <Text style={styles.etaValue}>{formatDuration(route.durationS)}</Text>
                  <Text style={styles.caption}>
                    {formatDistance(route.distanceM)} · о {arrivalClock(route.durationS)} · оцінка OpenStreetMap
                  </Text>
                </>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Почати навігацію"
              disabled={!route || status !== "idle" || !originIsReal}
              onPress={startNavigation}
              style={[styles.start, (!route || status !== "idle" || !originIsReal) && styles.startDisabled]}
            >
              <MaterialIcons name="navigation" size={20} color="#ffffff" />
              <Text style={styles.startText}>{originIsReal ? "Почати" : "Потрібна геолокація"}</Text>
            </Pressable>

            {route && route.steps.length > 0 ? (
              <ScrollView style={styles.steps} showsVerticalScrollIndicator={false}>
                {route.steps.map((step, index) => (
                  <View key={`${index}-${step.startIndex}`} style={styles.step}>
                    <View style={styles.stepIcon}>
                      <MaterialIcons name={MANEUVER_ICON[step.kind]} size={20} color={colors.foreground} />
                    </View>
                    <Text style={styles.stepText}>{step.instruction || "Продовжуйте рух"}</Text>
                    <Text style={styles.caption}>{step.distanceM > 0 ? formatDistance(step.distanceM) : ""}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : null}
          </>
        ) : (
          <ScrollView style={styles.steps} showsVerticalScrollIndicator={false}>
            {boardStop ? (
              <>
                <Text style={styles.legTitle}>Пішки до зупинки «{boardStop.name}»</Text>
                <Text style={styles.caption}>
                  {transitLegs.toStop ? `${formatDuration(transitLegs.toStop.durationS)} · ${formatDistance(transitLegs.toStop.distanceM)}` : "Рахуємо…"}
                </Text>
                <Text style={styles.sectionTitle}>Найближчі лінії</Text>
                {lines.length === 0 ? (
                  <Text style={styles.caption}>Зараз немає транспорту з GPS на цих лініях.</Text>
                ) : (
                  lines.slice(0, 6).map(({ vehicle, minutes }) => (
                    <View key={vehicle.id} style={styles.line}>
                      <View style={styles.lineBadge}>
                        <Text style={styles.lineBadgeText}>{vehicle.route}</Text>
                      </View>
                      <Text style={styles.lineText} numberOfLines={1}>{vehicle.destination}</Text>
                      <Text style={styles.lineEta}>~{minutes} хв</Text>
                    </View>
                  ))
                )}
                {exitStop ? (
                  <Text style={styles.caption}>
                    Вийти на «{exitStop.name}» і пішки до мети: {transitLegs.fromStop ? formatDuration(transitLegs.fromStop.durationS) : "рахуємо…"}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.caption}>Поруч немає зупинок (до {NEAR_STOP_KM * 1000} м). Оберіть пішки або авто.</Text>
            )}
            <Text style={styles.caption}>Час за GPS, не офіційний розклад. Маршрут між зупинками не розраховується.</Text>
          </ScrollView>
        )}
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  back: { position: "absolute", top: 56, left: 16 },
  backSurface: { width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: MIN_TOUCH / 2, padding: 0, alignItems: "center", justifyContent: "center" },
  sheet: { padding: 16, gap: 10, borderRadius: 0, borderTopLeftRadius: radius.xl * 1.5, borderTopRightRadius: radius.xl * 1.5, maxHeight: "52%" },
  destination: { fontFamily: fonts.extrabold, fontSize: 22, letterSpacing: -0.4, color: colors.foreground },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.mutedForeground },
  modes: { gap: 8 },
  mode: { minHeight: MIN_TOUCH, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, flexDirection: "row", alignItems: "center", gap: 6 },
  modeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeText: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground },
  modeTextActive: { color: "#ffffff" },
  eta: { gap: 2, minHeight: 56 },
  etaValue: { fontFamily: fonts.extrabold, fontSize: 34, letterSpacing: -0.8, color: colors.foreground },
  start: { minHeight: MIN_TOUCH + 4, borderRadius: radius.lg, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  startDisabled: { opacity: 0.45 },
  startText: { fontFamily: fonts.bold, fontSize: 16, color: "#ffffff" },
  steps: { maxHeight: 220 },
  step: { minHeight: MIN_TOUCH, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  stepIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" },
  stepText: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, color: colors.foreground },
  legTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.foreground, marginTop: 4 },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.foreground, marginTop: 10 },
  line: { minHeight: MIN_TOUCH, flexDirection: "row", alignItems: "center", gap: 10 },
  lineBadge: { minWidth: 44, height: 28, paddingHorizontal: 8, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.transportBus },
  lineBadgeText: { fontFamily: fonts.extrabold, fontSize: 13, color: "#ffffff" },
  lineText: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.foreground },
  lineEta: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.foreground },
  banner: { position: "absolute", top: 56, left: 16, right: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.primary, borderRadius: radius.xl },
  bannerIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  bannerCopy: { flex: 1, gap: 2 },
  bannerDistance: { fontFamily: fonts.extrabold, fontSize: 24, letterSpacing: -0.4, color: "#ffffff" },
  bannerTitle: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 21, color: "#ffffff" },
  navBar: { position: "absolute", bottom: 24, left: 16, right: 16, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderRadius: radius.xl },
  navStats: { flex: 1, gap: 2 },
  endButton: { minHeight: MIN_TOUCH, paddingHorizontal: 18, borderRadius: radius.lg, backgroundColor: colors.destructive, alignItems: "center", justifyContent: "center" },
  endButtonText: { fontFamily: fonts.bold, fontSize: 15, color: "#ffffff" },
});
