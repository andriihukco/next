/** App-level view and entity types. Domain types live in src/types/domain.ts. */

export type VehicleType = "tram" | "trolleybus" | "bus" | "taxi";
export type AppView = "city" | "map" | "admin";
export type DetailReturnView = "city" | "map";
export type VehicleFilter = VehicleType;
export type Vehicle = {
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
export type Stop = {
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
export type StopTab = "overview" | "schedule" | "facilities" | "contacts" | "reviews";
export type AirAlertStatus = "active" | "clear" | "unknown";
export type AirAlertThreatKind = "drone" | "bomb" | "other";
export type AirAlertThreat = {
  time: string;
  kind: AirAlertThreatKind;
  kindLabel: string;
  place: string;
  placeUk: string;
  note: string;
};
export type AirAlert = {
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
export type Shelter = {
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
export type ShelterLoadState = "loading" | "ready" | "error";

export type AdminDatasetId =
  | "vehicles"
  | "stops"
  | "shelters"
  | "places"
  | "education"
  | "events"
  | "air-alert"
  | "fixture-settings";
export type AdminOverrides = Partial<Record<AdminDatasetId, unknown>>;
