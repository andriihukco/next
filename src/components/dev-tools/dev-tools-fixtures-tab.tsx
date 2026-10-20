import { useState } from "react";
import { Button } from "../ui/button";
import { MaterialIcon } from "../ui/material-icon";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import {
  getScenarioLimits,
  settingsForScenario,
  type FixtureScenario,
  type FixtureSettings,
} from "../../lib/dev-fixture-settings";
import { SCENARIOS, getScenarioMeta } from "../../lib/dev-tools/scenarios";
import type { FixtureCheckResult } from "../../types/ui";

type DevToolsFixturesTabProps = {
  settings: FixtureSettings;
  onChange: (settings: FixtureSettings) => void;
  checks: FixtureCheckResult[] | null;
  onRunChecks: () => void;
  onCopyReplay: () => void;
  onboardingPreview: boolean;
  onOnboardingPreviewChange: (enabled: boolean) => void;
  onShowOnboarding: () => void;
};

const STRESS_PRESETS = [25, 50, 100, 200];

export function DevToolsFixturesTab({
  settings,
  onChange,
  checks,
  onRunChecks,
  onCopyReplay,
  onboardingPreview,
  onOnboardingPreviewChange,
  onShowOnboarding,
}: DevToolsFixturesTabProps) {
  const [seedDraft, setSeedDraft] = useState<string | null>(null);
  const limits = getScenarioLimits(settings.scenario);
  const meta = getScenarioMeta(settings.scenario);
  const countDisabled = settings.scenario === "no-service";

  const commitSeed = (raw: string): void => {
    setSeedDraft(raw);
    const seed = Number(raw);
    if (Number.isSafeInteger(seed) && seed >= 0) {
      onChange({ ...settings, seed });
    }
  };

  return (
    <div className="dev-tools-tab-body">
      <label className="dev-tools-toggle" htmlFor="dev-fixtures-enabled">
        <span>Увімкнути тестові дані</span>
        <Switch
          id="dev-fixtures-enabled"
          checked={settings.enabled}
          onCheckedChange={(enabled) =>
            onChange({ ...settings, enabled })
          }
        />
      </label>
      <p className="dev-tools-hint">
        Тестові дані діють лише на маршруті <code>/dev</code>. Після виходу з
        нього застосунок повертається до серверних даних.
      </p>

      <label className="dev-tools-toggle" htmlFor="dev-onboarding-preview">
        <span>Повторювати onboarding після перезавантаження</span>
        <Switch
          id="dev-onboarding-preview"
          checked={onboardingPreview}
          onCheckedChange={onOnboardingPreviewChange}
        />
      </label>
      <div className="dev-tools-actions">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onShowOnboarding}
        >
          <MaterialIcon name="play_circle" size={17} />
          Переглянути onboarding
        </Button>
      </div>

      <label className="dev-tools-field" htmlFor="dev-fixture-scenario">
        Сценарій
        <select
          id="dev-fixture-scenario"
          value={settings.scenario}
          onChange={(event) =>
            onChange(
              settingsForScenario(
                event.target.value as FixtureScenario,
                settings,
              ),
            )
          }
        >
          {SCENARIOS.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.label}
            </option>
          ))}
        </select>
      </label>
      <p className="dev-tools-hint">{meta.description}</p>
      {meta.network !== "normal" && (
        <p className="dev-tools-hint dev-tools-warning">
          <MaterialIcon name="wifi_off" size={14} />
          Цей сценарій імітує мережу (
          {meta.network === "offline" ? "без відповіді" : `затримка ${meta.latencyMs} мс`}
          ), тому дані беруться з сервера, а не з локальних fixtures.
        </p>
      )}

      <label className="dev-tools-field">
        Кількість транспорту · {settings.vehicleCount}
        <Slider
          aria-label="Кількість тестового транспорту"
          min={0}
          max={limits.maxVehicles}
          value={[settings.vehicleCount]}
          disabled={countDisabled}
          onValueChange={(value) =>
            onChange({
              ...settings,
              vehicleCount: Math.min(
                limits.maxVehicles,
                value[0] ?? settings.vehicleCount,
              ),
            })
          }
        />
      </label>
      <div className="dev-tools-actions">
        {STRESS_PRESETS.map((count) => (
          <Button
            key={count}
            type="button"
            variant="outline"
            size="sm"
            disabled={countDisabled}
            onClick={() =>
              onChange({
                ...settings,
                enabled: true,
                vehicleCount: Math.min(limits.maxVehicles, count),
              })
            }
          >
            {count}
          </Button>
        ))}
      </div>

      <label className="dev-tools-field">
        Середня швидкість · {settings.averageSpeed} км/год
        <Slider
          aria-label="Середня швидкість тестового транспорту"
          min={0}
          max={80}
          value={[settings.averageSpeed]}
          onValueChange={(value) =>
            onChange({
              ...settings,
              averageSpeed: value[0] ?? settings.averageSpeed,
            })
          }
        />
      </label>

      <label className="dev-tools-field" htmlFor="dev-fixture-seed">
        Seed для повторюваного результату
        <input
          id="dev-fixture-seed"
          className="dev-tools-seed"
          type="number"
          min="0"
          step="1"
          value={seedDraft ?? settings.seed}
          onChange={(event) => commitSeed(event.target.value)}
          onBlur={() => setSeedDraft(null)}
        />
      </label>
      <div className="dev-tools-actions">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              ...settings,
              seed: Math.floor(Math.random() * 100000),
            })
          }
        >
          <MaterialIcon name="casino" size={17} />
          Випадковий seed
        </Button>
      </div>

      <div className="dev-tools-actions">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCopyReplay}
        >
          <MaterialIcon name="content_copy" size={16} />
          Копіювати replay
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRunChecks}
        >
          <MaterialIcon name="fact_check" size={17} />
          Перевірити fixtures
        </Button>
      </div>

      {checks && (
        <div className="dev-tools-checks" role="status" aria-live="polite">
          <strong>
            Fixture smoke test ·{" "}
            {checks.filter((check) => check.passed).length}/{checks.length}
          </strong>
          {checks.map((check) => (
            <div
              className={check.passed ? "passed" : "failed"}
              key={check.label}
            >
              <MaterialIcon
                name={check.passed ? "check_circle" : "error"}
                size={16}
              />
              <span>{check.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
