import { getScenarioMeta, type ScenarioMeta } from "./dev-tools/scenarios";
import { DEV_ROUTE, isDevPathname } from "./dev-tools/route";

export type FixtureScenario =
  | "commute"
  | "peak"
  | "night"
  | "alert"
  | "no-service"
  | "network-loss"
  | "slow-api";

export type FixtureSettings = {
  enabled: boolean;
  scenario: FixtureScenario;
  vehicleCount: number;
  averageSpeed: number;
  seed: number;
};

export const DEFAULT_FIXTURE_SETTINGS: FixtureSettings = {
  enabled: false,
  scenario: "commute",
  vehicleCount: 24,
  averageSpeed: 26,
  seed: 42,
};

const SETTINGS_KEY = "un.dev-fixture-settings";
const SCENARIO_NAMES: FixtureScenario[] = [
  "commute",
  "peak",
  "night",
  "alert",
  "no-service",
  "network-loss",
  "slow-api",
];

/** Hard ceiling for every scenario, used to keep the stress test sane. */
export const MAX_FIXTURE_VEHICLES = 300;

export function isFixtureScenario(value: unknown): value is FixtureScenario {
  return (
    typeof value === "string" &&
    SCENARIO_NAMES.includes(value as FixtureScenario)
  );
}

export function getScenarioLimits(scenario: FixtureScenario): {
  maxVehicles: number;
  defaultVehicles: number;
  defaultSpeed: number;
} {
  const meta: ScenarioMeta = getScenarioMeta(scenario);
  return {
    maxVehicles: meta.maxVehicles,
    defaultVehicles: meta.defaultVehicles,
    defaultSpeed: meta.defaultSpeed,
  };
}

/** Builds a complete, consistent settings object for the given scenario. */
export function settingsForScenario(
  scenario: FixtureScenario,
  current: FixtureSettings = DEFAULT_FIXTURE_SETTINGS,
): FixtureSettings {
  const limits = getScenarioLimits(scenario);
  return {
    ...current,
    scenario,
    vehicleCount: limits.defaultVehicles,
    averageSpeed: limits.defaultSpeed,
  };
}

function normalizedSettings(value: unknown): FixtureSettings | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Partial<FixtureSettings>;
  if (
    typeof input.enabled !== "boolean" ||
    !isFixtureScenario(input.scenario) ||
    !Number.isInteger(input.vehicleCount) ||
    !Number.isFinite(input.averageSpeed) ||
    !Number.isInteger(input.seed)
  ) {
    return null;
  }
  const limits = getScenarioLimits(input.scenario);
  return {
    enabled: input.enabled,
    scenario: input.scenario,
    vehicleCount: Math.min(
      limits.maxVehicles,
      Math.max(0, input.vehicleCount as number),
    ),
    averageSpeed: Math.max(
      0,
      Math.min(80, Math.round(input.averageSpeed as number)),
    ),
    seed: (input.seed as number) >>> 0,
  };
}

export function readFixtureSettings(): FixtureSettings {
  const replay = new URLSearchParams(window.location.search).get(
    "dev-scenario",
  );
  if (replay) {
    try {
      const parsed = normalizedSettings(JSON.parse(replay));
      if (parsed) return { ...parsed, enabled: true };
      console.error("The shared test scenario URL contains invalid settings.");
    } catch (error) {
      console.error("Could not read the shared test scenario URL.", error);
    }
  }

  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = normalizedSettings(JSON.parse(saved));
      if (parsed) return parsed;
      console.error("Saved test scenario settings are invalid; using defaults.");
    }
  } catch (error) {
    console.error("Could not read saved test scenario settings.", error);
  }
  return DEFAULT_FIXTURE_SETTINGS;
}

export function saveFixtureSettings(settings: FixtureSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Could not save test scenario settings.", error);
  }
}

export function clearFixtureSettings(): void {
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch (error) {
    console.error("Could not clear test scenario settings.", error);
  }
}

/** True when the URL carries a shared scenario (`?dev-scenario=...`). */
export function hasFixtureReplay(): boolean {
  return new URLSearchParams(window.location.search).has("dev-scenario");
}

/**
 * Builds a shareable link that always lands on the `/dev` route, so the
 * recipient unlocks the same scenario without extra steps.
 */
export function createFixtureReplayUrl(settings: FixtureSettings): string {
  const url = new URL(window.location.href);
  if (!isDevPathname(url.pathname)) {
    url.pathname = DEV_ROUTE;
  }
  url.searchParams.set(
    "dev-scenario",
    JSON.stringify({ ...settings, enabled: true }),
  );
  return url.toString();
}
