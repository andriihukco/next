/**
 * @file city-guide.tsx
 * @description City guide panel with tabbed sections: Transport, Places,
 *   Education, Services, Jobs, Real Estate, Events.
 *
 *   Transport section has been redesigned per the 2026 UX audit:
 *   - "Nearby" tab: all vehicle types grouped by walk-distance buckets
 *   - Per-type tabs (Bus / Tram / Trolleybus / Taxi): list of routes,
 *     each expandable to show vehicles currently on that route
 *   - Directions inputs removed — they live in the Map view instead
 */
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  MaterialIcon,
} from "./ui/material-icon";
import {
  CITY_PLACE_CATEGORY_COLORS,
  cityEducationKind,
  cityPlaceCategories,
  cityPlaceIcons,
  cityPlaceOsmUrl,
  formatOpeningHours,
  type CityEducationKind,
  type CityPlace,
  type CityPlaceCategory,
} from "../lib/city-places";
import { vehicleFleetColor } from "../lib/fleet";
import {
  type CityEvent,
  type CityDirectoryListing,
  cityJobListings,
  cityRealEstateListings,
  cityServiceListings,
} from "../lib/city-fixtures";
import { Button } from "./ui/button";
import { CategoryChips } from "./ui/category-chips";
import { EntityDetail, flowsForKind, type InfoRow } from "./entity-detail";
import { useSavedItems } from "../lib/use-saved-items";
import { UnifiedCard } from "./ui/unified-card";

// ─── Types ────────────────────────────────────────────────────────────────────

type CitySection =
  | "transport"
  | "places"
  | "education"
  | "events"
  | "services"
  | "jobs"
  | "real-estate"
  | "market"
  | "parking"
  | "fuel"
  | "charging";

/** Sub-tab within the Transport section */
type TransportTab = "nearby" | "bus" | "tram" | "trolleybus" | "taxi";

type CityTransitType = "bus" | "tram" | "trolleybus" | "taxi";

export type CityTransitVehicle = {
  id: string;
  type: CityTransitType;
  route: string;
  destination: string;
  plate: string;
  speed: number;
  lat: number;
  lng: number;
};

type CityGuideProps = {
  userLocation: [number, number] | null;
  locationError: string | null;
  onShowOnMap: (coordinates: [number, number], placeName: string) => void;
  /** Opens the map planner with this place as the destination. */
  onDirections: (coordinates: [number, number], placeName: string) => void;
  onSelectTransportVehicle: (vehicleId: string) => void;
  onPageNavigationChange: (isDetailPage: boolean, onBack: () => void) => void;
  places: CityPlace[];
  placesStatus: "loading" | "ready" | "error";
  placesError: string;
  onRetryPlaces: () => void;
  onPlacesChange: (places: CityPlace[]) => void;
  cityEvents: CityEvent[];
  transportVehicles: CityTransitVehicle[];
  transitDataStatus: "loading" | "ready" | "error";
  transportIsSimulated: boolean;
  onUseLiveTransit: () => void;
  searchQuery: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TRANSPORT_TABS: { id: TransportTab; label: string; icon: string }[] = [
  { id: "nearby",     label: "Поруч",       icon: "near_me" },
  { id: "bus",        label: "Автобуси",    icon: "directions_bus" },
  { id: "tram",       label: "Трамваї",     icon: "tram" },
  { id: "trolleybus", label: "Тролейбуси",  icon: "electric_bolt" },
  { id: "taxi",       label: "Таксі",       icon: "local_taxi" },
];

const CITY_SECTIONS: { id: CitySection; label: string; icon: string }[] = [
  { id: "transport",   label: "Транспорт",    icon: "directions_transit" },
  { id: "places",      label: "Місця",        icon: "explore" },
  { id: "education",   label: "Освіта",       icon: "school" },
  { id: "services",    label: "Послуги",      icon: "storefront" },
  { id: "jobs",        label: "Робота",       icon: "work" },
  { id: "real-estate", label: "Нерухомість",  icon: "real_estate_agent" },
  { id: "events",      label: "Афіша",        icon: "event" },
  { id: "market",      label: "Ринок",        icon: "store" },
  { id: "parking",     label: "Парковка",     icon: "local_parking" },
  { id: "fuel",        label: "АЗС",          icon: "local_gas_station" },
  { id: "charging",   label: "Електрозарядка", icon: "ev_station" },
];

const CITY_CENTER: [number, number] = [24.0297, 49.8397];

const FEATURED_CATEGORIES: CityPlaceCategory[] = [
  "groceries", "food", "health", "pharmacy"
];

const EXCLUDED_PLACE_CATEGORIES = new Set<CityPlaceCategory>([
  "transport", "education", "services", "jobs", "beauty", "real-estate",
  "market", "parking", "fuel", "charging-station", "recycling", "atm", "post-office",
  "bicycle-parking", "motorcycle-parking", "bus-stop", "tram-stop", "taxi-stand",
  "car-sharing", "waste-disposal", "public-toilet", "water-fountain",
]);

const POPULAR_CATEGORY_ORDER: CityPlaceCategory[] = [
  "food", "groceries", "health", "pharmacy", "pets", "culture",
  "tourism", "stay", "parks", "sports", "finance", "public", "religion",
  "shopping", "nightlife", "library", "flowers", "veterinary", "pet-shop",
  "fitness", "yoga", "dance", "music-school", "art-studio", "playground",
  "laundry", "dry-cleaning", "optician", "dentist", "car-wash", "car-repair",
  "tire-service", "construction", "hardware", "bicycle-rental", "scooter-rental",
  "car-rental", "internet-cafe", "copy-center", "print-shop", "photo-studio",
  "shoe-repair", "key-cutting", "locksmith", "buildings", "other",
];

const EDUCATION_KIND_LABELS: Record<CityEducationKind, string> = {
  school: "Школа",
  kindergarten: "Дитячий садок",
  university: "Університет",
  "adult-course": "Курси й спеціалізовані школи",
  library: "Бібліотека",
};

const EVENT_FILTERS = [
  { id: "all",        label: "Усі події",  icon: "event" },
  { id: "Для родини", label: "Для родини", icon: "family_restroom" },
  { id: "Діти",       label: "Діти",       icon: "child_care" },
  { id: "Зустріч",    label: "Зустріч",    icon: "groups" },
] as const;

const EDUCATION_FILTERS: { id: CityEducationKind; label: string; icon: string }[] = [
  { id: "school",       label: "Школи",       icon: "school" },
  { id: "kindergarten", label: "Садочки",     icon: "child_care" },
  { id: "university",   label: "Університети", icon: "account_balance" },
  { id: "adult-course", label: "Курси",       icon: "menu_book" },
  { id: "library",      label: "Бібліотеки",  icon: "local_library" },
];

const SERVICE_FILTERS = [
  { id: "beauty",       label: "Краса",       icon: "spa" },
  { id: "dry-cleaning", label: "Хімчистка",   icon: "local_laundry_service" },
  { id: "plumbing",     label: "Сантехнік",   icon: "water_drop" },
  { id: "repair",       label: "Ремонт",      icon: "build" },
  { id: "cleaning",     label: "Прибирання",  icon: "cleaning_services" },
] as const;

const JOB_FILTERS = [
  { id: "technology",  label: "IT",           icon: "computer" },
  { id: "hospitality", label: "Гостинність", icon: "restaurant" },
  { id: "retail",      label: "Торгівля",    icon: "shopping_cart" },
  { id: "education",   label: "Освіта",      icon: "school" },
] as const;

const REAL_ESTATE_FILTERS = [
  { id: "rent",       label: "Оренда",        icon: "home" },
  { id: "sale",       label: "Продаж",       icon: "real_estate_agent" },
  { id: "commercial", label: "Комерція",     icon: "business" },
  { id: "private",    label: "Приватне житло", icon: "house" },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "All categories" disclosure above a category row. */
/** Haversine approximation using flat-earth for short distances */
function distanceToPlace(place: CityPlace, origin: [number, number]): number {
  const latDiff = (place.lat - origin[1]) * 111_000;
  const lngDiff = (place.lng - origin[0]) * Math.cos((origin[1] * Math.PI) / 180) * 111_000;
  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
}

function distanceToVehicle(
  vehicle: CityTransitVehicle,
  origin: [number, number],
): number {
  const latDiff = (vehicle.lat - origin[1]) * 111_000;
  const lngDiff =
    (vehicle.lng - origin[0]) *
    Math.cos((origin[1] * Math.PI) / 180) *
    111_000;
  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
}

function formatPlaceDistance(meters: number): string {
  return meters >= 1000
    ? `${new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(meters / 1000)} км`
    : `${Math.round(meters / 10) * 10} м`;
}

type DemoProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
};

function demoProductsFor(place: CityPlace): DemoProduct[] {
  const seed = [...place.id].reduce(
    (acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0,
    7,
  );
  const r = (index: number): number => ((seed * (index + 1) * 1664525 + 1013904223) >>> 0) / 0x1_0000_0000;

  if (place.category === "groceries") {
    return [
      { id: "p1", name: "Молоко 1л",        description: "Свіже пастеризоване", price: Math.round(20 + r(0) * 30) },
      { id: "p2", name: "Хліб житній",      description: "Нарізний, 500 г",     price: Math.round(25 + r(1) * 20) },
      { id: "p3", name: "Яйця С1 10шт",     description: "Охолоджені",           price: Math.round(60 + r(2) * 30) },
      { id: "p4", name: "Кефір 2,5% 0,5л",  description: "Відбірний",            price: Math.round(18 + r(3) * 15) },
    ];
  }
  if (place.category === "food") {
    return [
      { id: "m1", name: "Борщ",         description: "З пампушками",     price: Math.round(80 + r(0) * 70) },
      { id: "m2", name: "Вареники",     description: "З картоплею",      price: Math.round(70 + r(1) * 60) },
      { id: "m3", name: "Капучіно",     description: "Подвійний еспресо", price: Math.round(55 + r(2) * 35) },
    ];
  }
  if (place.category === "education") {
    return [
      { id: "b1", name: "Кобзар",       description: "Т. Г. Шевченко",   price: 0 },
      { id: "b2", name: "Захар Беркут", description: "І. Франко",         price: 0 },
      { id: "b3", name: "Лісова пісня", description: "Леся Українка",     price: 0 },
    ];
  }
  return [];
}

const PLACE_INFO_ICONS: Record<string, string> = {
  Графік: "schedule",
  Email: "email",
  "Wi-Fi": "wifi",
  Кухня: "restaurant_menu",
  Оператор: "domain",
};

/** Detail rows shown for a place. Phone and website are actions, not rows. */
function placeInfoRows(place: CityPlace): InfoRow[] {
  return Object.entries(place.details)
    .filter(([label]) => !["Тип", "Телефон", "Мобільний", "Сайт"].includes(label))
    .map(([label, value]) => ({
      icon: PLACE_INFO_ICONS[label] ?? "info",
      label,
      value: label === "Графік" ? formatOpeningHours(value) : value,
      href: label === "Email" ? `mailto:${value}` : undefined,
    }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EducationCard({
  place,
  kind,
  onShowOnMap,
  onOpen,
  detailPage,
}: {
  place: CityPlace;
  kind: CityEducationKind;
  onShowOnMap: (coordinates: [number, number], name: string) => void;
  onOpen?: () => void;
  detailPage: boolean;
}) {
  return (
    <UnifiedCard variant="education" onClick={onOpen}>
      <UnifiedCard.Header
        title={place.name}
        subtitle={place.address}
        icon="school"
        category={EDUCATION_KIND_LABELS[kind]}
      />
      {detailPage && (
        <>
          {Object.entries(place.details)
            .filter(([label]) => label !== "Тип")
            .map(([label, value]) => {
              const isPhone = label === "Телефон" || label === "Мобільний";
              const isWebsite = label === "Сайт" || label === "Email";
              const isHours = label === "Графік";
              const icon =
                label === "Графік" ? "schedule" :
                label === "Телефон" || label === "Мобільний" ? "call" :
                label === "Сайт" ? "language" :
                label === "Email" ? "email" :
                label === "Wi-Fi" ? "wifi" :
                label === " wheelchair" ? "accessible" : "info";

              return (
                <UnifiedCard.Meta
                  key={label}
                  label={label}
                  value={isHours ? formatOpeningHours(value) : value}
                  icon={icon}
                  clickable={isPhone || isWebsite}
                  onClick={() => {
                    if (isPhone) {
                      const phone = value.replace(/\D/g, "");
                      window.open(`tel:${phone}`, "_self");
                    } else if (label === "Сайт") {
                      window.open(value.startsWith("http") ? value : `https://${value}`, "_blank");
                    } else if (label === "Email") {
                      window.open(`mailto:${value}`, "_self");
                    }
                  }}
                />
              );
            })}
        </>
      )}
      <UnifiedCard.Action
        label="На мапі"
        icon="location_on"
        variant="outline"
        onClick={() => onShowOnMap([place.lng, place.lat], place.name)}
      />
      {detailPage && (
        <UnifiedCard.Action
          label="OpenStreetMap"
          icon="open_in_new"
          variant="outline"
          onClick={() => window.open(cityPlaceOsmUrl(place), "_blank")}
        />
      )}
    </UnifiedCard>
  );
}

function DirectoryListingPage({
  title,
  kind,
  listings,
  filters,
  selectedId,
  onSelect,
  saved,
  onToggleSaved,
  onShowOnMap,
  onDirections,
}: {
  title: string;
  kind: "service" | "job" | "home";
  listings: CityDirectoryListing[];
  filters: ReadonlyArray<{ id: string; label: string; icon: string }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  saved: ReadonlySet<string>;
  onToggleSaved: (id: string) => void;
  onShowOnMap: (coordinates: [number, number], name: string) => void;
  onDirections: (coordinates: [number, number], name: string) => void;
}) {
  const [activeFilter, setActiveFilter] = useState(filters[0]?.id ?? "");

  const visible = useMemo(() => {
    return listings.filter((item) => item.category === activeFilter);
  }, [listings, activeFilter]);


  const selected = listings.find((item) => item.id === selectedId);
  if (selected) {
    const filter = filters.find((item) => item.id === selected.category);
    return (
      <section className="city-section" aria-label={title}>
        <EntityDetail
          kind={kind === "service" && flowsForKind(selected.category).length > 0 ? selected.category : kind}
          title={selected.name}
          eyebrow={filter?.label ?? title}
          subtitle={selected.summary}
          icon={filter?.icon ?? "business"}
          demo
          description={selected.details}
          info={[
            { icon: "location_on", label: "Адреса", value: selected.location },
            ...(selected.organization
              ? [{ icon: "domain", label: kind === "job" ? "Роботодавець" : "Організація", value: selected.organization }]
              : []),
          ]}
          coordinates={selected.coordinates}
          saved={saved.has(selected.id)}
          onToggleSaved={() => onToggleSaved(selected.id)}
          onShowOnMap={() => onShowOnMap(selected.coordinates, selected.name)}
          onDirections={() => onDirections(selected.coordinates, selected.name)}
        />
      </section>
    );
  }

  return (
    <section className="city-section" aria-label={title}>
      <CategoryChips label={`Фільтр: ${title}`} items={filters} value={activeFilter} onChange={setActiveFilter} />
      <div className="city-place-list">
        {visible.map((item) => (
          <UnifiedCard key={item.id} variant="directory" onClick={() => onSelect(item.id)}>
            <UnifiedCard.Header
              title={item.name}
              subtitle={item.summary}
              category={`${item.location} · демо`}
              icon={filters.find((filter) => filter.id === item.category)?.icon ?? "business"}
            />
            <UnifiedCard.Action
              label="На мапі"
              icon="location_on"
              variant="outline"
              onClick={() => onShowOnMap(item.coordinates, item.name)}
            />
          </UnifiedCard>
        ))}
        {visible.length === 0 && (
          <div className="city-places-state">
            <MaterialIcon name="search_off" size={20} />
            <span>Нічого не знайдено за цим фільтром.</span>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Transport Section ─────────────────────────────────────────────────────────

/**
 * NearbyTransportTab — shows ALL vehicle types within distance buckets.
 * Requires user location; shows a prompt if unavailable.
 */
function NearbyTransportTab({
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
function RouteListTab({
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

// ─── Main Component ────────────────────────────────────────────────────────────

export function CityGuide({
  userLocation,
  locationError,
  onShowOnMap,
  onDirections,
  onPageNavigationChange,
  places,
  placesStatus,
  placesError,
  onRetryPlaces,
  onPlacesChange,
  cityEvents,
  transportVehicles,
  transitDataStatus,
  transportIsSimulated,
  onUseLiveTransit,
  onSelectTransportVehicle,
  searchQuery,
}: CityGuideProps) {
  const [section, setSection] = useState<CitySection>(() => {
    const saved = localStorage.getItem("eway-last-section");
    return (saved as CitySection) || "transport";
  });
  const [transportTab, setTransportTab] = useState<TransportTab>(() => {
    const saved = localStorage.getItem("eway-last-transport-tab");
    return (saved as TransportTab) || "nearby";
  });
  const [placeCategory, setPlaceCategory] = useState<
    "popular" | "nearby" | CityPlaceCategory
  >("popular");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [placeDisplayLimit, setPlaceDisplayLimit] = useState(40);
  const [educationKind, setEducationKind] = useState<CityEducationKind>("school");
  const [selectedEducationId, setSelectedEducationId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [eventCategory, setEventCategory] = useState("all");

  const origin = userLocation ?? CITY_CENTER;
  const [saved, toggleSaved] = useSavedItems();

  // Keep the active section tab visible when it changes or the list reopens.
  const sectionNavRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const nav = sectionNavRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active) return;
    nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
  }, [section]);

  const availableCategories = useMemo(
    () =>
      cityPlaceCategories.filter(
        ({ id }) =>
          !EXCLUDED_PLACE_CATEGORIES.has(id) &&
          (FEATURED_CATEGORIES.includes(id) ||
            places.some((place) => place.category === id)),
      ),
    [places],
  );

  const visiblePlaces = useMemo(
    () =>
      places
        .filter((place) => {
          if (EXCLUDED_PLACE_CATEGORIES.has(place.category)) return false;
          const matchesCategory =
            placeCategory === "nearby" ||
            placeCategory === "popular" ||
            place.category === placeCategory;
          const matchesSearch =
            `${place.name} ${place.categoryLabel} ${place.address}`
              .toLocaleLowerCase("uk-UA")
              .includes(searchQuery.trim().toLocaleLowerCase("uk-UA"));
          return matchesCategory && matchesSearch;
        })
        .sort((a, b) => {
          if (placeCategory === "popular") {
            const diff =
              POPULAR_CATEGORY_ORDER.indexOf(a.category) -
              POPULAR_CATEGORY_ORDER.indexOf(b.category);
            if (diff !== 0) return diff;
          }
          return distanceToPlace(a, origin) - distanceToPlace(b, origin);
        }),
    [origin, placeCategory, searchQuery, places],
  );

  const shownPlaces = visiblePlaces.slice(0, placeDisplayLimit);

  const educationPlaces = useMemo(
    () =>
      places.flatMap((place) => {
        const kind = cityEducationKind(place);
        return kind ? [{ place, kind }] : [];
      }),
    [places],
  );

  const filteredEducationPlaces = useMemo(
    () => educationPlaces.filter(({ kind }) => kind === educationKind),
    [educationKind, educationPlaces],
  );

  const selectedEducation = educationPlaces.find(
    ({ place }) => place.id === selectedEducationId,
  );
  const selectedEvent = cityEvents.find((event) => event.id === selectedEventId);

  const isDetailPage = Boolean(selectedPlaceId || selectedEducationId || selectedEventId || selectedListingId);

  const returnToSection = (): void => {
    setSelectedPlaceId(null);
    setSelectedEducationId(null);
    setSelectedEventId(null);
    setSelectedListingId(null);
    onPageNavigationChange(false, returnToSection);
  };

  useEffect(() => {
    if (placesStatus === "ready") {
      const filteredPlaces = (() => {
        switch (section) {
          case "places":
            return visiblePlaces;
          case "market":
            return places.filter((p) => p.category === "market");
          case "parking":
            return places.filter((p) => p.category === "parking");
          case "fuel":
            return places.filter((p) => p.category === "fuel");
          case "charging":
            return places.filter((p) => p.category === "charging-station");
          default:
            return [];
        }
      })();
      onPlacesChange(filteredPlaces);
    }
  }, [onPlacesChange, placesStatus, section, visiblePlaces, places]);

  useEffect(() => {
    if (!userLocation && placeCategory === "nearby") {
      setPlaceCategory("popular");
    }
  }, [placeCategory, userLocation]);

  const toggleSetValue = (current: Set<string>, value: string): Set<string> => {
    const next = new Set(current);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };


  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="city-guide">

      {/* ── Section navigation ─────────────────────────────────────────────── */}
      <nav
        ref={sectionNavRef}
        className="city-section-nav"
        aria-label="Розділи міста"
        data-tour="city-sections"
        hidden={isDetailPage}
      >
        {CITY_SECTIONS.map((item) => (
          <button
            type="button"
            key={item.id}
            data-tour={item.id === "events" ? "city-events" : undefined}
            className={section === item.id ? "active" : ""}
            aria-current={section === item.id ? "page" : undefined}
            onClick={() => {
              setSelectedPlaceId(null);
              setSelectedEducationId(null);
              setSelectedEventId(null);
              setSelectedListingId(null);
              setSection(item.id);
              localStorage.setItem("eway-last-section", item.id);
              if (item.id === "places") setPlaceCategory("popular");
              onPageNavigationChange(false, returnToSection);
            }}
          >
            <MaterialIcon name={item.icon} size={24} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* ── Transport section ──────────────────────────────────────────────── */}
      {section === "transport" && (
        <section className="city-section city-transport-page" aria-label="Транспорт">

          {/* Live data status banner */}
          {transportIsSimulated ? (
            <div className="city-transit-source is-simulated">
              <span>Симуляція — не GPS-наживо.</span>
              <Button type="button" variant="outline" size="sm" onClick={onUseLiveTransit}>
                GPS-наживо
              </Button>
            </div>
          ) : transitDataStatus === "loading" ? (
            <p className="city-transit-source" role="status">
              Завантажуємо GPS…
            </p>
          ) : null}

          <CategoryChips
            label="Тип транспорту"
            items={TRANSPORT_TABS.map((tab) => ({
              ...tab,
              count: tab.id === "nearby" ? 0 : transportVehicles.filter((v) => v.type === tab.id).length,
            }))}
            value={transportTab}
            onChange={(id) => {
              setTransportTab(id as TransportTab);
              localStorage.setItem("eway-last-transport-tab", id);
            }}
          />

          {/* Tab content */}
          {transportTab === "nearby" ? (
            <NearbyTransportTab
              vehicles={transportVehicles}
              userLocation={userLocation}
              onRequestLocation={() => {
                // The parent handles geolocation; we signal via onShowOnMap with a
                // special key. A cleaner approach would be a prop, but for now we
                // re-use the pattern the map view uses.
                // Parent listens for this via onSelectTransportVehicle("__locate__")
                onSelectTransportVehicle("__locate__");
              }}
              onSelectVehicle={onSelectTransportVehicle}
              transitDataStatus={transitDataStatus}
            />
          ) : (
            <RouteListTab
              type={transportTab as CityTransitType}
              vehicles={transportVehicles}
              searchQuery={searchQuery}
              onSelectVehicle={onSelectTransportVehicle}
              transitDataStatus={transitDataStatus}
            />
          )}
        </section>
      )}

      {/* ── Places section ─────────────────────────────────────────────────── */}
      {section === "places" && (
        <section
          className={`city-section city-places${selectedPlaceId ? " place-detail-page" : ""}`}
          aria-label="Місця"
        >
          {!selectedPlaceId && (
            <CategoryChips
              label="Категорії місць"
              items={[
                { id: "popular", label: "Популярне", icon: "award_star" },
                ...(userLocation ? [{ id: "nearby", label: "Поруч", icon: "near_me" }] : []),
                ...availableCategories.map((category) => ({
                  id: category.id,
                  label: category.label,
                  icon: cityPlaceIcons[category.id],
                  color: CITY_PLACE_CATEGORY_COLORS[category.id],
                })),
              ]}
              value={placeCategory}
              onChange={(id) => {
                setPlaceCategory(id as typeof placeCategory);
                setPlaceDisplayLimit(40);
              }}
            />
          )}
          {!selectedPlaceId && locationError && (
            <p className="city-location-error" role="status">
              {locationError} Показуємо місця від центру Львова.
            </p>
          )}
          {!selectedPlaceId && placesStatus === "loading" && (
            <div className="city-places-state" role="status">
              <MaterialIcon name="progress_activity" size={20} />
              <span>Завантажуємо місця поруч…</span>
            </div>
          )}
          {!selectedPlaceId && placesStatus === "error" && (
            <div className="city-places-state city-places-error" role="alert">
              <MaterialIcon name="cloud_off" size={20} />
              <span>{placesError}</span>
              <Button type="button" variant="outline" size="sm" onClick={onRetryPlaces}>
                Спробувати ще
              </Button>
            </div>
          )}
          {placesStatus === "ready" &&
            (selectedPlaceId
              ? places.some((p) => p.id === selectedPlaceId)
              : visiblePlaces.length > 0) && (
            <>
              {!selectedPlaceId && (
                <div className="city-place-results-heading">
                  <h3>
                    {placeCategory === "nearby"
                      ? "Поруч зараз"
                      : placeCategory === "popular"
                        ? "Популярне"
                        : cityPlaceCategories.find((c) => c.id === placeCategory)?.label}
                  </h3>
                  <span>Знайдено: {visiblePlaces.length}</span>
                </div>
              )}
              <div className={`city-place-list city-osm-place-list${selectedPlaceId ? " place-detail-list" : ""}`}>
                {shownPlaces
                  .filter((place) => !selectedPlaceId || place.id === selectedPlaceId)
                  .map((place) => {
                    const detailOpen = selectedPlaceId === place.id;
                    if (detailOpen) {
                      const phone = place.details["Телефон"] || place.details["Мобільний"];
                      return (
                        <EntityDetail
                          key={place.id}
                          kind={place.category}
                          title={place.name}
                          eyebrow={place.categoryLabel}
                          subtitle={[place.address, formatPlaceDistance(distanceToPlace(place, origin))].filter(Boolean).join(" · ")}
                          icon={cityPlaceIcons[place.category]}
                          iconColor={CITY_PLACE_CATEGORY_COLORS[place.category]}
                          info={placeInfoRows(place)}
                          menu={demoProductsFor(place)}
                          catalog={demoProductsFor(place)}
                          coordinates={[place.lng, place.lat]}
                          phone={phone}
                          website={place.details["Сайт"]}
                          sourceUrl={cityPlaceOsmUrl(place)}
                          saved={saved.has(place.id)}
                          onToggleSaved={() => toggleSaved(place.id)}
                          onShowOnMap={() => onShowOnMap([place.lng, place.lat], place.name)}
                          onDirections={() => onDirections([place.lng, place.lat], place.name)}
                        />
                      );
                    }
                    return (
                      <UnifiedCard
                        key={place.id}
                        variant={place.category === "food" ? "restaurant" : place.category === "stay" ? "hotel" : "place"}
                        onClick={() => {
                          setSelectedPlaceId(place.id);
                          onPageNavigationChange(true, returnToSection);
                        }}
                      >
                        <UnifiedCard.Header
                          title={place.name}
                          subtitle={[formatPlaceDistance(distanceToPlace(place, origin)), place.address].filter(Boolean).join(" · ")}
                          icon={cityPlaceIcons[place.category]}
                          iconColor={CITY_PLACE_CATEGORY_COLORS[place.category]}
                          category={place.categoryLabel}
                        />
                        {place.details["Графік"] && (
                          <UnifiedCard.Meta
                            label="Графік"
                            value={formatOpeningHours(place.details["Графік"])}
                            icon="schedule"
                          />
                        )}
                      </UnifiedCard>
                    );
                  })}
              </div>
            </>
          )}
          {!selectedPlaceId && placesStatus === "ready" && shownPlaces.length < visiblePlaces.length && (
            <Button
              type="button"
              variant="outline"
              className="city-show-more"
              onClick={() => setPlaceDisplayLimit((l) => l + 40)}
            >
              <MaterialIcon name="expand_more" size={18} />
              Показати ще ({visiblePlaces.length - shownPlaces.length})
            </Button>
          )}
          {!selectedPlaceId && placesStatus === "ready" && visiblePlaces.length === 0 && (
            <div className="city-places-state">
              <MaterialIcon name="search_off" size={20} />
              <span>Місць за цим фільтром не знайдено.</span>
            </div>
          )}
          {!selectedPlaceId && (
            <p className="city-osm-attribution">
              OpenFreeMap на основі OpenStreetMap ·{" "}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
                ліцензія ODbL
              </a>
            </p>
          )}
        </section>
      )}

      {/* ── Education section ─────────────────────────────────────────────── */}
      {section === "education" && (
        <section className="city-section" aria-label="Освіта">
          {selectedEducation ? (
            <>
              <EntityDetail
                kind={selectedEducation.kind === "library" ? "library" : selectedEducation.kind}
                title={selectedEducation.place.name}
                eyebrow={EDUCATION_KIND_LABELS[selectedEducation.kind]}
                subtitle={selectedEducation.place.address}
                icon={EDUCATION_FILTERS.find((filter) => filter.id === selectedEducation.kind)?.icon ?? "school"}
                info={placeInfoRows(selectedEducation.place)}
                catalog={demoProductsFor(selectedEducation.place)}
                coordinates={[selectedEducation.place.lng, selectedEducation.place.lat]}
                phone={selectedEducation.place.details["Телефон"] || selectedEducation.place.details["Мобільний"]}
                website={selectedEducation.place.details["Сайт"]}
                sourceUrl={cityPlaceOsmUrl(selectedEducation.place)}
                saved={saved.has(selectedEducation.place.id)}
                onToggleSaved={() => toggleSaved(selectedEducation.place.id)}
                onShowOnMap={() => onShowOnMap([selectedEducation.place.lng, selectedEducation.place.lat], selectedEducation.place.name)}
                onDirections={() => onDirections([selectedEducation.place.lng, selectedEducation.place.lat], selectedEducation.place.name)}
              />
            </>
          ) : (
            <>
              <CategoryChips
                label="Тип закладу"
                items={EDUCATION_FILTERS}
                value={educationKind}
                onChange={(id) => setEducationKind(id as CityEducationKind)}
              />
              {placesStatus === "loading" ? (
                <div className="city-places-state" role="status">
                  <MaterialIcon name="sync" size={20} />
                  <span>Завантажуємо заклади…</span>
                </div>
              ) : placesStatus === "error" ? (
                <div className="city-places-state">
                  <MaterialIcon name="error_outline" size={20} />
                  <span>{placesError || "Не вдалося завантажити місця з карти."}</span>
                  <Button type="button" variant="outline" onClick={onRetryPlaces}>Повторити</Button>
                </div>
              ) : (
                <div className="city-place-list">
                  {filteredEducationPlaces.map(({ place, kind }) => (
                    <EducationCard
                      key={place.id}
                      place={place}
                      kind={kind}
                      onShowOnMap={onShowOnMap}
                      onOpen={() => {
                        setSelectedEducationId(place.id);
                        onPageNavigationChange(true, returnToSection);
                      }}
                      detailPage={false}
                    />
                  ))}
                  {filteredEducationPlaces.length === 0 && (
                    <div className="city-places-state">
                      <MaterialIcon name="search_off" size={20} />
                      <span>Закладів цієї категорії немає в OpenStreetMap для поточної ділянки.</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ── Directory sections ────────────────────────────────────────────── */}
      {section === "services" && (
        <DirectoryListingPage
          title="Послуги"
          kind="service"
          selectedId={selectedListingId}
          onSelect={(id) => {
            setSelectedListingId(id);
            onPageNavigationChange(true, returnToSection);
          }}
          saved={saved}
          onToggleSaved={toggleSaved}
          onDirections={onDirections}
          listings={cityServiceListings}
          filters={SERVICE_FILTERS}
          onShowOnMap={onShowOnMap}
        />
      )}
      {section === "jobs" && (
        <DirectoryListingPage
          title="Робота у Львові"
          kind="job"
          selectedId={selectedListingId}
          onSelect={(id) => {
            setSelectedListingId(id);
            onPageNavigationChange(true, returnToSection);
          }}
          saved={saved}
          onToggleSaved={toggleSaved}
          onDirections={onDirections}
          listings={cityJobListings}
          filters={JOB_FILTERS}
          onShowOnMap={onShowOnMap}
        />
      )}
      {section === "real-estate" && (
        <DirectoryListingPage
          title="Нерухомість"
          kind="home"
          selectedId={selectedListingId}
          onSelect={(id) => {
            setSelectedListingId(id);
            onPageNavigationChange(true, returnToSection);
          }}
          saved={saved}
          onToggleSaved={toggleSaved}
          onDirections={onDirections}
          listings={cityRealEstateListings}
          filters={REAL_ESTATE_FILTERS}
          onShowOnMap={onShowOnMap}
        />
      )}

      {/* ── Events section ────────────────────────────────────────────────── */}
      {section === "events" && (
        <section className="city-section" aria-label="Події">
          {!selectedEvent && (
            <>
              <CategoryChips
                label="Категорії подій"
                items={EVENT_FILTERS}
                value={eventCategory}
                onChange={setEventCategory}
              />
            </>
          )}
          <div className="city-event-list">
            {cityEvents
              .filter(
                (event) =>
                  (!selectedEvent || event.id === selectedEvent.id) &&
                  (selectedEvent ||
                    eventCategory === "all" ||
                    event.category === eventCategory),
              )
              .map((event) =>
                event.id === selectedEventId ? (
                  <EntityDetail
                    key={event.id}
                    kind="event"
                    title={event.name}
                    eyebrow={event.category}
                    subtitle={`${event.time} · ${event.venue}`}
                    date={{ day: event.day, month: event.month }}
                    demo
                    description={event.summary}
                    info={[
                      { icon: "schedule", label: "Час", value: `${event.day} ${event.month}, ${event.time}` },
                      { icon: "location_on", label: "Місце", value: event.venue },
                    ]}
                    coordinates={event.coordinates}
                    saved={saved.has(event.id)}
                    onToggleSaved={() => toggleSaved(event.id)}
                    onShowOnMap={() => onShowOnMap(event.coordinates, event.venue)}
                    onDirections={() => onDirections(event.coordinates, event.venue)}
                  />
                ) : (
                  <UnifiedCard
                    key={event.id}
                    variant="event"
                    onClick={() => {
                      setSelectedEventId(event.id);
                      onPageNavigationChange(true, returnToSection);
                    }}
                  >
                    <UnifiedCard.Header
                      title={event.name}
                      subtitle={`${event.time} · ${event.venue}`}
                      category={`${event.category} · демо`}
                      date={{ day: event.day, month: event.month }}
                    />
                    <UnifiedCard.Action
                      label="На мапі"
                      icon="location_on"
                      variant="outline"
                      onClick={() => onShowOnMap(event.coordinates, event.venue)}
                    />
                  </UnifiedCard>
                ),
              )}
            {!selectedEvent &&
              !cityEvents.some(
                (event) => eventCategory === "all" || event.category === eventCategory,
              ) && (
                <div className="city-places-state">
                  <MaterialIcon name="event_busy" size={20} />
                  <span>Подій у цій категорії поки немає.</span>
                </div>
              )}
          </div>
        </section>
      )}

      {/* ── Market section ─────────────────────────────────────────────────── */}
      {section === "market" && (
        <section className="city-section" aria-label="Ринок">
          <div className="city-category-heading">
            <h2>Ринки та барахолки</h2>
          </div>
          <div className="city-place-list">
            {visiblePlaces.filter((p) => p.category === "market").map((place) => (
              <UnifiedCard key={place.id} variant="directory">
                <UnifiedCard.Header
                  title={place.name}
                  subtitle={place.address}
                  icon="store"
                />
                <UnifiedCard.Action
                  label="На мапі"
                  icon="location_on"
                  variant="outline"
                  onClick={() => onShowOnMap([place.lng, place.lat], place.name)}
                />
              </UnifiedCard>
            ))}
            {visiblePlaces.filter((p) => p.category === "market").length === 0 && (
              <div className="city-places-state">
                <MaterialIcon name="store" size={20} />
                <span>Ринків поки немає.</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Parking section ────────────────────────────────────────────────── */}
      {section === "parking" && (
        <section className="city-section" aria-label="Парковка">
          <div className="city-category-heading">
            <h2>Парковки</h2>
          </div>
          <div className="city-place-list">
            {visiblePlaces.filter((p) => p.category === "parking").map((place) => (
              <UnifiedCard key={place.id} variant="directory">
                <UnifiedCard.Header
                  title={place.name}
                  subtitle={place.address}
                  icon="local_parking"
                />
                <UnifiedCard.Action
                  label="На мапі"
                  icon="location_on"
                  variant="outline"
                  onClick={() => onShowOnMap([place.lng, place.lat], place.name)}
                />
              </UnifiedCard>
            ))}
            {visiblePlaces.filter((p) => p.category === "parking").length === 0 && (
              <div className="city-places-state">
                <MaterialIcon name="local_parking" size={20} />
                <span>Парковок поки немає.</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Fuel section ───────────────────────────────────────────────────── */}
      {section === "fuel" && (
        <section className="city-section" aria-label="АЗС">
          <div className="city-category-heading">
            <h2>АЗС (Заправки)</h2>
          </div>
          <div className="city-place-list">
            {visiblePlaces.filter((p) => p.category === "fuel").map((place) => (
              <UnifiedCard key={place.id} variant="directory">
                <UnifiedCard.Header
                  title={place.name}
                  subtitle={place.address}
                  icon="local_gas_station"
                />
                <UnifiedCard.Action
                  label="На мапі"
                  icon="location_on"
                  variant="outline"
                  onClick={() => onShowOnMap([place.lng, place.lat], place.name)}
                />
              </UnifiedCard>
            ))}
            {visiblePlaces.filter((p) => p.category === "fuel").length === 0 && (
              <div className="city-places-state">
                <MaterialIcon name="local_gas_station" size={20} />
                <span>АЗС поки немає.</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Charging section ───────────────────────────────────────────────── */}
      {section === "charging" && (
        <section className="city-section" aria-label="Електрозарядка">
          <div className="city-category-heading">
            <h2>Електрозарядні станції</h2>
          </div>
          <div className="city-place-list">
            {visiblePlaces.filter((p) => p.category === "charging-station").map((place) => (
              <UnifiedCard key={place.id} variant="directory">
                <UnifiedCard.Header
                  title={place.name}
                  subtitle={place.address}
                  icon="ev_station"
                />
                <UnifiedCard.Action
                  label="На мапі"
                  icon="location_on"
                  variant="outline"
                  onClick={() => onShowOnMap([place.lng, place.lat], place.name)}
                />
              </UnifiedCard>
            ))}
            {visiblePlaces.filter((p) => p.category === "charging-station").length === 0 && (
              <div className="city-places-state">
                <MaterialIcon name="ev_station" size={20} />
                <span>Електрозарядних станцій поки немає.</span>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
