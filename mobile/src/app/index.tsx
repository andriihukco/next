import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import * as Location from "expo-location";
import { CityMap, LVIV_REGION, type MapRegion, type Selection } from "../components/city-map";
import { CitySheet, type SheetContent } from "../components/city-sheet";
import { GlassSurface } from "../components/glass-surface";
import { useLiveVehicles } from "../hooks/use-live-vehicles";
import { useDevSim } from "../lib/dev-sim";
import { useAirAlert } from "../hooks/use-air-alert";
import { useShelters } from "../hooks/use-shelters";
import { AirAlertPill } from "../components/air-alert-pill";
import { nearestShelter } from "../lib/shelters";
import { useStops } from "../hooks/use-stops";
import { fetchPlacesIn, type CityPlace } from "../lib/places-api";
import { fetchRouteShape } from "../lib/transit-api";
import { distanceKm } from "../lib/geo";
import { colors } from "../lib/theme";
import { TransportPanel } from "../components/transport/transport-panel";
import { MapHeader } from "../components/transport/map-header";
import { SectionTabs, type CitySection } from "../components/transport/section-tabs";
import { PlaceDetail } from "../components/places/place-detail";

const PLACES_MAX_DELTA = 0.08; // Places load only when zoomed in enough to be useful.
const PLACES_DEBOUNCE_MS = 500;

/** Місто: the live transit and places map. The home screen of the app. */
export default function CityScreen() {
  const sim = useDevSim();
  const live = useLiveVehicles();
  // Simulated transport replaces the feed while simulation is on (dev tools only).
  const vehicles = sim.simulate ? sim.vehicles : live.vehicles;
  const stops = useStops();
  const liveAlert = useAirAlert();
  const alert = sim.alert ?? liveAlert;
  const shelters = useShelters();
  const showShelters = alert?.status === "active";
  const [userCoordinate, setUserCoordinate] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState<MapRegion>(LVIV_REGION);
  const [places, setPlaces] = useState<CityPlace[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [focus, setFocus] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeShape, setRouteShape] = useState<{ latitude: number; longitude: number }[] | null>(null);
  const [locating, setLocating] = useState(false);
  const [section, setSection] = useState<CitySection>("transport");

  useEffect(() => {
    let active = true;
    void Location.getForegroundPermissionsAsync().then(async ({ granted }) => {
      if (!active) return;
      setLocating(granted);
      if (!granted) return;
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (active) {
        setUserCoordinate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const placeOrigin = userCoordinate ?? { latitude: region.latitude, longitude: region.longitude };
  const openDirections = (place: CityPlace) => {
    router.push({ pathname: "/directions", params: { name: place.name, lat: String(place.lat), lng: String(place.lng) } });
  };

  const nearest = useMemo(() => nearestShelter(shelters, userCoordinate), [shelters, userCoordinate]);

  // Places for the visible area, debounced while the user pans.
  useEffect(() => {
    if (region.latitudeDelta > PLACES_MAX_DELTA) {
      setPlaces([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchPlacesIn({
        south: region.latitude - region.latitudeDelta / 2,
        north: region.latitude + region.latitudeDelta / 2,
        west: region.longitude - region.longitudeDelta / 2,
        east: region.longitude + region.longitudeDelta / 2,
      })
        .then(setPlaces)
        .catch(() => setPlaces([]));
    }, PLACES_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // Only the centre and zoom matter for the query, not every intermediate region.
  }, [region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta]);

  const selectedVehicle = useMemo(
    () => (selection?.kind === "vehicle" ? vehicles.find((v) => v.id === selection.id) ?? null : null),
    [selection, vehicles],
  );

  // Route shape for the selected vehicle's trip.
  const tripId = selectedVehicle?.tripId ?? null;
  useEffect(() => {
    setRouteShape(null);
    if (!tripId) return;
    const controller = new AbortController();
    void fetchRouteShape(tripId, controller.signal).then((shape) => {
      if (!controller.signal.aborted) setRouteShape(shape);
    });
    return () => controller.abort();
  }, [tripId]);

  const content: SheetContent | null = useMemo(() => {
    if (!selection) return null;
    if (selection.kind === "vehicle") {
      return selectedVehicle ? { kind: "vehicle", vehicle: selectedVehicle } : null;
    }
    if (selection.kind === "stop") {
      const stop = stops.find((s) => s.id === selection.id);
      return stop ? { kind: "stop", stop, vehicles } : null;
    }
    if (selection.kind === "shelter") {
      const shelter = shelters.find((s) => s.id === selection.id);
      if (!shelter) return null;
      const nearestMeters =
        nearest?.shelter.id === shelter.id
          ? nearest.meters
          : userCoordinate
            ? distanceKm(userCoordinate, { latitude: shelter.lat, longitude: shelter.lng }) * 1000
            : null;
      return { kind: "shelter", shelter, nearestMeters };
    }
    const place = places.find((p) => p.id === selection.id);
    return place ? { kind: "place", place } : null;
  }, [selection, selectedVehicle, stops, vehicles, places, shelters, nearest, userCoordinate]);

  return (
    <View style={styles.screen}>
      <CityMap
        vehicles={vehicles}
        stops={stops}
        places={places}
        shelters={shelters}
        showShelters={showShelters}
        nearestShelterId={showShelters ? (nearest?.shelter.id ?? null) : null}
        selection={selection}
        routeShape={routeShape}
        userLocation={locating ? userCoordinate : null}
        focus={focus}
        onSelect={setSelection}
        onRegionChangeComplete={setRegion}
      />

      <MapHeader />

      {showShelters && alert && (
        <View style={styles.alertWrap}>
          <AirAlertPill alert={alert} />
        </View>
      )}

      <TransportPanel
        section={section}
        vehicles={vehicles}
        simulated={sim.simulate}
        onUseLive={() => sim.setSimulate(false)}
        onSelectVehicle={(id) => setSelection({ kind: "vehicle", id })}
        places={places}
        origin={placeOrigin}
        hasUserLocation={userCoordinate !== null}
        onOpenPlace={(place: CityPlace) => setSelection({ kind: "place", id: place.id })}
        onShowPlaceOnMap={(place: CityPlace) => {
          setSelection({ kind: "place", id: place.id });
          setFocus({ latitude: place.lat, longitude: place.lng });
        }}
        onDirectionsToPlace={openDirections}
      />

      <SectionTabs value={section} onChange={setSection} />

      {content ? (
        <View style={styles.sheetWrap}>
          <GlassSurface>
            {content.kind === "place" ? (
              <PlaceDetail
                place={content.place}
                distanceMeters={distanceKm(placeOrigin, { latitude: content.place.lat, longitude: content.place.lng }) * 1000}
                onBack={() => setSelection(null)}
                onShowOnMap={() => setFocus({ latitude: content.place.lat, longitude: content.place.lng })}
                onDirections={() => openDirections(content.place)}
                onOpenPage={() => router.push({ pathname: "/place", params: { place: JSON.stringify(content.place) } })}
              />
            ) : (
              <CitySheet content={content} />
            )}
          </GlassSurface>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  alertWrap: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
  },
  sheetWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 36,
  },
});
