import type { CSSProperties } from "react";
import { Button } from "../../components/ui/button";
import { ChevronRight, MaterialIcon } from "../../components/ui/material-icon";
import { label, safeStopWebsite } from "../../lib/app-formatters";
import type { Stop, Vehicle } from "../../lib/app-types";
import { vehicleFleetColor } from "../../lib/fleet";
import type { ElevationStatus } from "../../hooks/use-stop-details";

export type StopArrival = { vehicle: Vehicle; minutes: number };

type OverviewProps = {
  stop: Stop;
  arrivals: StopArrival[];
  terrainEnabled: boolean;
  onEnableTerrain: () => void;
  elevation: number | null;
  elevationStatus: ElevationStatus;
  onSelectVehicle: (vehicle: Vehicle) => void;
};

function elevationLabel(status: ElevationStatus, elevation: number | null): string {
  if (status === "ready" && elevation !== null) return `≈ ${Math.round(elevation / 10) * 10} м`;
  if (status === "loading") return "Завантажуємо висоту…";
  if (status === "unavailable") return "Висота зараз недоступна";
  return "Очікуємо дані рельєфу";
}

export function StopOverviewPanel({
  stop,
  arrivals,
  terrainEnabled,
  onEnableTerrain,
  elevation,
  elevationStatus,
  onSelectVehicle,
}: OverviewProps) {
  return (
    <>
      {terrainEnabled ? (
        <div className="stop-elevation-card">
          <MaterialIcon name="landscape" size={20} />
          <span>
            <small>ВИСОТА НАД РІВНЕМ МОРЯ</small>
            <strong>{elevationLabel(elevationStatus, elevation)}</strong>
          </span>
        </div>
      ) : (
        <button type="button" className="stop-elevation-enable" onClick={onEnableTerrain}>
          <MaterialIcon name="landscape" size={18} />
          Показати рельєф і висоту
          <ChevronRight size={17} />
        </button>
      )}
      <div className="stop-routes-summary">
        <strong>Маршрути тут</strong>
        <div className="stop-route-chips">
          {stop.routes.map((route) => (
            <span key={route}>{route}</span>
          ))}
        </div>
      </div>
      <div className="stop-section-heading">
        <span>Транспорт поруч</span>
        <small>Оцінка за GPS</small>
      </div>
      <div className="arrival-list stop-arrivals">
        {arrivals.length ? (
          arrivals.map(({ vehicle, minutes }) => (
            <Button
              type="button"
              variant="ghost"
              className="arrival"
              key={vehicle.id}
              onClick={() => onSelectVehicle(vehicle)}
            >
              <span
                className="route-number"
                style={{ "--route-color": vehicleFleetColor(vehicle.type) } as CSSProperties}
              >
                {vehicle.route}
              </span>
              <span className="stop-arrival-copy">
                <strong>{vehicle.destination || label(vehicle.type)}</strong>
                <small>Борт {vehicle.plate}</small>
              </span>
              <b>
                {minutes}
                <small> хв</small>
              </b>
            </Button>
          ))
        ) : (
          <div className="stop-empty-state">Наразі немає транспорту з GPS поруч.</div>
        )}
      </div>
    </>
  );
}

export function StopSchedulePanel({ stop, arrivals }: { stop: Stop; arrivals: StopArrival[] }) {
  return (
    <div className="stop-tab-content">
      <div className="stop-section-heading">
        <span>Відправлення</span>
        <small>{stop.timetable?.length ? "Розклад" : "Оцінка GPS"}</small>
      </div>
      {stop.timetable?.length ? (
        <div className="stop-timetable">
          {stop.timetable.map((entry, index) => (
            <div key={`${entry.route}-${entry.departure}-${index}`}>
              <span className="stop-route-chip">{entry.route}</span>
              <strong>{entry.departure}</strong>
            </div>
          ))}
        </div>
      ) : arrivals.length ? (
        <>
          {arrivals.map(({ vehicle, minutes }) => (
            <div className="stop-schedule-row" key={vehicle.id}>
              <span className="stop-route-chip">{vehicle.route}</span>
              <span>{vehicle.destination || label(vehicle.type)}</span>
              <strong>~{minutes} хв</strong>
            </div>
          ))}
          <p className="stop-data-note">Орієнтовний час за відстанню та GPS, не офіційний розклад.</p>
        </>
      ) : (
        <div className="stop-empty-state">Розклад і GPS-прибуття для цієї зупинки зараз недоступні.</div>
      )}
    </div>
  );
}

export function StopFacilitiesPanel({ stop }: { stop: Stop }) {
  return (
    <div className="stop-tab-content">
      <div className="stop-section-heading">
        <span>Зручності на зупинці</span>
      </div>
      {stop.facilities?.length ? (
        <div className="stop-facilities">
          {stop.facilities.map((facility) => (
            <span key={facility}>
              <MaterialIcon name="check_circle" size={17} />
              {facility}
            </span>
          ))}
        </div>
      ) : (
        <div className="stop-empty-state">Про павільйон, доступність чи інші зручності даних немає.</div>
      )}
    </div>
  );
}

export function StopContactsPanel({ stop }: { stop: Stop }) {
  const website = safeStopWebsite(stop.website);
  return (
    <div className="stop-tab-content">
      <div className="stop-section-heading">
        <span>Контактна інформація</span>
      </div>
      {stop.address && (
        <div className="stop-contact-row">
          <MaterialIcon name="location_on" size={18} />
          <span>{stop.address}</span>
        </div>
      )}
      {stop.phone && (
        <a className="stop-contact-row" href={`tel:${stop.phone.replace(/[^\d+]/g, "")}`}>
          <MaterialIcon name="call" size={18} />
          <span>{stop.phone}</span>
        </a>
      )}
      {website && (
        <a className="stop-contact-row" href={website} target="_blank" rel="noreferrer">
          <MaterialIcon name="language" size={18} />
          <span>Вебсайт перевізника</span>
          <MaterialIcon name="open_in_new" size={16} />
        </a>
      )}
      {!stop.address && !stop.phone && !stop.website && (
        <div className="stop-empty-state">Контакти не передаються у поточному наборі даних зупинок.</div>
      )}
    </div>
  );
}

export function StopReviewsPanel({ stop }: { stop: Stop }) {
  return (
    <div className="stop-tab-content">
      <div className="stop-section-heading">
        <span>Оцінка пасажирів</span>
      </div>
      {stop.rating !== undefined ? (
        <div className="stop-rating">
          <MaterialIcon name="star" size={24} />
          <strong>{stop.rating.toFixed(1)}</strong>
          <span>{stop.reviewCount ?? 0} відгуків</span>
        </div>
      ) : (
        <div className="stop-empty-state">
          Рейтинг і відгуки для зупинок ще не надходять із міського джерела даних.
        </div>
      )}
    </div>
  );
}
