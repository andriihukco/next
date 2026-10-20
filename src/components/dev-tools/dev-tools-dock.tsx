import { useState } from "react";
import { Button } from "../ui/button";
import { MaterialIcon } from "../ui/material-icon";
import { DevToolsAdminTab, type DevDatasetSummary } from "./dev-tools-admin-tab";
import { DevToolsDiagnosticsTab } from "./dev-tools-diagnostics-tab";
import { DevToolsFixturesTab } from "./dev-tools-fixtures-tab";
import { DevToolsRuntimeTab } from "./dev-tools-runtime-tab";
import {
  createFixtureReplayUrl,
  type FixtureSettings,
} from "../../lib/dev-fixture-settings";
import { runFixtureChecks } from "../../lib/dev-tools/checks";
import {
  buildDiagnosticsReport,
  buildStateExport,
  downloadJson,
  timestampedFilename,
} from "../../lib/dev-tools/diagnostics";
import { useFps } from "../../lib/dev-tools/use-fps";
import {
  useDevToolsPanel,
  type DevToolsTab,
} from "../../lib/dev-tools/use-dev-tools-panel";
import type {
  DevRuntimeSnapshot,
  DevScenarioSnapshot,
} from "../../lib/dev-tools/types";
import type { FixtureCheckResult } from "../../types/ui";

export type DevToolsDockProps = {
  runtime: DevRuntimeSnapshot;
  settings: FixtureSettings;
  onSettingsChange: (settings: FixtureSettings) => void;
  overridesActive: boolean;
  onOpenAdmin: () => void;
  onShowOnboarding: () => void;
  onSpawn: (count: number) => void;
  onResetSettings: () => void;
  onClearStorage: () => void;
  onClearOverrides: () => void;
  datasets: DevDatasetSummary[];
  onboardingPreview: boolean;
  onOnboardingPreviewChange: (enabled: boolean) => void;
};

const TABS: { id: DevToolsTab; label: string; icon: string }[] = [
  { id: "fixtures", label: "Дані", icon: "science" },
  { id: "runtime", label: "Runtime", icon: "speed" },
  { id: "diagnostics", label: "Діагностика", icon: "bug_report" },
  { id: "admin", label: "Адмін", icon: "admin_panel_settings" },
];

export function DevToolsDock({
  runtime,
  settings,
  onSettingsChange,
  overridesActive,
  onOpenAdmin,
  onShowOnboarding,
  onSpawn,
  onResetSettings,
  onClearStorage,
  onClearOverrides,
  datasets,
  onboardingPreview,
  onOnboardingPreviewChange,
}: DevToolsDockProps) {
  const { open, tab, position, setTab, close, resetPosition, handlers } =
    useDevToolsPanel(true);
  const [status, setStatus] = useState("");
  const [checks, setChecks] = useState<FixtureCheckResult[] | null>(null);
  // The frame meter only runs while the panel is open.
  const fps = useFps(open);

  const liveRuntime: DevRuntimeSnapshot = { ...runtime, fps };
  const scenario: DevScenarioSnapshot = {
    enabled: settings.enabled,
    scenario: settings.scenario,
    vehicleCount: settings.vehicleCount,
    averageSpeed: settings.averageSpeed,
    seed: settings.seed,
  };

  const copyToClipboard = async (
    text: string,
    successMessage: string,
    failureMessage: string,
  ): Promise<void> => {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard access is unavailable in this browser.");
      }
      await navigator.clipboard.writeText(text);
      setStatus(successMessage);
    } catch (error) {
      console.error(failureMessage, error);
      setStatus("Не вдалося скопіювати дані. Перевірте дозвіл браузера.");
    }
  };

  const handleSettingsChange = (next: FixtureSettings): void => {
    setChecks(null);
    setStatus("");
    onSettingsChange(next);
  };

  const handleRunChecks = (): void => {
    setChecks(runFixtureChecks(settings));
  };

  const handleCopyReplay = (): void => {
    void copyToClipboard(
      createFixtureReplayUrl(settings),
      "Посилання для відтворення скопійовано.",
      "Could not copy the test scenario URL.",
    );
  };

  const handleCopyReport = (): void => {
    void copyToClipboard(
      buildDiagnosticsReport(liveRuntime, scenario),
      "Діагностику скопійовано.",
      "Could not copy the developer diagnostics.",
    );
  };

  const handleExportState = (): void => {
    downloadJson(
      buildStateExport(liveRuntime, scenario, { overridesActive }),
      timestampedFilename("eway-dev-state"),
    );
    setStatus("Стан експортовано у JSON-файл.");
  };

  const handleClearStorage = (): void => {
    onClearStorage();
    setChecks(null);
    setStatus("Локальний dev-стан очищено.");
  };

  const handleClearOverrides = (): void => {
    onClearOverrides();
    setStatus("Локальні перевизначення очищено.");
  };

  const handleResetSettings = (): void => {
    onResetSettings();
    setChecks(null);
    setStatus("Налаштування сценарію скинуто.");
  };

  const dockClass = [
    "dev-tools-panel",
    position.x < window.innerWidth / 2 ? "dock-left" : "dock-right",
    position.y > window.innerHeight / 2 ? "dock-above" : "dock-below",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="dev-tools-dock" style={{ left: position.x, top: position.y }}>
      <Button
        type="button"
        className="dev-tools-trigger"
        aria-label={
          open
            ? "Закрити інструменти розробника"
            : "Відкрити інструменти розробника"
        }
        aria-expanded={open}
        aria-controls="dev-tools-panel"
        title="Інструменти розробника (Ctrl/⌘ + Shift + D)"
        {...handlers}
      >
        <MaterialIcon name="build" size={22} />
        <span className="dev-tools-badge">DEV</span>
        {settings.enabled && (
          <span className="dev-tools-dot" aria-hidden="true" />
        )}
      </Button>

      {open && (
        <section
          id="dev-tools-panel"
          className={dockClass}
          aria-label="Інструменти розробника"
        >
          <header>
            <div>
              <strong>Інструменти розробника</strong>
              <small>Маршрут /dev · Ctrl/⌘ + Shift + D</small>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Закрити інструменти розробника"
              onClick={close}
            >
              <MaterialIcon name="close" size={18} />
            </Button>
          </header>

          <div className="dev-tools-tabs" role="tablist" aria-label="Розділи">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`dev-tools-tab-${item.id}`}
                aria-selected={tab === item.id}
                aria-controls="dev-tools-tabpanel"
                className={tab === item.id ? "active" : ""}
                onClick={() => setTab(item.id)}
              >
                <MaterialIcon name={item.icon} size={16} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div
            id="dev-tools-tabpanel"
            role="tabpanel"
            aria-labelledby={`dev-tools-tab-${tab}`}
            className="dev-tools-tabpanel"
          >
            {tab === "fixtures" && (
              <DevToolsFixturesTab
                settings={settings}
                onChange={handleSettingsChange}
                checks={checks}
                onRunChecks={handleRunChecks}
                onCopyReplay={handleCopyReplay}
                onboardingPreview={onboardingPreview}
                onOnboardingPreviewChange={onOnboardingPreviewChange}
                onShowOnboarding={onShowOnboarding}
              />
            )}
            {tab === "runtime" && (
              <DevToolsRuntimeTab
                runtime={liveRuntime}
                scenario={scenario}
                onSpawn={onSpawn}
                onResetPosition={resetPosition}
              />
            )}
            {tab === "diagnostics" && (
              <DevToolsDiagnosticsTab
                runtime={liveRuntime}
                scenario={scenario}
                onCopyReport={handleCopyReport}
                onExportState={handleExportState}
                onClearStorage={handleClearStorage}
                onResetSettings={handleResetSettings}
              />
            )}
            {tab === "admin" && (
              <DevToolsAdminTab
                datasets={datasets}
                overridesActive={overridesActive}
                onOpenAdmin={onOpenAdmin}
                onClearOverrides={handleClearOverrides}
              />
            )}
          </div>

          <p className="dev-tools-status" role="status" aria-live="polite">
            {status ||
              (settings.enabled
                ? "Активні локальні тестові дані (лише на /dev)."
                : "Зараз показуються дані з сервера.")}
          </p>
        </section>
      )}
    </div>
  );
}
