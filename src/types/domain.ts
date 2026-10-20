/**
 * @file domain.ts
 * @description Core domain entity types that mirror the backend/API shapes.
 *   Import these instead of redefining them in component files.
 */

export type VehicleType = "tram" | "trolleybus" | "bus" | "taxi";

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

export type AirAlertStatus = "active" | "clear" | "unknown";

export type AirAlert = {
  status: AirAlertStatus;
  level: "red" | "yellow" | null;
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
