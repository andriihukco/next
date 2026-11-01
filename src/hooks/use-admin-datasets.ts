import { buildAdminDatasets, saveAdminDataset, summarizeAdminDatasets } from "../lib/admin-datasets";
import type { useCityPlaces } from "./use-city-places";
import type { useDevFixtures } from "./use-dev-fixtures";
import type { useTransitFeed } from "./use-transit-feed";

/** Datasets the dev admin panel can edit, and where each saved dataset goes. */
export function useAdminDatasets(
  feed: ReturnType<typeof useTransitFeed>,
  places: ReturnType<typeof useCityPlaces>,
  dev: ReturnType<typeof useDevFixtures>,
) {
  const datasets = buildAdminDatasets({
    vehicles: feed.vehicles,
    stops: feed.stops,
    shelters: feed.shelters,
    places: places.cityPlaces,
    events: places.eventData,
    airAlert: feed.airAlert,
    fixtureSettings: dev.fixtureSettings,
  });
  const save = (id: string, value: unknown): string | null =>
    saveAdminDataset(id, value, {
      vehicles: feed.setVehicles,
      stops: feed.setStops,
      shelters: (shelters) => {
        feed.setShelters(shelters);
        feed.setShelterLoadState("ready");
      },
      places: places.setCityPlaces,
      events: places.setEventData,
      airAlert: feed.setAirAlert,
      fixtureSettings: dev.setFixtureSettings,
      overrideSaved: dev.markOverridesActive,
    });
  return { datasets, summary: summarizeAdminDatasets(datasets), save };
}
