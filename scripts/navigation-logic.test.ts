/**
 * @file navigation-logic.test.ts
 * @description Logic tests for turn-by-turn routing: parsing, progress and formatting.
 * Run with `npm run test:navigation`. Set NAV_LIVE=1 to also query the routing server.
 */
import {
  arrivalClock,
  distanceToNextStep,
  fetchNavRoute,
  formatDistance,
  formatDuration,
  locateOnRoute,
  parseNavRoute,
  type LatLng,
} from "../src/lib/navigation";

const results: string[] = [];
const check = (label: string, passed: boolean): void => {
  results.push(`${passed ? "PASS" : "FAIL"} ${label}`);
};

// A straight north-south leg of about 1.1 km, then an eastward leg of about 0.6 km with one right turn.
const north: LatLng = { latitude: 49.8419, longitude: 24.0315 };
const middle: LatLng = { latitude: 49.8519, longitude: 24.0315 };
const end: LatLng = { latitude: 49.8519, longitude: 24.0415 };

const syntheticRoute = parseNavRoute(
  {
    trip: {
      summary: { time: 900, length: 1.7 },
      legs: [
        {
          shape: encodeShape([north, middle]),
          maneuvers: [{ type: 1, instruction: "Йдіть на північ.", length: 1.1, time: 780, begin_shape_index: 0 }],
        },
        {
          shape: encodeShape([middle, end]),
          maneuvers: [
            { type: 11, instruction: "Поверніть праворуч.", length: 0.6, time: 120, begin_shape_index: 0 },
            { type: 4, instruction: "Ви прибули.", length: 0, time: 0, begin_shape_index: 1 },
          ],
        },
      ],
    },
  },
  "walk",
);

check("two legs join without a duplicate point", syntheticRoute.coordinates.length === 3);
check("route distance is converted to meters", Math.round(syntheticRoute.distanceM) === 1700);
check("first maneuver starts at zero", syntheticRoute.steps[0]?.startDistanceM === 0);
check("turn maneuver maps to the right kind", syntheticRoute.steps[1]?.kind === "right");
check("arrival maneuver maps to arrive", syntheticRoute.steps[2]?.kind === "arrive");
check("turn starts at the join point (~1100 m)", Math.abs((syntheticRoute.steps[1]?.startDistanceM ?? 0) - 1100) < 15);

const start = locateOnRoute(syntheticRoute, north);
check("rider at the start has no progress", start.traveledM < 1 && start.stepIndex === 0);

const halfway = locateOnRoute(syntheticRoute, { latitude: 49.8469, longitude: 24.0315 });
check("point on the first leg is on route", halfway.offRouteM < 2);
check("halfway progress is about 550 m", Math.abs(halfway.traveledM - 550) < 15);
check("distance to the turn is about 550 m", Math.abs(distanceToNextStep(syntheticRoute, halfway) - 550) < 15);

const offRoute = locateOnRoute(syntheticRoute, { latitude: 49.8469, longitude: 24.0355 });
check("point about 300 m east is off route by about 300 m", Math.abs(offRoute.offRouteM - 300) < 25);

const onSecondLeg = locateOnRoute(syntheticRoute, { latitude: 49.8519, longitude: 24.0365 });
check("rider on the second leg moves to step 2", onSecondLeg.stepIndex === 1);
check("remaining time shrinks with progress", locateOnRoute(syntheticRoute, middle).remainingS < halfway.remainingS);

check("formats short distances in meters", formatDistance(340) === "340 м");
check("formats long distances in kilometres", formatDistance(1250) === "1,3 км");
check("formats durations under an hour", formatDuration(754) === "13 хв");
check("formats durations over an hour", formatDuration(5400) === "1 год 30 хв");
check("arrival clock adds seconds to now", arrivalClock(600, new Date(2026, 0, 1, 9, 50)) === "10:00");

if (process.env.NAV_LIVE === "1") {
  const live = await fetchNavRoute(north, end, "walk");
  check("live route has steps with Ukrainian instructions", live.steps.length > 0 && /[а-яіїєґ]/i.test(live.steps[0].instruction));
  check("live route has a positive distance", live.distanceM > 0);
}

for (const line of results) console.log(line);
const failed = results.filter((line) => line.startsWith("FAIL")).length;
if (failed) {
  console.log(`${failed} check(s) failed`);
  process.exit(1);
}

/** Test-only encoder for Valhalla polyline6. */
function encodeShape(points: LatLng[]): string {
  let previousLat = 0;
  let previousLng = 0;
  let output = "";
  const encodeValue = (value: number) => {
    let v = value < 0 ? ~(value << 1) : value << 1;
    while (v >= 0x20) {
      output += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    output += String.fromCharCode(v + 63);
  };
  for (const point of points) {
    const lat = Math.round(point.latitude * 1e6);
    const lng = Math.round(point.longitude * 1e6);
    encodeValue(lat - previousLat);
    encodeValue(lng - previousLng);
    previousLat = lat;
    previousLng = lng;
  }
  return output;
}
