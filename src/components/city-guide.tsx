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
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  MaterialIcon,
  X,
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
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
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

const TRANSIT_TYPE_TO_TAB: Record<CityTransitType, TransportTab> = {
  bus: "bus",
  tram: "tram",
  trolleybus: "trolleybus",
  taxi: "taxi",
};

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

const CATEGORY_PHOTOS: Record<CityPlaceCategory, string> = {
  groceries:   "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=82",
  food:        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=82",
  health:      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=82",
  pets:        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=82",
  education:   "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=82",
  parks:       "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=82",
  sports:      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=82",
  culture:     "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=900&q=82",
  tourism:     "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=900&q=82",
  transport:   "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=82",
  finance:     "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=82",
  public:      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=82",
  religion:    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=82",
  shopping:    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=82",
  nightlife:   "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=82",
  services:    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=82",
  jobs:        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=82",
  beauty:      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=82",
  "real-estate":"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=82",
  stay:        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=82",
  buildings:   "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=900&q=82",
  other:       "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=82",
  // New categories
  market:      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=82",
  parking:     "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=900&q=82",
  fuel:        "https://images.unsplash.com/photo-1547165868-28cb4c0c01b7?auto=format&fit=crop&w=900&q=82",
  "charging-station": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=900&q=82",
  recycling:   "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=900&q=82",
  pharmacy:    "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=900&q=82",
  atm:         "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=900&q=82",
  "post-office": "https://images.unsplash.com/photo-1563227696-d43d5d085b45?auto=format&fit=crop&w=900&q=82",
  library:     "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=900&q=82",
  "car-wash":  "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=900&q=82",
  "car-repair": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=900&q=82",
  "tire-service": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=82",
  construction: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=82",
  hardware:    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=82",
  flowers:     "https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=900&q=82",
  veterinary:  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=82",
  "pet-shop":  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=900&q=82",
  laundry:     "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?auto=format&fit=crop&w=900&q=82",
  "dry-cleaning": "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=900&q=82",
  optician:    "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=900&q=82",
  dentist:     "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=900&q=82",
  fitness:     "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=82",
  yoga:        "https://images.unsplash.com/photo-1544367563-12123d8965cd?auto=format&fit=crop&w=900&q=82",
  dance:       "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?auto=format&fit=crop&w=900&q=82",
  "music-school": "https://images.unsplash.com/photo-1507838153414-b4b713384ebd?auto=format&fit=crop&w=900&q=82",
  "art-studio": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=82",
  playground:  "https://images.unsplash.com/photo-1560010930-7e673c91f249?auto=format&fit=crop&w=900&q=82",
  "bicycle-rental": "https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=82",
  "scooter-rental": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=82",
  "car-rental": "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=900&q=82",
  "internet-cafe": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=82",
  "copy-center": "https://images.unsplash.com/photo-1568702846914-96b305d28998?auto=format&fit=crop&w=900&q=82",
  "print-shop": "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=900&q=82",
  "photo-studio": "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=900&q=82",
  "shoe-repair": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=900&q=82",
  "key-cutting": "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=900&q=82",
  locksmith:   "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=82",
  "waste-disposal": "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=900&q=82",
  "water-fountain": "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?auto=format&fit=crop&w=900&q=82",
  "public-toilet": "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=82",
  "bicycle-parking": "https://images.unsplash.com/photo-1571069917304-3906ca5065c9?auto=format&fit=crop&w=900&q=82",
  "motorcycle-parking": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=82",
  "bus-stop":   "https://images.unsplash.com/photo-1553307654-913a27a11b27?auto=format&fit=crop&w=900&q=82",
  "tram-stop":  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=900&q=82",
  "taxi-stand": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=82",
  "car-sharing": "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=900&q=82",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatCartItemCount(count: number): string {
  if (count % 100 >= 11 && count % 100 <= 19) return "товарів";
  const last = count % 10;
  if (last === 1) return "товар";
  if (last >= 2 && last <= 4) return "товари";
  return "товарів";
}

type PlaceActionKind = "cart" | "books" | "hotel" | "reservation" | "tickets" | "save";
type DemoProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
};

function placeActionFor(place: CityPlace): {
  kind: PlaceActionKind;
  title: string;
  description: string;
  buttonLabel: string;
} {
  switch (place.category) {
    case "groceries":
      return { kind: "cart", title: "Замовлення", description: "Демо-кошик для цього магазину.", buttonLabel: "Оформити" };
    case "food":
      return { kind: "cart", title: "Меню та замовлення", description: "Демонстраційне меню закладу.", buttonLabel: "Замовити" };
    case "education":
      return { kind: "books", title: "Каталог", description: "Доступні книги та матеріали.", buttonLabel: "Зарезервувати" };
    case "stay":
      return { kind: "hotel", title: "Бронювання номера", description: "Демо-форма для готелю.", buttonLabel: "Забронювати" };
    case "health":
      return { kind: "reservation", title: "Запис на прийом", description: "Демо-запис до фахівця.", buttonLabel: "Записатися" };
    case "sports":
      return { kind: "tickets", title: "Квитки", description: "Демо-замовлення квитків.", buttonLabel: "Придбати" };
    case "culture":
    case "tourism":
      return { kind: "tickets", title: "Квитки та екскурсії", description: "Демо-замовлення квитків.", buttonLabel: "Придбати" };
    default:
      return { kind: "save", title: "Збережи місце", description: "Додайте до локального списку.", buttonLabel: "Зберегти" };
  }
}

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

function bookingChoicesFor(place: CityPlace): { label: string; options: string[] } | null {
  if (place.category === "health")  return { label: "Спеціалізація", options: ["Терапевт", "Стоматолог", "Офтальмолог"] };
  if (place.category === "sports")  return { label: "Вид спорту",    options: ["Футбол", "Теніс", "Плавання"] };
  if (place.category === "culture") return { label: "Тип події",     options: ["Виставка", "Екскурсія", "Майстер-клас"] };
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlaceMapButton({
  place,
  onShowOnMap,
}: {
  place: CityPlace;
  onShowOnMap: (coordinates: [number, number], name: string) => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="osm-place-map-button"
      onClick={() => onShowOnMap([place.lng, place.lat], place.name)}
    >
      <MaterialIcon name="location_on" size={17} />
      На мапі
    </Button>
  );
}

function PlacePhoto({
  place,
  distance,
}: {
  place: CityPlace;
  distance: string;
}) {
  const [imageError, setImageError] = useState(false);
  const photoUrl = place.imageUrl ?? CATEGORY_PHOTOS[place.category];
  return (
    <div className="osm-place-photo">
      {!imageError && photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          aria-hidden="true"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className={`osm-place-photo-placeholder ${place.category}`}>
          <MaterialIcon name={cityPlaceIcons[place.category]} size={26} />
        </div>
      )}
      <span className="osm-place-distance">{distance}</span>
    </div>
  );
}

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
      {!detailPage && onOpen && (
        <UnifiedCard.Action
          label="Детальніше"
          icon="chevron_right"
          variant="secondary"
          onClick={onOpen}
        />
      )}
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
  listings,
  filters,
  onShowOnMap,
}: {
  title: string;
  listings: CityDirectoryListing[];
  filters: ReadonlyArray<{ id: string; label: string; icon: string }>;
  onShowOnMap: (coordinates: [number, number], name: string) => void;
}) {
  const [activeFilter, setActiveFilter] = useState(filters[0]?.id ?? "");
  const [showAllCategories, setShowAllCategories] = useState(false);

  const visible = useMemo(() => {
    return listings.filter((item) => item.category === activeFilter);
  }, [listings, activeFilter]);

  const currentFilterLabel = filters.find((f) => f.id === activeFilter)?.label || filters[0]?.label || title;

  return (
    <section className="city-section" aria-labelledby="directory-title">
      <div className="city-category-heading">
        <button
          type="button"
          aria-expanded={showAllCategories}
          onClick={() => setShowAllCategories((c) => !c)}
        >
          Усі категорії
          <MaterialIcon
            name={showAllCategories ? "keyboard_arrow_up" : "keyboard_arrow_down"}
            size={20}
          />
        </button>
        <button
          type="button"
          className="city-filters-button"
          aria-label="Фільтри"
        >
          <MaterialIcon name="tune" size={20} />
          Фільтри
        </button>
      </div>
      {!showAllCategories && (
        <div className="city-filter-row" role="group" aria-label={`Фільтр: ${title}`}>
        {filters.map((filter) => (
          <button
            type="button"
            key={filter.id}
            data-filter={filter.id}
            className={activeFilter === filter.id ? "active" : ""}
            aria-pressed={activeFilter === filter.id}
            onClick={() => setActiveFilter(filter.id)}
          >
            <span className="city-filter-row-orb">
              <MaterialIcon name={filter.icon} size={34} />
            </span>
            <span className="city-filter-row-label">{filter.label}</span>
          </button>
        ))}
      </div>
      )}
      {showAllCategories && (
        <div className="city-category-grid expanded" role="group" aria-label="Усі категорії">
          {filters.map((filter) => (
            <button
              type="button"
              key={filter.id}
              className={`city-category-tile${activeFilter === filter.id ? " active" : ""}`}
              aria-pressed={activeFilter === filter.id}
              onClick={() => {
                setActiveFilter(filter.id);
                setShowAllCategories(false);
              }}
            >
              <span className="city-filter-row-orb">
                <MaterialIcon name={filter.icon} size={34} />
              </span>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      )}
      <div className="city-place-list">
        {visible.map((item) => (
          <UnifiedCard key={item.id} variant="directory">
            <UnifiedCard.Header
              title={item.name}
              subtitle={item.summary}
              icon="business"
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
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllEventCategories, setShowAllEventCategories] = useState(false);
  const [showAllTransportCategories, setShowAllTransportCategories] = useState(false);
  const [placeCategory, setPlaceCategory] = useState<
    "popular" | "nearby" | CityPlaceCategory
  >("popular");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [placeDisplayLimit, setPlaceDisplayLimit] = useState(40);
  const [placeCart, setPlaceCart] = useState<Record<string, Record<string, number>>>({});
  const [placeActionSearch, setPlaceActionSearch] = useState<Record<string, string>>({});
  const [placeActionFeedback, setPlaceActionFeedback] = useState<Record<string, string>>({});
  const [savedPlaces, setSavedPlaces] = useState<Set<string>>(() => new Set());
  const [educationKind, setEducationKind] = useState<CityEducationKind>("school");
  const [selectedEducationId, setSelectedEducationId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [goingEvents, setGoingEvents] = useState<Set<string>>(() => new Set());
  const [eventCategory, setEventCategory] = useState("all");

  const origin = userLocation ?? CITY_CENTER;

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

  const isDetailPage = Boolean(selectedPlaceId || selectedEducationId || selectedEventId);

  const returnToSection = (): void => {
    setSelectedPlaceId(null);
    setSelectedEducationId(null);
    setSelectedEventId(null);
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

  const updatePlaceCart = (placeId: string, productId: string, delta: number): void => {
    setPlaceCart((current) => {
      const nextPlaceItems = { ...(current[placeId] ?? {}) };
      const nextCount = Math.max(0, (nextPlaceItems[productId] ?? 0) + delta);
      if (nextCount === 0) delete nextPlaceItems[productId];
      else nextPlaceItems[productId] = nextCount;
      return { ...current, [placeId]: nextPlaceItems };
    });
  };

  const setPlaceFeedback = (placeId: string, message: string): void => {
    setPlaceActionFeedback((current) => ({ ...current, [placeId]: message }));
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="city-guide">

      {/* ── Section navigation ─────────────────────────────────────────────── */}
      <nav
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

          <div className="city-category-heading">
            <button
              type="button"
              aria-expanded={showAllTransportCategories}
              onClick={() => setShowAllTransportCategories((c) => !c)}
            >
              Усі категорії
              <MaterialIcon
                name={showAllTransportCategories ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                size={20}
              />
            </button>
            <button
              type="button"
              className="city-filters-button"
              aria-label="Фільтри"
            >
              <MaterialIcon name="tune" size={20} />
              Фільтри
            </button>
          </div>

          {/* Transport type tab bar */}
          {!showAllTransportCategories && (
            <div
              className="city-transport-tab-bar"
              role="tablist"
              aria-label="Тип транспорту"
            >
            {TRANSPORT_TABS.map((tab) => {
              const count =
                tab.id === "nearby"
                  ? 0
                  : transportVehicles.filter((v) => v.type === tab.id).length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={transportTab === tab.id}
                  data-filter={tab.id}
                  className={`city-transport-tab${transportTab === tab.id ? " active" : ""}`}
                  onClick={() => {
                    setTransportTab(tab.id);
                    localStorage.setItem("eway-last-transport-tab", tab.id);
                  }}
                >
                  <span className="city-transport-tab-orb">
                    <MaterialIcon name={tab.icon} size={34} />
                  </span>
                  <span className="city-transport-tab-label">{tab.label}</span>
                  {count > 0 && (
                    <span className="city-transport-tab-count">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
          )}
          {showAllTransportCategories && (
            <div className="city-category-grid expanded" role="group" aria-label="Усі категорії">
              {TRANSPORT_TABS.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  className={`city-category-tile${transportTab === tab.id ? " active" : ""}`}
                  aria-pressed={transportTab === tab.id}
                  onClick={() => {
                    setTransportTab(tab.id);
                    localStorage.setItem("eway-last-transport-tab", tab.id);
                    setShowAllTransportCategories(false);
                  }}
                >
                  <span className="city-transport-tab-orb">
                    <MaterialIcon name={tab.icon} size={34} />
                  </span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          )}

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
          {selectedPlaceId ? (
            <div className="city-place-detail-heading">
              {places
                .filter((place) => place.id === selectedPlaceId)
                .map((place) => (
                  <div key={place.id}>
                    <span>{place.categoryLabel}</span>
                    <h2 id="places-title">{place.name}</h2>
                    <p>{place.address}</p>
                  </div>
                ))}
            </div>
          ) : null}
          {!selectedPlaceId && (
            <div className={`city-category-heading${showAllCategories ? " expanded" : ""}`}>
              <button
                type="button"
                aria-expanded={showAllCategories}
                onClick={() => setShowAllCategories((c) => !c)}
              >
                Усі категорії
                <MaterialIcon
                  name={showAllCategories ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                  size={20}
                />
              </button>
              <button
                type="button"
                className="city-filters-button"
                aria-label="Фільтри"
              >
                <MaterialIcon name="tune" size={20} />
                Фільтри
              </button>
            </div>
          )}
          {!selectedPlaceId && (
            <div
              className={`city-category-grid${showAllCategories ? " expanded" : " scrollable"}`}
              role="group"
              aria-label="Категорії місць"
            >
              <button
                type="button"
                className={`city-category-tile city-category-popular${placeCategory === "popular" ? " active" : ""}`}
                aria-pressed={placeCategory === "popular"}
                onClick={() => { setPlaceCategory("popular"); setPlaceDisplayLimit(40); }}
              >
                <span className="city-category-orb">
                  <MaterialIcon name="award_star" size={34} />
                </span>
                <span>Популярне</span>
              </button>
              {userLocation && (
                <button
                  type="button"
                  className={`city-category-tile city-category-nearby${placeCategory === "nearby" ? " active" : ""}`}
                  aria-pressed={placeCategory === "nearby"}
                  onClick={() => { setPlaceCategory("nearby"); setPlaceDisplayLimit(40); }}
                >
                  <span className="city-category-orb">
                    <MaterialIcon name="near_me" size={34} />
                  </span>
                  <span>Поруч</span>
                </button>
              )}
              {availableCategories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  className={`city-category-tile category-${category.id}${placeCategory === category.id ? " active" : ""}`}
                  aria-pressed={placeCategory === category.id}
                  onClick={() => { setPlaceCategory(category.id); setPlaceDisplayLimit(40); }}
                >
                  <span
                    className="city-category-orb"
                    style={{ "--category-color": CITY_PLACE_CATEGORY_COLORS[category.id] } as CSSProperties}
                  >
                    <MaterialIcon name={cityPlaceIcons[category.id]} size={34} />
                  </span>
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
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
                      : cityPlaceCategories.find((c) => c.id === placeCategory)?.label}
                  </h3>
                  <span>
                    {placeCategory === "nearby" ? "Місця поруч" : cityPlaceCategories.find((c) => c.id === placeCategory)?.label}
                  </span>
                </div>
              )}
              <div className={`city-place-list city-osm-place-list${selectedPlaceId ? " place-detail-list" : ""}`}>
                {shownPlaces
                  .filter((place) => !selectedPlaceId || place.id === selectedPlaceId)
                  .map((place) => {
                    const detailOpen = selectedPlaceId === place.id;
                    const action = placeActionFor(place);
                    const bookingChoice = bookingChoicesFor(place);
                    const products = demoProductsFor(place);
                    const actionSearch = placeActionSearch[place.id] ?? "";
                    const filteredProducts = products.filter((product) =>
                      `${product.name} ${product.description}`
                        .toLocaleLowerCase("uk-UA")
                        .includes(actionSearch.trim().toLocaleLowerCase("uk-UA")),
                    );
                    const cart = placeCart[place.id] ?? {};
                    const cartCount = Object.values(cart).reduce((t, c) => t + c, 0);
                    const cartTotal = products.reduce(
                      (total, product) => total + product.price * (cart[product.id] ?? 0),
                      0,
                    );
                    return (
                      <>
                        <UnifiedCard
                          key={place.id}
                          variant={place.category === "food" ? "restaurant" : place.category === "stay" ? "hotel" : "place"}
                          onClick={() => {
                            setSelectedPlaceId(place.id);
                            onPageNavigationChange(true, returnToSection);
                          }}
                          aria-label={`Відкрити сторінку ${place.name}`}
                        >
                          <UnifiedCard.Header
                            title={place.name}
                            subtitle={place.address}
                            icon={cityPlaceIcons[place.category]}
                            iconColor={CITY_PLACE_CATEGORY_COLORS[place.category]}
                            category={place.categoryLabel}
                          />
                          <UnifiedCard.Meta
                            label="Відстань"
                            value={formatPlaceDistance(distanceToPlace(place, origin))}
                            icon="location_on"
                          />
                          {place.details["Графік"] && (
                            <UnifiedCard.Meta
                              label="Графік"
                              value={formatOpeningHours(place.details["Графік"])}
                              icon="schedule"
                            />
                          )}
                          {place.details["Телефон"] && (
                            <UnifiedCard.Meta
                              label="Телефон"
                              value={place.details["Телефон"]}
                              icon="call"
                              clickable
                              onClick={() => {
                                const phone = place.details["Телефон"].replace(/\D/g, "");
                                window.open(`tel:${phone}`, "_self");
                              }}
                            />
                          )}
                        </UnifiedCard>
                        {detailOpen && (
                          <UnifiedCard variant="place" className="place-detail-card">
                            <UnifiedCard.Header
                              title="Деталі"
                              icon="info"
                            />
                            {Object.entries(place.details)
                              .filter(([l]) => l !== "Тип")
                              .map(([l, value]) => {
                                const isPhone = l === "Телефон" || l === "Мобільний";
                                const isWebsite = l === "Сайт" || l === "Email";
                                const isHours = l === "Графік";
                                const icon =
                                  l === "Графік" ? "schedule" :
                                  l === "Телефон" || l === "Мобільний" ? "call" :
                                  l === "Сайт" ? "language" :
                                  l === "Email" ? "email" :
                                  l === "Wi-Fi" ? "wifi" :
                                  l === " wheelchair" ? "accessible" : "info";

                                return (
                                  <UnifiedCard.Meta
                                    key={l}
                                    label={l}
                                    value={isHours ? formatOpeningHours(value) : value}
                                    icon={icon}
                                    clickable={isPhone || isWebsite}
                                    onClick={() => {
                                      if (isPhone) {
                                        const phone = value.replace(/\D/g, "");
                                        window.open(`tel:${phone}`, "_self");
                                      } else if (l === "Сайт") {
                                        window.open(value.startsWith("http") ? value : `https://${value}`, "_blank");
                                      } else if (l === "Email") {
                                        window.open(`mailto:${value}`, "_self");
                                      }
                                    }}
                                  />
                                );
                              })}
                          </UnifiedCard>
                        )}
                        {detailOpen && (
                          <section className="osm-place-detail">
                            <>
                              {action.kind === "books" && (
                                <>
                                  <label className="osm-place-catalog-search">
                                    <MaterialIcon name="search" size={19} />
                                    <input
                                      type="search"
                                      aria-label={`Пошук книг у ${place.name}`}
                                      placeholder="Знайти книгу"
                                      value={actionSearch}
                                      onChange={(e) =>
                                        setPlaceActionSearch((c) => ({ ...c, [place.id]: e.target.value }))
                                      }
                                    />
                                  </label>
                                  <div className="osm-place-product-list">
                                    {filteredProducts.map((book) => (
                                      <div className="osm-place-product" key={book.id}>
                                        <div>
                                          <strong>{book.name}</strong>
                                          <span>{book.description}</span>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          className="osm-place-add-button"
                                          onClick={() => setPlaceFeedback(place.id, `Запит на «${book.name}» збережено локально.`)}
                                        >
                                          Зарезервувати
                                        </Button>
                                      </div>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                      <p className="osm-place-catalog-empty">Книгу не знайдено в демо-каталозі.</p>
                                    )}
                                  </div>
                                </>
                              )}
                            {(action.kind === "hotel" || action.kind === "reservation") && (
                              <form
                                className="osm-place-booking-form"
                                onSubmit={(event) => {
                                  event.preventDefault();
                                  const fd = new FormData(event.currentTarget);
                                  if (action.kind === "hotel") {
                                    const arrival = String(fd.get("arrival"));
                                    const departure = String(fd.get("departure"));
                                    if (departure <= arrival) {
                                      setPlaceFeedback(place.id, "Дата виїзду має бути пізніше за дату заїзду.");
                                      return;
                                    }
                                    setPlaceFeedback(place.id, `Дати ${arrival} — ${departure} збережено локально.`);
                                  } else {
                                    const choice = String(fd.get("booking-choice") ?? "");
                                    setPlaceFeedback(place.id, `${choice ? `${choice}: ` : ""}план збережено локально.`);
                                  }
                                }}
                              >
                                <div className="osm-place-form-fields">
                                  {action.kind === "hotel" ? (
                                    <>
                                      <label>Заїзд<input type="date" name="arrival" required /></label>
                                      <label>Виїзд<input type="date" name="departure" required /></label>
                                      <label>Гості
                                        <select name="guests" defaultValue="2">
                                          {["1","2","3","4","5"].map((n) => (
                                            <option key={n} value={n}>{n} {n === "1" ? "гість" : n <= "4" ? "гості" : "гостей"}</option>
                                          ))}
                                        </select>
                                      </label>
                                    </>
                                  ) : (
                                    <>
                                      <label>Дата й час<input type="datetime-local" name="visit" required /></label>
                                      {bookingChoice && (
                                        <label>
                                          {bookingChoice.label}
                                          <select name="booking-choice" defaultValue={bookingChoice.options[0]}>
                                            {bookingChoice.options.map((opt) => (
                                              <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                          </select>
                                        </label>
                                      )}
                                    </>
                                  )}
                                </div>
                                <Button type="submit" className="osm-place-primary-action">
                                  <MaterialIcon
                                    name={action.kind === "hotel" ? "hotel" : "event_available"}
                                    size={18}
                                  />
                                  {action.buttonLabel}
                                </Button>
                              </form>
                            )}
                            {action.kind === "tickets" && (
                              <form
                                className="osm-place-ticket-form"
                                onSubmit={(event) => {
                                  event.preventDefault();
                                  const fd = new FormData(event.currentTarget);
                                  setPlaceFeedback(place.id, `План для ${fd.get("ticket-count")} кв. збережено локально.`);
                                }}
                              >
                                <label>
                                  Кількість
                                  <select name="ticket-count" defaultValue="2">
                                    {["1","2","3","4"].map((n) => (
                                      <option key={n} value={n}>{n} квиток{n === "1" ? "" : n <= "4" ? "и" : "ів"}</option>
                                    ))}
                                  </select>
                                </label>
                                <Button type="submit" className="osm-place-primary-action">
                                  {action.buttonLabel}
                                </Button>
                              </form>
                            )}
                            {action.kind === "save" && (
                              <Button
                                type="button"
                                className={`osm-place-primary-action${savedPlaces.has(place.id) ? " is-saved" : ""}`}
                                aria-pressed={savedPlaces.has(place.id)}
                                onClick={() => {
                                  setSavedPlaces((current) => toggleSetValue(current, place.id));
                                  setPlaceFeedback(
                                    place.id,
                                    savedPlaces.has(place.id)
                                      ? "Місце вилучено зі збережених."
                                      : "Місце додано до збережених.",
                                  );
                                }}
                              >
                                <MaterialIcon
                                  name={savedPlaces.has(place.id) ? "bookmark_added" : "bookmark_add"}
                                  size={18}
                                />
                                {savedPlaces.has(place.id) ? "Збережено" : action.buttonLabel}
                              </Button>
                            )}
                            {placeActionFeedback[place.id] && (
                              <p className="osm-place-action-feedback" role="status">
                                <MaterialIcon name="check_circle" size={18} />
                                {placeActionFeedback[place.id]}
                              </p>
                            )}
                            </>
                          </section>
                        )}
                      </>
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
              <div className="city-place-detail-heading">
                <span>{EDUCATION_KIND_LABELS[selectedEducation.kind]}</span>
                <h2 id="education-title">{selectedEducation.place.name}</h2>
              </div>
              <div className="city-nested-detail">
                <EducationCard
                  place={selectedEducation.place}
                  kind={selectedEducation.kind}
                  onShowOnMap={onShowOnMap}
                  detailPage
                />
              </div>
            </>
          ) : (
            <>
              <div className="city-category-heading">
                <button
                  type="button"
                  aria-expanded={showAllCategories}
                  onClick={() => setShowAllCategories((c) => !c)}
                >
                  Усі категорії
                  <MaterialIcon
                    name={showAllCategories ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                    size={20}
                  />
                </button>
                <button
                  type="button"
                  className="city-filters-button"
                  aria-label="Фільтри"
                >
                  <MaterialIcon name="tune" size={20} />
                  Фільтри
                </button>
              </div>
              {!showAllCategories && (
                <div className="city-filter-row" role="group" aria-label="Тип закладу">
                {EDUCATION_FILTERS.map((filter) => (
                  <button
                    type="button"
                    key={filter.id}
                    data-filter={filter.id}
                    className={educationKind === filter.id ? "active" : ""}
                    aria-pressed={educationKind === filter.id}
                    onClick={() => setEducationKind(filter.id)}
                  >
                    <span className="city-filter-row-orb">
                      <MaterialIcon name={filter.icon} size={34} />
                    </span>
                    <span className="city-filter-row-label">{filter.label}</span>
                  </button>
                ))}
              </div>
              )}
              {showAllCategories && (
                <div className="city-category-grid expanded" role="group" aria-label="Усі категорії">
                  {EDUCATION_FILTERS.map((filter) => (
                    <button
                      type="button"
                      key={filter.id}
                      className={`city-category-tile${educationKind === filter.id ? " active" : ""}`}
                      aria-pressed={educationKind === filter.id}
                      onClick={() => {
                        setEducationKind(filter.id);
                        setShowAllCategories(false);
                      }}
                    >
                      <span className="city-filter-row-orb">
                        <MaterialIcon name={filter.icon} size={34} />
                      </span>
                      <span>{filter.label}</span>
                    </button>
                  ))}
                </div>
              )}
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
          listings={cityServiceListings}
          filters={SERVICE_FILTERS}
          onShowOnMap={onShowOnMap}
        />
      )}
      {section === "jobs" && (
        <DirectoryListingPage
          title="Робота у Львові"
          listings={cityJobListings}
          filters={JOB_FILTERS}
          onShowOnMap={onShowOnMap}
        />
      )}
      {section === "real-estate" && (
        <DirectoryListingPage
          title="Нерухомість"
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
              <div className="city-category-heading">
                <button
                  type="button"
                  aria-expanded={showAllEventCategories}
                  onClick={() => setShowAllEventCategories((c) => !c)}
                >
                  Усі категорії
                  <MaterialIcon
                    name={showAllEventCategories ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                    size={20}
                  />
                </button>
                <button
                  type="button"
                  className="city-filters-button"
                  aria-label="Фільтри"
                >
                  <MaterialIcon name="tune" size={20} />
                  Фільтри
                </button>
              </div>
              {!showAllEventCategories && (
                <div className="city-filter-row" role="group" aria-label="Категорії подій">
                {[
                  { id: "all", label: "Усі події", icon: "event" },
                  { id: "Для родини", label: "Для родини", icon: "family_restroom" },
                  { id: "Діти", label: "Діти", icon: "child_care" },
                  { id: "Зустріч", label: "Зустріч", icon: "groups" },
                ].map((category) => (
                  <button
                    type="button"
                    key={category.id}
                    data-filter={category.id}
                    className={eventCategory === category.id ? "active" : ""}
                    aria-pressed={eventCategory === category.id}
                    onClick={() => setEventCategory(category.id)}
                  >
                    <span className="city-filter-row-orb">
                      <MaterialIcon name={category.icon} size={34} />
                    </span>
                    <span className="city-filter-row-label">{category.label}</span>
                  </button>
                ))}
              </div>
              )}
              {showAllEventCategories && (
                <div className="city-category-grid expanded" role="group" aria-label="Усі категорії">
                  {[
                    { id: "all", label: "Усі події", icon: "event" },
                    { id: "Для родини", label: "Для родини", icon: "family_restroom" },
                    { id: "Діти", label: "Діти", icon: "child_care" },
                    { id: "Зустріч", label: "Зустріч", icon: "groups" },
                  ].map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      className={`city-category-tile${eventCategory === category.id ? " active" : ""}`}
                      aria-pressed={eventCategory === category.id}
                      onClick={() => {
                        setEventCategory(category.id);
                        setShowAllEventCategories(false);
                      }}
                    >
                      <span className="city-filter-row-orb">
                        <MaterialIcon name={category.icon} size={34} />
                      </span>
                      <span>{category.label}</span>
                    </button>
                  ))}
                </div>
              )}
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
              .map((event) => {
                const going = goingEvents.has(event.id);
                const detailPage = event.id === selectedEventId;
                return (
                  <article
                    className={`event-card${detailPage ? " event-detail-page" : ""}`}
                    key={event.id}
                  >
                    <div className="event-date">
                      <strong>{event.day}</strong>
                      <span>{event.month}</span>
                    </div>
                    <div className="event-card-content">
                      <div className="event-category">{event.category}</div>
                      <h3>{event.name}</h3>
                      <p>{event.summary}</p>
                      <div className="event-meta">
                        <span><Clock3 size={13} aria-hidden="true" />{event.time}</span>
                        <span><MapPin size={13} aria-hidden="true" />{event.venue}</span>
                      </div>
                      <div className="event-actions">
                        {detailPage ? (
                          <>
                            <Button
                              type="button"
                              variant={going ? "default" : "outline"}
                              className="event-going"
                              aria-pressed={going}
                              onClick={() => setGoingEvents((c) => toggleSetValue(c, event.id))}
                            >
                              <CalendarDays size={15} aria-hidden="true" />
                              {going ? "Ви йдете" : "Піду"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="event-map-link"
                              onClick={() => onShowOnMap(event.coordinates, event.venue)}
                            >
                              Місце <ArrowUpRight size={14} aria-hidden="true" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              className="event-open"
                              onClick={() => onShowOnMap(event.coordinates, event.venue)}
                            >
                              <MapPin size={15} aria-hidden="true" />
                              На мапі
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="event-open"
                              onClick={() => {
                                setSelectedEventId(event.id);
                                onPageNavigationChange(true, returnToSection);
                              }}
                            >
                              Деталі
                              <MaterialIcon name="chevron_right" size={19} />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
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
