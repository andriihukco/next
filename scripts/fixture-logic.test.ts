/**
 * @file fixture-logic.test.ts
 * @description Logic tests for the developer fixture generator.
 * Run with `npm run test:fixtures`.
 */
import {
  advanceFixtureVehicles,
  createFixtureVehicles,
} from "../src/lib/dev-fixtures";
import {
  DEFAULT_FIXTURE_SETTINGS,
  settingsForScenario,
} from "../src/lib/dev-fixture-settings";

const results: string[] = [];
const check = (label: string, passed: boolean): void => {
  results.push(`${passed ? "PASS" : "FAIL"} ${label}`);
};

const night = settingsForScenario("night", DEFAULT_FIXTURE_SETTINGS);
const nightVehicles = createFixtureVehicles({ ...night, vehicleCount: 40 });
check("night caps the fleet at 6", nightVehicles.length === 6);

const peak = settingsForScenario("peak", DEFAULT_FIXTURE_SETTINGS);
check("peak default fleet is 120", peak.vehicleCount === 120);
check(
  "peak can render 300 vehicles",
  createFixtureVehicles({ ...peak, vehicleCount: 300 }).length === 300,
);
check(
  "network loss empties the fleet",
  createFixtureVehicles({ ...peak, scenario: "network-loss" }).length === 0,
);
check(
  "no service empties the fleet",
  createFixtureVehicles({ ...peak, scenario: "no-service" }).length === 0,
);

const first = createFixtureVehicles(peak);
const second = createFixtureVehicles(peak);
check("seed is deterministic", JSON.stringify(first) === JSON.stringify(second));
check(
  "a different seed changes the fleet",
  JSON.stringify(first) !==
    JSON.stringify(createFixtureVehicles({ ...peak, seed: 43 })),
);

const moved = advanceFixtureVehicles(first, 30);
const travelled = Math.hypot(
  moved[0].lat - first[0].lat,
  moved[0].lng - first[0].lng,
);
check("vehicles advance along the route", travelled > 0);

console.log(results.join("\n"));
if (results.some((line) => line.startsWith("FAIL"))) {
  process.exitCode = 1;
}
