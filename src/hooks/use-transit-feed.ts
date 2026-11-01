import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";
import { readAdminOverride } from "../lib/admin-overrides";
import { isAirAlert, isArrayOf, isShelter, isStop, isVehicle } from "../lib/app-validators";
import type { FixtureSettings } from "../lib/dev-fixture-settings";
import {
  advanceFixtureVehicles,
  createFixtureVehicles,
  getFixtureAirAlert,
  getFixtureStops,
} from "../lib/dev-fixtures";
import { getScenarioMeta } from "../lib/dev-tools/scenarios";
import type { AirAlert, Shelter, ShelterLoadState, Stop, Vehicle } from "../lib/app-types";

export type LoadStatus = "loading" | "ready" | "error";

const UNKNOWN_AIR_ALERT: AirAlert = {
  status: "unknown",
  level: null,
  updatedAt: 0,
  source: "alerts.in.ua",
};

type TransitFeedOptions = {
  /** True on the `/dev` route; only then can fixtures replace live data. */
  devToolsActive: boolean;
  fixtureSettings: FixtureSettings;
  /** Bumped to reload every feed after local overrides are cleared. */
  resetToken: number;
};

/**
 * Live vehicles (2.5 s poll), stops, air alert (30 s poll) and shelters (12 h poll).
 * On `/dev` with fixtures on, simulated data replaces the live feeds.
 * Local admin overrides always win over both.
 */
export function useTransitFeed({ devToolsActive, fixtureSettings, resetToken }: TransitFeedOptions) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() =>
    readAdminOverride("vehicles", [], isArrayOf(isVehicle)),
  );
  const [transitDataStatus, setTransitDataStatus] = useState<LoadStatus>("loading");
  const [stops, setStops] = useState<Stop[]>(() => readAdminOverride("stops", [], isArrayOf(isStop)));
  const [shelters, setShelters] = useState<Shelter[]>(() =>
    readAdminOverride("shelters", [], isArrayOf(isShelter)),
  );
  const [shelterLoadState, setShelterLoadState] = useState<ShelterLoadState>("loading");
  const [airAlert, setAirAlert] = useState<AirAlert>(() =>
    readAdminOverride("air-alert", UNKNOWN_AIR_ALERT, isAirAlert),
  );

  useEffect(() => {
    const fixturesActive = devToolsActive && fixtureSettings.enabled;
    const meta = getScenarioMeta(fixtureSettings.scenario);
    const latency = fixturesActive && meta.network === "slow" ? meta.latencyMs : 0;

    if (fixturesActive && meta.network === "offline") {
      setVehicles(readAdminOverride("vehicles", [], isArrayOf(isVehicle)));
      setTransitDataStatus("error");
      return;
    }

    if (fixturesActive && latency === 0) {
      setVehicles(
        readAdminOverride<Vehicle[]>("vehicles", createFixtureVehicles(fixtureSettings), isArrayOf(isVehicle)),
      );
      setTransitDataStatus("ready");
      let previousTick = performance.now();
      const timer = window.setInterval(() => {
        const now = performance.now();
        const elapsedSeconds = Math.min((now - previousTick) / 1000, 5);
        previousTick = now;
        setVehicles((current) => advanceFixtureVehicles(current, elapsedSeconds));
      }, 1000);
      return () => window.clearInterval(timer);
    }
    let active = true;
    setTransitDataStatus("loading");
    const load = async (): Promise<void> => {
      try {
        const response = await fetch(apiUrl("/api/vehicles"));
        if (!response.ok) {
          throw new Error(`Transit API returned ${response.status}.`);
        }
        const payload = (await response.json()) as { data?: Vehicle[] };
        if (latency > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, latency));
        }
        if (active) {
          setVehicles(readAdminOverride("vehicles", payload.data ?? [], isArrayOf(isVehicle)));
          setTransitDataStatus("ready");
        }
      } catch (error) {
        console.error("Live transit data is unavailable", error);
        if (active) setTransitDataStatus("error");
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), latency > 0 ? latency + 2500 : 2500);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [resetToken, devToolsActive, fixtureSettings]);

  useEffect(() => {
    const fixturesActive = devToolsActive && fixtureSettings.enabled;
    const meta = getScenarioMeta(fixtureSettings.scenario);
    if (fixturesActive && meta.network === "offline") {
      setStops(readAdminOverride("stops", [], isArrayOf(isStop)));
      return;
    }
    if (fixturesActive) {
      setStops(readAdminOverride("stops", getFixtureStops(), isArrayOf(isStop)));
      return;
    }
    let active = true;
    const load = async (): Promise<void> => {
      try {
        const response = await fetch(apiUrl("/api/stops"));
        const payload = (await response.json()) as { data?: Stop[] };
        if (active) setStops(readAdminOverride("stops", payload.data ?? [], isArrayOf(isStop)));
      } catch (error) {
        console.error("Transit stop data is unavailable", error);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [resetToken, devToolsActive, fixtureSettings]);

  useEffect(() => {
    const fixturesActive = devToolsActive && fixtureSettings.enabled;
    const meta = getScenarioMeta(fixtureSettings.scenario);
    if (fixturesActive && meta.network === "offline") {
      setAirAlert(
        readAdminOverride("air-alert", { ...UNKNOWN_AIR_ALERT, source: "dev: network loss" }, isAirAlert),
      );
      return;
    }
    if (fixturesActive) {
      setAirAlert(
        readAdminOverride<AirAlert>("air-alert", getFixtureAirAlert(fixtureSettings.scenario), isAirAlert),
      );
      return;
    }
    let active = true;
    const load = async (): Promise<void> => {
      try {
        const response = await fetch(apiUrl("/api/air-alert"));
        const payload = (await response.json()) as { data?: AirAlert };
        if (active && payload.data) {
          setAirAlert(readAdminOverride("air-alert", payload.data, isAirAlert));
        }
      } catch (error) {
        console.error("Air alert status is unavailable", error);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [resetToken, devToolsActive, fixtureSettings]);

  useEffect(() => {
    let active = true;
    const load = async (): Promise<void> => {
      try {
        const response = await fetch(apiUrl("/api/shelters"));
        if (!response.ok) {
          throw new Error(`Shelter data request failed with ${response.status}`);
        }
        const payload = (await response.json()) as { data?: Shelter[] };
        if (!Array.isArray(payload.data)) {
          throw new Error("Shelter data response has an invalid format");
        }
        if (active) {
          setShelters(readAdminOverride("shelters", payload.data, isArrayOf(isShelter)));
          setShelterLoadState("ready");
        }
      } catch (error) {
        console.error("Lviv shelter data is unavailable", error);
        if (active) setShelterLoadState("error");
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 12 * 60 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [resetToken]);

  return {
    vehicles,
    setVehicles,
    transitDataStatus,
    stops,
    setStops,
    shelters,
    setShelters,
    shelterLoadState,
    setShelterLoadState,
    airAlert,
    setAirAlert,
  };
}
