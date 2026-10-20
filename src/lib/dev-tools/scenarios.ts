import type { FixtureScenario } from "../dev-fixture-settings";

/**
 * @file scenarios.ts
 * @description Single source of truth for the developer scenario catalogue.
 * Every scenario describes how the fixture data and the network behave.
 */

export type ScenarioNetwork = "normal" | "offline" | "slow";

export type ScenarioMeta = {
  id: FixtureScenario;
  label: string;
  description: string;
  /** Upper bound for the vehicle counter. */
  maxVehicles: number;
  /** Vehicle count applied when the scenario is picked. */
  defaultVehicles: number;
  /** Average speed (km/h) applied when the scenario is picked. */
  defaultSpeed: number;
  /** How the app pretends the network behaves. */
  network: ScenarioNetwork;
  /** Latency injected into API responses, in ms. */
  latencyMs: number;
};

export const SCENARIOS: ScenarioMeta[] = [
  {
    id: "commute",
    label: "Звичайний день",
    description: "Помірний рух: стандартна кількість транспорту.",
    maxVehicles: 120,
    defaultVehicles: 24,
    defaultSpeed: 26,
    network: "normal",
    latencyMs: 0,
  },
  {
    id: "peak",
    label: "Піковий час",
    description: "Щільний потік: багато транспорту, повільніша швидкість.",
    maxVehicles: 300,
    defaultVehicles: 120,
    defaultSpeed: 16,
    network: "normal",
    latencyMs: 0,
  },
  {
    id: "night",
    label: "Пізній вечір",
    description: "Рідкісні маршрути, максимум 6 одиниць.",
    maxVehicles: 6,
    defaultVehicles: 4,
    defaultSpeed: 22,
    network: "normal",
    latencyMs: 0,
  },
  {
    id: "alert",
    label: "Повітряна тривога",
    description: "Активна тривога та звичайний рух транспорту.",
    maxVehicles: 120,
    defaultVehicles: 24,
    defaultSpeed: 18,
    network: "normal",
    latencyMs: 0,
  },
  {
    id: "no-service",
    label: "Без транспорту",
    description: "Порожня мережа: перевірка станів без даних.",
    maxVehicles: 0,
    defaultVehicles: 0,
    defaultSpeed: 0,
    network: "normal",
    latencyMs: 0,
  },
  {
    id: "network-loss",
    label: "Втрата мережі",
    description: "API не відповідає: помилка завантаження та порожні дані.",
    maxVehicles: 120,
    defaultVehicles: 0,
    defaultSpeed: 26,
    network: "offline",
    latencyMs: 0,
  },
  {
    id: "slow-api",
    label: "Повільний API",
    description: "Відповідь сервера затримується на 6 секунд.",
    maxVehicles: 120,
    defaultVehicles: 24,
    defaultSpeed: 26,
    network: "slow",
    latencyMs: 6000,
  },
];

export function getScenarioMeta(scenario: FixtureScenario): ScenarioMeta {
  return (
    SCENARIOS.find((item) => item.id === scenario) ??
    SCENARIOS[0]
  );
}

export function scenarioLabel(scenario: FixtureScenario): string {
  return getScenarioMeta(scenario).label;
}
