import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { resolveColor } from "./lib/design-colors";
import { recolorMapForTheme, snapshotMapPalette } from "./lib/map-theme";
import { FILLED_ICON_FAMILY, loadFilledIconFont } from "./lib/material-symbols-filled";
import { useResolvedTheme } from "./lib/use-theme";
import { usePasswordRecovery } from "./lib/supabase";
import * as maplibregl from "maplibre-gl";
import {
  GeoJSONSource,
  type Map as MapLibreMap,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import type {
  FeatureCollection,
  LineString,
  Point,
  Position,
} from "geojson";
import {
  Bus,
  ChevronRight,
  LocateFixed,
  MapPin,
  MaterialIcon,
  Navigation,
  Plus,
  Search,
  TriangleAlert,
  X,
} from "./components/ui/material-icon";
import { AnimatePresence, MotionConfig, motion, useTransform, type MotionStyle } from "motion/react";
import { BrandLogo } from "./components/ui/brand-logo";
import { Button } from "./components/ui/button";
import { IconButton } from "./components/ui/icon-button";
import { useBottomSheet } from "./components/ui/use-bottom-sheet";
import { useMediaQuery } from "./lib/use-media-query";
import { Card } from "./components/ui/card";
import { Toggle } from "./components/ui/toggle";
import { AdminPanel, type AdminDataset } from "./components/admin-panel";
import { BuildingModelEditor } from "./components/building-model-editor";
import { CityGuide } from "./components/city-guide";
import { TransitVehicleArtwork } from "./components/transit-vehicle-artwork";
import {
  ActionBar,
  ActionBarButton,
  DetailChip,
  DetailHero,
  DetailSection,
  SheetNavBar,
  StatGrid,
} from "./components/ui/detail-layout";
import { Input } from "./components/ui/input";
import { TooltipProvider } from "./components/ui/tooltip";
import { apiUrl } from "./lib/api";
import { EntityDetail, type InfoRow } from "./components/entity-detail";
import { useSavedItems } from "./lib/use-saved-items";
import {
  createVehicle3DLayer,
  type Vehicle3DLayer,
} from "./lib/vehicle-3d-layer";
import {
  createBuilding3DLayer,
  type Building3DLayer,
  type BuildingModelData,
} from "./lib/building-3d-layer";
import {
  deleteBuildingModel,
  loadBuildingModels,
  saveBuildingModel,
} from "./lib/building-model-store";
import {
  advanceFixtureVehicles,
  createFixtureRoute,
  createFixtureVehicles,
  getFixtureAirAlert,
  getFixtureStops,
} from "./lib/dev-fixtures";
import {
  cityEvents as defaultCityEvents,
  type CityEvent,
} from "./lib/city-fixtures";
import {
  clearFixtureSettings,
  DEFAULT_FIXTURE_SETTINGS,
  getScenarioLimits,
  hasFixtureReplay,
  isFixtureScenario,
  readFixtureSettings,
  saveFixtureSettings,
  type FixtureSettings,
} from "./lib/dev-fixture-settings";
import { DevToolsDock } from "./components/dev-tools/dev-tools-dock";
import { isDevRouteActive, useDevRoute } from "./lib/dev-tools/route";
import { getScenarioMeta } from "./lib/dev-tools/scenarios";
import {
  ADMIN_OVERRIDES_KEY,
  clearDevStorage,
} from "./lib/dev-tools/storage";
import {
  getRidershipEstimate,
  TRANSIT_TYPE_COLORS as COLORS,
  vehicleFleetColor,
  vehicleModelDescription,
} from "./lib/fleet";
import {
  CITY_PLACE_CATEGORY_COLORS,
  cityBuildingFromMapFeature,
  cityPlaceIcons,
  cityPlaceCategories,
  cityPlacesFromMapFeatures,
  type CityPlaceCategory,
  type CityPlace,
} from "./lib/city-places";
import { cityNames, ukraineCityRegions } from "./lib/ukraine-city-regions";
import { BenefitsDialog } from "./features/onboarding/benefits-dialog";
import { SettingsDialog } from "./features/settings/settings-dialog";
import { OnboardingDialog } from "./features/onboarding/onboarding-dialog";
import { ONBOARDING_STEPS, type OnboardingProfile } from "./features/onboarding/steps";
import {
  BENEFITS_DISMISSED_KEY,
  ONBOARDING_COMPLETE_KEY,
  ONBOARDING_PREVIEW_KEY,
  ONBOARDING_PROFILE_KEY,
  readOnboardingValue,
  saveOnboardingValue,
} from "./features/onboarding/storage";

type VehicleType = "tram" | "trolleybus" | "bus" | "taxi";
type AppView = "city" | "map" | "admin";
type DetailReturnView = "city" | "map";
// MapLibre looks for its worker next to its own bundle chunk, where the build does not emit it.
maplibregl.setWorkerUrl(maplibreWorkerUrl);

const BRAND_BLUE = "var(--brand-blue)";
type VehicleFilter = VehicleType;
type Vehicle = {
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
  /** Next stop on the vehicle's trip, or null when unknown or at the end of the route. */
  nextStop?: string | null;
  fixtureRouteId?: string;
  dataSource?: "test";
  routeProgress?: number;
};
type Stop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  routes: string[];
  address?: string;
  facilities?: string[];
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  timetable?: { route: string; departure: string }[];
};
type StopTab = "overview" | "schedule" | "facilities" | "contacts" | "reviews";
type AirAlertStatus = "active" | "clear" | "unknown";
type AirAlertThreatKind = "drone" | "bomb" | "other";
type AirAlertThreat = {
  time: string;
  kind: AirAlertThreatKind;
  kindLabel: string;
  place: string;
  placeUk: string;
  note: string;
};
type AirAlert = {
  status: AirAlertStatus;
  level: "red" | "yellow" | null;
  since?: string | null;
  sinceText?: string | null;
  areasAffected?: string[];
  threats?: AirAlertThreat[];
  reportAt?: string | null;
  updatedAt: number;
  source: string;
};
type Shelter = {
  id: string;
  settlement: string;
  address: string;
  district: string;
  objectType: string;
  status: string;
  access24_7: boolean;
  capacity: number | null;
  lat: number;
  lng: number;
};
type ShelterLoadState = "loading" | "ready" | "error";

type AdminDatasetId =
  | "vehicles"
  | "stops"
  | "shelters"
  | "places"
  | "education"
  | "events"
  | "air-alert"
  | "fixture-settings";
type AdminOverrides = Partial<Record<AdminDatasetId, unknown>>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const isString = (value: unknown): value is string =>
  typeof value === "string";
const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);
const isVehicle = (value: unknown): value is Vehicle =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.tripId) &&
  isString(value.route) &&
  isString(value.destination) &&
  (value.type === "bus" ||
    value.type === "tram" ||
    value.type === "trolleybus") &&
  isNumber(value.lat) &&
  isNumber(value.lng) &&
  isNumber(value.speed) &&
  isNumber(value.bearing) &&
  isString(value.plate) &&
  typeof value.lowFloor === "boolean" &&
  typeof value.mapMatched === "boolean" &&
  (value.fixtureRouteId === undefined || isString(value.fixtureRouteId)) &&
  (value.dataSource === undefined || value.dataSource === "test");
const isStop = (value: unknown): value is Stop =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.name) &&
  isNumber(value.lat) &&
  isNumber(value.lng) &&
  isStringArray(value.routes) &&
  (value.address === undefined || isString(value.address)) &&
  (value.facilities === undefined || isStringArray(value.facilities)) &&
  (value.phone === undefined || isString(value.phone)) &&
  (value.website === undefined || isString(value.website)) &&
  (value.rating === undefined ||
    (isNumber(value.rating) && value.rating >= 0 && value.rating <= 5)) &&
  (value.reviewCount === undefined ||
    (isNumber(value.reviewCount) &&
      Number.isInteger(value.reviewCount) &&
      value.reviewCount >= 0)) &&
  (value.timetable === undefined ||
    (Array.isArray(value.timetable) &&
      value.timetable.every(
        (entry) =>
          isRecord(entry) &&
          isString(entry.route) &&
          isString(entry.departure),
      )));
const isShelter = (value: unknown): value is Shelter =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.settlement) &&
  isString(value.address) &&
  isString(value.district) &&
  isString(value.objectType) &&
  isString(value.status) &&
  typeof value.access24_7 === "boolean" &&
  (value.capacity === null || isNumber(value.capacity)) &&
  isNumber(value.lat) &&
  isNumber(value.lng);
const isCityPlace = (value: unknown): value is CityPlace =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.name) &&
  isString(value.category) &&
  Object.prototype.hasOwnProperty.call(
    CITY_PLACE_CATEGORY_COLORS,
    value.category,
  ) &&
  isString(value.categoryLabel) &&
  isNumber(value.lat) &&
  isNumber(value.lng) &&
  isString(value.address) &&
  isRecord(value.details) &&
  Object.values(value.details).every(isString) &&
  (value.imageUrl === undefined || isString(value.imageUrl));
const isCoordinates = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  value.length === 2 &&
  isNumber(value[0]) &&
  isNumber(value[1]);
const isCityEvent = (value: unknown): value is CityEvent =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.day) &&
  isString(value.month) &&
  isString(value.time) &&
  isString(value.name) &&
  isString(value.venue) &&
  isString(value.summary) &&
  isString(value.category) &&
  isCoordinates(value.coordinates);
const isAirAlertThreat = (value: unknown): value is AirAlertThreat =>
  isRecord(value) &&
  isString(value.time) &&
  (value.kind === "drone" || value.kind === "bomb" || value.kind === "other") &&
  isString(value.kindLabel) &&
  isString(value.place) &&
  isString(value.placeUk) &&
  isString(value.note);
const isAirAlert = (value: unknown): value is AirAlert =>
  isRecord(value) &&
  (value.status === "active" ||
    value.status === "clear" ||
    value.status === "unknown") &&
  (value.level === "red" || value.level === "yellow" || value.level === null) &&
  isNumber(value.updatedAt) &&
  isString(value.source) &&
  (value.since === undefined || value.since === null || isString(value.since)) &&
  (value.sinceText === undefined ||
    value.sinceText === null ||
    isString(value.sinceText)) &&
  (value.reportAt === undefined ||
    value.reportAt === null ||
    isString(value.reportAt)) &&
  (value.areasAffected === undefined || isStringArray(value.areasAffected)) &&
  (value.threats === undefined || isArrayOf(isAirAlertThreat)(value.threats));
const isFixtureSettings = (value: unknown): value is FixtureSettings =>
  isRecord(value) &&
  typeof value.enabled === "boolean" &&
  isFixtureScenario(value.scenario) &&
  isNumber(value.vehicleCount) &&
  Number.isInteger(value.vehicleCount) &&
  isNumber(value.averageSpeed) &&
  isNumber(value.seed) &&
  Number.isInteger(value.seed);

const isArrayOf =
  <T,>(guard: (value: unknown) => value is T) =>
  (value: unknown): value is T[] =>
    Array.isArray(value) && value.every(guard);

const readAdminOverrides = (): AdminOverrides => {
  try {
    const saved = localStorage.getItem(ADMIN_OVERRIDES_KEY);
    if (!saved) return {};
    const parsed: unknown = JSON.parse(saved);
    if (!isRecord(parsed)) {
      console.error("Saved admin overrides are invalid; ignoring them.");
      return {};
    }
    return parsed as AdminOverrides;
  } catch (error) {
    console.error("Could not read local admin overrides.", error);
    return {};
  }
};

const readAdminOverride = <T,>(
  id: AdminDatasetId,
  fallback: T,
  guard: (value: unknown) => value is T,
): T => {
  if (!isDevRouteActive()) return fallback;
  const override = readAdminOverrides()[id];
  if (override === undefined) return fallback;
  if (guard(override)) return override;
  console.error(`Saved admin override for ${id} is invalid; ignoring it.`);
  return fallback;
};

const persistAdminOverride = (id: AdminDatasetId, value: unknown): string | null => {
  if (!isDevRouteActive()) {
    return "Редагування доступне лише на маршруті /dev.";
  }
  try {
    const overrides = readAdminOverrides();
    localStorage.setItem(
      ADMIN_OVERRIDES_KEY,
      JSON.stringify({ ...overrides, [id]: value }),
    );
    return null;
  } catch (error) {
    console.error(`Could not save the ${id} admin override.`, error);
    return "Зміни не збережено. Перевірте доступ до локального сховища.";
  }
};

const CENTER: [number, number] = [24.0297, 49.8397];
const LVIV_REGION_BOUNDS: [[number, number], [number, number]] = [
  [22.6, 48.5],
  [25.6, 50.6],
];
const CITY_UPDATES_ENDPOINT = import.meta.env.VITE_CITY_UPDATES_ENDPOINT?.trim();
const TELEGRAM_CHANNEL_URL = (() => {
  const configuredUrl = import.meta.env.VITE_TELEGRAM_CHANNEL_URL?.trim();
  if (!configuredUrl) return "";
  try {
    const url = new URL(configuredUrl);
    if (url.protocol === "https:" && url.hostname === "t.me") {
      return url.href;
    }
  } catch (error) {
    console.error("The configured Telegram channel URL is invalid.", error);
    return "";
  }
  console.error("The Telegram channel URL must be an HTTPS t.me link.");
  return "";
})();
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const pinImageId = (category: string, active = false): string =>
  active ? `wayme-place-${category}-active` : `wayme-place-${category}`;

// Active pins draw the filled glyph; the rest draw the outlined one.
const cityPlacePinImage = async (
  category: CityPlaceCategory,
  active = false,
): Promise<ImageData> => {
  const iconName = cityPlaceIcons[category];
  const filled = active && (await loadFilledIconFont());
  const family = filled ? FILLED_ICON_FAMILY : "Material Symbols Rounded";
  const font = `500 18px "${family}"`;
  await document.fonts.load(font, iconName);
  if (!document.fonts.check(font, iconName)) {
    throw new Error("The Material Symbols font is not available.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 80;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the map pin canvas.");
  context.scale(2, 2);
  const pin = new Path2D(
    "M16 1C7.7 1 1 7.6 1 15.8 1 26.4 16 39 16 39s15-12.6 15-23.2C31 7.6 24.3 1 16 1Z",
  );
  context.fillStyle = resolveColor(CITY_PLACE_CATEGORY_COLORS[category]);
  context.strokeStyle = resolveColor("var(--card)");
  context.lineWidth = 1.5;
  context.fill(pin);
  context.stroke(pin);
  context.font = font;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = resolveColor("var(--card)");
  context.fillText(iconName, 16, 16);
  return context.getImageData(0, 0, canvas.width, canvas.height);
};
const label = (type: VehicleType): string =>
  type === "tram" ? "Трамвай" : type === "trolleybus" ? "Тролейбус" : "Автобус";
const PLACE_INFO_ICONS: Record<string, string> = {
  "Адреса": "location_on",
  "Години роботи": "schedule",
  "Висота": "height",
  "Поверхи": "layers",
  "Оператор": "business",
  "Телефон": "call",
};

/** Source tags as quick facts. Website and phone are handled by the detail layout. */
function placeInfoRows(place: CityPlace): InfoRow[] {
  return Object.entries(place.details)
    .filter(([label]) => label !== "Сайт" && label !== "Телефон")
    .map(([label, value]) => ({
      icon: PLACE_INFO_ICONS[label] ?? "info",
      label,
      value,
    }));
}

function SidebarStepHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return <SheetNavBar title={title} onBack={onBack} />;
}
const minutesAway = (vehicle: Vehicle, stop: Stop): number =>
  Math.max(
    1,
    Math.round(
      new maplibregl.LngLat(vehicle.lng, vehicle.lat).distanceTo(
        new maplibregl.LngLat(stop.lng, stop.lat),
      ) /
        Math.max(vehicle.speed, 12) /
        60,
    ),
  );

type VehicleFeatureProperties = Pick<
  Vehicle,
  "id" | "route" | "plate" | "type"
> & { selected: boolean };
type StopFeatureProperties = Pick<Stop, "id" | "name">;
type ShelterFeatureProperties = Pick<Shelter, "id" | "address"> & {
  nearest: boolean;
  readyOrRecommended: boolean;
};
type CityPlaceFeatureProperties = Pick<
  CityPlace,
  "id" | "name" | "category" | "categoryLabel" | "address"
> & { selected: boolean };

const vehicleFeatures = (
  vehicles: Vehicle[],
  selectedId?: string,
): FeatureCollection<Point, VehicleFeatureProperties> => ({
  type: "FeatureCollection",
  features: vehicles.map((vehicle) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [vehicle.lng, vehicle.lat] },
    properties: {
      id: vehicle.id,
      route: vehicle.route,
      plate: vehicle.plate,
      type: vehicle.type,
      selected: vehicle.id === selectedId,
    },
  })),
});

const stopFeatures = (
  stops: Stop[],
): FeatureCollection<Point, StopFeatureProperties> => ({
  type: "FeatureCollection",
  features: stops.map((stop) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [stop.lng, stop.lat] },
    properties: { id: stop.id, name: stop.name },
  })),
});

const shelterFeatures = (
  shelters: Shelter[],
  nearestId?: string,
): FeatureCollection<Point, ShelterFeatureProperties> => ({
  type: "FeatureCollection",
  features: shelters.map((shelter) => {
    const status = shelter.status.trim().toLocaleLowerCase("uk-UA");
    return {
      type: "Feature",
      geometry: { type: "Point", coordinates: [shelter.lng, shelter.lat] },
      properties: {
        id: shelter.id,
        address: shelter.address,
        nearest: shelter.id === nearestId,
        readyOrRecommended:
          shelter.access24_7 &&
          (status === "готове" || status.startsWith("рекомендоване")),
      },
    };
  }),
});

const cityPlaceFeatures = (
  places: CityPlace[],
  selectedId?: string,
): FeatureCollection<Point, CityPlaceFeatureProperties> => ({
  type: "FeatureCollection",
  features: places.map((place) => ({
    type: "Feature",
    id: place.id,
    geometry: { type: "Point", coordinates: [place.lng, place.lat] },
    properties: {
      id: place.id,
      name: place.name,
      category: place.category,
      categoryLabel: place.categoryLabel,
      address: place.address,
      selected: place.id === selectedId,
    },
  })),
});

const formatDistance = (meters: number): string =>
  meters >= 1000
    ? `${new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(meters / 1000)} км`
    : `${Math.round(meters / 10) * 10} м`;

const safeStopWebsite = (value?: string): string | null => {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
};

const routeFeatures = (
  coordinates: Position[] = [],
): FeatureCollection<LineString> => ({
  type: "FeatureCollection",
  features:
    coordinates.length > 1
      ? [
          {
            type: "Feature",
            geometry: { type: "LineString", coordinates },
            properties: {},
          },
        ]
      : [],
});

const updateGeoJSONSource = (
  map: MapLibreMap,
  id: string,
  data: FeatureCollection,
): void => {
  const source = map.getSource(id);
  if (source instanceof GeoJSONSource) source.setData(data);
};

const animateRouteProgress = (
  map: MapLibreMap,
  coordinates: [number, number][],
  color: string,
): (() => void) => {
  if (coordinates.length < 2) return () => {};
  const distances = [0];
  for (let index = 1; index < coordinates.length; index += 1) {
    const previous = coordinates[index - 1];
    const current = coordinates[index];
    distances.push(
      distances[index - 1] +
        new maplibregl.LngLat(previous[0], previous[1]).distanceTo(
          new maplibregl.LngLat(current[0], current[1]),
        ),
    );
  }
  const routeLength = distances[distances.length - 1];
  if (!routeLength) return () => {};

  const element = document.createElement("span");
  element.className = "route-progress-marker";
  element.setAttribute("aria-hidden", "true");
  element.style.setProperty("--route-color", color);
  const marker = new maplibregl.Marker({ element, anchor: "center" })
    .setLngLat(coordinates[0])
    .addTo(map);
  const startedAt = performance.now();
  let frame = 0;
  const advance = (now: number): void => {
    const distance = (((now - startedAt) * 9) / 1000) % routeLength;
    let segment = distances.findIndex(
      (value, index) => index > 0 && value >= distance,
    );
    if (segment < 1) segment = coordinates.length - 1;
    const segmentStart = distances[segment - 1];
    const segmentLength = distances[segment] - segmentStart;
    const progress =
      segmentLength > 0 ? (distance - segmentStart) / segmentLength : 0;
    const [startLng, startLat] = coordinates[segment - 1];
    const [endLng, endLat] = coordinates[segment];
    marker.setLngLat([
      startLng + (endLng - startLng) * progress,
      startLat + (endLat - startLat) * progress,
    ]);
    frame = window.requestAnimationFrame(advance);
  };
  frame = window.requestAnimationFrame(advance);

  return () => {
    window.cancelAnimationFrame(frame);
    marker.remove();
  };
};

export default function App() {
  const devRouteActive = useDevRoute();
  const developmentToolsAvailable = devRouteActive;
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const cityMarkerRef = useRef<maplibregl.Marker | null>(null);
  const vehicle3DLayerRef = useRef<Vehicle3DLayer | null>(null);
  const building3DLayerRef = useRef<Building3DLayer | null>(null);
  const vehiclesRef = useRef<Vehicle[]>([]);
  const stopsRef = useRef<Stop[]>([]);
  const cityPlacesRef = useRef<CityPlace[]>([]);
  const activeViewRef = useRef<AppView>("city");
  const [mapReady, setMapReady] = useState(false);
  const [mapPitch, setMapPitch] = useState(60);
  const [mapBearing, setMapBearing] = useState(0);
  const [terrainEnabled, setTerrainEnabled] = useState(false);
  const [selectedStopTab, setSelectedStopTab] =
    useState<StopTab>("overview");
  const [selectedStopElevation, setSelectedStopElevation] = useState<number | null>(
    null,
  );
  const [stopElevationStatus, setStopElevationStatus] = useState<
    "idle" | "loading" | "ready" | "unavailable"
  >("idle");
  const [onboardingPreviewOnReload, setOnboardingPreviewOnReload] = useState(
    () =>
      isDevRouteActive() &&
      readOnboardingValue(ONBOARDING_PREVIEW_KEY) === "true",
  );
  const [onboardingPhase, setOnboardingPhase] = useState<
    "welcome" | "profile" | "tour"
  >("welcome");
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const shouldPreview =
      isDevRouteActive() &&
      readOnboardingValue(ONBOARDING_PREVIEW_KEY) === "true";
    return (
      readOnboardingValue(ONBOARDING_COMPLETE_KEY) !== "true" ||
      shouldPreview
    );
  });
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showBenefits, setShowBenefits] = useState(
    () =>
      readOnboardingValue(ONBOARDING_COMPLETE_KEY) === "true" &&
      readOnboardingValue(BENEFITS_DISMISSED_KEY) !== "true" &&
      !(
        isDevRouteActive() &&
        readOnboardingValue(ONBOARDING_PREVIEW_KEY) === "true"
      ),
  );
  const [notificationMessage, setNotificationMessage] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>(() =>
    readAdminOverride("vehicles", [], isArrayOf(isVehicle)),
  );
  const [transitDataStatus, setTransitDataStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [stops, setStops] = useState<Stop[]>(() =>
    readAdminOverride("stops", [], isArrayOf(isStop)),
  );
  const [shelters, setShelters] = useState<Shelter[]>(() =>
    readAdminOverride("shelters", [], isArrayOf(isShelter)),
  );
  const [shelterLoadState, setShelterLoadState] =
    useState<ShelterLoadState>("loading");
  const [airAlert, setAirAlert] = useState<AirAlert>(() =>
    readAdminOverride(
      "air-alert",
      {
        status: "unknown",
        level: null,
        updatedAt: 0,
        source: "alerts.in.ua",
      },
      isAirAlert,
    ),
  );
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [followVehicleId, setFollowVehicleId] = useState<string | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [cityPlaces, setCityPlaces] = useState<CityPlace[]>(() =>
    readAdminOverride("places", [], isArrayOf(isCityPlace)),
  );
  const [eventData, setEventData] = useState<CityEvent[]>(() =>
    readAdminOverride("events", defaultCityEvents, isArrayOf(isCityEvent)),
  );
  const [mapCityPlaces, setMapCityPlaces] = useState<CityPlace[]>([]);
  const [mapLayerCategories, setMapLayerCategories] = useState<Set<CityPlaceCategory>>(new Set());
  const [mapSettingsOpen, setMapSettingsOpen] = useState(false);
  const mapSettingsRef = useRef<HTMLDivElement>(null);
  const [cityPlacesStatus, setCityPlacesStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [cityPlacesError, setCityPlacesError] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<CityPlace | null>(null);
  const [buildingModels, setBuildingModels] = useState<BuildingModelData[]>([]);
  const [buildingModelPreview, setBuildingModelPreview] =
    useState<BuildingModelData | null>(null);
  const [buildingModelsStatus, setBuildingModelsStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [buildingModelsError, setBuildingModelsError] = useState("");
  const [activeView, setActiveView] = useState<AppView>("city");
  const [detailReturnView, setDetailReturnView] =
    useState<DetailReturnView>("map");
  const [cityPageOpen, setCityPageOpen] = useState(false);
  const cityPageBackRef = useRef<() => void>(() => setCityPageOpen(false));
  const [cityLaunchModalOpen, setCityLaunchModalOpen] = useState(false);
  const [interestedCities, setInterestedCities] = useState<Set<string>>(
    new Set([cityNames.find((city) => city === "Київ") ?? cityNames[0]]),
  );
  const [citySearch, setCitySearch] = useState("");
  const [cityUpdateEmail, setCityUpdateEmail] = useState("");
  const [cityUpdateStatus, setCityUpdateStatus] = useState("");
  const [cityUpdateSubmitting, setCityUpdateSubmitting] = useState(false);
  const cityLaunchDialogRef = useRef<HTMLDialogElement>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const [fixtureSettings, setFixtureSettings] = useState<FixtureSettings>(() => {
    const base = readFixtureSettings();
    // A shared scenario link always wins over the locally saved state.
    return hasFixtureReplay()
      ? base
      : readAdminOverride("fixture-settings", base, isFixtureSettings);
  });
  const [dataResetToken, setDataResetToken] = useState(0);
  const [browserOnline, setBrowserOnline] = useState(navigator.onLine);
  const [adminOverridesActive, setAdminOverridesActive] = useState(() =>
    Object.keys(readAdminOverrides()).length > 0,
  );
  const [airAlertExpanded, setAirAlertExpanded] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>(() => {
    const saved = localStorage.getItem("eway-last-vehicle-filter");
    return (saved as VehicleFilter) || "bus";
  });
  const [transitFlow, setTransitFlow] = useState<VehicleType | null | "menu">(
    null,
  );
  const [search, setSearch] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const passwordRecovery = usePasswordRecovery();
  // A password-reset link lands here signed in; open the account view to set the new password.
  useEffect(() => {
    if (passwordRecovery) setSettingsOpen(true);
  }, [passwordRecovery]);
  // Inputs stay instant; list filtering runs at lower priority so typing never stalls.
  const deferredSearch = useDeferredValue(search);
  const [waypoints, setWaypoints] = useState(["Моє місцезнаходження", ""]);

  useEffect(() => {
    const dialog = cityLaunchDialogRef.current;
    if (!dialog) return;
    if (cityLaunchModalOpen && !dialog.open) dialog.showModal();
    else if (!cityLaunchModalOpen && dialog.open) dialog.close();
  }, [cityLaunchModalOpen]);

  useEffect(() => {
    const goOnline = (): void => setBrowserOnline(true);
    const goOffline = (): void => setBrowserOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    let active = true;
    loadBuildingModels()
      .then((models) => {
        if (!active) return;
        setBuildingModels(models);
        setBuildingModelsStatus("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error("Could not load the local building models.", error);
        setBuildingModelsStatus("error");
        setBuildingModelsError(
          "Не вдалося відкрити локальне сховище 3D-моделей. Перевірте налаштування браузера.",
        );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setBuildingModelPreview(null);
  }, [selectedPlace?.id]);

  const [savedPlaceIds, toggleSavedPlace] = useSavedItems();

  // The developer tools live on the `/dev` route: open the map so the panel
  // is reachable right away, and leave the admin view when the route ends.
  useEffect(() => {
    if (!developmentToolsAvailable) return;
    if (activeViewRef.current === "city") setActiveView("map");
  }, [developmentToolsAvailable]);

  const refreshCityPlaces = (): void => {
    if (activeViewRef.current !== "city") return;
    const map = mapRef.current;
    if (!map) return;
    if (!map.getSource("openmaptiles")) {
      setCityPlacesStatus("error");
      setCityPlacesError("Джерело місць не доступне у стилі карти.");
      return;
    }
    if (!map.isSourceLoaded("openmaptiles")) {
      setCityPlacesStatus("loading");
      return;
    }
    try {
      const features = map.querySourceFeatures("openmaptiles", {
        sourceLayer: "poi",
      }).filter((feature) => {
        if (feature.geometry.type !== "Point") return false;
        const [lng, lat] = feature.geometry.coordinates;
        return (
          typeof lng === "number" &&
          typeof lat === "number" &&
          map.getBounds().contains([lng, lat])
        );
      });
      const nextPlaces = readAdminOverride(
        "places",
        cityPlacesFromMapFeatures(features),
        isArrayOf(isCityPlace),
      );
      if (!nextPlaces.length && cityPlacesRef.current.length) {
        setCityPlacesStatus("ready");
        return;
      }
      if (JSON.stringify(nextPlaces) !== JSON.stringify(cityPlacesRef.current)) {
        cityPlacesRef.current = nextPlaces;
        setCityPlaces(nextPlaces);
      }
      setCityPlacesStatus("ready");
      setCityPlacesError("");
    } catch (error) {
      console.error("Could not read places from the visible map tiles.", error);
      setCityPlacesStatus("error");
      setCityPlacesError("Не вдалося прочитати місця з даних карти.");
    }
  };

  useEffect(() => {
    activeViewRef.current = activeView;
    if (activeView === "city") refreshCityPlaces();
  }, [activeView]);

  const nearestShelter = useMemo(() => {
    if (!userLocation) return null;
    const location = new maplibregl.LngLat(userLocation[0], userLocation[1]);
    return (
      shelters
        .filter((shelter) => {
          const status = shelter.status.trim().toLocaleLowerCase("uk-UA");
          return (
            shelter.access24_7 &&
            (status === "готове" || status.startsWith("рекомендоване"))
          );
        })
        .map((shelter) => ({
          ...shelter,
          distanceMeters: location.distanceTo(
            new maplibregl.LngLat(shelter.lng, shelter.lat),
          ),
        }))
        .sort((left, right) => left.distanceMeters - right.distanceMeters)[0] ??
      null
    );
  }, [shelters, userLocation]);
  const normalizedCitySearch = citySearch.trim().toLocaleLowerCase("uk-UA");
  const filteredCityRegions = useMemo(
    () =>
      ukraineCityRegions
        .map((region) => {
          const matchesRegion = region.name
            .toLocaleLowerCase("uk-UA")
            .includes(normalizedCitySearch);
          const matchesCenter = region.center
            .toLocaleLowerCase("uk-UA")
            .includes(normalizedCitySearch);
          const cities = matchesRegion
            ? region.cities
            : region.cities.filter((city) =>
                city.toLocaleLowerCase("uk-UA").includes(normalizedCitySearch),
              );
          return {
            ...region,
            matchesRegion,
            matchesCenter,
            cities,
            showCenter:
              !normalizedCitySearch || matchesRegion || matchesCenter,
          };
        })
        .filter(
          (region) =>
            !normalizedCitySearch ||
            region.matchesRegion ||
            region.matchesCenter ||
            region.cities.length > 0,
        ),
    [normalizedCitySearch],
  );
  const cityIndexGroups = useMemo(() => {
    const collator = new Intl.Collator("uk-UA");
    const entries = filteredCityRegions
      .flatMap((region) => [
        ...(region.showCenter
          ? [{ key: `${region.name}|${region.center}`, name: region.center, isCenter: true }]
          : []),
        ...region.cities.map((city) => ({
          key: `${region.name}|${city}`,
          name: city,
          isCenter: false,
        })),
      ])
      .sort((a, b) => collator.compare(a.name, b.name));
    const groups = new Map<string, typeof entries>();
    for (const entry of entries) {
      const letter = entry.name.charAt(0).toLocaleUpperCase("uk-UA");
      groups.set(letter, [...(groups.get(letter) ?? []), entry]);
    }
    return [...groups].map(([letter, items]) => ({ letter, items }));
  }, [filteredCityRegions]);

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapNode.current,
      style: MAP_STYLE,
      center: CENTER,
      zoom: 14.6,
      minZoom: 8,
      maxZoom: 19,
      maxBounds: LVIV_REGION_BOUNDS,
      pitch: 60,
      bearing: -12,
      maxPitch: 75,
      attributionControl: {},
    });
    let lastCityPlaceRefresh = 0;
    let cityPlaceRefreshTimer: number | null = null;
    const refreshCityPlacesWhileMoving = (): void => {
      const now = Date.now();
      const elapsed = now - lastCityPlaceRefresh;
      if (elapsed >= 250) {
        lastCityPlaceRefresh = now;
        refreshCityPlaces();
        return;
      }
      if (cityPlaceRefreshTimer !== null) return;
      cityPlaceRefreshTimer = window.setTimeout(() => {
        cityPlaceRefreshTimer = null;
        lastCityPlaceRefresh = Date.now();
        refreshCityPlaces();
      }, 250 - elapsed);
    };
    const updateMapPitch = (): void => setMapPitch(map.getPitch());
    map.on("pitch", updateMapPitch);
    map.on("rotate", () => setMapBearing(map.getBearing()));
    map.on("idle", refreshCityPlaces);
    map.on("move", refreshCityPlacesWhileMoving);
    map.once("load", async () => {
      snapshotMapPalette();
      map.addSource("wayme-vehicles", {
        type: "geojson",
        data: vehicleFeatures([]),
      });
      map.addSource("wayme-stops", {
        type: "geojson",
        data: stopFeatures([]),
      });
      map.addSource("wayme-city-places", {
        type: "geojson",
        data: cityPlaceFeatures([]),
        cluster: true,
        clusterMaxZoom: 16,
        clusterRadius: 56,
      });
      map.addSource("wayme-route", {
        type: "geojson",
        lineMetrics: true,
        data: routeFeatures(),
      });
      map.addSource("wayme-location", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
      map.addSource("wayme-shelters", {
        type: "geojson",
        data: shelterFeatures([]),
      });
      const placeCategories = Object.keys(
        CITY_PLACE_CATEGORY_COLORS,
      ) as CityPlaceCategory[];
      const addPinImages = (
        category: CityPlaceCategory,
        normal: ImageData,
        active: ImageData,
      ): void => {
        map.addImage(pinImageId(category), normal, { pixelRatio: 2 });
        map.addImage(pinImageId(category, true), active, { pixelRatio: 2 });
      };
      let fallbackPin: { normal: ImageData; active: ImageData } | undefined;
      try {
        const normal = await cityPlacePinImage("other");
        fallbackPin = { normal, active: await cityPlacePinImage("other", true) };
      } catch (error) {
        console.error("Could not create the fallback map pin.", error);
      }
      if (mapRef.current !== map) return;
      const missingPinCategories: CityPlaceCategory[] = [];
      for (const category of placeCategories) {
        try {
          const normal = await cityPlacePinImage(category);
          const active = await cityPlacePinImage(category, true);
          addPinImages(category, normal, active);
          fallbackPin ??= { normal, active };
        } catch (error) {
          console.error(`Could not create the ${category} map pin.`, error);
          if (fallbackPin) {
            addPinImages(category, fallbackPin.normal, fallbackPin.active);
          } else {
            missingPinCategories.push(category);
          }
        }
        if (mapRef.current !== map) return;
      }
      if (fallbackPin) {
        for (const category of missingPinCategories) {
          addPinImages(category, fallbackPin.normal, fallbackPin.active);
        }
      } else if (missingPinCategories.length > 0) {
        console.error(
          `Could not create map pins for: ${missingPinCategories.join(", ")}.`,
        );
      }
      // Each pin image is looked up by category; a selected place uses its active image.
      const pinExpression = (active: boolean): maplibregl.ExpressionSpecification => {
        const branches = placeCategories
          .filter((category) => category !== "other")
          .flatMap((category): [string, string] => [category, pinImageId(category, active)]);
        const match: unknown[] = ["match", ["get", "category"], ...branches, pinImageId("other", active)];
        return match as unknown as maplibregl.ExpressionSpecification;
      };
      const cityPlaceIconExpression: maplibregl.ExpressionSpecification = [
        "case",
        ["==", ["get", "selected"], true],
        pinExpression(true),
        pinExpression(false),
      ];

      const style = map.getStyle();
      const backgroundLayer = map.getLayer("background");
      if (backgroundLayer) {
        map.setPaintProperty("background", "background-color", resolveColor("var(--map-background)"));
      }
      for (const [layerId, color] of [
        ["landuse_residential", resolveColor("var(--map-landuse)")],
        ["landcover_wood", resolveColor("var(--map-wood)")],
        ["landcover_grass", resolveColor("var(--map-grass)")],
        ["water", resolveColor("var(--map-water)")],
      ] as const) {
        if (map.getLayer(layerId)) {
          map.setPaintProperty(layerId, "fill-color", color);
        }
      }
      for (const layer of style.layers) {
        if (layer.id.startsWith("road_") && layer.type === "line") {
          map.setPaintProperty(
            layer.id,
            "line-color",
            layer.id.includes("casing") ? resolveColor("var(--map-casing)") : resolveColor("var(--map-surface)"),
          );
        }
        if (layer.type === "symbol") {
          map.setLayoutProperty(layer.id, "visibility", "none");
        }
      }
      const buildingLayer = style.layers.find(
        (layer) =>
          "source-layer" in layer &&
          layer["source-layer"] === "building" &&
          "source" in layer,
      );
      if (buildingLayer?.type === "fill") {
        map.setPaintProperty(buildingLayer.id, "fill-color", resolveColor("var(--card)"));
        map.setPaintProperty(buildingLayer.id, "fill-outline-color", resolveColor("var(--map-outline)"));
      }
      const buildingSourceId =
        buildingLayer && "source" in buildingLayer
          ? buildingLayer.source
          : undefined;
      const buildingSource = buildingSourceId
        ? style.sources[buildingSourceId]
        : undefined;
      const existingExtrusion = style.layers.find(
        (layer) =>
          layer.type === "fill-extrusion" &&
          "source-layer" in layer &&
          layer["source-layer"] === "building",
      );
      if (existingExtrusion) {
        map.setPaintProperty(
          existingExtrusion.id,
          "fill-extrusion-color",
          resolveColor("var(--card)"),
        );
        map.setPaintProperty(
          existingExtrusion.id,
          "fill-extrusion-opacity",
          1,
        );
      } else if (buildingSourceId && buildingSource?.type === "vector") {
        const firstLabel = style.layers.find((layer) => layer.type === "symbol");
        const extrusionLayer: maplibregl.FillExtrusionLayerSpecification = {
            id: "wayme-building-extrusions",
            type: "fill-extrusion",
            source: buildingSourceId,
            "source-layer": "building",
            minzoom: 14,
            filter: ["any", ["has", "render_height"], ["has", "height"]],
            paint: {
              "fill-extrusion-color": resolveColor("var(--card)"),
              "fill-extrusion-height": [
                "max",
                ["to-number", ["get", "render_height"], 0],
                ["to-number", ["get", "height"], 0],
                3,
              ],
              "fill-extrusion-base": [
                "max",
                ["to-number", ["get", "render_min_height"], 0],
                ["to-number", ["get", "min_height"], 0],
              ],
              "fill-extrusion-opacity": 1,
              "fill-extrusion-vertical-gradient": true,
            },
          };
        if (firstLabel) map.addLayer(extrusionLayer, firstLabel.id);
        else map.addLayer(extrusionLayer, undefined);
      }

      map.addSource("wayme-dem", {
        type: "raster-dem",
        tiles: [
          "https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        maxzoom: 15,
        encoding: "terrarium",
        attribution:
          '<a href="https://registry.opendata.aws/terrain-tiles/" target="_blank">AWS Terrain Tiles</a> · <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank">Mapzen</a>',
      });
      map.addLayer({
        id: "wayme-terrain-hillshade",
        type: "hillshade",
        source: "wayme-dem",
        layout: { visibility: "none" },
        paint: {
          "hillshade-shadow-color": resolveColor("var(--map-hillshade-shadow)"),
          "hillshade-highlight-color": resolveColor("var(--map-hillshade-highlight)"),
          "hillshade-accent-color": resolveColor("var(--map-hillshade-accent)"),
          "hillshade-exaggeration": 0.35,
        },
      });
      map.addLayer({
        id: "wayme-route-outline",
        type: "line",
        source: "wayme-route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": resolveColor("var(--card)"),
          "line-width": 10,
          "line-opacity": 0.88,
        },
      });
      map.addLayer({
        id: "wayme-route-line",
        type: "line",
        source: "wayme-route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": resolveColor("var(--map-route)"),
          "line-width": 5,
          "line-opacity": 0.95,
        },
      });
      map.addLayer({
        id: "wayme-stops-icons",
        type: "symbol",
        source: "wayme-stops",
        minzoom: 13,
        layout: {
          "icon-image": "wayme-place-transport",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 13, 0.48, 17, 0.68],
          "icon-anchor": "bottom",
          "icon-allow-overlap": false,
          "icon-ignore-placement": false,
        },
      });
      map.addLayer({
        id: "wayme-stops-labels",
        type: "symbol",
        source: "wayme-stops",
        minzoom: 16,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-offset": [0, 1.8],
          "text-font": ["Noto Sans Regular"],
        },
        paint: {
          "text-color": resolveColor("var(--map-label)"),
          "text-halo-color": resolveColor("var(--card)"),
          "text-halo-width": 1.5,
        },
      });
      map.addLayer({
        id: "wayme-city-place-clusters",
        type: "circle",
        source: "wayme-city-places",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": resolveColor(BRAND_BLUE),
          "circle-radius": [
            "step",
            ["get", "point_count"],
            15,
            20,
            19,
            80,
            24,
          ],
          "circle-stroke-color": resolveColor("var(--card)"),
          "circle-stroke-width": 2,
        },
      });
      map.addLayer({
        id: "wayme-city-place-cluster-count",
        type: "symbol",
        source: "wayme-city-places",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
          "text-font": ["Noto Sans Bold"],
        },
        paint: { "text-color": resolveColor("var(--card)") },
      });
      map.addLayer({
        id: "wayme-city-place-points",
        type: "symbol",
        source: "wayme-city-places",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": cityPlaceIconExpression,
          "icon-size": ["interpolate", ["linear"], ["zoom"], 12, 0.82, 17, 1.08],
          "icon-anchor": "bottom",
          "icon-allow-overlap": false,
          "icon-ignore-placement": false,
        },
      });
      map.addLayer({
        id: "wayme-city-place-labels",
        type: "symbol",
        source: "wayme-city-places",
        minzoom: 15,
        filter: ["!", ["has", "point_count"]],
        layout: {
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [0, 1.8],
          "text-font": ["Noto Sans Regular"],
          "text-max-width": 12,
          "text-optional": true,
        },
        paint: {
          "text-color": resolveColor("var(--map-label-strong)"),
          "text-halo-color": resolveColor("var(--card)"),
          "text-halo-width": 1.5,
        },
      });
      map.addLayer({
        id: "wayme-shelters-circles",
        type: "circle",
        source: "wayme-shelters",
        layout: { visibility: "none" },
        paint: {
          "circle-radius": ["case", ["get", "nearest"], 11, 7],
          "circle-color": [
            "case",
            ["get", "nearest"],
            resolveColor("var(--map-marker-alert)"),
            ["get", "readyOrRecommended"],
            resolveColor("var(--map-marker-teal)"),
            resolveColor("var(--map-marker-muted)"),
          ],
          "circle-stroke-color": resolveColor("var(--card)"),
          "circle-stroke-width": ["case", ["get", "nearest"], 3, 2],
        },
      });
      map.addLayer({
        id: "wayme-shelters-labels",
        type: "symbol",
        source: "wayme-shelters",
        minzoom: 14,
        filter: ["==", ["get", "nearest"], true],
        layout: {
          visibility: "none",
          "text-field": ["get", "address"],
          "text-size": 11,
          "text-offset": [0, 1.35],
          "text-font": ["Noto Sans Bold"],
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": resolveColor("var(--map-label-alert)"),
          "text-halo-color": resolveColor("var(--card)"),
          "text-halo-width": 2,
        },
      });
      map.addLayer({
        id: "wayme-vehicles-circles",
        type: "circle",
        source: "wayme-vehicles",
        paint: {
          "circle-radius": 18,
          "circle-color": resolveColor("var(--card)"),
          "circle-opacity": 0.03,
          "circle-stroke-opacity": 0.05,
          "circle-stroke-width": 0,
        },
      });
      building3DLayerRef.current = createBuilding3DLayer();
      map.addLayer(building3DLayerRef.current);
      vehicle3DLayerRef.current = createVehicle3DLayer({
        onSelect: (id) => {
          const vehicle = vehiclesRef.current.find(
            (candidate) => candidate.id === id,
          );
          if (vehicle) focusVehicle(vehicle);
        },
      });
      map.addLayer(vehicle3DLayerRef.current);
      // DOM-free route labels: a colored badge and its route number, drawn by MapLibre above the models.
      map.addLayer({
        id: "wayme-vehicles-badge",
        type: "circle",
        source: "wayme-vehicles",
        minzoom: 14,
        paint: {
          "circle-radius": ["case", ["get", "selected"], 13, 11],
          "circle-color": [
            "match",
            ["get", "type"],
            "bus", resolveColor(COLORS.bus),
            "tram", resolveColor(COLORS.tram),
            "trolleybus", resolveColor(COLORS.trolleybus),
            resolveColor(COLORS.taxi),
          ],
          "circle-stroke-color": resolveColor("var(--card)"),
          "circle-stroke-width": 2,
        },
      });
      map.addLayer({
        id: "wayme-vehicles-label",
        type: "symbol",
        source: "wayme-vehicles",
        minzoom: 14,
        layout: {
          "text-field": ["get", "route"],
          "text-font": ["Noto Sans Bold"],
          "text-size": 12,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: { "text-color": resolveColor("var(--card)") },
      });
      map.addLayer({
        id: "wayme-location-circle",
        type: "circle",
        source: "wayme-location",
        paint: {
          "circle-radius": 8,
          "circle-color": resolveColor(BRAND_BLUE),
          "circle-stroke-color": resolveColor("var(--card)"),
          "circle-stroke-width": 3,
        },
      });
      setMapReady(true);
    });
    map.on("error", ({ error }) => {
      console.error("Map rendering error", error);
    });
    mapRef.current = map;
    return () => {
      cityMarkerRef.current?.remove();
      cityMarkerRef.current = null;
      map.off("pitch", updateMapPitch);
      map.off("move", refreshCityPlacesWhileMoving);
      if (cityPlaceRefreshTimer !== null) {
        window.clearTimeout(cityPlaceRefreshTimer);
      }
      map.remove();
      mapRef.current = null;
      vehicle3DLayerRef.current = null;
      building3DLayerRef.current = null;
      setMapReady(false);
    };
  }, []);

  const resolvedTheme = useResolvedTheme();
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    recolorMapForTheme(map);
  }, [resolvedTheme, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.getSource("wayme-dem")) return;
    map.setTerrain(
      terrainEnabled ? { source: "wayme-dem", exaggeration: 1 } : null,
    );
    map.setLayoutProperty(
      "wayme-terrain-hillshade",
      "visibility",
      terrainEnabled && mapPitch < 0.5 ? "visible" : "none",
    );
  }, [mapPitch, mapReady, terrainEnabled]);

  useEffect(() => {
    setSelectedStopTab("overview");
  }, [selectedStop?.id]);

  useEffect(() => {
    setSelectedStopElevation(null);
    if (!selectedStop || !terrainEnabled || !mapReady) {
      setStopElevationStatus("idle");
      return;
    }
    const map = mapRef.current;
    if (!map) return;
    setStopElevationStatus("loading");
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      const elevation = map.queryTerrainElevation([
        selectedStop.lng,
        selectedStop.lat,
      ]);
      if (elevation !== null && Number.isFinite(elevation)) {
        setSelectedStopElevation(elevation);
        setStopElevationStatus("ready");
        window.clearInterval(timer);
      } else if (attempts >= 10) {
        setStopElevationStatus("unavailable");
        window.clearInterval(timer);
      }
    }, 300);
    return () => window.clearInterval(timer);
  }, [mapReady, selectedStop, terrainEnabled]);

  useEffect(() => {
    const fixturesActive = developmentToolsAvailable && fixtureSettings.enabled;
    const meta = getScenarioMeta(fixtureSettings.scenario);
    const latency = fixturesActive && meta.network === "slow" ? meta.latencyMs : 0;

    if (fixturesActive && meta.network === "offline") {
      setVehicles(
        readAdminOverride("vehicles", [], isArrayOf(isVehicle)),
      );
      setTransitDataStatus("error");
      return;
    }

    if (fixturesActive && latency === 0) {
      setVehicles(
        readAdminOverride<Vehicle[]>(
          "vehicles",
          createFixtureVehicles(fixtureSettings),
          isArrayOf(isVehicle),
        ),
      );
      setTransitDataStatus("ready");
      let previousTick = performance.now();
      const timer = window.setInterval(() => {
        const now = performance.now();
        const elapsedSeconds = Math.min((now - previousTick) / 1000, 5);
        previousTick = now;
        setVehicles((current) =>
          advanceFixtureVehicles(current, elapsedSeconds),
        );
      }, 1000);
      return () => window.clearInterval(timer);
    }
    let active = true;
    setTransitDataStatus("loading");
    const load = async (): Promise<void> => {
      try {
        const response = await fetch(apiUrl("/api/vehicles"));
        if (!response.ok) {
          throw new Error(`Transit API returned ${response.status}.`);
        }
        const payload = (await response.json()) as { data?: Vehicle[] };
        if (latency > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, latency));
        }
        if (active) {
          setVehicles(
            readAdminOverride(
              "vehicles",
              payload.data ?? [],
              isArrayOf(isVehicle),
            ),
          );
          setTransitDataStatus("ready");
        }
      } catch (error) {
        console.error("Live transit data is unavailable", error);
        if (active) setTransitDataStatus("error");
      }
    };
    void load();
    const timer = window.setInterval(
      () => void load(),
      latency > 0 ? latency + 2500 : 2500,
    );
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [dataResetToken, developmentToolsAvailable, fixtureSettings]);
  useEffect(() => {
    const fixturesActive = developmentToolsAvailable && fixtureSettings.enabled;
    const meta = getScenarioMeta(fixtureSettings.scenario);
    if (fixturesActive && meta.network === "offline") {
      setStops(readAdminOverride("stops", [], isArrayOf(isStop)));
      return;
    }
    if (fixturesActive) {
      setStops(
        readAdminOverride("stops", getFixtureStops(), isArrayOf(isStop)),
      );
      return;
    }
    let active = true;
    const load = async (): Promise<void> => {
      try {
        const stopResponse = await fetch(apiUrl("/api/stops"));
        const stopPayload = (await stopResponse.json()) as { data?: Stop[] };
        if (active) {
          setStops(
            readAdminOverride(
              "stops",
              stopPayload.data ?? [],
              isArrayOf(isStop),
            ),
          );
        }
      } catch (error) {
        console.error("Transit stop data is unavailable", error);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [dataResetToken, developmentToolsAvailable, fixtureSettings]);
  useEffect(() => {
    const fixturesActive = developmentToolsAvailable && fixtureSettings.enabled;
    const meta = getScenarioMeta(fixtureSettings.scenario);
    if (fixturesActive && meta.network === "offline") {
      setAirAlert(
        readAdminOverride(
          "air-alert",
          {
            status: "unknown",
            level: null,
            updatedAt: 0,
            source: "dev: network loss",
          },
          isAirAlert,
        ),
      );
      return;
    }
    if (fixturesActive) {
      setAirAlert(
        readAdminOverride<AirAlert>(
          "air-alert",
          getFixtureAirAlert(fixtureSettings.scenario),
          isAirAlert,
        ),
      );
      return;
    }
    let active = true;
    const load = async (): Promise<void> => {
      try {
        const response = await fetch(apiUrl("/api/air-alert"));
        const payload = (await response.json()) as { data?: AirAlert };
        if (active && payload.data) {
          setAirAlert(readAdminOverride("air-alert", payload.data, isAirAlert));
        }
      } catch (error) {
        console.error("Air alert status is unavailable", error);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [dataResetToken, developmentToolsAvailable, fixtureSettings]);

  useEffect(() => {
    let active = true;
    const load = async (): Promise<void> => {
      try {
        const response = await fetch(apiUrl("/api/shelters"));
        if (!response.ok) {
          throw new Error(`Shelter data request failed with ${response.status}`);
        }
        const payload = (await response.json()) as { data?: Shelter[] };
        if (!Array.isArray(payload.data)) {
          throw new Error("Shelter data response has an invalid format");
        }
        if (active) {
          setShelters(
            readAdminOverride(
              "shelters",
              payload.data,
              isArrayOf(isShelter),
            ),
          );
          setShelterLoadState("ready");
        }
      } catch (error) {
        console.error("Lviv shelter data is unavailable", error);
        if (active) setShelterLoadState("error");
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 12 * 60 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [dataResetToken]);

  useEffect(() => {
    const map = mapRef.current;
    vehiclesRef.current = vehicles;
    if (!map || !mapReady) return;
    // While a vehicle is selected, only that vehicle stays on the map.
    const mapVehicles = selectedVehicle
      ? vehicles.filter((vehicle) => vehicle.id === selectedVehicle.id)
      : vehicles;
    vehicle3DLayerRef.current?.setVehicles(
      mapVehicles
        .filter((vehicle): vehicle is typeof vehicle & { type: "tram" | "trolleybus" | "bus" } =>
          vehicle.type === "bus" || vehicle.type === "tram" || vehicle.type === "trolleybus",
        )
        .map((vehicle) => ({
          id: vehicle.id,
          type: vehicle.type,
          route: vehicle.route,
          destination: vehicle.destination,
          lat: vehicle.lat,
          lng: vehicle.lng,
          bearing: vehicle.bearing,
          plate: vehicle.plate,
          stopName: vehicle.nextStop ?? null,
          selected: vehicle.id === selectedVehicle?.id,
        })),
    );
    updateGeoJSONSource(
      map,
      "wayme-vehicles",
      vehicleFeatures(mapVehicles, selectedVehicle?.id),
    );
  }, [mapReady, selectedVehicle?.id, vehicles]);

  useEffect(() => {
    if (!mapReady) return;
    const layer = building3DLayerRef.current;
    if (!layer) return;
    const models = buildingModelPreview
      ? [
          ...buildingModels.filter(
            (model) => model.id !== buildingModelPreview.id,
          ),
          buildingModelPreview,
        ]
      : buildingModels;
    layer.setModels(models);
  }, [buildingModelPreview, buildingModels, mapReady]);
  useEffect(() => {
    const map = mapRef.current;
    stopsRef.current = stops;
    if (!map || !mapReady) return;
    updateGeoJSONSource(map, "wayme-stops", stopFeatures(stops));
  }, [mapReady, stops]);
  useEffect(() => {
    const map = mapRef.current;
    cityPlacesRef.current = cityPlaces;
    if (!map || !mapReady) return;
    const filtered =
      mapLayerCategories.size > 0
        ? mapCityPlaces.filter((p) => mapLayerCategories.has(p.category))
        : mapCityPlaces;
    updateGeoJSONSource(map, "wayme-city-places", cityPlaceFeatures(filtered, selectedPlace?.id));
  }, [mapCityPlaces, mapLayerCategories, mapReady, selectedPlace?.id]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !userLocation) return;
    updateGeoJSONSource(map, "wayme-location", {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: userLocation },
          properties: {},
        },
      ],
    });
  }, [mapReady, userLocation]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    updateGeoJSONSource(
      map,
      "wayme-shelters",
      shelterFeatures(shelters, nearestShelter?.id),
    );
    const visibility = airAlert.status === "active" ? "visible" : "none";
    map.setLayoutProperty("wayme-shelters-circles", "visibility", visibility);
    map.setLayoutProperty("wayme-shelters-labels", "visibility", visibility);
  }, [airAlert.status, mapReady, nearestShelter?.id, shelters]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    updateGeoJSONSource(map, "wayme-route", routeFeatures());
    if (!selectedVehicle?.tripId) return;
    let active = true;
    let stopAnimation = (): void => {};
    const load = async (): Promise<void> => {
      try {
        let coordinates: [number, number][];
        if (selectedVehicle.fixtureRouteId) {
          coordinates = createFixtureRoute({
            fixtureRouteId: selectedVehicle.fixtureRouteId,
          }).map(([lat, lng]) => [lng, lat]);
        } else {
          const response = await fetch(
            apiUrl(`/api/routes/${encodeURIComponent(selectedVehicle.tripId)}`),
          );
          if (!response.ok) {
            throw new Error(`Route API returned ${response.status}.`);
          }
          const payload = (await response.json()) as {
            data?: [number, number][];
          };
          if (
            !Array.isArray(payload.data) ||
            payload.data.length < 2 ||
            !payload.data.every(
              (point) =>
                Array.isArray(point) &&
                point.length >= 2 &&
                isNumber(point[0]) &&
                isNumber(point[1]),
            )
          ) {
            throw new Error("Route API returned invalid route coordinates.");
          }
          coordinates = payload.data.map(
            ([lat, lng]): [number, number] => [lng, lat],
          );
        }
        if (coordinates.length < 2) {
          throw new Error("Route shape contains fewer than two coordinates.");
        }
        if (!active || !mapRef.current) return;
        updateGeoJSONSource(map, "wayme-route", routeFeatures(coordinates));
        map.setPaintProperty(
          "wayme-route-line",
          "line-color",
          COLORS[selectedVehicle.type],
        );
        stopAnimation = animateRouteProgress(
          map,
          coordinates,
          COLORS[selectedVehicle.type],
        );
      } catch (error) {
        console.error("Route shape is unavailable", error);
      }
    };
    void load();
    return () => {
      active = false;
      stopAnimation();
    };
  }, [mapReady, selectedVehicle]);

  const focusVehicle = (vehicle: Vehicle): void => {
    const map = mapRef.current;
    setDetailReturnView(activeViewRef.current === "city" ? "city" : "map");
    setSelectedStop(null);
    setSelectedPlace(null);
    setSelectedVehicle(vehicle);
    setActiveView("map");
    setFollowVehicleId(vehicle.id);
    map?.flyTo({
      center: [vehicle.lng, vehicle.lat],
      zoom: Math.max(map.getZoom(), 17),
      duration: 900,
    });
  };

  const isFollowingSelectedVehicle =
    selectedVehicle !== null && followVehicleId === selectedVehicle.id;

  const zoomToVehicle = (vehicle: Vehicle, zoom: number): void => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      center: [vehicle.lng, vehicle.lat],
      zoom: Math.max(map.getZoom(), zoom),
      duration: 700,
    });
  };

  const toggleVehicleFollow = (): void => {
    if (!selectedVehicle) return;
    if (isFollowingSelectedVehicle) {
      setFollowVehicleId(null);
      return;
    }
    setFollowVehicleId(selectedVehicle.id);
    mapRef.current?.easeTo({
      center: [selectedVehicle.lng, selectedVehicle.lat],
      duration: 600,
    });
  };

  // Keep the open vehicle sheet in sync with live positions.
  useEffect(() => {
    setSelectedVehicle((current) =>
      current
        ? (vehicles.find((vehicle) => vehicle.id === current.id) ?? current)
        : current,
    );
  }, [vehicles]);

  useEffect(() => {
    if (!selectedVehicle) setFollowVehicleId(null);
  }, [selectedVehicle]);

  // Re-center on the followed vehicle whenever fresh positions arrive.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !followVehicleId) return;
    const vehicle = vehicles.find((candidate) => candidate.id === followVehicleId);
    if (!vehicle) return;
    map.easeTo({ center: [vehicle.lng, vehicle.lat], duration: 700 });
  }, [followVehicleId, mapReady, vehicles]);

  // A user drag means they want to look elsewhere, so stop following.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const stopFollowing = (): void => setFollowVehicleId(null);
    map.on("dragstart", stopFollowing);
    return () => {
      map.off("dragstart", stopFollowing);
    };
  }, [mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const interactiveLayers = [
      "wayme-vehicles-circles",
      "wayme-stops-icons",
      "wayme-stops-labels",
      "wayme-city-place-clusters",
      "wayme-city-place-cluster-count",
      "wayme-city-place-points",
      "wayme-city-place-labels",
    ];
    const findInteractiveFeature = (
      point: maplibregl.Point,
    ): maplibregl.MapGeoJSONFeature | undefined => {
      const exact = map.queryRenderedFeatures(point, {
        layers: interactiveLayers,
      });
      if (exact.length) return exact[0];
      const radius = 12;
      const nearby = map.queryRenderedFeatures(
        [
          [point.x - radius, point.y - radius],
          [point.x + radius, point.y + radius],
        ],
        { layers: interactiveLayers },
      );
      const distance = (feature: maplibregl.MapGeoJSONFeature): number => {
        if (feature.geometry.type !== "Point") return Infinity;
        const [lng, lat] = feature.geometry.coordinates;
        if (typeof lng !== "number" || typeof lat !== "number") return Infinity;
        const projected = map.project([lng, lat]);
        return Math.hypot(projected.x - point.x, projected.y - point.y);
      };
      return nearby.sort((left, right) => distance(left) - distance(right))[0];
    };
    const handleClick = (event: maplibregl.MapMouseEvent): void => {
      const feature = findInteractiveFeature(event.point);
      if (!feature) {
        const buildingFeature = map
          .queryRenderedFeatures(event.point)
          .find((candidate) => candidate.sourceLayer === "building");
        if (buildingFeature) {
          const place = cityBuildingFromMapFeature(buildingFeature);
          if (place) {
            setDetailReturnView(activeViewRef.current === "city" ? "city" : "map");
            setSelectedVehicle(null);
            setSelectedStop(null);
            setSelectedPlace(place);
            setActiveView("map");
          }
        }
        return;
      }
      if (feature?.properties) {
        if (
          feature.layer.id === "wayme-city-place-clusters" ||
          feature.layer.id === "wayme-city-place-cluster-count"
        ) {
          const source = map.getSource("wayme-city-places");
          if (!(source instanceof GeoJSONSource)) return;
          const clusterId = Number(feature.properties.cluster_id);
          void source
            .getClusterExpansionZoom(clusterId)
            .then((zoom) => {
              map.easeTo({
                center: (feature.geometry as Point).coordinates as [
                  number,
                  number,
                ],
                zoom,
                duration: 300,
              });
            })
            .catch((error: unknown) => {
              console.error("Could not expand the map place cluster.", error);
            });
          return;
        }
        if (
          feature.layer.id === "wayme-city-place-points" ||
          feature.layer.id === "wayme-city-place-labels"
        ) {
          const place = cityPlacesRef.current.find(
            (candidate) => candidate.id === feature.properties?.id,
          );
          if (!place) return;
          setDetailReturnView(activeViewRef.current === "city" ? "city" : "map");
          setSelectedVehicle(null);
          setSelectedStop(null);
          setSelectedPlace(place);
          setActiveView("map");
          map.flyTo({
            center: [place.lng, place.lat],
            zoom: Math.max(map.getZoom(), 16),
            duration: 450,
          });
          return;
        }
        const { id } = feature.properties;
        if (feature.layer.id.startsWith("wayme-vehicles")) {
          const vehicle = vehiclesRef.current.find(
            (candidate) => candidate.id === id,
          );
          if (!vehicle) return;
          focusVehicle(vehicle);
          return;
        }
        if (feature.layer.id.startsWith("wayme-stops")) {
          const stop = stopsRef.current.find(
            (candidate) => candidate.id === id,
          );
          if (!stop) return;
          setDetailReturnView(activeViewRef.current === "city" ? "city" : "map");
          setSelectedVehicle(null);
          setSelectedPlace(null);
          setSelectedStop(stop);
          setActiveView("map");
          return;
        }
      }
    };
    const handleMove = (event: maplibregl.MapMouseEvent): void => {
      const appFeature = findInteractiveFeature(event.point);
      map.getCanvas().style.cursor = appFeature ? "pointer" : "";
    };
    map.on("click", handleClick);
    map.on("mousemove", handleMove);
    return () => {
      map.off("click", handleClick);
      map.off("mousemove", handleMove);
    };
  }, [mapReady]);

  // Close map settings popover on outside click
  useEffect(() => {
    if (!mapSettingsOpen) return;
    const handleOutside = (event: MouseEvent): void => {
      if (
        mapSettingsRef.current &&
        !mapSettingsRef.current.contains(event.target as Node)
      ) {
        setMapSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [mapSettingsOpen]);

  const filtered = useMemo(
    () =>
      vehicles
        .filter((vehicle) =>
          `${vehicle.route} ${vehicle.destination} ${vehicle.plate}`
            .toLowerCase()
            .includes(deferredSearch.toLowerCase()),
        )
        .filter((vehicle) => vehicle.type === vehicleFilter)
        .slice(0, 24),
    [vehicles, deferredSearch, vehicleFilter],
  );
  const arrivals = useMemo(
    () =>
      selectedStop
        ? vehicles
            .filter((vehicle) => selectedStop.routes.includes(vehicle.route))
            .map((vehicle) => ({
              vehicle,
              minutes: minutesAway(vehicle, selectedStop),
            }))
            .sort((a, b) => a.minutes - b.minutes)
            .slice(0, 6)
        : [],
    [selectedStop, vehicles],
  );
  const closeInspector = (): void => {
    setSelectedVehicle(null);
    setSelectedStop(null);
    setSelectedPlace(null);
    setBuildingModelPreview(null);
  };
  const persistBuildingModel = async (
    model: BuildingModelData,
  ): Promise<void> => {
    await saveBuildingModel(model);
    setBuildingModels((current) => [
      ...current.filter((item) => item.id !== model.id),
      model,
    ]);
    setBuildingModelPreview(null);
  };
  const removeBuildingModel = async (id: string): Promise<void> => {
    await deleteBuildingModel(id);
    setBuildingModels((current) => current.filter((item) => item.id !== id));
    setBuildingModelPreview(null);
  };
  const returnFromInspector = (): void => {
    closeInspector();
    setTransitFlow(null);
    setActiveView(detailReturnView);
  };
  const inspectorOpen = Boolean(
    transitFlow || selectedVehicle || selectedStop || selectedPlace,
  );
  const isMobileLayout = useMediaQuery("(max-width: 800px)");
  const railRef = useRef<HTMLElement>(null);
  const [railHeight, setRailHeight] = useState(0);
  // Measured before paint so the sheet never flashes fully open on load.
  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    setRailHeight(rail.offsetHeight);
    const observer = new ResizeObserver(() => setRailHeight(rail.offsetHeight));
    observer.observe(rail);
    return () => observer.disconnect();
  }, []);
  const sheet = useBottomSheet({
    enabled: isMobileLayout && !inspectorOpen && activeView !== "admin",
    sheetHeight: railHeight,
  });
  const sheetHiddenPx = useTransform(sheet.hiddenHeight, (value) => `${value}px`);
  const flowStops = useMemo(() => {
    if (!transitFlow || transitFlow === "menu") return [];
    const candidate =
      selectedVehicle ??
      vehicles.find((vehicle) => vehicle.type === transitFlow);
    if (!candidate) return [];
    const lineStops = stops.filter((stop) =>
      stop.routes.includes(candidate.route),
    );
    return lineStops;
  }, [selectedVehicle, stops, transitFlow, vehicles]);
  const selectedStopDistance = useMemo(() => {
    if (!selectedStop || !userLocation) return null;
    return new maplibregl.LngLat(userLocation[0], userLocation[1]).distanceTo(
      new maplibregl.LngLat(selectedStop.lng, selectedStop.lat),
    );
  }, [selectedStop, userLocation]);
  const selectedRidership = selectedVehicle
    ? getRidershipEstimate(`${selectedVehicle.id}-${selectedVehicle.route}`)
    : null;
  const maxDailyPassengers = selectedRidership
    ? Math.max(...selectedRidership.daily.map((day) => day.passengers))
    : 1;
  const addWaypoint = (): void =>
    setWaypoints((current) =>
      current.length < 5 ? [...current, ""] : current,
    );
  const requestLocation = (): void => {
    if (!navigator.geolocation) {
      setLocationError("Цей браузер не підтримує визначення місцезнаходження.");
      return;
    }
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const map = mapRef.current;
        if (!map) return;
        const point: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        setUserLocation(point);
        map.flyTo({ center: point, zoom: 15, duration: 500 });
      },
      (error) => {
        setLocationError(
          error.code === 1
            ? "Дозвольте доступ до геолокації в налаштуваннях браузера."
            : "Не вдалося визначити місце. Спробуйте ще раз.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
    );
  };
  const finishOnboarding = (): void => {
    saveOnboardingValue(ONBOARDING_COMPLETE_KEY, "true");
    setShowOnboarding(false);
    setShowBenefits(readOnboardingValue(BENEFITS_DISMISSED_KEY) !== "true");
  };
  const startOnboardingTour = (profile: OnboardingProfile): void => {
    saveOnboardingValue(ONBOARDING_PROFILE_KEY, JSON.stringify(profile));
    setOnboardingPhase("tour");
    setOnboardingStep(0);
    setActiveView("city");
  };
  const goToOnboardingStep = (step: number): void => {
    if (step >= ONBOARDING_STEPS.length) {
      finishOnboarding();
      return;
    }
    const next = Math.max(0, step);
    setActiveView(ONBOARDING_STEPS[next].view);
    setOnboardingStep(next);
  };
  const dismissBenefits = (): void => {
    saveOnboardingValue(BENEFITS_DISMISSED_KEY, "true");
    setShowBenefits(false);
  };
  const requestNotificationPermission = (): void => {
    if (typeof Notification === "undefined") {
      setNotificationMessage("Цей браузер не підтримує системні сповіщення.");
      return;
    }
    if (Notification.permission === "granted") {
      setNotificationMessage(
        "Дозвіл надано. Сповіщення про повітряну тривогу вмикаються в Профілі після входу.",
      );
      return;
    }
    if (Notification.permission === "denied") {
      setNotificationMessage(
        "Доступ вимкнено в налаштуваннях браузера. Його можна змінити там.",
      );
      return;
    }
    void Notification.requestPermission()
      .then((permission) => {
        setNotificationMessage(
          permission === "granted"
            ? "Дозвіл надано. Сповіщення про повітряну тривогу вмикаються в Профілі після входу."
            : "Дозвіл не надано. Його можна змінити в налаштуваннях браузера.",
        );
      })
      .catch((error: unknown) => {
        console.error("Could not request notification permission.", error);
        setNotificationMessage("Не вдалося запросити дозвіл на сповіщення.");
      });
  };
  const resetMapOrientation = (): void => {
    mapRef.current?.easeTo({
      bearing: 0,
      roll: 0,
      duration: 250,
    });
  };
  /** Pans the view one step in a direction (up, down, left, right). */
  const panMap = (direction: "up" | "down" | "left" | "right"): void => {
    const step = 120;
    const offset: [number, number] =
      direction === "up" ? [0, step]
      : direction === "down" ? [0, -step]
      : direction === "left" ? [step, 0]
      : [-step, 0];
    mapRef.current?.panBy(offset, { duration: 250 });
  };
  const toggleMapMode = (): void => {
    const map = mapRef.current;
    const pitch = mapPitch >= 0.5 ? 0 : 60;
    setMapPitch(pitch);
    if (!map) return;
    map.easeTo({
      pitch,
      ...(pitch === 0 ? { bearing: 0 } : {}),
      duration: 400,
    });
  };
  const startOnboarding = (): void => {
    setOnboardingStep(0);
    setOnboardingPhase("welcome");
    setActiveView("city");
    setShowBenefits(false);
    setShowOnboarding(true);
  };
  const updateFixtureSettings = (un: FixtureSettings): void => {
    setFixtureSettings(un);
    saveFixtureSettings(un);
    persistAdminOverride("fixture-settings", un);
    if (!un.enabled && window.location.search.includes("dev-scenario=")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("dev-scenario");
      window.history.replaceState({}, "", url);
    }
  };
  const resetFixtureSettings = (): void => {
    updateFixtureSettings({ ...DEFAULT_FIXTURE_SETTINGS });
  };
  const clearAdminOverrides = (): void => {
    try {
      localStorage.removeItem(ADMIN_OVERRIDES_KEY);
    } catch (error) {
      console.error("Could not clear the local admin overrides.", error);
    }
    setAdminOverridesActive(false);
    setDataResetToken((token) => token + 1);
  };
  const clearDevState = (): void => {
    clearDevStorage();
    clearFixtureSettings();
    setFixtureSettings({ ...DEFAULT_FIXTURE_SETTINGS });
    setOnboardingPreviewOnReload(false);
    saveOnboardingValue(ONBOARDING_PREVIEW_KEY, "false");
    setAdminOverridesActive(false);
    setDataResetToken((token) => token + 1);
  };
  const spawnFixtureVehicles = (count: number): void => {
    const limits = getScenarioLimits(fixtureSettings.scenario);
    updateFixtureSettings({
      ...fixtureSettings,
      enabled: true,
      vehicleCount: Math.min(limits.maxVehicles, Math.max(1, count)),
    });
  };
  const adminDatasets: AdminDataset[] = [
    {
      id: "vehicles",
      label: "Транспорт",
      description: "Борти та маршрути. Зміни залишаються в цьому браузері.",
      data: vehicles,
    },
    {
      id: "stops",
      label: "Зупинки",
      description: "Зупинки та маршрути громадського транспорту.",
      data: stops,
    },
    {
      id: "shelters",
      label: "Укриття",
      description: "Публічні координати й атрибути укриттів.",
      data: shelters,
    },
    {
      id: "places",
      label: "Місця",
      description: "POI, доступні в поточній області карти.",
      data: cityPlaces,
    },
    {
      id: "events",
      label: "Події",
      description: "Події та локації міської афіші.",
      data: eventData,
    },
    {
      id: "air-alert",
      label: "Повітряна тривога",
      description: "Статус індикатора повітряної тривоги.",
      data: airAlert,
    },
    {
      id: "fixture-settings",
      label: "Сценарій",
      description: "Налаштування локальних транспортних сценаріїв.",
      data: fixtureSettings,
    },
  ];
  const devDatasetSummary = adminDatasets.map((dataset) => ({
    id: dataset.id,
    label: dataset.label,
    value: Array.isArray(dataset.data)
      ? String(dataset.data.length)
      : typeof dataset.data === "object" && dataset.data !== null
        ? "об'єкт"
        : "—",
  }));
  const devRuntime = {
    mapReady,
    activeView,
    transitDataStatus,
    cityPlacesStatus,
    shelterLoadState,
    cityPlacesCount: cityPlaces.length,
    stopsCount: stops.length,
    vehiclesCount: vehicles.length,
    sheltersCount: shelters.length,
    online: browserOnline,
    fps: 0,
  };
  const saveAdminDataset = (id: string, value: unknown): string | null => {
    const saveOverride = (key: AdminDatasetId): string | null => {
      const error = persistAdminOverride(key, value);
      if (!error) setAdminOverridesActive(true);
      return error;
    };
    switch (id) {
      case "vehicles":
        if (!isArrayOf(isVehicle)(value)) {
          return "Транспорт має бути масивом з коректними полями Vehicle.";
        }
        if (saveOverride("vehicles")) return "Не вдалося зберегти локальні зміни.";
        setVehicles(value);
        return null;
      case "stops":
        if (!isArrayOf(isStop)(value)) {
          return "Зупинки мають містити id, назву, координати й маршрути.";
        }
        if (saveOverride("stops")) return "Не вдалося зберегти локальні зміни.";
        setStops(value);
        return null;
      case "shelters":
        if (!isArrayOf(isShelter)(value)) {
          return "Укриття мають бути масивом з коректними полями.";
        }
        if (saveOverride("shelters")) return "Не вдалося зберегти локальні зміни.";
        setShelters(value);
        setShelterLoadState("ready");
        return null;
      case "places":
        if (!isArrayOf(isCityPlace)(value)) {
          return "Місця мають містити коректну категорію та координати.";
        }
        if (saveOverride("places")) return "Не вдалося зберегти локальні зміни.";
        cityPlacesRef.current = value;
        setCityPlaces(value);
        return null;
      case "events":
        if (!isArrayOf(isCityEvent)(value)) {
          return "Події мають містити назву, час, місце та координати.";
        }
        if (saveOverride("events")) return "Не вдалося зберегти локальні зміни.";
        setEventData(value);
        return null;
      case "air-alert":
        if (!isAirAlert(value)) {
          return "Статус тривоги має бути коректним об’єктом AirAlert.";
        }
        if (saveOverride("air-alert")) return "Не вдалося зберегти локальні зміни.";
        setAirAlert(value);
        return null;
      case "fixture-settings":
        if (!isFixtureSettings(value)) {
          return "Налаштування сценарію мають некоректний формат.";
        }
        if (saveOverride("fixture-settings")) {
          return "Не вдалося зберегти локальні зміни.";
        }
        setFixtureSettings(value);
        saveFixtureSettings(value);
        return null;
      default:
        return "Невідомий набір даних.";
    }
  };
  const showCityPlace = (
    coordinates: [number, number],
    placeName: string,
  ): void => {
    const map = mapRef.current;
    if (!map) return;
    const place = cityPlaces.find(
      (candidate) =>
        candidate.name === placeName ||
        (Math.abs(candidate.lng - coordinates[0]) < 0.0001 &&
          Math.abs(candidate.lat - coordinates[1]) < 0.0001),
    );
    const markerElement = document.createElement("span");
    markerElement.className = "city-map-pin";
    markerElement.style.setProperty(
      "--pin-color",
      CITY_PLACE_CATEGORY_COLORS[place?.category ?? "other"],
    );
    markerElement.setAttribute("role", "img");
    markerElement.setAttribute("aria-label", placeName);
    const markerIcon = document.createElement("span");
    markerIcon.className = "material-symbols-rounded";
    markerIcon.textContent = "place";
    markerElement.append(markerIcon);
    cityMarkerRef.current?.remove();
    cityMarkerRef.current = new maplibregl.Marker({
      element: markerElement,
      anchor: "bottom",
    })
      .setLngLat(coordinates)
      .addTo(map);
    setDetailReturnView(activeView === "city" ? "city" : "map");
    setTransitFlow(null);
    setSelectedStop(null);
    setSelectedVehicle(null);
    setSelectedPlace(place ?? null);
    setActiveView("map");
    map.flyTo({ center: coordinates, zoom: 16, duration: 650 });
  };
  // "Маршрут" from any detail page: pin the destination and open the planner with it.
  const openDirections = (coordinates: [number, number], placeName: string): void => {
    showCityPlace(coordinates, placeName);
    setSelectedPlace(null);
    setCityPageOpen(false);
    setWaypoints((current) => [current[0] || "Моє місцезнаходження", placeName]);
    // Lower the mobile sheet so the pinned destination is visible above it.
    if (isMobileLayout) sheet.setDetent("half");
  };
  const showTransitVehicle = (vehicleId: string): void => {
    // Special signal from the Nearby tab when user hasn't granted location yet
    if (vehicleId === "__locate__") {
      requestLocation();
      return;
    }
    const vehicle = vehicles.find((candidate) => candidate.id === vehicleId);
    if (!vehicle) {
      console.error(`Could not find transit vehicle ${vehicleId}.`);
      return;
    }
    setDetailReturnView("city");
    setTransitFlow(null);
    setSelectedStop(null);
    setSelectedPlace(null);
    setSelectedVehicle(vehicle);
    setActiveView("map");
    mapRef.current?.flyTo({
      center: [vehicle.lng, vehicle.lat],
      zoom: 15,
      duration: 450,
    });
  };
  const selectInterestedCity = (city: string): void => {
    setInterestedCities((prev) => {
      const next = new Set(prev);
      if (next.has(city)) {
        next.delete(city);
      } else {
        next.add(city);
      }
      return next;
    });
    setCityUpdateStatus("");
  };
  const submitCityUpdate = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    if (!CITY_UPDATES_ENDPOINT) {
      setCityUpdateStatus(
        "Підписка ще не підключена. Адресу не збережено — спробуйте пізніше.",
      );
      return;
    }
    setCityUpdateSubmitting(true);
    try {
      const citiesArray = Array.from(interestedCities);
      const response = await fetch(CITY_UPDATES_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cityUpdateEmail.trim(),
          cities: citiesArray,
        }),
      });
      if (!response.ok) {
        throw new Error(`Email signup failed with status ${response.status}.`);
      }
      setCityUpdateEmail("");
      setCityUpdateStatus(
        `Дякуємо! Напишемо, коли un з’явиться у ${citiesArray.length} ${citiesArray.length === 1 ? "місті" : "містах"}.`,
      );
    } catch (error) {
      console.error("Could not submit the city launch email signup.", error);
      setCityUpdateStatus(
        "Не вдалося надіслати адресу. Перевірте з’єднання та спробуйте ще раз.",
      );
    } finally {
      setCityUpdateSubmitting(false);
    }
  };
  const sheetEnabled = isMobileLayout && !inspectorOpen && activeView !== "admin";
  // City and profile. Mobile floats these pills over the map;
  // desktop keeps them in the rail header (DESIGN.md §5).
  const cityHeaderControls = (
    <>
      <BrandLogo className="brand-logo" />
      <button
        type="button"
        className="city-picker"
        aria-label="Місто: Львів. Обрати місто"
        aria-haspopup="dialog"
        aria-expanded={cityLaunchModalOpen}
        onClick={() => {
          setCityUpdateStatus("");
          setCityLaunchModalOpen(true);
        }}
      >
        <span className="city-picker-name">Львів</span>
        <span className="city-picker-beta">Beta</span>
        <MaterialIcon name="expand_more" size={16} />
      </button>
      <span className="brand-header-spacer" aria-hidden="true" />
      <IconButton
        label="Профіль і налаштування"
        tooltipSide="bottom"
        className="brand-header-action"
        aria-haspopup="dialog"
        aria-expanded={settingsOpen}
        onClick={() => setSettingsOpen(true)}
      >
        <MaterialIcon name="account_circle" size={22} />
      </IconButton>
    </>
  );
  return (
    <MotionConfig reducedMotion="user">
    <TooltipProvider delayDuration={300}>
    <main className="un-shell">
      <div ref={mapNode} className="map-canvas" />
      {sheetEnabled && !(activeView === "city" && cityPageOpen) && (
        <header className="brand-header brand-header-floating">{cityHeaderControls}</header>
      )}
      <motion.aside
        ref={railRef}
        className={`brand-rail${activeView === "city" || inspectorOpen ? " city-mode" : ""}${inspectorOpen ? " inspector-open" : ""}${sheetEnabled ? " is-sheet" : ""}${sheetEnabled && sheet.detent === "full" ? " is-full" : ""}`}
        style={sheetEnabled ? { y: sheet.y, "--sheet-hidden": sheetHiddenPx } as unknown as MotionStyle : undefined}
      >
        {sheetEnabled && (
          <button
            type="button"
            className="sheet-handle"
            aria-label={sheet.detent === "full" ? "Згорнути панель" : "Розгорнути панель"}
            aria-expanded={sheet.detent === "full"}
            {...sheet.handleProps}
            onClick={(event) => {
              // Pointer taps are handled in onPointerUp; this is the keyboard path.
              if (event.detail === 0) sheet.setDetent(sheet.detent === "full" ? "half" : "full");
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowUp") {
                event.preventDefault();
                sheet.setDetent(sheet.detent === "peek" ? "half" : "full");
              } else if (event.key === "ArrowDown") {
                event.preventDefault();
                sheet.setDetent(sheet.detent === "full" ? "half" : "peek");
              }
            }}
          >
            <span aria-hidden="true" />
          </button>
        )}
        {activeView === "city" && cityPageOpen && !inspectorOpen ? (
          <header className="brand-header page-back-header">
            <Button
              type="button"
              variant="ghost"
              className="page-back-button"
              aria-label="Назад до списку"
              onClick={() => cityPageBackRef.current()}
            >
              <MaterialIcon name="arrow_back" size={20} />
              Назад
            </Button>
          </header>
        ) : !inspectorOpen && !sheetEnabled ? (
            <header className="brand-header">{cityHeaderControls}</header>
        ) : null}
        <div
          className="city-guide-frame"
          hidden={activeView !== "city" || inspectorOpen}
        >
          <CityGuide
            userLocation={userLocation}
            locationError={locationError}
            onShowOnMap={showCityPlace}
            onDirections={openDirections}
            onSelectTransportVehicle={showTransitVehicle}
            onPageNavigationChange={(isSubpage, onBack) => {
              setCityPageOpen(isSubpage);
              cityPageBackRef.current = onBack;
            }}
            places={cityPlaces}
            placesStatus={cityPlacesStatus}
            placesError={cityPlacesError}
            onRetryPlaces={refreshCityPlaces}
            onPlacesChange={setMapCityPlaces}
            cityEvents={eventData}
            transportVehicles={vehicles}
            transitDataStatus={transitDataStatus}
            transportIsSimulated={
              developmentToolsAvailable && fixtureSettings.enabled
            }
            onUseLiveTransit={() =>
              updateFixtureSettings({ ...fixtureSettings, enabled: false })
            }
            searchQuery={deferredSearch}
          />
        </div>
        {activeView === "admin" && developmentToolsAvailable && (
          <AdminPanel
            datasets={adminDatasets}
            onSave={saveAdminDataset}
            onClose={() => setActiveView("city")}
          />
        )}
        {activeView === "map" && !inspectorOpen && (
          <>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="return-city-button"
          onClick={() => {
            setCityPageOpen(false);
            setActiveView("city");
          }}
        >
          <MaterialIcon name="arrow_back" size={18} />
          Назад
        </Button>
        <Card className="journey-card">
          {waypoints.map((point, index) => (
            <label className="waypoint" key={index}>
              <span className={index === 0 ? "point-origin" : "point-stop"}>
                {index + 1}
              </span>
              <Input
                aria-label={index === 0 ? "Початкова точка" : `Точка ${index + 1}`}
                className="waypoint-input"
                value={point}
                placeholder={index === 0 ? "Звідки?" : "Додайте точку"}
                onChange={(event) =>
                  setWaypoints((current) =>
                    current.map((value, i) =>
                      i === index ? event.target.value : value,
                    ),
                  )
                }
              />
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="dismiss"
                  aria-label="Прибрати точку"
                  onClick={() =>
                    setWaypoints((current) =>
                      current.filter((_, i) => i !== index),
                    )
                  }
                >
                  <X size={14} />
                </Button>
              )}
            </label>
          ))}
          {waypoints.length < 5 &&
            waypoints.some((point, index) => index > 0 && point.trim()) && (
            <Button type="button" variant="ghost" size="sm" className="add-waypoint" onClick={addWaypoint}>
              <Plus size={13} /> Додати точку
            </Button>
          )}
          <Button
            type="button"
            variant="default"
            className="primary-action"
            onClick={() => setTransitFlow("menu")}
          >
            <Navigation size={14} />
            Побудувати маршрут
          </Button>
        </Card>
        <label className="search-field">
          <Search size={16} />
          <Input
            aria-label="Пошук маршруту або транспорту"
            className="search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Маршрут, місце або борт"
          />
          <span className="search-count" aria-label={`Знайдено: ${filtered.length}`}>{filtered.length}</span>
        </label>
        <div className="transport-category-row" role="group" aria-label="Тип транспорту">
          {([
            { id: "bus", label: "Автобуси", icon: "directions_bus" },
            { id: "tram", label: "Трамваї", icon: "tram" },
            { id: "trolleybus", label: "Тролейбуси", icon: "electric_bolt" },
            { id: "taxi", label: "Таксі", icon: "local_taxi" },
          ] as const).map((filter) => (
            <Toggle variant="pill"
              key={filter.id}
             
             
              className="transport-category"
              style={
                {
                  "--transport-color": COLORS[filter.id],
                } as React.CSSProperties
              }
              onClick={() => {
                setVehicleFilter(filter.id);
                localStorage.setItem("eway-last-vehicle-filter", filter.id);
              }} pressed={vehicleFilter === filter.id}><MaterialIcon name={filter.icon} size={18} filled={vehicleFilter === filter.id} />
              {filter.label}
            </Toggle>
          ))}
        </div>
        <div className="routes-heading">
          <span>Поруч на мапі</span>
          <small>{filtered.length} одиниць</small>
        </div>
        <div className="route-list">
            {filtered.map((vehicle) => (
              <Button
                type="button"
                variant="ghost"
                key={vehicle.id}
                className="route-row"
                onClick={() => {
                  setDetailReturnView("map");
                  setTransitFlow(null);
                  setSelectedStop(null);
                  setSelectedPlace(null);
                  setSelectedVehicle(vehicle);
                  mapRef.current?.flyTo({
                    center: [vehicle.lng, vehicle.lat],
                    zoom: 15,
                  });
                }}
              >
                <span
                  className="route-number"
                  style={
                    {
                      "--route-color": vehicleFleetColor(vehicle.type),
                    } as React.CSSProperties
                  }
                >
                  {vehicle.route}
                </span>
                <span className="route-copy">
                  <strong>{vehicle.destination || label(vehicle.type)}</strong>
                  <small>Борт {vehicle.plate}</small>
                </span>
                <ChevronRight size={16} />
              </Button>
            ))
          }
          {filtered.length === 0 && (
            <div className="empty-state">
              {transitDataStatus === "loading" ? (
                <>
                  <strong>Завантажуємо транспорт…</strong>
                  <span>Зачекайте, поки оновляться дані з мапи.</span>
                </>
              ) : transitDataStatus === "error" ? (
                <>
                  <strong>Не вдалося завантажити транспорт</strong>
                  <span>
                    Перевірте з’єднання. У розробці запустіть `npm run server`
                    окремо від `npm run dev`.
                  </span>
                </>
              ) : (
                <>
                  <strong>Нічого не знайдено</strong>
                  <span>Змініть пошук або фільтр транспорту.</span>
                </>
              )}
            </div>
          )}
        </div>
          </>
        )}
        {transitFlow && (
          <section className="inspector transit-flow">
            <SidebarStepHeader
              title={
                transitFlow === "menu"
                  ? "Маршрути"
                  : `${label(transitFlow)} · зупинки`
              }
              onBack={() => setTransitFlow(null)}
            />
            <header className="inspector-header">
              <div>
                <span className="eyebrow">un · транспорт</span>
                <h2>
                  {transitFlow === "menu"
                    ? "Оберіть транспорт"
                    : `${label(transitFlow)} · зупинки`}
                </h2>
                <p>
                  {transitFlow === "menu"
                    ? "Показуємо тільки доступні у Львові типи."
                    : "Жива лінія та ключові зупинки."}
                </p>
              </div>
            </header>
            {transitFlow === "menu" ? (
              <div className="arrival-list">
                {(["bus", "trolleybus", "tram"] as VehicleType[]).map((type) => (
                  <Button
                    type="button"
                    variant="ghost"
                    className="arrival"
                    key={type}
                    onClick={() => setTransitFlow(type)}
                  >
                    <span
                      className="route-number"
                      style={
                        { "--route-color": COLORS[type] } as React.CSSProperties
                      }
                    >
                      <Bus size={15} />
                    </span>
                    <div>
                      <strong>{label(type)}</strong>
                      <small>
                        {
                          vehicles.filter((vehicle) => vehicle.type === type)
                            .length
                        }{" "}
                        {developmentToolsAvailable && fixtureSettings.enabled
                          ? "тестових одиниць"
                          : "GPS-наживо"}
                      </small>
                    </div>
                    <ChevronRight size={17} />
                  </Button>
                ))}
              </div>
            ) : (
              <>
                <div className="trip-line">
                  <span className="trip-dot" />
                  <div>
                    <small>Ключові зупинки маршруту</small>
                    <strong>
                      {selectedVehicle?.route ?? "Оберіть транспорт на мапі"}
                    </strong>
                    <p>Повний список оновлюється з розкладу.</p>
                  </div>
                </div>
                <div className="arrival-list">
                  {flowStops.map((stop, index) => (
                    <details className="route-stop-card" key={stop.id}>
                      <summary className="route-stop-summary">
                        <span className="route-stop-index">{index + 1}</span>
                        <span className="route-stop-copy">
                          <strong>{stop.name}</strong>
                          <small>
                            {index === 0
                              ? "Початок маршруту"
                              : index === flowStops.length - 1
                                ? "Кінцева зупинка"
                                : userLocation
                                  ? `Від вас · ${formatDistance(
                                      new maplibregl.LngLat(
                                        userLocation[0],
                                        userLocation[1],
                                      ).distanceTo(
                                        new maplibregl.LngLat(stop.lng, stop.lat),
                                      ),
                                    )}`
                                  : stop.routes.slice(0, 4).join(" · ")}
                          </small>
                        </span>
                        {(index === 0 || index === flowStops.length - 1) && (
                          <span className="route-endpoint-badge">
                            {index === 0 ? "Старт" : "Фініш"}
                          </span>
                        )}
                        <MaterialIcon
                          className="route-stop-chevron"
                          name="expand_more"
                          size={20}
                        />
                      </summary>
                      <div className="route-stop-expanded">
                        <div className="route-stop-routes">
                          {stop.routes.map((route) => (
                            <span key={route}>{route}</span>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="route-stop-open"
                          onClick={() => {
                            setDetailReturnView("map");
                            setSelectedVehicle(null);
                            setSelectedPlace(null);
                            setSelectedStop(stop);
                            setTransitFlow(null);
                            mapRef.current?.flyTo({
                              center: [stop.lng, stop.lat],
                              zoom: 16,
                            });
                          }}
                        >
                          <MapPin size={16} />
                          Відкрити зупинку
                        </Button>
                      </div>
                    </details>
                  ))}
                </div>
              </>
            )}
          </section>
        )}
        {selectedVehicle && (
          <section className="inspector detail-sheet">
            <SheetNavBar title="Транспорт на мапі" onBack={returnFromInspector} />
            <DetailHero
              badge={
                <span
                  className="route-number big"
                  style={
                    {
                      "--route-color": vehicleFleetColor(selectedVehicle.type),
                    } as React.CSSProperties
                  }
                >
                  {selectedVehicle.route || "—"}
                </span>
              }
              eyebrow={`${selectedVehicle.dataSource === "test" ? "Тестовий сценарій" : "GPS наживо"} · ${label(selectedVehicle.type)}`}
              title={selectedVehicle.plate}
              subtitle={selectedVehicle.destination || "Напрямок уточнюється"}
              chips={
                <>
                  <DetailChip icon="sensors" tone="live">На лінії</DetailChip>
                  {selectedVehicle.lowFloor && (
                    <DetailChip icon="accessible">Низька підлога</DetailChip>
                  )}
                </>
              }
            />
            <ActionBar>
              <ActionBarButton
                icon={isFollowingSelectedVehicle ? "gps_fixed" : "gps_not_fixed"}
                label={isFollowingSelectedVehicle ? "Стежимо" : "Стежити"}
                pressed={isFollowingSelectedVehicle}
                onClick={toggleVehicleFollow}
              />
              <ActionBarButton
                icon="zoom_in"
                label="Ближче"
                onClick={() => zoomToVehicle(selectedVehicle, 18)}
              />
            </ActionBar>
            <DetailSection title="Стан рейсу">
              <StatGrid
                items={[
                  { label: "Швидкість", value: `${Math.round(selectedVehicle.speed)} км/год` },
                  { label: "Курс", value: `${selectedVehicle.bearing}°` },
                  { label: "Статус", value: "На лінії" },
                ]}
              />
              <p className="detail-note">
                {selectedVehicle.mapMatched
                  ? selectedVehicle.dataSource === "test"
                    ? "Тестову позицію розміщено на маршруті."
                    : "GPS прив’язано до маршруту."
                  : "Показано актуальну GPS-позицію."}
              </p>
            </DetailSection>
            <DetailSection title="Транспорт">
              <div className="vehicle-model-card">
                {(selectedVehicle.type === "bus" || selectedVehicle.type === "tram" || selectedVehicle.type === "trolleybus") && (
                  <TransitVehicleArtwork
                    id={selectedVehicle.plate}
                    route={selectedVehicle.route}
                    type={selectedVehicle.type}
                  />
                )}
                <div>
                  <strong>{vehicleModelDescription(selectedVehicle.type)}</strong>
                  <span>Точну марку та модель GPS-дані не передають</span>
                </div>
              </div>
            </DetailSection>
            {selectedRidership && (
              <DetailSection className="ridership-section" title="Пасажиропотік">
                <section className="ridership-card" aria-labelledby="ridership-title">
                  <div className="ridership-heading">
                    <div>
                      <span className="eyebrow">ПАСАЖИРОПОТІК</span>
                      <h3 id="ridership-title">Завантаженість</h3>
                    </div>
                    <MaterialIcon name="groups" size={20} />
                  </div>
                  <div className="ridership-current">
                    <div>
                      <span>Зараз у салоні</span>
                      <strong>~{selectedRidership.current}</strong>
                      <small>орієнтовно</small>
                    </div>
                    <span className="ridership-current-note">
                      <MaterialIcon name="info" size={15} />
                      Оцінка, не лічильник GPS
                    </span>
                  </div>
                  <div className="ridership-chart-heading">
                    <strong>Пасажирів за день</strong>
                    <span>оцінка</span>
                  </div>
                  <div
                    className="ridership-chart"
                    role="img"
                    aria-label={`Демонстраційна оцінка пасажиропотоку за днями: ${selectedRidership.daily
                      .map(({ day, passengers }) => `${day}: близько ${passengers}`)
                      .join(", ")}`}
                  >
                    {selectedRidership.daily.map(({ day, passengers }) => (
                      <div className="ridership-day" key={day}>
                        <span className="ridership-bar-track">
                          <span
                            className="ridership-bar"
                            style={{
                              height: `${(passengers / maxDailyPassengers) * 100}%`,
                            }}
                            title={`${day}: ~${passengers} пасажирів`}
                          />
                        </span>
                        <span>{day}</span>
                      </div>
                    ))}
                  </div>
                  <p className="ridership-disclaimer">
                    Демонстраційна модель попиту. Реальні GPS-дані не містять кількості пасажирів.
                  </p>
                </section>
              </DetailSection>
            )}
          </section>
        )}
        {selectedStop && (
          <section className="inspector stop-inspector">
            <SidebarStepHeader
              title="Транспорт на мапі"
              onBack={returnFromInspector}
            />
            <header className="inspector-header">
              <div>
                <span className="eyebrow">ЗУПИНКА · МІСЬКИЙ ТРАНСПОРТ</span>
                <h2>{selectedStop.name}</h2>
                <p>
                  {selectedStop.routes.length}{" "}
                  {selectedStop.routes.length === 1
                    ? "маршрут"
                    : "маршрутів"}{" "}
                  проходить тут
                </p>
              </div>
            </header>
            {selectedStopDistance !== null && (
              <div className="stop-distance-card">
                <span className="stop-distance-icon">
                  <MaterialIcon name="near_me" size={19} />
                </span>
                <span>
                  <small>Від вашого місця</small>
                  <strong>{formatDistance(selectedStopDistance)}</strong>
                </span>
                <span className="stop-distance-caption">до зупинки</span>
              </div>
            )}
            <div className="stop-tabs" role="tablist" aria-label="Інформація про зупинку">
              {([
                { id: "overview", label: "Огляд", icon: "info" },
                { id: "schedule", label: "Розклад", icon: "schedule" },
                { id: "facilities", label: "Зручності", icon: "accessible" },
                { id: "contacts", label: "Контакти", icon: "call" },
                { id: "reviews", label: "Відгуки", icon: "star" },
              ] as const).map((tab) => (
                <button
                  type="button"
                  role="tab"
                  id={`stop-tab-${tab.id}`}
                  aria-controls={`stop-panel-${tab.id}`}
                  aria-selected={selectedStopTab === tab.id}
                  tabIndex={selectedStopTab === tab.id ? 0 : -1}
                  className={`stop-tab${selectedStopTab === tab.id ? " active" : ""}`}
                  key={tab.id}
                  data-filter={tab.id}
                  onClick={() => setSelectedStopTab(tab.id)}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                      return;
                    }
                    event.preventDefault();
                    const tabs = Array.from(
                      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                        '[role="tab"]',
                      ) ?? [],
                    );
                    const currentIndex = tabs.indexOf(event.currentTarget);
                    const nextIndex =
                      (currentIndex +
                        (event.key === "ArrowRight" ? 1 : -1) +
                        tabs.length) %
                      tabs.length;
                    tabs[nextIndex]?.focus();
                    tabs[nextIndex]?.click();
                  }}
                >
                  <span className="stop-tab-orb">
                    <MaterialIcon name={tab.icon} size={34} />
                  </span>
                  <span className="stop-tab-label">{tab.label}</span>
                </button>
              ))}
            </div>
            <section
              className="stop-tab-panel"
              role="tabpanel"
              id={`stop-panel-${selectedStopTab}`}
              aria-labelledby={`stop-tab-${selectedStopTab}`}
              tabIndex={0}
            >
              {selectedStopTab === "overview" && (
                <>
                  {terrainEnabled ? (
                    <div className="stop-elevation-card">
                      <MaterialIcon name="landscape" size={20} />
                      <span>
                        <small>ВИСОТА НАД РІВНЕМ МОРЯ</small>
                        <strong>
                          {stopElevationStatus === "ready" &&
                          selectedStopElevation !== null
                            ? `≈ ${Math.round(selectedStopElevation / 10) * 10} м`
                            : stopElevationStatus === "loading"
                              ? "Завантажуємо висоту…"
                              : stopElevationStatus === "unavailable"
                                ? "Висота зараз недоступна"
                                : "Очікуємо дані рельєфу"}
                        </strong>
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="stop-elevation-enable"
                      onClick={() => setTerrainEnabled(true)}
                    >
                      <MaterialIcon name="landscape" size={18} />
                      Показати рельєф і висоту
                      <ChevronRight size={17} />
                    </button>
                  )}
                  <div className="stop-routes-summary">
                    <strong>Маршрути тут</strong>
                    <div className="stop-route-chips">
                      {selectedStop.routes.map((route) => (
                        <span key={route}>{route}</span>
                      ))}
                    </div>
                  </div>
                  <div className="stop-section-heading">
                    <span>Транспорт поруч</span>
                    <small>Оцінка за GPS</small>
                  </div>
                  <div className="arrival-list stop-arrivals">
                    {arrivals.length ? (
                      arrivals.map(({ vehicle, minutes }) => (
                        <Button
                          type="button"
                          variant="ghost"
                          className="arrival"
                          key={vehicle.id}
                          onClick={() => {
                            setDetailReturnView("map");
                            setSelectedStop(null);
                            setSelectedVehicle(vehicle);
                          }}
                        >
                          <span
                            className="route-number"
                            style={
                              {
                                "--route-color": vehicleFleetColor(vehicle.type),
                              } as React.CSSProperties
                            }
                          >
                            {vehicle.route}
                          </span>
                          <span className="stop-arrival-copy">
                            <strong>
                              {vehicle.destination || label(vehicle.type)}
                            </strong>
                            <small>Борт {vehicle.plate}</small>
                          </span>
                          <b>
                            {minutes}
                            <small> хв</small>
                          </b>
                        </Button>
                      ))
                    ) : (
                      <div className="stop-empty-state">
                        Наразі немає транспорту з GPS поруч.
                      </div>
                    )}
                  </div>
                </>
              )}
              {selectedStopTab === "schedule" && (
                <div className="stop-tab-content">
                  <div className="stop-section-heading">
                    <span>Відправлення</span>
                    <small>
                      {selectedStop.timetable?.length
                        ? "Розклад"
                        : "Оцінка GPS"}
                    </small>
                  </div>
                  {selectedStop.timetable?.length ? (
                    <div className="stop-timetable">
                      {selectedStop.timetable.map((entry, index) => (
                        <div key={`${entry.route}-${entry.departure}-${index}`}>
                          <span className="stop-route-chip">{entry.route}</span>
                          <strong>{entry.departure}</strong>
                        </div>
                      ))}
                    </div>
                  ) : arrivals.length ? (
                    <>
                      {arrivals.map(({ vehicle, minutes }) => (
                        <div className="stop-schedule-row" key={vehicle.id}>
                          <span className="stop-route-chip">{vehicle.route}</span>
                          <span>{vehicle.destination || label(vehicle.type)}</span>
                          <strong>~{minutes} хв</strong>
                        </div>
                      ))}
                      <p className="stop-data-note">
                        Орієнтовний час за відстанню та GPS, не офіційний розклад.
                      </p>
                    </>
                  ) : (
                    <div className="stop-empty-state">
                      Розклад і GPS-прибуття для цієї зупинки зараз недоступні.
                    </div>
                  )}
                </div>
              )}
              {selectedStopTab === "facilities" && (
                <div className="stop-tab-content">
                  <div className="stop-section-heading">
                    <span>Зручності на зупинці</span>
                  </div>
                  {selectedStop.facilities?.length ? (
                    <div className="stop-facilities">
                      {selectedStop.facilities.map((facility) => (
                        <span key={facility}>
                          <MaterialIcon name="check_circle" size={17} />
                          {facility}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="stop-empty-state">
                      Про павільйон, доступність чи інші зручності даних немає.
                    </div>
                  )}
                </div>
              )}
              {selectedStopTab === "contacts" && (
                <div className="stop-tab-content">
                  <div className="stop-section-heading">
                    <span>Контактна інформація</span>
                  </div>
                  {selectedStop.address && (
                    <div className="stop-contact-row">
                      <MaterialIcon name="location_on" size={18} />
                      <span>{selectedStop.address}</span>
                    </div>
                  )}
                  {selectedStop.phone && (
                    <a
                      className="stop-contact-row"
                      href={`tel:${selectedStop.phone.replace(/[^\d+]/g, "")}`}
                    >
                      <MaterialIcon name="call" size={18} />
                      <span>{selectedStop.phone}</span>
                    </a>
                  )}
                  {safeStopWebsite(selectedStop.website) && (
                    <a
                      className="stop-contact-row"
                      href={safeStopWebsite(selectedStop.website) ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MaterialIcon name="language" size={18} />
                      <span>Вебсайт перевізника</span>
                      <MaterialIcon name="open_in_new" size={16} />
                    </a>
                  )}
                  {!selectedStop.address &&
                    !selectedStop.phone &&
                    !selectedStop.website && (
                      <div className="stop-empty-state">
                        Контакти не передаються у поточному наборі даних зупинок.
                      </div>
                    )}
                </div>
              )}
              {selectedStopTab === "reviews" && (
                <div className="stop-tab-content">
                  <div className="stop-section-heading">
                    <span>Оцінка пасажирів</span>
                  </div>
                  {selectedStop.rating !== undefined ? (
                    <div className="stop-rating">
                      <MaterialIcon name="star" size={24} />
                      <strong>{selectedStop.rating.toFixed(1)}</strong>
                      <span>
                        {selectedStop.reviewCount ?? 0} відгуків
                      </span>
                    </div>
                  ) : (
                    <div className="stop-empty-state">
                      Рейтинг і відгуки для зупинок ще не надходять із міського
                      джерела даних.
                    </div>
                  )}
                </div>
              )}
            </section>
          </section>
        )}
        {selectedPlace && (
          <section className="inspector place-inspector">
            <SidebarStepHeader
              title="Місця"
              onBack={returnFromInspector}
            />
            <div className="place-inspector-body">
              <EntityDetail
                kind={selectedPlace.category}
                title={selectedPlace.name}
                eyebrow={selectedPlace.categoryLabel}
                subtitle={selectedPlace.address}
                icon={cityPlaceIcons[selectedPlace.category]}
                iconColor={CITY_PLACE_CATEGORY_COLORS[selectedPlace.category]}
                place={selectedPlace}
                info={placeInfoRows(selectedPlace)}
                phone={selectedPlace.details["Телефон"]}
                website={selectedPlace.details["Сайт"]}
                coordinates={[selectedPlace.lng, selectedPlace.lat]}
                saved={savedPlaceIds.has(selectedPlace.id)}
                onToggleSaved={() => toggleSavedPlace(selectedPlace.id)}
                onShowOnMap={() =>
                  mapRef.current?.flyTo({
                    center: [selectedPlace.lng, selectedPlace.lat],
                    zoom: 17,
                    duration: 500,
                  })
                }
                onDirections={() =>
                  openDirections(
                    [selectedPlace.lng, selectedPlace.lat],
                    selectedPlace.name,
                  )
                }
              >
                {selectedPlace.category === "buildings" && (
                  <>
                    <BuildingModelEditor
                      key={selectedPlace.id}
                      knownHeight={selectedPlace.heightMeters ?? null}
                      model={buildingModels.find(
                        (model) => model.id === selectedPlace.id,
                      )}
                      onDelete={removeBuildingModel}
                      onPreview={setBuildingModelPreview}
                      onSave={persistBuildingModel}
                      place={selectedPlace}
                    />
                    {buildingModelsStatus === "error" && (
                      <p className="building-model-message error">
                        {buildingModelsError}
                      </p>
                    )}
                  </>
                )}
              </EntityDetail>
            </div>
          </section>
        )}
      </motion.aside>
      {airAlert.status === "active" && (
      <section
        className={`air-alert active level-${airAlert.level ?? "red"}${airAlertExpanded ? " expanded" : ""}`}
        role="status"
      >
        <button
          type="button"
          className="air-alert-pill"
          aria-expanded={airAlertExpanded}
          onClick={() => setAirAlertExpanded((expanded) => !expanded)}
        >
          <TriangleAlert size={19} />
          <strong>
            {airAlert.level === "yellow"
              ? "БпЛА · Львівщина"
              : "Тривога · Львівщина"}
          </strong>
          <MaterialIcon
            name={airAlertExpanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}
            size={20}
          />
        </button>
        {airAlertExpanded && (
          <div className="air-alert-details">
            <p>
              {airAlert.level === "yellow"
                ? "Жовтий рівень — загроза ударних БпЛА. Будьте уважні, в укриття спускайтеся за потреби."
                : "Червоний рівень — ракетна небезпека. Негайно пройдіть до найближчого укриття."}
            </p>
            {(airAlert.sinceText || (airAlert.areasAffected?.length ?? 0) > 0) && (
              <div className="air-alert-meta">
                {airAlert.sinceText && (
                  <span className="air-alert-since">
                    <MaterialIcon name="schedule" size={15} />
                    {airAlert.sinceText}
                  </span>
                )}
                {(airAlert.areasAffected?.length ?? 0) > 0 && (
                  <ul className="air-alert-areas" aria-label="Райони під тривогою">
                    {airAlert.areasAffected?.map((area) => (
                      <li key={area}>{area}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="air-alert-threats">
              <div className="air-alert-threats-head">
                <MaterialIcon name="flight" size={16} />
                <strong>БпЛА та КАБ</strong>
                <small>за повідомленнями Повітряних сил</small>
              </div>
              {(airAlert.threats?.length ?? 0) > 0 ? (
                <ul className="air-alert-threat-list">
                  {airAlert.threats?.map((threat) => (
                    <li
                      className={`air-alert-threat kind-${threat.kind}`}
                      key={`${threat.time}-${threat.place}`}
                    >
                      <time>{threat.time}</time>
                      <span>{threat.placeUk}</span>
                      <small>{threat.kindLabel}</small>
                      {threat.note && <p>{threat.note}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="air-alert-threat-empty">
                  Нових повідомлень про БпЛА по Львівщині немає. Статус
                  оновлюється кожні 30 секунд.
                </p>
              )}
            </div>
            <div className="air-alert-links">
              <Button asChild variant="outline" size="sm" className="alert-action">
                <a
                  href="https://map.war-monitor.org/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <MaterialIcon name="radar" size={16} />
                  Жива мапа БпЛА
                </a>
              </Button>
            </div>
            <small className="air-alert-source">
              Офіційні повідомлення мають пріоритет.
            </small>
            <div className="shelter-nearest">
              {shelterLoadState === "loading" ? (
                <span>Завантажуємо міський перелік укриттів…</span>
              ) : shelterLoadState === "error" ? (
                <span>
                  Не вдалося завантажити перелік укриттів. Перевірте{" "}
                  <a
                    href="https://opendata.city-adm.lviv.ua/dataset/zahysni-sporudy-lvivska-mth"
                    target="_blank"
                    rel="noreferrer"
                  >
                    дані міста
                  </a>
                  .
                </span>
              ) : !userLocation ? (
                <>
                  {locationError && (
                    <span className="shelter-location-error" role="alert">
                      {locationError}
                    </span>
                  )}
                  <span>Дозвольте геолокацію, щоб знайти найближче укриття.</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shelter-action"
                    onClick={requestLocation}
                  >
                    Моє місце
                  </Button>
                </>
              ) : nearestShelter ? (
                <>
                  <strong>
                    Найближче · {formatDistance(nearestShelter.distanceMeters)}{" "}
                    по прямій
                  </strong>
                  <span className="shelter-address">
                    {nearestShelter.address}
                  </span>
                  <small>
                    {nearestShelter.status}
                    {nearestShelter.capacity
                      ? ` · ${nearestShelter.capacity} місць`
                      : ""}
                    {" · доступ 24/7 за даними міста"}
                  </small>
                  <div className="shelter-actions">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shelter-action"
                      onClick={() =>
                        mapRef.current?.flyTo({
                          center: [nearestShelter.lng, nearestShelter.lat],
                          zoom: 16,
                          duration: 650,
                        })
                      }
                    >
                      На мапі
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="shelter-action"
                    >
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${nearestShelter.lat},${nearestShelter.lng}&travelmode=walking&origin=${userLocation[1]},${userLocation[0]}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Маршрут
                      </a>
                    </Button>
                  </div>
                  <small className="shelter-source-note">
                    Відстань по прямій. Фактичну доступність перевіряйте на
                    місці ·{" "}
                    <a
                      href="https://opendata.city-adm.lviv.ua/dataset/zahysni-sporudy-lvivska-mth"
                      target="_blank"
                      rel="noreferrer"
                    >
                      джерело: відкриті дані Львова
                    </a>
                  </small>
                </>
              ) : (
                <span>
                  Немає укриття зі статусом «готове» або «рекомендоване» та
                  цілодобовим доступом у міському переліку.{" "}
                  <a
                    href="https://opendata.city-adm.lviv.ua/dataset/zahysni-sporudy-lvivska-mth"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Переглянути джерело
                  </a>
                  .
                </span>
              )}
            </div>
          </div>
        )}
      </section>
      )}
      {locationError && activeView !== "admin" && (
        <div className="map-location-error" role="alert">
          {locationError}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Закрити повідомлення"
            onClick={() => setLocationError(null)}
          >
            <X size={18} />
          </Button>
        </div>
      )}
      <div
        className={`map-controls${mapPitch >= 0.5 ? " map-controls-3d" : " map-controls-2d"}`}
        role="group"
        aria-label="Керування мапою"
        data-tour="map-controls"
        hidden={activeView === "admin"}
      >
        <div className="map-control-set" role="group" aria-label="Вигляд мапи">
          <Button
            type="button"
            variant="ghost"
            className="map-control map-compass"
            aria-label="Компас: повернути карту на північ"
            title="Компас: повернути карту на північ"
            onClick={resetMapOrientation}
          >
            <span className="map-compass-needle" style={{ transform: `rotate(${-mapBearing}deg)` }}>
              <MaterialIcon name="navigation" size={20} />
            </span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="map-control map-mode-control"
            aria-label={mapPitch < 0.5 ? "Перейти до 3D-вигляду" : "Перейти до вигляду 2D зверху"}
            aria-pressed={mapPitch >= 0.5}
            title={mapPitch < 0.5 ? "Перейти до 3D-вигляду" : "Перейти до вигляду 2D зверху"}
            onClick={toggleMapMode}
          >
            3D
          </Button>
          {mapPitch >= 0.5 && (
            <Button
              type="button"
              variant="ghost"
              className={`map-control terrain-control${terrainEnabled ? " active" : ""}`}
              aria-label={terrainEnabled ? "Вимкнути рельєф і лісові масиви" : "Увімкнути рельєф і лісові масиви"}
              aria-pressed={terrainEnabled}
              title={terrainEnabled ? "Вимкнути рельєф і лісові масиви" : "Увімкнути рельєф і лісові масиви"}
              onClick={() => setTerrainEnabled((enabled) => !enabled)}
            >
              <MaterialIcon name="terrain" size={20} />
            </Button>
          )}
        </div>
        <div className="map-control-set map-pan-pad" role="group" aria-label="Перемістити карту">
          <span aria-hidden="true" />
          <Button type="button" variant="ghost" className="map-control" aria-label="Перемістити карту вгору" title="Вгору" onClick={() => panMap("up")}><MaterialIcon name="keyboard_arrow_up" size={22} /></Button>
          <span aria-hidden="true" />
          <Button type="button" variant="ghost" className="map-control" aria-label="Перемістити карту ліворуч" title="Ліворуч" onClick={() => panMap("left")}><MaterialIcon name="keyboard_arrow_left" size={22} /></Button>
          <span aria-hidden="true" className="map-pan-center" />
          <Button type="button" variant="ghost" className="map-control" aria-label="Перемістити карту праворуч" title="Праворуч" onClick={() => panMap("right")}><MaterialIcon name="keyboard_arrow_right" size={22} /></Button>
          <span aria-hidden="true" />
          <Button type="button" variant="ghost" className="map-control" aria-label="Перемістити карту донизу" title="Донизу" onClick={() => panMap("down")}><MaterialIcon name="keyboard_arrow_down" size={22} /></Button>
          <span aria-hidden="true" />
        </div>
        <div className="map-control-set map-zoom-controls" role="group" aria-label="Масштаб">
          <Button type="button" variant="ghost" className="map-control" aria-label="Збільшити масштаб" title="Збільшити масштаб" onClick={() => mapRef.current?.zoomIn()}><MaterialIcon name="add" size={22} /></Button>
          <Button type="button" variant="ghost" className="map-control" aria-label="Зменшити масштаб" title="Зменшити масштаб" onClick={() => mapRef.current?.zoomOut()}><MaterialIcon name="remove" size={22} /></Button>
        </div>
        <div className="map-control-set" role="group" aria-label="Додаткові дії">
          <Button type="button" variant="ghost" className="map-control" aria-label="Моє місцезнаходження" title="Моє місцезнаходження" data-tour="map-location" onClick={requestLocation}><LocateFixed size={20} /></Button>
          <div className="map-settings-wrap" ref={mapSettingsRef}>
            <Button
              type="button"
              variant="ghost"
              className={`map-control map-settings-btn${mapSettingsOpen ? " active" : ""}`}
              aria-label="Що показувати на мапі"
              aria-expanded={mapSettingsOpen}
              aria-haspopup="dialog"
              title="Шари мапи"
              onClick={() => setMapSettingsOpen((o) => !o)}
            >
              <MaterialIcon name="layers" size={20} />
              {mapLayerCategories.size > 0 && (
                <span className="map-settings-badge">{mapLayerCategories.size}</span>
              )}
            </Button>
            {mapSettingsOpen && (
              <div
                className="map-settings-popover"
                role="dialog"
                aria-label="Шари мапи"
              >
                <div className="map-settings-header">
                  <span className="map-settings-title">Що показувати</span>
                  {mapLayerCategories.size > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="map-settings-clear"
                      onClick={() => setMapLayerCategories(new Set())}
                    >
                      Скинути
                    </Button>
                  )}
                </div>
                <p className="map-settings-hint">
                  До 3 категорій одночасно
                </p>
                <div className="map-settings-chips" role="group" aria-label="Категорії місць">
                  {cityPlaceCategories.map((cat) => {
                    const isActive = mapLayerCategories.has(cat.id);
                    const atLimit = !isActive && mapLayerCategories.size >= 3;
                    return (
                      <Toggle variant="pill"
                        key={cat.id}
                        size="sm"
                       
                        disabled={atLimit}
                        className="map-layer-chip"
                        style={{ "--chip-color": CITY_PLACE_CATEGORY_COLORS[cat.id] } as React.CSSProperties}
                        onClick={() => {
                          setMapLayerCategories((prev) => {
                            const next = new Set(prev);
                            if (next.has(cat.id)) {
                              next.delete(cat.id);
                            } else if (next.size < 3) {
                              next.add(cat.id);
                            }
                            return next;
                          });
                        }} pressed={isActive}>
                        <span
                          className="map-layer-chip-dot"
                          aria-hidden="true"
                        />
                        {cat.label}
                      </Toggle>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {developmentToolsAvailable && activeView !== "admin" && (
        <DevToolsDock
          key="dev-tools-dock"
          runtime={devRuntime}
          settings={fixtureSettings}
          onSettingsChange={updateFixtureSettings}
          overridesActive={adminOverridesActive}
          onOpenAdmin={() => setActiveView("admin")}
          onShowOnboarding={startOnboarding}
          onSpawn={spawnFixtureVehicles}
          onResetSettings={resetFixtureSettings}
          onClearStorage={clearDevState}
          onClearOverrides={clearAdminOverrides}
          datasets={devDatasetSummary}
          onboardingPreview={onboardingPreviewOnReload}
          onOnboardingPreviewChange={(enabled) => {
            setOnboardingPreviewOnReload(enabled);
            saveOnboardingValue(ONBOARDING_PREVIEW_KEY, String(enabled));
          }}
        />
      )}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingDialog
            key="onboarding"
            phase={onboardingPhase}
            step={onboardingStep}
            viewKey={activeView}
            onPhaseChange={setOnboardingPhase}
            onStartTour={startOnboardingTour}
            onStepChange={goToOnboardingStep}
            onFinish={finishOnboarding}
          />
        )}
        {showBenefits && (
          <BenefitsDialog
            key="benefits"
            notificationMessage={notificationMessage}
            onRequestLocation={requestLocation}
            onRequestNotifications={requestNotificationPermission}
            onDismiss={dismissBenefits}
          />
        )}
        {settingsOpen && (
          <SettingsDialog
            key="settings"
            cityName="Львів"
            initialView={passwordRecovery ? "account" : "main"}
            onClose={() => setSettingsOpen(false)}
            onOpenCityPicker={() => {
              setCityUpdateStatus("");
              setCityLaunchModalOpen(true);
            }}
            onRequestLocation={requestLocation}
            onReplayOnboarding={startOnboarding}
          />
        )}
      </AnimatePresence>
    </main>
    <dialog
      ref={cityLaunchDialogRef}
      className="city-launch-dialog"
      aria-modal="true"
      aria-labelledby="city-launch-title"
      onClose={() => setCityLaunchModalOpen(false)}
      onCancel={() => setCityLaunchModalOpen(false)}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          setCityLaunchModalOpen(false);
        }
      }}
    >
      <div className="city-launch-content">
        <header className="city-launch-header">
          <div>
            <span className="city-launch-eyebrow">un · МІСТО ПОРУЧ</span>
            <h2 id="city-launch-title">Незабаром у нових містах</h2>
            <p>
              Оберіть область або знайдіть місто. Повідомимо, щойно un
              з’явиться поруч.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Закрити вибір міста"
            onClick={() => setCityLaunchModalOpen(false)}
          >
            <X size={20} />
          </Button>
        </header>
        <label className="city-launch-search">
          <MaterialIcon name="search" size={20} />
          <Input
            type="search"
            aria-label="Знайти місто або область"
            placeholder="Місто або область"
            value={citySearch}
            onChange={(event) => setCitySearch(event.target.value)}
          />
          {citySearch && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Очистити пошук міст"
              onClick={() => setCitySearch("")}
            >
              <MaterialIcon name="close" size={18} />
            </Button>
          )}
        </label>
        <div
          className="city-launch-list"
          role="region"
          aria-label="Області та міста України"
        >
          <div className="city-index">
            {cityIndexGroups.map(({ letter, items }) => (
              <section
                key={letter}
                className="city-index-section"
                aria-labelledby={`city-index-${letter}`}
              >
                <h3 id={`city-index-${letter}`} className="city-index-letter">
                  {letter}
                </h3>
                <ul className="city-index-items">
                  {items.map((entry) => {
                    const isSelected = interestedCities.has(entry.name);
                    const isCurrent = entry.name === "Львів";
                    return (
                      <li key={entry.key}>
                        <button
                          type="button"
                          className={`city-region-city${entry.isCenter ? " city-region-center" : ""}${isSelected ? " active" : ""}${isCurrent ? " current" : ""}`}
                          aria-pressed={isSelected}
                          disabled={isCurrent}
                          onClick={() => selectInterestedCity(entry.name)}
                        >
                          <span>{entry.name}</span>
                          {isCurrent ? (
                            <span className="city-region-badge">Доступне</span>
                          ) : isSelected ? (
                            <MaterialIcon name="check" size={18} />
                          ) : entry.isCenter ? (
                            <span className="city-region-badge">Центр</span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
          {filteredCityRegions.length === 0 && (
            <p className="city-launch-empty" role="status">
              Місто або область не знайдено. Перевірте назву й спробуйте ще раз.
            </p>
          )}
        </div>
        <div className="city-launch-actions">
          {TELEGRAM_CHANNEL_URL ? (
            <a
              className="city-launch-telegram"
              href={TELEGRAM_CHANNEL_URL}
              target="_blank"
              rel="noreferrer"
            >
              <div className="city-launch-telegram-content">
                <div className="city-launch-telegram-icon">
                  <MaterialIcon name="send" size={24} />
                </div>
                <div className="city-launch-telegram-text">
                  <strong>Підпишіться на Telegram</strong>
                  <span>Отримуйте новини про запуск у нових містах</span>
                </div>
                <MaterialIcon name="arrow_forward" size={20} />
              </div>
            </a>
          ) : (
            <p className="city-launch-telegram-note">
              Посилання на Telegram-канал з’явиться тут незабаром.
            </p>
          )}
          <form className="city-launch-email-form" onSubmit={submitCityUpdate}>
            <label htmlFor="city-launch-email">
              Залиште email — надішлемо новину про запуск у {interestedCities.size} {interestedCities.size === 1 ? "місті" : "містах"}
            </label>
            <div>
              <Input
                id="city-launch-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={cityUpdateEmail}
                disabled={cityUpdateSubmitting}
                onChange={(event) => {
                  setCityUpdateEmail(event.target.value);
                  setCityUpdateStatus("");
                }}
                required
              />
              <Button type="submit" disabled={cityUpdateSubmitting}>
                {cityUpdateSubmitting ? "Надсилаємо…" : "Повідомити мене"}
              </Button>
            </div>
            <p
              className="city-launch-status"
              role="status"
              aria-live="polite"
            >
              {cityUpdateStatus ||
                "Адресу буде надіслано лише після підключення підписки."}
            </p>
          </form>
        </div>
      </div>
    </dialog>
    </TooltipProvider>
    </MotionConfig>
  );
}
