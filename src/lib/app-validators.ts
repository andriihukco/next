/** Runtime guards for values read from storage, the API, or dev fixtures. */
import { CITY_PLACE_CATEGORY_COLORS } from "./city-places";
import type { CityEvent } from "./city-fixtures";
import type { CityPlace } from "./city-places";
import { isFixtureScenario, type FixtureSettings } from "./dev-fixture-settings";
import type { AirAlert, AirAlertThreat, Shelter, Stop, Vehicle } from "./app-types";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
export const isString = (value: unknown): value is string =>
  typeof value === "string";
export const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);
export const isVehicle = (value: unknown): value is Vehicle =>
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
export const isStop = (value: unknown): value is Stop =>
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
export const isShelter = (value: unknown): value is Shelter =>
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
export const isCityPlace = (value: unknown): value is CityPlace =>
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
export const isCoordinates = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  value.length === 2 &&
  isNumber(value[0]) &&
  isNumber(value[1]);
export const isCityEvent = (value: unknown): value is CityEvent =>
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
export const isAirAlertThreat = (value: unknown): value is AirAlertThreat =>
  isRecord(value) &&
  isString(value.time) &&
  (value.kind === "drone" || value.kind === "bomb" || value.kind === "other") &&
  isString(value.kindLabel) &&
  isString(value.place) &&
  isString(value.placeUk) &&
  isString(value.note);
export const isAirAlert = (value: unknown): value is AirAlert =>
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
export const isFixtureSettings = (value: unknown): value is FixtureSettings =>
  isRecord(value) &&
  typeof value.enabled === "boolean" &&
  isFixtureScenario(value.scenario) &&
  isNumber(value.vehicleCount) &&
  Number.isInteger(value.vehicleCount) &&
  isNumber(value.averageSpeed) &&
  isNumber(value.seed) &&
  Number.isInteger(value.seed);

export const isArrayOf =
  <T,>(guard: (value: unknown) => value is T) =>
  (value: unknown): value is T[] =>
    Array.isArray(value) && value.every(guard);
