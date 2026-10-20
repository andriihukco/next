import routeFixtures from "./fixture-routes.json";
import {
  getScenarioLimits,
  type FixtureScenario,
  type FixtureSettings,
} from "./dev-fixture-settings";

export type FixtureVehicle = {
  id: string;
  tripId: string;
  route: string;
  destination: string;
  type: "tram" | "trolleybus" | "bus";
  lat: number;
  lng: number;
  speed: number;
  bearing: number;
  fixtureRouteId: string;
  plate: string;
  lowFloor: boolean;
  mapMatched: boolean;
  dataSource: "test";
  routeProgress: number;
  nextStop: string | null;
};

export type FixtureStop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  routes: string[];
};

export type FixturePlace = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
};

export type FixtureAirAlert = {
  status: "active" | "clear";
  level: "red" | "yellow" | null;
  updatedAt: number;
  source: string;
};

type FixtureRoute = {
  id: string;
  route: string;
  type: FixtureVehicle["type"];
  destination: string;
  coordinates: [number, number][];
};
const fixtureRoutes: FixtureRoute[] = routeFixtures.map((route) => ({
  ...route,
  type: route.type as FixtureVehicle["type"],
  coordinates: route.coordinates.map(
    ([lat, lng]): [number, number] => [lat, lng],
  ),
}));
const fixtureRouteSequence = [
  ...Array.from(
    {
      length: Math.max(
        ...(["bus", "tram", "trolleybus"] as const).map(
          (type) => fixtureRoutes.filter((route) => route.type === type).length,
        ),
      ),
    },
    (_, index) =>
      (["bus", "tram", "trolleybus"] as const)
        .map((type) =>
          fixtureRoutes.filter((route) => route.type === type)[index],
        )
        .filter((route): route is FixtureRoute => route !== undefined),
  ).flat(),
];

const stopFixtures: FixtureStop[] = [
  {
    id: "test-stop-1",
    name: "Площа Ринок",
    lat: 49.8419,
    lng: 24.0315,
    routes: ["1", "2", "8A"],
  },
  {
    id: "test-stop-2",
    name: "Університет",
    lat: 49.8357,
    lng: 24.0222,
    routes: ["1", "3", "9"],
  },
  {
    id: "test-stop-3",
    name: "Залізничний вокзал",
    lat: 49.8391,
    lng: 23.9937,
    routes: ["2", "4", "8A"],
  },
  {
    id: "test-stop-4",
    name: "Підвальна",
    lat: 49.8441,
    lng: 24.0398,
    routes: ["3", "5", "9"],
  },
  {
    id: "test-stop-5",
    name: "Стрийський ринок",
    lat: 49.8276,
    lng: 24.0308,
    routes: ["4", "5"],
  },
];

const placeFixtures: FixturePlace[] = [
  {
    id: "test-place-1",
    name: "Тестовий ТЦ",
    lat: 49.8419,
    lng: 24.0315,
    category: "mall",
  },
  {
    id: "test-place-2",
    name: "Стрийський парк",
    lat: 49.8254,
    lng: 24.0342,
    category: "park",
  },
  {
    id: "test-place-3",
    name: "Тестова школа",
    lat: 49.8408,
    lng: 24.0286,
    category: "school",
  },
  {
    id: "test-place-4",
    name: "Тестовий заклад харчування",
    lat: 49.8432,
    lng: 24.0351,
    category: "food",
  },
];

function randomGenerator(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
}

/** Scenarios that intentionally produce an empty network. */
const EMPTY_NETWORK_SCENARIOS: FixtureScenario[] = [
  "no-service",
  "network-loss",
];

// Test stops are generated along each fixture route so next-stop data exists on /dev.
const FIXTURE_STOP_SPACING_METERS = 450;
const fixtureRouteStopCache = new Map<string, { name: string; progress: number }[]>();

function fixtureRouteStops(routeId: string): { name: string; progress: number }[] {
  const cached = fixtureRouteStopCache.get(routeId);
  if (cached) return cached;
  const route = fixtureRoutes.find((candidate) => candidate.id === routeId);
  const totalLength = route
    ? routeSegments(route.coordinates).reduce((total, segment) => total + segment.length, 0)
    : 0;
  const count = Math.max(1, Math.round(totalLength / FIXTURE_STOP_SPACING_METERS));
  const stops = Array.from({ length: count }, (_, index) => ({
    name: `Тестова зупинка ${index + 1}`,
    progress: (index + 1) / count,
  }));
  fixtureRouteStopCache.set(routeId, stops);
  return stops;
}

function fixtureNextStop(routeId: string, progress: number): string | null {
  return fixtureRouteStops(routeId).find((stop) => stop.progress > progress + 1e-9)?.name ?? null;
}

export function createFixtureVehicles(
  settings: FixtureSettings,
): FixtureVehicle[] {
  if (EMPTY_NETWORK_SCENARIOS.includes(settings.scenario)) return [];
  const random = randomGenerator(settings.seed);
  const limits = getScenarioLimits(settings.scenario);
  const count = Math.min(settings.vehicleCount, limits.maxVehicles);

  return Array.from({ length: count }, (_, index) => {
    const route = fixtureRouteSequence[index % fixtureRouteSequence.length];
    const position = positionOnFixtureRoute(route.coordinates, random);
    return {
      id: `test-${settings.seed}-${index + 1}`,
      tripId: `test-${settings.seed}-${index + 1}`,
      route: route.route,
      destination: route.destination,
      type: route.type,
      fixtureRouteId: route.id,
      lat: position.lat,
      lng: position.lng,
      speed: Math.max(
        0,
        Math.round(settings.averageSpeed + (random() - 0.5) * 14),
      ),
      bearing: position.bearing,
      plate: `TEST-${String(index + 1).padStart(3, "0")}`,
      lowFloor: index % 2 === 0,
      mapMatched: true,
      dataSource: "test" as const,
      routeProgress: position.routeProgress,
      nextStop: fixtureNextStop(route.id, position.routeProgress),
    };
  });
}

export function advanceFixtureVehicles<T extends {
  fixtureRouteId?: string;
  routeProgress?: number;
  speed: number;
  lat: number;
  lng: number;
  bearing: number;
}>(vehicles: T[], elapsedSeconds: number): T[] {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return vehicles;

  return vehicles.map((vehicle) => {
    if (
      !vehicle.fixtureRouteId ||
      typeof vehicle.routeProgress !== "number" ||
      !Number.isFinite(vehicle.routeProgress)
    ) {
      return vehicle;
    }
    const route = fixtureRoutes.find(
      (candidate) => candidate.id === vehicle.fixtureRouteId,
    );
    if (!route) {
      console.error(
        `No local GTFS shape found for test route ${vehicle.fixtureRouteId}.`,
      );
      return vehicle;
    }
    const segments = routeSegments(route.coordinates);
    const totalLength = segments.reduce(
      (total, segment) => total + segment.length,
      0,
    );
    if (totalLength <= 0) return vehicle;

    const progress =
      (((vehicle.routeProgress * totalLength +
        (Math.max(0, vehicle.speed) / 3.6) * elapsedSeconds) %
        totalLength) +
        totalLength) %
      totalLength /
      totalLength;
    return {
      ...vehicle,
      ...positionAtRouteDistance(segments, progress * totalLength),
      routeProgress: progress,
      nextStop: fixtureNextStop(route.id, progress),
    };
  });
}

export function createFixtureRoute(
  vehicle: Pick<FixtureVehicle, "fixtureRouteId">,
): [number, number][] {
  const route = fixtureRoutes.find(
    (candidate) => candidate.id === vehicle.fixtureRouteId,
  );
  if (!route) {
    console.error(`No local GTFS shape found for test route ${vehicle.fixtureRouteId}.`);
    return [];
  }
  return route.coordinates;
}

type RouteSegment = {
  previous: [number, number];
  point: [number, number];
  length: number;
  startDistance: number;
};

function routeSegments(coordinates: [number, number][]): RouteSegment[] {
  let distance = 0;
  return coordinates.slice(1).flatMap((point, index) => {
    const previous = coordinates[index];
    const length = Math.hypot(
      (point[0] - previous[0]) * 111_000,
      (point[1] - previous[1]) * 73_000,
    );
    if (length <= 0) return [];
    const segment = { previous, point, length, startDistance: distance };
    distance += length;
    return [segment];
  });
}

function positionOnFixtureRoute(
  coordinates: [number, number][],
  random: () => number,
): { lat: number; lng: number; bearing: number; routeProgress: number } {
  const center: [number, number] = [49.8397, 24.0297];
  const segments = routeSegments(coordinates);
  const totalLength = segments.reduce((total, segment) => total + segment.length, 0);
  if (totalLength <= 0) {
    throw new Error("A local GTFS route must contain at least two coordinates.");
  }
  const nearbySegments = segments.filter((segment) => {
    const middleLat = (segment.previous[0] + segment.point[0]) / 2;
    const middleLng = (segment.previous[1] + segment.point[1]) / 2;
    return (
      Math.hypot(
        (middleLat - center[0]) * 111_000,
        (middleLng - center[1]) * 73_000,
      ) <= 1_500
    );
  });
  const candidates = nearbySegments.length > 0 ? nearbySegments : segments;
  const candidateLength = candidates.reduce(
    (total, segment) => total + segment.length,
    0,
  );
  let distanceOnCandidates = random() * candidateLength;
  let selected = candidates[candidates.length - 1];
  for (const candidate of candidates) {
    if (distanceOnCandidates <= candidate.length) {
      selected = candidate;
      break;
    }
    distanceOnCandidates -= candidate.length;
  }
  const distanceAlongRoute = selected.startDistance + distanceOnCandidates;
  const position = positionAtRouteDistance(segments, distanceAlongRoute);
  return {
    ...position,
    routeProgress: distanceAlongRoute / totalLength,
  };
}

function positionAtRouteDistance(
  segments: RouteSegment[],
  distance: number,
): { lat: number; lng: number; bearing: number } {
  const segment =
    segments.find(
      (candidate) =>
        distance <= candidate.startDistance + candidate.length,
    ) ?? segments[segments.length - 1];
  const progress = Math.max(
    0,
    Math.min(1, (distance - segment.startDistance) / segment.length),
  );
  return {
    lat: segment.previous[0] + (segment.point[0] - segment.previous[0]) * progress,
    lng: segment.previous[1] + (segment.point[1] - segment.previous[1]) * progress,
    bearing:
      (Math.round(
        (Math.atan2(
          (segment.point[1] - segment.previous[1]) * 73,
          (segment.point[0] - segment.previous[0]) * 111,
        ) *
          180) /
          Math.PI,
      ) +
        360) %
      360,
  };
}

export function getFixtureStops(): FixtureStop[] {
  return stopFixtures;
}

export function getFixturePlaces(): FixturePlace[] {
  return placeFixtures;
}

export function getFixtureAirAlert(
  scenario: FixtureScenario,
): FixtureAirAlert {
  return {
    status: scenario === "alert" ? "active" : "clear",
    level: scenario === "alert" ? "red" : null,
    updatedAt: Date.now(),
    source: "un local fixture DB",
  };
}
