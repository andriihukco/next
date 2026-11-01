import type { CSSProperties } from "react";
import * as maplibregl from "maplibre-gl";
import { Button } from "../../components/ui/button";
import { SheetNavBar } from "../../components/ui/detail-layout";
import { Bus, ChevronRight, MapPin, MaterialIcon } from "../../components/ui/material-icon";
import { formatDistance, label } from "../../lib/app-formatters";
import type { Stop, Vehicle, VehicleType } from "../../lib/app-types";
import { TRANSIT_TYPE_COLORS as COLORS } from "../../lib/fleet";

const FLOW_TYPES: VehicleType[] = ["bus", "trolleybus", "tram"];

type TransitFlowPanelProps = {
  /** "menu" lists the transport types; a type lists the stops of its line. */
  flow: VehicleType | "menu";
  vehicles: Vehicle[];
  stops: Stop[];
  selectedVehicle: Vehicle | null;
  userLocation: [number, number] | null;
  simulated: boolean;
  onFlowChange: (flow: VehicleType | null) => void;
  onOpenStop: (stop: Stop) => void;
};

function stopCaption(
  stop: Stop,
  index: number,
  total: number,
  userLocation: [number, number] | null,
): string {
  if (index === 0) return "Початок маршруту";
  if (index === total - 1) return "Кінцева зупинка";
  if (!userLocation) return stop.routes.slice(0, 4).join(" · ");
  const distance = new maplibregl.LngLat(userLocation[0], userLocation[1]).distanceTo(
    new maplibregl.LngLat(stop.lng, stop.lat),
  );
  return `Від вас · ${formatDistance(distance)}`;
}

/** «Побудувати маршрут»: pick a transport type, then browse the stops of its line. */
export function TransitFlowPanel({
  flow,
  vehicles,
  selectedVehicle,
  userLocation,
  simulated,
  onFlowChange,
  onOpenStop,
  stops,
}: TransitFlowPanelProps) {
  const title = flow === "menu" ? "Маршрути" : `${label(flow)} · зупинки`;
  const candidate =
    flow === "menu" ? undefined : (selectedVehicle ?? vehicles.find((vehicle) => vehicle.type === flow));
  const flowStops = candidate ? stops.filter((stop) => stop.routes.includes(candidate.route)) : [];
  return (
    <section className="inspector transit-flow">
      <SheetNavBar title={title} onBack={() => onFlowChange(null)} />
      <header className="inspector-header">
        <div>
          <span className="eyebrow">un · транспорт</span>
          <h2>{flow === "menu" ? "Оберіть транспорт" : `${label(flow)} · зупинки`}</h2>
          <p>{flow === "menu" ? "Показуємо тільки доступні у Львові типи." : "Жива лінія та ключові зупинки."}</p>
        </div>
      </header>
      {flow === "menu" ? (
        <div className="arrival-list">
          {FLOW_TYPES.map((type) => (
            <Button type="button" variant="ghost" className="arrival" key={type} onClick={() => onFlowChange(type)}>
              <span className="route-number" style={{ "--route-color": COLORS[type] } as CSSProperties}>
                <Bus size={15} />
              </span>
              <div>
                <strong>{label(type)}</strong>
                <small>
                  {vehicles.filter((vehicle) => vehicle.type === type).length}{" "}
                  {simulated ? "тестових одиниць" : "GPS-наживо"}
                </small>
              </div>
              <ChevronRight size={17} />
            </Button>
          ))}
        </div>
      ) : (
        <>
          <div className="trip-line">
            <span className="trip-dot" />
            <div>
              <small>Ключові зупинки маршруту</small>
              <strong>{selectedVehicle?.route ?? "Оберіть транспорт на мапі"}</strong>
              <p>Повний список оновлюється з розкладу.</p>
            </div>
          </div>
          <div className="arrival-list">
            {flowStops.map((stop, index) => (
              <details className="route-stop-card" key={stop.id}>
                <summary className="route-stop-summary">
                  <span className="route-stop-index">{index + 1}</span>
                  <span className="route-stop-copy">
                    <strong>{stop.name}</strong>
                    <small>{stopCaption(stop, index, flowStops.length, userLocation)}</small>
                  </span>
                  {(index === 0 || index === flowStops.length - 1) && (
                    <span className="route-endpoint-badge">{index === 0 ? "Старт" : "Фініш"}</span>
                  )}
                  <MaterialIcon className="route-stop-chevron" name="expand_more" size={20} />
                </summary>
                <div className="route-stop-expanded">
                  <div className="route-stop-routes">
                    {stop.routes.map((route) => (
                      <span key={route}>{route}</span>
                    ))}
                  </div>
                  <Button type="button" variant="outline" className="route-stop-open" onClick={() => onOpenStop(stop)}>
                    <MapPin size={16} />
                    Відкрити зупинку
                  </Button>
                </div>
              </details>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
