/**
 * @file ui.ts
 * @description UI-only state types — not backed by API shapes.
 */

export type AppView = "city" | "map" | "admin";
export type DetailReturnView = "city" | "map";
export type StopTab = "overview" | "schedule" | "facilities" | "contacts" | "reviews";
export type ShelterLoadState = "loading" | "ready" | "error";
export type DataStatus = "loading" | "ready" | "error";

export type SpotlightRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type DevToolsDragState = {
  pointerId: number;
  startX: number;
  startY: number;
  left: number;
  top: number;
  moved: boolean;
};

export type FixtureCheckResult = {
  label: string;
  passed: boolean;
};

export type AdminDatasetId =
  | "vehicles"
  | "stops"
  | "shelters"
  | "places"
  | "education"
  | "events"
  | "air-alert"
  | "fixture-settings";
