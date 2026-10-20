import { Button } from "../ui/button";
import { MaterialIcon } from "../ui/material-icon";
import type {
  DevRuntimeSnapshot,
  DevScenarioSnapshot,
} from "../../lib/dev-tools/types";

type DevToolsDiagnosticsTabProps = {
  runtime: DevRuntimeSnapshot;
  scenario: DevScenarioSnapshot;
  onCopyReport: () => void;
  onExportState: () => void;
  onClearStorage: () => void;
  onResetSettings: () => void;
};

export function DevToolsDiagnosticsTab({
  runtime,
  scenario,
  onCopyReport,
  onExportState,
  onClearStorage,
  onResetSettings,
}: DevToolsDiagnosticsTabProps) {
  return (
    <div className="dev-tools-tab-body">
      <div className="dev-tools-diagnostics" aria-label="Діагностика">
        <strong>Діагностика</strong>
        <div>
          <span>Маршрут</span>
          <b>{window.location.pathname}</b>
        </div>
        <div>
          <span>Сценарій</span>
          <b>{scenario.scenario}</b>
        </div>
        <div>
          <span>Seed</span>
          <b>{scenario.seed}</b>
        </div>
        <div>
          <span>Борти на карті</span>
          <b>{runtime.vehiclesCount}</b>
        </div>
        <div>
          <span>FPS</span>
          <b>{runtime.fps > 0 ? runtime.fps : "—"}</b>
        </div>
      </div>

      <div className="dev-tools-actions">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCopyReport}
        >
          <MaterialIcon name="content_copy" size={16} />
          Звіт діагностики
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExportState}
        >
          <MaterialIcon name="download" size={17} />
          Експорт стану (JSON)
        </Button>
      </div>

      <div className="dev-tools-subsection">
        <strong>Обслуговування</strong>
        <p className="dev-tools-hint">
          Очищення не змінює серверні дані — лише локальний стан браузера.
        </p>
        <div className="dev-tools-actions">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetSettings}
          >
            <MaterialIcon name="restart_alt" size={17} />
            Скинути налаштування сценарію
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClearStorage}
          >
            <MaterialIcon name="delete_sweep" size={17} />
            Очистити dev-сховище
          </Button>
        </div>
      </div>
    </div>
  );
}
