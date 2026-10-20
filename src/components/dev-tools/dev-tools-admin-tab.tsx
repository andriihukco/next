import { Button } from "../ui/button";
import { MaterialIcon } from "../ui/material-icon";

export type DevDatasetSummary = {
  id: string;
  label: string;
  value: string;
};

type DevToolsAdminTabProps = {
  datasets: DevDatasetSummary[];
  overridesActive: boolean;
  onOpenAdmin: () => void;
  onClearOverrides: () => void;
};

export function DevToolsAdminTab({
  datasets,
  overridesActive,
  onOpenAdmin,
  onClearOverrides,
}: DevToolsAdminTabProps) {
  return (
    <div className="dev-tools-tab-body">
      <div className="dev-tools-diagnostics" aria-label="Набори даних">
        <strong>Набори даних</strong>
        {datasets.map((dataset) => (
          <div key={dataset.id}>
            <span>{dataset.label}</span>
            <b>{dataset.value}</b>
          </div>
        ))}
      </div>

      <div className="dev-tools-actions">
        <Button
          type="button"
          variant="outline"
          onClick={onOpenAdmin}
        >
          <MaterialIcon name="admin_panel_settings" size={18} />
          Адмінпанель
        </Button>
      </div>

      <div className="dev-tools-subsection">
        <strong>Локальні перевизначення</strong>
        <p className="dev-tools-hint">
          {overridesActive
            ? "Активні локальні перевизначення — застосунок показує збережені дані замість серверних."
            : "Локальних перевизначень немає — застосунок показує серверні дані."}
        </p>
        <div className="dev-tools-actions">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!overridesActive}
            onClick={onClearOverrides}
          >
            <MaterialIcon name="delete_outline" size={17} />
            Очистити перевизначення
          </Button>
        </div>
      </div>
    </div>
  );
}
