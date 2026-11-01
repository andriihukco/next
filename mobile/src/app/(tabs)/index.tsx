import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { useIsFocused, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Onboarding, ONBOARDING_COMPLETE_KEY } from "../../components/onboarding/onboarding";
import { CityMap, type MapCommands, type Selection } from "../../components/city-map";
import { MapControls, MAX_LAYER_CATEGORIES, type MapControlsHandle } from "../../components/map/map-controls";
import { AirAlertPill } from "../../components/air-alert-pill";
import { useCityData, type Point } from "../../lib/city-data";
import { fetchRouteShape } from "../../lib/transit-api";
import type { MapStyleMode } from "../../lib/map-style";
import { openPlace, openProfile, openShelter, openStop, openVehicle } from "../../lib/navigation";
import { useDevSim } from "../../lib/dev-sim";
import { colors, themed } from "../../lib/theme";
import { AvatarButton, Badge, layout, space, Txt } from "../../ui";

/**
 * Мапа: the live city map, full screen. Controls float in the corners; tapping a vehicle, stop,
 * place or shelter opens its own page instead of a card over the map (design/screens.md#map).
 */
export default function MapScreen() {
  const city = useCityData();
  const sim = useDevSim();
  const insets = useSafeAreaInsets();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [focus, setFocus] = useState<Point | null>(null);
  const [routeShape, setRouteShape] = useState<Point[] | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleMode>("standard");
  const [layerCategories, setLayerCategories] = useState<ReadonlySet<string>>(new Set());
  const mapCommands = useRef<MapCommands>(null);
  const controls = useRef<MapControlsHandle>(null);

  // Onboarding on first launch, or again from Профіль («Показати знайомство ще раз» passes tour=1).
  const { tour } = useLocalSearchParams<{ tour?: string }>();
  const [onboarding, setOnboarding] = useState(false);
  // Only while the map tab is on screen; the tour points at its controls.
  const focused = useIsFocused();
  useEffect(() => {
    if (tour === "1") {
      setOnboarding(true);
      return;
    }
    void AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY).then((done) => setOnboarding(done !== "1"));
  }, [tour]);

  // «Показати на мапі» from another page: center there and highlight the item.
  const { mapFocus, clearMapFocus } = city;
  useEffect(() => {
    if (!mapFocus) return;
    setFocus(mapFocus.point);
    setSelection(mapFocus.selection ?? null);
    clearMapFocus();
  }, [mapFocus, clearMapFocus]);

  const toggleLayer = (id: string) => {
    setLayerCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX_LAYER_CATEGORIES) next.add(id);
      return next;
    });
  };
  // As on the web: chosen categories narrow the map pins; no choice shows every place.
  const mapPlaces = useMemo(
    () => (layerCategories.size > 0 ? city.places.filter((place) => layerCategories.has(place.category)) : city.places),
    [city.places, layerCategories],
  );

  // Route line of the highlighted vehicle.
  const tripId = selection?.kind === "vehicle" ? (city.vehicles.find((v) => v.id === selection.id)?.tripId ?? null) : null;
  useEffect(() => {
    setRouteShape(null);
    if (!tripId) return;
    const controller = new AbortController();
    void fetchRouteShape(tripId, controller.signal).then((shape) => {
      if (!controller.signal.aborted) setRouteShape(shape);
    });
    return () => controller.abort();
  }, [tripId]);

  const select = (next: Selection | null) => {
    setSelection(next);
    if (!next) return;
    if (next.kind === "vehicle") openVehicle(next.id);
    else if (next.kind === "stop") openStop(next.id);
    else if (next.kind === "shelter") openShelter(next.id);
    else {
      const place = city.places.find((item) => item.id === next.id);
      if (place) openPlace(place);
    }
  };

  const locate = async () => {
    const point = await city.locate();
    if (point) setFocus(point);
  };

  return (
    <View style={styles.screen}>
      <CityMap
        vehicles={city.vehicles}
        stops={city.stops}
        places={mapPlaces}
        shelters={city.shelters}
        showShelters={city.sheltersOn}
        nearestShelterId={city.sheltersOn ? (city.nearestShelter?.shelter.id ?? null) : null}
        selection={selection}
        routeShape={routeShape}
        userLocation={city.user}
        focus={focus}
        onSelect={select}
        onRegionChangeComplete={city.setRegion}
        mapStyle={mapStyle}
        onCamera={(camera) => controls.current?.setCamera(camera)}
        controller={mapCommands}
      />

      <View style={[styles.topBar, { top: insets.top + space.sm }]} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Львів, бета. Довго натисніть, щоб відкрити інструменти розробника"
          delayLongPress={5000}
          onLongPress={sim.openDevTools}
          style={styles.cityPill}
        >
          <Txt variant="headline">Львів</Txt>
          <Badge label="Beta" tone="accent" />
        </Pressable>
        <AvatarButton onPress={openProfile} />
      </View>

      {city.sheltersOn && city.alert ? (
        <View style={[styles.alert, { top: insets.top + 64 }]}>
          <AirAlertPill alert={city.alert} />
        </View>
      ) : null}

      <MapControls
        ref={controls}
        map={mapCommands}
        mapStyle={mapStyle}
        onChangeMapStyle={setMapStyle}
        onLocate={() => void locate()}
        layerCategories={layerCategories}
        onToggleLayer={toggleLayer}
        onClearLayers={() => setLayerCategories(new Set())}
      />

      <Onboarding visible={onboarding && focused} onDone={() => setOnboarding(false)} />
    </View>
  );
}

const styles = themed(() => ({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: {
    position: "absolute",
    left: layout.screenMargin,
    right: layout.screenMargin,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 40,
    paddingHorizontal: space.md,
    borderRadius: 999,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alert: { position: "absolute", left: layout.screenMargin, right: layout.screenMargin + 56 },
}));
