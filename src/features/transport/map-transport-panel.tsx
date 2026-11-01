import { useMemo, useState, type CSSProperties } from "react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { ChevronRight, MaterialIcon, Navigation, Plus, Search, X } from "../../components/ui/material-icon";
import { Toggle } from "../../components/ui/toggle";
import { label } from "../../lib/app-formatters";
import type { Vehicle, VehicleFilter } from "../../lib/app-types";
import { TRANSIT_TYPE_COLORS as COLORS, vehicleFleetColor } from "../../lib/fleet";
import type { LoadStatus } from "../../hooks/use-transit-feed";

const VEHICLE_FILTER_KEY = "eway-last-vehicle-filter";
const MAX_WAYPOINTS = 5;
const MAX_LISTED_VEHICLES = 24;

const VEHICLE_FILTERS = [
  { id: "bus", label: "Автобуси", icon: "directions_bus" },
  { id: "tram", label: "Трамваї", icon: "tram" },
  { id: "trolleybus", label: "Тролейбуси", icon: "electric_bolt" },
  { id: "taxi", label: "Таксі", icon: "local_taxi" },
] as const;

type MapTransportPanelProps = {
  waypoints: string[];
  onWaypointsChange: (waypoints: string[]) => void;
  onBuildRoute: () => void;
  search: string;
  /** Deferred copy of `search`, so filtering never blocks typing. */
  deferredSearch: string;
  onSearchChange: (value: string) => void;
  vehicles: Vehicle[];
  transitDataStatus: LoadStatus;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onBack: () => void;
};

function readVehicleFilter(): VehicleFilter {
  try {
    return (localStorage.getItem(VEHICLE_FILTER_KEY) as VehicleFilter) || "bus";
  } catch {
    return "bus";
  }
}

function EmptyVehicleList({ status }: { status: LoadStatus }) {
  if (status === "loading") {
    return (
      <div className="empty-state">
        <strong>Завантажуємо транспорт…</strong>
        <span>Зачекайте, поки оновляться дані з мапи.</span>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="empty-state">
        <strong>Не вдалося завантажити транспорт</strong>
        <span>Перевірте з’єднання. У розробці запустіть `npm run server` окремо від `npm run dev`.</span>
      </div>
    );
  }
  return (
    <div className="empty-state">
      <strong>Нічого не знайдено</strong>
      <span>Змініть пошук або фільтр транспорту.</span>
    </div>
  );
}

/** Map view rail: journey planner, transport search, type filter, and the vehicle list. */
export function MapTransportPanel(props: MapTransportPanelProps) {
  const { waypoints, onWaypointsChange, vehicles, deferredSearch } = props;
  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>(readVehicleFilter);
  const filtered = useMemo(() => {
    const query = deferredSearch.toLowerCase();
    return vehicles
      .filter((vehicle) => `${vehicle.route} ${vehicle.destination} ${vehicle.plate}`.toLowerCase().includes(query))
      .filter((vehicle) => vehicle.type === vehicleFilter)
      .slice(0, MAX_LISTED_VEHICLES);
  }, [vehicles, deferredSearch, vehicleFilter]);

  const chooseFilter = (filter: VehicleFilter): void => {
    setVehicleFilter(filter);
    try {
      localStorage.setItem(VEHICLE_FILTER_KEY, filter);
    } catch {
      // Storage can be blocked; the choice then lasts for this visit only.
    }
  };

  return (
    <>
      <Button type="button" variant="ghost" size="sm" className="return-city-button" onClick={props.onBack}>
        <MaterialIcon name="arrow_back" size={18} />
        Назад
      </Button>
      <Card className="journey-card">
        {waypoints.map((point, index) => (
          <label className="waypoint" key={index}>
            <span className={index === 0 ? "point-origin" : "point-stop"}>{index + 1}</span>
            <Input
              aria-label={index === 0 ? "Початкова точка" : `Точка ${index + 1}`}
              className="waypoint-input"
              value={point}
              placeholder={index === 0 ? "Звідки?" : "Додайте точку"}
              onChange={(event) =>
                onWaypointsChange(waypoints.map((value, i) => (i === index ? event.target.value : value)))
              }
            />
            {index > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="dismiss"
                aria-label="Прибрати точку"
                onClick={() => onWaypointsChange(waypoints.filter((_, i) => i !== index))}
              >
                <X size={14} />
              </Button>
            )}
          </label>
        ))}
        {waypoints.length < MAX_WAYPOINTS && waypoints.some((point, index) => index > 0 && point.trim()) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="add-waypoint"
            onClick={() => onWaypointsChange([...waypoints, ""])}
          >
            <Plus size={13} /> Додати точку
          </Button>
        )}
        <Button type="button" variant="default" className="primary-action" onClick={props.onBuildRoute}>
          <Navigation size={14} />
          Побудувати маршрут
        </Button>
      </Card>
      <label className="search-field">
        <Search size={16} />
        <Input
          aria-label="Пошук маршруту або транспорту"
          className="search-input"
          value={props.search}
          onChange={(event) => props.onSearchChange(event.target.value)}
          placeholder="Маршрут, місце або борт"
        />
        <span className="search-count" aria-label={`Знайдено: ${filtered.length}`}>
          {filtered.length}
        </span>
      </label>
      <div className="transport-category-row" role="group" aria-label="Тип транспорту">
        {VEHICLE_FILTERS.map((filter) => (
          <Toggle
            variant="pill"
            key={filter.id}
            className="transport-category"
            style={{ "--transport-color": COLORS[filter.id] } as CSSProperties}
            onClick={() => chooseFilter(filter.id)}
            pressed={vehicleFilter === filter.id}
          >
            <MaterialIcon name={filter.icon} size={18} filled={vehicleFilter === filter.id} />
            {filter.label}
          </Toggle>
        ))}
      </div>
      <div className="routes-heading">
        <span>Поруч на мапі</span>
        <small>{filtered.length} одиниць</small>
      </div>
      <div className="route-list">
        {filtered.map((vehicle) => (
          <Button
            type="button"
            variant="ghost"
            key={vehicle.id}
            className="route-row"
            onClick={() => props.onSelectVehicle(vehicle)}
          >
            <span className="route-number" style={{ "--route-color": vehicleFleetColor(vehicle.type) } as CSSProperties}>
              {vehicle.route}
            </span>
            <span className="route-copy">
              <strong>{vehicle.destination || label(vehicle.type)}</strong>
              <small>Борт {vehicle.plate}</small>
            </span>
            <ChevronRight size={16} />
          </Button>
        ))}
        {filtered.length === 0 && <EmptyVehicleList status={props.transitDataStatus} />}
      </div>
    </>
  );
}
