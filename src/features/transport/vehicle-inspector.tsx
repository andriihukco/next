import type { CSSProperties } from "react";
import { TransitVehicleArtwork } from "../../components/transit-vehicle-artwork";
import {
  ActionBar,
  ActionBarButton,
  DetailChip,
  DetailHero,
  DetailSection,
  SheetNavBar,
  StatGrid,
} from "../../components/ui/detail-layout";
import { label } from "../../lib/app-formatters";
import { SAMPLE_CONTENT_ENABLED } from "../../lib/features";
import type { Vehicle } from "../../lib/app-types";
import { getRidershipEstimate, vehicleFleetColor, vehicleModelDescription } from "../../lib/fleet";
import { RidershipCard } from "./ridership-card";

type VehicleInspectorProps = {
  vehicle: Vehicle;
  following: boolean;
  onToggleFollow: () => void;
  onZoomIn: () => void;
  onBack: () => void;
};

/** Detail sheet for one live (or simulated) vehicle. */
export function VehicleInspector({ vehicle, following, onToggleFollow, onZoomIn, onBack }: VehicleInspectorProps) {
  // Modelled, not measured: development only until a ridership source exists.
  const ridership = SAMPLE_CONTENT_ENABLED ? getRidershipEstimate(`${vehicle.id}-${vehicle.route}`) : null;
  return (
    <section className="inspector detail-sheet">
      <SheetNavBar title="Транспорт на мапі" onBack={onBack} />
      <DetailHero
        badge={
          <span
            className="route-number big"
            style={{ "--route-color": vehicleFleetColor(vehicle.type) } as CSSProperties}
          >
            {vehicle.route || "—"}
          </span>
        }
        eyebrow={`${vehicle.dataSource === "test" ? "Тестовий сценарій" : "GPS наживо"} · ${label(vehicle.type)}`}
        title={vehicle.plate}
        subtitle={vehicle.destination || "Напрямок уточнюється"}
        chips={
          <>
            <DetailChip icon="sensors" tone="live">На лінії</DetailChip>
            {vehicle.lowFloor && <DetailChip icon="accessible">Низька підлога</DetailChip>}
          </>
        }
      />
      <ActionBar>
        <ActionBarButton
          icon={following ? "gps_fixed" : "gps_not_fixed"}
          label={following ? "Стежимо" : "Стежити"}
          pressed={following}
          onClick={onToggleFollow}
        />
        <ActionBarButton icon="zoom_in" label="Ближче" onClick={onZoomIn} />
      </ActionBar>
      <DetailSection title="Стан рейсу">
        <StatGrid
          items={[
            { label: "Швидкість", value: `${Math.round(vehicle.speed)} км/год` },
            { label: "Курс", value: `${vehicle.bearing}°` },
            { label: "Статус", value: "На лінії" },
          ]}
        />
        <p className="detail-note">
          {vehicle.mapMatched
            ? vehicle.dataSource === "test"
              ? "Тестову позицію розміщено на маршруті."
              : "GPS прив’язано до маршруту."
            : "Показано актуальну GPS-позицію."}
        </p>
      </DetailSection>
      <DetailSection title="Транспорт">
        <div className="vehicle-model-card">
          {(vehicle.type === "bus" || vehicle.type === "tram" || vehicle.type === "trolleybus") && (
            <TransitVehicleArtwork id={vehicle.plate} route={vehicle.route} type={vehicle.type} />
          )}
          <div>
            <strong>{vehicleModelDescription(vehicle.type)}</strong>
            <span>Точну марку та модель GPS-дані не передають</span>
          </div>
        </div>
      </DetailSection>
      {ridership && (
        <DetailSection className="ridership-section" title="Пасажиропотік">
          <RidershipCard ridership={ridership} />
        </DetailSection>
      )}
    </section>
  );
}
