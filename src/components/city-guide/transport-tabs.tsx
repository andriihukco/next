import { useMemo, useState, type CSSProperties } from "react";
import { MaterialIcon } from "../ui/material-icon";
import { vehicleFleetColor } from "../../lib/fleet";
import { Button } from "../ui/button";
import { type CityTransitType, type CityTransitVehicle } from "./constants";
import { distanceToVehicle, formatPlaceDistance } from "./helpers";

// ─── Transport Section ─────────────────────────────────────────────────────────

/**
 * NearbyTransportTab — shows ALL vehicle types within distance buckets.
 * Requires user location; shows a prompt if unavailable.
 */
export function NearbyTransportTab({
  vehicles,
  userLocation,
  onRequestLocation,
  onSelectVehicle,
  transitDataStatus,
}: {
  vehicles: CityTransitVehicle[];
  userLocation: [number, number] | null;
  onRequestLocation: () => void;
  onSelectVehicle: (id: string) => void;
  transitDataStatus: "loading" | "ready" | "error";
}) {
  if (!userLocation) {
    return (
      <div className="transport-nearby-prompt">
        <MaterialIcon name="near_me" size={32} />
        <strong>Дозвольте геолокацію</strong>
        <span>Ми покажемо весь транспорт поблизу від вас, відсортований за відстанню.</span>
        <Button type="button" onClick={onRequestLocation}>
          Моє місце
        </Button>
      </div>
    );
  }

  const withDistance = vehicles
    .map((v) => ({ vehicle: v, distance: distanceToVehicle(v, userLocation) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 30);

  const buckets: { label: string; max: number }[] = [
    { label: "До 300 м",   max: 300 },
    { label: "300–600 м",  max: 600 },
    { label: "600–1200 м", max: 1200 },
    { label: "1200–2000 м",max: 2000 },
  ];

  const grouped: Array<{ label: string; items: typeof withDistance }> = [];
  let remaining = withDistance;
  for (const bucket of buckets) {
    const inBucket = remaining.filter((x) => x.distance <= bucket.max);
    remaining = remaining.filter((x) => x.distance > bucket.max);
    if (inBucket.length > 0) {
      grouped.push({ label: bucket.label, items: inBucket });
    }
  }
  if (remaining.length > 0) {
    grouped.push({ label: "Більше 2 км", items: remaining });
  }

  if (withDistance.length === 0) {
    return (
      <div className="city-places-state">
        {transitDataStatus === "loading" ? (
          <span>Завантажуємо транспорт…</span>
        ) : transitDataStatus === "error" ? (
          <>
            <MaterialIcon name="directions_bus_filled" size={22} />
            <span>Не вдалося завантажити транспорт. Перевірте з’єднання.</span>
          </>
        ) : (
          <>
            <MaterialIcon name="directions_bus_filled" size={22} />
            <span>Поруч немає транспорту з GPS.</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="city-transit-list">
      {grouped.map(({ label, items }) => (
        <div key={label}>
          <div className="transit-distance-bucket-label">{label}</div>
          {items.map(({ vehicle, distance }) => (
            <Button
              key={vehicle.id}
              type="button"
              variant="ghost"
              className="route-row city-transit-row"
              onClick={() => onSelectVehicle(vehicle.id)}
            >
              <span
                className="route-number"
                style={{ "--route-color": vehicleFleetColor(vehicle.type) } as CSSProperties}
              >
                {vehicle.route}
              </span>
              <span className="route-copy">
                <strong>{vehicle.destination || vehicle.plate}</strong>
                <small>
                  {vehicle.type === "bus" ? "Автобус" :
                   vehicle.type === "tram" ? "Трамвай" :
                   vehicle.type === "trolleybus" ? "Тролейбус" : "Таксі"}
                  {" · "}Борт {vehicle.plate} · {formatPlaceDistance(distance)}
                </small>
              </span>
              <MaterialIcon name="chevron_right" size={19} />
            </Button>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * RouteListTab — groups all vehicles of one type by route number.
 * Tapping a route expands it to show individual vehicles on that route.
 */
export function RouteListTab({
  type,
  vehicles,
  searchQuery,
  onSelectVehicle,
  transitDataStatus,
}: {
  type: CityTransitType;
  vehicles: CityTransitVehicle[];
  searchQuery: string;
  onSelectVehicle: (id: string) => void;
  transitDataStatus: "loading" | "ready" | "error";
}) {
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase("uk-UA");
    return vehicles.filter(
      (v) =>
        v.type === type &&
        (!q ||
          `${v.route} ${v.destination} ${v.plate}`
            .toLocaleLowerCase("uk-UA")
            .includes(q)),
    );
  }, [vehicles, type, searchQuery]);

  // Group by route number, sorted numerically
  const routes = useMemo(() => {
    const map = new Map<string, CityTransitVehicle[]>();
    for (const v of filtered) {
      const list = map.get(v.route) ?? [];
      list.push(v);
      map.set(v.route, list);
    }
    return [...map.entries()]
      .map(([route, items]) => ({ route, items }))
      .sort((a, b) => {
        const na = Number.parseInt(a.route, 10);
        const nb = Number.parseInt(b.route, 10);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
        return a.route.localeCompare(b.route, "uk");
      });
  }, [filtered]);

  if (routes.length === 0) {
    return (
      <div className="city-places-state" role="status">
        {transitDataStatus === "loading" ? (
          <span>Завантажуємо транспорт…</span>
        ) : transitDataStatus === "error" ? (
          <span>Не вдалося завантажити транспорт. Перевірте з'єднання.</span>
        ) : (
          <>
            <MaterialIcon name="directions_bus_filled" size={22} />
            <span>
              {searchQuery
                ? "За цим запитом нічого не знайдено."
                : "Зараз на мапі немає транспорту цього типу."}
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="city-transit-list">
      {routes.map(({ route, items }) => {
        const isExpanded = expandedRoute === route;
        const routeColor = vehicleFleetColor(type);
        const firstDestination = items[0]?.destination ?? "";
        return (
          <div key={route} className="transit-route-group">
            {/* Route header row */}
            <button
              type="button"
              className={`route-row city-transit-row transit-route-header${isExpanded ? " is-expanded" : ""}`}
              aria-expanded={isExpanded}
              onClick={() => setExpandedRoute(isExpanded ? null : route)}
            >
              <span
                className="route-number"
                style={{ "--route-color": routeColor } as CSSProperties}
              >
                {route}
              </span>
              <span className="route-copy">
                <strong>{firstDestination || `Маршрут ${route}`}</strong>
                <small>{items.length} одиниць на лінії</small>
              </span>
              <MaterialIcon
                name={isExpanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                size={19}
              />
            </button>

            {/* Expanded vehicle list */}
            {isExpanded && (
              <div className="transit-route-vehicles">
                {items.map((vehicle) => (
                  <Button
                    key={vehicle.id}
                    type="button"
                    variant="ghost"
                    className="route-row city-transit-row transit-vehicle-row"
                    onClick={() => onSelectVehicle(vehicle.id)}
                  >
                    <span className="transit-vehicle-plate-dot" aria-hidden="true" />
                    <span className="route-copy">
                      <strong>Борт {vehicle.plate}</strong>
                      <small>
                        {vehicle.destination || `Маршрут ${vehicle.route}`} · {Math.round(vehicle.speed)} км/год
                      </small>
                    </span>
                    <MaterialIcon name="chevron_right" size={17} />
                  </Button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
