import type { FixtureScenario } from "../dev-fixture-settings";

/**
 * @file types.ts
 * @description Shared shapes between the developer panel and the app shell.
 */

export type DevRuntimeSnapshot = {
  mapReady: boolean;
  activeView: string;
  transitDataStatus: string;
  cityPlacesStatus: string;
  shelterLoadState: string;
  cityPlacesCount: number;
  stopsCount: number;
  vehiclesCount: number;
  sheltersCount: number;
  online: boolean;
  fps: number;
};

export type DevScenarioSnapshot = {
  enabled: boolean;
  scenario: FixtureScenario;
  vehicleCount: number;
  averageSpeed: number;
  seed: number;
};

export type DevBuildInfo = {
  mode: string;
  env: string;
  version: string;
  buildTime: string;
  userAgent: string;
  viewport: string;
  dpr: number;
};
