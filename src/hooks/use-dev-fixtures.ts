import { useState } from "react";
import { persistAdminOverride, readAdminOverride, readAdminOverrides } from "../lib/admin-overrides";
import { isFixtureSettings } from "../lib/app-validators";
import {
  clearFixtureSettings,
  DEFAULT_FIXTURE_SETTINGS,
  getScenarioLimits,
  hasFixtureReplay,
  readFixtureSettings,
  saveFixtureSettings,
  type FixtureSettings,
} from "../lib/dev-fixture-settings";
import { isDevRouteActive } from "../lib/dev-tools/route";
import { ADMIN_OVERRIDES_KEY, clearDevStorage } from "../lib/dev-tools/storage";
import { ONBOARDING_PREVIEW_KEY, readOnboardingValue, saveOnboardingValue } from "../features/onboarding/storage";

/** Dev-route state: simulated transit scenario, local admin overrides, and the onboarding preview flag. */
export function useDevFixtures() {
  const [fixtureSettings, setFixtureSettings] = useState<FixtureSettings>(() => {
    const base = readFixtureSettings();
    // A shared scenario link always wins over the locally saved state.
    return hasFixtureReplay() ? base : readAdminOverride("fixture-settings", base, isFixtureSettings);
  });
  const [resetToken, setResetToken] = useState(0);
  const [overridesActive, setOverridesActive] = useState(
    () => Object.keys(readAdminOverrides()).length > 0,
  );
  const [onboardingPreview, setOnboardingPreviewState] = useState(
    () => isDevRouteActive() && readOnboardingValue(ONBOARDING_PREVIEW_KEY) === "true",
  );

  const updateFixtureSettings = (next: FixtureSettings): void => {
    setFixtureSettings(next);
    saveFixtureSettings(next);
    persistAdminOverride("fixture-settings", next);
    if (!next.enabled && window.location.search.includes("dev-scenario=")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("dev-scenario");
      window.history.replaceState({}, "", url);
    }
  };
  const resetFixtureSettings = (): void => updateFixtureSettings({ ...DEFAULT_FIXTURE_SETTINGS });
  const clearAdminOverrides = (): void => {
    try {
      localStorage.removeItem(ADMIN_OVERRIDES_KEY);
    } catch (error) {
      console.error("Could not clear the local admin overrides.", error);
    }
    setOverridesActive(false);
    setResetToken((token) => token + 1);
  };
  const clearDevState = (): void => {
    clearDevStorage();
    clearFixtureSettings();
    setFixtureSettings({ ...DEFAULT_FIXTURE_SETTINGS });
    setOnboardingPreview(false);
    setOverridesActive(false);
    setResetToken((token) => token + 1);
  };
  const spawnFixtureVehicles = (count: number): void => {
    const limits = getScenarioLimits(fixtureSettings.scenario);
    updateFixtureSettings({
      ...fixtureSettings,
      enabled: true,
      vehicleCount: Math.min(limits.maxVehicles, Math.max(1, count)),
    });
  };
  function setOnboardingPreview(enabled: boolean): void {
    setOnboardingPreviewState(enabled);
    saveOnboardingValue(ONBOARDING_PREVIEW_KEY, String(enabled));
  }

  return {
    fixtureSettings,
    setFixtureSettings,
    resetToken,
    overridesActive,
    markOverridesActive: () => setOverridesActive(true),
    onboardingPreview,
    setOnboardingPreview,
    updateFixtureSettings,
    resetFixtureSettings,
    clearAdminOverrides,
    clearDevState,
    spawnFixtureVehicles,
  };
}
