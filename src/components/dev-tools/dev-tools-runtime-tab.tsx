import { Button } from "../ui/button";
import { MaterialIcon } from "../ui/material-icon";
import { getScenarioLimits } from "../../lib/dev-fixture-settings";
import { getScenarioMeta } from "../../lib/dev-tools/scenarios";
import type {
  DevRuntimeSnapshot,
  DevScenarioSnapshot,
} from "../../lib/dev-tools/types";

type DevToolsRuntimeTabProps = {
  runtime: DevRuntimeSnapshot;
  scenario: DevScenarioSnapshot;
  onSpawn: (count: number) => void;
  onResetPosition: () => void;
};

const STRESS_PRESETS = [50, 100, 200, 300];

export function DevToolsRuntimeTab({
  runtime,
  scenario,
  onSpawn,
  onResetPosition,
}: DevToolsRuntimeTabProps) {
  const meta = getScenarioMeta(scenario.scenario);
  const limits = getScenarioLimits(scenario.scenario);

  return (
    <div className="dev-tools-tab-body">
      <div className="dev-tools-diagnostics" aria-label="Стан застосунку">
        <strong>Runtime</strong>
        <div>
          <span>Мапа</span>
          <b>{runtime.mapReady ? "READY" : "LOADING"}</b>
        </div>
        <div>
          <span>Вид</span>
          <b>{runtime.activeView}</b>
        </div>
        <div>
          <span>Місця · зупинки</span>
          <b>
            {runtime.cityPlacesCount} · {runtime.stopsCount}
          </b>
        </div>
        <div>
          <span>Борти · укриття</span>
          <b>
            {runtime.vehiclesCount} · {runtime.sheltersCount}
          </b>
        </div>
        <div>
          <span>Дані місць · укриттів</span>
          <b>
            {runtime.cityPlacesStatus} · {runtime.shelterLoadState}
          </b>
        </div>
        <div>
          <span>Транспорт</span>
          <b>{runtime.transitDataStatus}</b>
        </div>
        <div>
          <span>Мережа</span>
          <b>{runtime.online ? "ONLINE" : "OFFLINE"}</b>
        </div>
        <div>
          <span>FPS</span>
          <b>{runtime.fps > 0 ? runtime.fps : "—"}</b>
        </div>
      </div>

      <div className="dev-tools-subsection">
        <strong>Стрес-тест</strong>
        <p className="dev-tools-hint">
          Миттєво додає одиниць транспорту, щоб перевірити продуктивність
          карти. Максимум для сценарію «{meta.label}» — {limits.maxVehicles}.
        </p>
        <div className="dev-tools-actions">
          {STRESS_PRESETS.map((count) => (
            <Button
              key={count}
              type="button"
              variant="outline"
              size="sm"
              disabled={count > limits.maxVehicles}
              onClick={() => onSpawn(count)}
            >
              +{count}
            </Button>
          ))}
        </div>
      </div>

      <div className="dev-tools-subsection">
        <strong>Імітація мережі</strong>
        <p className="dev-tools-hint">
          Поточний сценарій імітує мережу:{" "}
          <code>{meta.network === "offline" ? "offline" : meta.network}</code>
          {meta.latencyMs > 0 ? ` (+${meta.latencyMs} мс)` : ""}.
        </p>
      </div>

      <div className="dev-tools-actions">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onResetPosition}
        >
          <MaterialIcon name="restart_alt" size={17} />
          Скинути позицію кнопки
        </Button>
      </div>
    </div>
  );
}
