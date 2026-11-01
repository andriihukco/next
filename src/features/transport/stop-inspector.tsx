import { useState, type KeyboardEvent } from "react";
import { SheetNavBar } from "../../components/ui/detail-layout";
import { MaterialIcon } from "../../components/ui/material-icon";
import { formatDistance } from "../../lib/app-formatters";
import type { Stop, StopTab, Vehicle } from "../../lib/app-types";
import type { ElevationStatus } from "../../hooks/use-stop-details";
import {
  StopContactsPanel,
  StopFacilitiesPanel,
  StopOverviewPanel,
  StopReviewsPanel,
  StopSchedulePanel,
  type StopArrival,
} from "./stop-tab-panels";

const STOP_TABS = [
  { id: "overview", label: "Огляд", icon: "info" },
  { id: "schedule", label: "Розклад", icon: "schedule" },
  { id: "facilities", label: "Зручності", icon: "accessible" },
  { id: "contacts", label: "Контакти", icon: "call" },
  { id: "reviews", label: "Відгуки", icon: "star" },
] as const;

type StopInspectorProps = {
  stop: Stop;
  /** Meters from the user, or null when the location is unknown. */
  distance: number | null;
  arrivals: StopArrival[];
  terrainEnabled: boolean;
  onEnableTerrain: () => void;
  elevation: number | null;
  elevationStatus: ElevationStatus;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onBack: () => void;
};

// Arrow keys move between tabs, as the WAI-ARIA tabs pattern expects.
function moveTabFocus(event: KeyboardEvent<HTMLButtonElement>): void {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  const tabs = Array.from(
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
  );
  const currentIndex = tabs.indexOf(event.currentTarget);
  const nextIndex = (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  tabs[nextIndex]?.focus();
  tabs[nextIndex]?.click();
}

/** Detail sheet for a transit stop. Mount with `key={stop.id}` so the tab resets per stop. */
export function StopInspector(props: StopInspectorProps) {
  const { stop, distance, arrivals, onBack } = props;
  const [tab, setTab] = useState<StopTab>("overview");
  return (
    <section className="inspector stop-inspector">
      <SheetNavBar title="Транспорт на мапі" onBack={onBack} />
      <header className="inspector-header">
        <div>
          <span className="eyebrow">ЗУПИНКА · МІСЬКИЙ ТРАНСПОРТ</span>
          <h2>{stop.name}</h2>
          <p>
            {stop.routes.length} {stop.routes.length === 1 ? "маршрут" : "маршрутів"} проходить тут
          </p>
        </div>
      </header>
      {distance !== null && (
        <div className="stop-distance-card">
          <span className="stop-distance-icon">
            <MaterialIcon name="near_me" size={19} />
          </span>
          <span>
            <small>Від вашого місця</small>
            <strong>{formatDistance(distance)}</strong>
          </span>
          <span className="stop-distance-caption">до зупинки</span>
        </div>
      )}
      <div className="stop-tabs" role="tablist" aria-label="Інформація про зупинку">
        {STOP_TABS.map((item) => (
          <button
            type="button"
            role="tab"
            id={`stop-tab-${item.id}`}
            aria-controls={`stop-panel-${item.id}`}
            aria-selected={tab === item.id}
            tabIndex={tab === item.id ? 0 : -1}
            className={`stop-tab${tab === item.id ? " active" : ""}`}
            key={item.id}
            data-filter={item.id}
            onClick={() => setTab(item.id)}
            onKeyDown={moveTabFocus}
          >
            <span className="stop-tab-orb">
              <MaterialIcon name={item.icon} size={34} />
            </span>
            <span className="stop-tab-label">{item.label}</span>
          </button>
        ))}
      </div>
      <section
        className="stop-tab-panel"
        role="tabpanel"
        id={`stop-panel-${tab}`}
        aria-labelledby={`stop-tab-${tab}`}
        tabIndex={0}
      >
        {tab === "overview" && (
          <StopOverviewPanel
            stop={stop}
            arrivals={arrivals}
            terrainEnabled={props.terrainEnabled}
            onEnableTerrain={props.onEnableTerrain}
            elevation={props.elevation}
            elevationStatus={props.elevationStatus}
            onSelectVehicle={props.onSelectVehicle}
          />
        )}
        {tab === "schedule" && <StopSchedulePanel stop={stop} arrivals={arrivals} />}
        {tab === "facilities" && <StopFacilitiesPanel stop={stop} />}
        {tab === "contacts" && <StopContactsPanel stop={stop} />}
        {tab === "reviews" && <StopReviewsPanel stop={stop} />}
      </section>
    </section>
  );
}
