import type {
  DevBuildInfo,
  DevRuntimeSnapshot,
  DevScenarioSnapshot,
} from "./types";
import { getScenarioMeta } from "./scenarios";

/**
 * @file diagnostics.ts
 * @description Builds the human readable diagnostics report and the
 * machine readable state export.
 */

export function readBuildInfo(): DevBuildInfo {
  return {
    mode: import.meta.env.MODE,
    env: import.meta.env.VITE_APP_ENV ?? "unknown",
    version: import.meta.env.VITE_APP_VERSION ?? "dev",
    buildTime: import.meta.env.VITE_BUILD_TIME ?? "unknown",
    userAgent: navigator.userAgent,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    dpr: window.devicePixelRatio,
  };
}

export function buildDiagnosticsReport(
  runtime: DevRuntimeSnapshot,
  scenario: DevScenarioSnapshot,
): string {
  const build = readBuildInfo();
  const meta = getScenarioMeta(scenario.scenario);
  return [
    "un dev diagnostics",
    `time: ${new Date().toISOString()}`,
    `route: ${window.location.pathname}`,
    `build: ${build.mode} / ${build.env} / ${build.version}`,
    `browser online: ${runtime.online}`,
    `viewport: ${build.viewport} @${build.dpr}x`,
    `map: ${runtime.mapReady ? "ready" : "loading"}`,
    `view: ${runtime.activeView}`,
    `places: ${runtime.cityPlacesStatus} (${runtime.cityPlacesCount})`,
    `vehicles: ${runtime.vehiclesCount} (${runtime.transitDataStatus})`,
    `stops: ${runtime.stopsCount}`,
    `shelters: ${runtime.shelterLoadState} (${runtime.sheltersCount})`,
    `fps: ${runtime.fps}`,
    `fixture mode: ${scenario.enabled ? "on" : "off"}`,
    `scenario: ${scenario.scenario} (${meta.label})`,
    `scenario network: ${meta.network}`,
    `seed: ${scenario.seed}`,
    `average speed: ${scenario.averageSpeed}`,
  ].join("\n");
}

export function buildStateExport(
  runtime: DevRuntimeSnapshot,
  scenario: DevScenarioSnapshot,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    generatedAt: new Date().toISOString(),
    route: window.location.pathname,
    build: readBuildInfo(),
    scenario: { ...scenario },
    runtime: { ...runtime },
    ...extra,
  };
}

/** Triggers a JSON download of the current developer state. */
export function downloadJson(payload: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function timestampedFilename(prefix: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `${prefix}-${stamp}.json`;
}
