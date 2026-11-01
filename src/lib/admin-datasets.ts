import type { AdminDataset } from "../components/admin-panel";
import { persistAdminOverride } from "./admin-overrides";
import type { AdminDatasetId, AirAlert, Shelter, Stop, Vehicle } from "./app-types";
import {
  isAirAlert,
  isArrayOf,
  isCityEvent,
  isCityPlace,
  isFixtureSettings,
  isShelter,
  isStop,
  isVehicle,
} from "./app-validators";
import type { CityEvent } from "./listing-types";
import type { CityPlace } from "./city-places";
import { saveFixtureSettings, type FixtureSettings } from "./dev-fixture-settings";

export type AdminData = {
  vehicles: Vehicle[];
  stops: Stop[];
  shelters: Shelter[];
  places: CityPlace[];
  events: CityEvent[];
  airAlert: AirAlert;
  fixtureSettings: FixtureSettings;
};

/** Where a saved dataset goes after it passes validation and is stored locally. */
export type AdminDataSink = {
  vehicles: (value: Vehicle[]) => void;
  stops: (value: Stop[]) => void;
  shelters: (value: Shelter[]) => void;
  places: (value: CityPlace[]) => void;
  events: (value: CityEvent[]) => void;
  airAlert: (value: AirAlert) => void;
  fixtureSettings: (value: FixtureSettings) => void;
  /** Called after any override is stored. */
  overrideSaved: () => void;
};

export function buildAdminDatasets(data: AdminData): AdminDataset[] {
  return [
    {
      id: "vehicles",
      label: "Транспорт",
      description: "Борти та маршрути. Зміни залишаються в цьому браузері.",
      data: data.vehicles,
    },
    { id: "stops", label: "Зупинки", description: "Зупинки та маршрути громадського транспорту.", data: data.stops },
    { id: "shelters", label: "Укриття", description: "Публічні координати й атрибути укриттів.", data: data.shelters },
    { id: "places", label: "Місця", description: "POI, доступні в поточній області карти.", data: data.places },
    { id: "events", label: "Події", description: "Події та локації міської афіші.", data: data.events },
    {
      id: "air-alert",
      label: "Повітряна тривога",
      description: "Статус індикатора повітряної тривоги.",
      data: data.airAlert,
    },
    {
      id: "fixture-settings",
      label: "Сценарій",
      description: "Налаштування локальних транспортних сценаріїв.",
      data: data.fixtureSettings,
    },
  ];
}

/** One-line counts for the dev tools dock. */
export function summarizeAdminDatasets(datasets: AdminDataset[]) {
  return datasets.map((dataset) => ({
    id: dataset.id,
    label: dataset.label,
    value: Array.isArray(dataset.data)
      ? String(dataset.data.length)
      : typeof dataset.data === "object" && dataset.data !== null
        ? "об'єкт"
        : "—",
  }));
}

const SAVE_FAILED = "Не вдалося зберегти локальні зміни.";

/** Validates and stores one dataset. Returns an error message, or null on success. */
export function saveAdminDataset(id: string, value: unknown, sink: AdminDataSink): string | null {
  const saveOverride = (key: AdminDatasetId): boolean => {
    const error = persistAdminOverride(key, value);
    if (!error) sink.overrideSaved();
    return Boolean(error);
  };
  switch (id) {
    case "vehicles":
      if (!isArrayOf(isVehicle)(value)) return "Транспорт має бути масивом з коректними полями Vehicle.";
      if (saveOverride("vehicles")) return SAVE_FAILED;
      sink.vehicles(value);
      return null;
    case "stops":
      if (!isArrayOf(isStop)(value)) return "Зупинки мають містити id, назву, координати й маршрути.";
      if (saveOverride("stops")) return SAVE_FAILED;
      sink.stops(value);
      return null;
    case "shelters":
      if (!isArrayOf(isShelter)(value)) return "Укриття мають бути масивом з коректними полями.";
      if (saveOverride("shelters")) return SAVE_FAILED;
      sink.shelters(value);
      return null;
    case "places":
      if (!isArrayOf(isCityPlace)(value)) return "Місця мають містити коректну категорію та координати.";
      if (saveOverride("places")) return SAVE_FAILED;
      sink.places(value);
      return null;
    case "events":
      if (!isArrayOf(isCityEvent)(value)) return "Події мають містити назву, час, місце та координати.";
      if (saveOverride("events")) return SAVE_FAILED;
      sink.events(value);
      return null;
    case "air-alert":
      if (!isAirAlert(value)) return "Статус тривоги має бути коректним об’єктом AirAlert.";
      if (saveOverride("air-alert")) return SAVE_FAILED;
      sink.airAlert(value);
      return null;
    case "fixture-settings":
      if (!isFixtureSettings(value)) return "Налаштування сценарію мають некоректний формат.";
      if (saveOverride("fixture-settings")) return SAVE_FAILED;
      sink.fixtureSettings(value);
      saveFixtureSettings(value);
      return null;
    default:
      return "Невідомий набір даних.";
  }
}
