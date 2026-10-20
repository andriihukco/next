import {
  createFixtureRoute,
  createFixtureVehicles,
} from "../dev-fixtures";
import { getScenarioLimits, type FixtureSettings } from "../dev-fixture-settings";
import type { FixtureCheckResult } from "../../types/ui";

/**
 * @file checks.ts
 * @description Smoke tests for the local fixture generator.
 */

export function runFixtureChecks(settings: FixtureSettings): FixtureCheckResult[] {
  try {
    const generated = createFixtureVehicles(settings);
    const repeated = createFixtureVehicles(settings);
    const limits = getScenarioLimits(settings.scenario);
    const expectedCount = Math.min(settings.vehicleCount, limits.maxVehicles);
    const routeGeometryValid = generated.every((vehicle) => {
      const coordinates = createFixtureRoute(vehicle);
      return (
        coordinates.length >= 2 &&
        coordinates.every(
          ([lat, lng]) =>
            Number.isFinite(lat) &&
            Number.isFinite(lng) &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180,
        )
      );
    });
    return [
      {
        label: "Кількість одиниць відповідає сценарію",
        passed: generated.length === expectedCount,
      },
      {
        label: "ID тестових одиниць унікальні",
        passed:
          new Set(generated.map((vehicle) => vehicle.id)).size === generated.length,
      },
      {
        label: "Seed дає відтворюваний результат",
        passed: JSON.stringify(generated) === JSON.stringify(repeated),
      },
      {
        label: "Координати й швидкості валідні",
        passed: generated.every(
          (vehicle) =>
            Number.isFinite(vehicle.lat) &&
            Number.isFinite(vehicle.lng) &&
            Number.isFinite(vehicle.speed) &&
            vehicle.speed >= 0,
        ),
      },
      {
        label: "Для кожного борту знайдено GTFS-геометрію",
        passed: routeGeometryValid,
      },
    ];
  } catch (error) {
    console.error("Fixture smoke checks could not complete.", error);
    return [
      {
        label: `Перевірки зупинено: ${
          error instanceof Error ? error.message : "невідома помилка"
        }`,
        passed: false,
      },
    ];
  }
}
