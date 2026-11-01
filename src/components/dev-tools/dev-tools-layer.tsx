import type { AppView } from "../../lib/app-types";
import type { useAdminDatasets } from "../../hooks/use-admin-datasets";
import type { useCityPlaces } from "../../hooks/use-city-places";
import type { useDevFixtures } from "../../hooks/use-dev-fixtures";
import type { useTransitFeed } from "../../hooks/use-transit-feed";
import { DevToolsDock } from "./dev-tools-dock";

type DevToolsLayerProps = {
  dev: ReturnType<typeof useDevFixtures>;
  feed: ReturnType<typeof useTransitFeed>;
  places: ReturnType<typeof useCityPlaces>;
  admin: ReturnType<typeof useAdminDatasets>;
  mapReady: boolean;
  activeView: AppView;
  online: boolean;
  onOpenAdmin: () => void;
  onShowOnboarding: () => void;
};

/** Connects the `/dev` dock to live app state. Rendered only on the dev route. */
export function DevToolsLayer({
  dev,
  feed,
  places,
  admin,
  mapReady,
  activeView,
  online,
  onOpenAdmin,
  onShowOnboarding,
}: DevToolsLayerProps) {
  return (
    <DevToolsDock
      runtime={{
        mapReady,
        activeView,
        transitDataStatus: feed.transitDataStatus,
        cityPlacesStatus: places.cityPlacesStatus,
        shelterLoadState: feed.shelterLoadState,
        cityPlacesCount: places.cityPlaces.length,
        stopsCount: feed.stops.length,
        vehiclesCount: feed.vehicles.length,
        sheltersCount: feed.shelters.length,
        online,
        fps: 0,
      }}
      settings={dev.fixtureSettings}
      onSettingsChange={dev.updateFixtureSettings}
      overridesActive={dev.overridesActive}
      onOpenAdmin={onOpenAdmin}
      onShowOnboarding={onShowOnboarding}
      onSpawn={dev.spawnFixtureVehicles}
      onResetSettings={dev.resetFixtureSettings}
      onClearStorage={dev.clearDevState}
      onClearOverrides={dev.clearAdminOverrides}
      datasets={admin.summary}
      onboardingPreview={dev.onboardingPreview}
      onOnboardingPreviewChange={dev.setOnboardingPreview}
    />
  );
}
