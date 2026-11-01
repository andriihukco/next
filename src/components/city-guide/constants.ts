import {
  CITY_PLACE_CATEGORY_COLORS,
  cityPlaceCategories,
  cityPlaceIcons,
  type CityEducationKind,
  type CityPlace,
  type CityPlaceCategory,
} from "../../lib/city-places";
import type { CityEvent } from "../../lib/listing-types";

/** City guide sections, tabs, filters and the category lists they use. */

// ─── Types ────────────────────────────────────────────────────────────────────

export type CitySection =
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

/** How a place list is laid out. The map is a separate view, not a layout. */
export type PlacesLayout = "list" | "grid";

/** Sub-tab within the Transport section */
export type TransportTab = "nearby" | "bus" | "tram" | "trolleybus" | "taxi";

export type CityTransitType = "bus" | "tram" | "trolleybus" | "taxi";

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

export type CityGuideProps = {
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
  cityEvents: CityEvent[];
  transportVehicles: CityTransitVehicle[];
  transitDataStatus: "loading" | "ready" | "error";
  transportIsSimulated: boolean;
  onUseLiveTransit: () => void;
  searchQuery: string;
};

/** Save, map and directions actions every city guide card and detail shares. */
export type CityItemActions = {
  saved: ReadonlySet<string>;
  onToggleSaved: (id: string) => void;
  onShowOnMap: (coordinates: [number, number], placeName: string) => void;
  onDirections: (coordinates: [number, number], placeName: string) => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

// Orb colors for category rows (DESIGN.md §2, §7).
export const TRANSPORT_TABS: { id: TransportTab; label: string; icon: string; color: string }[] = [
  { id: "nearby",     label: "Поруч",       icon: "near_me",         color: "var(--transport-nearby)" },
  { id: "bus",        label: "Автобуси",    icon: "directions_bus",  color: "var(--transport-bus)" },
  { id: "tram",       label: "Трамваї",     icon: "tram",            color: "var(--transport-tram)" },
  { id: "trolleybus", label: "Тролейбуси",  icon: "electric_bolt",   color: "var(--transport-trolleybus)" },
  { id: "taxi",       label: "Таксі",       icon: "local_taxi",      color: "var(--transport-taxi)" },
];

export const CITY_SECTIONS: { id: CitySection; label: string; icon: string }[] = [
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

export const CITY_CENTER: [number, number] = [24.0297, 49.8397];

export const FEATURED_CATEGORIES: CityPlaceCategory[] = [
  "groceries", "food", "health", "pharmacy"
];

export const EXCLUDED_PLACE_CATEGORIES = new Set<CityPlaceCategory>([
  "transport", "education", "services", "jobs", "beauty", "real-estate",
  "market", "parking", "fuel", "charging-station", "recycling", "atm", "post-office",
  "bicycle-parking", "motorcycle-parking", "bus-stop", "tram-stop", "taxi-stand",
  "car-sharing", "waste-disposal", "public-toilet", "water-fountain",
]);

export const POPULAR_CATEGORY_ORDER: CityPlaceCategory[] = [
  "food", "groceries", "health", "pharmacy", "pets", "culture",
  "tourism", "stay", "parks", "sports", "finance", "public", "religion",
  "shopping", "nightlife", "library", "flowers", "veterinary", "pet-shop",
  "fitness", "yoga", "dance", "music-school", "art-studio", "playground",
  "laundry", "dry-cleaning", "optician", "dentist", "car-wash", "car-repair",
  "tire-service", "construction", "hardware", "bicycle-rental", "scooter-rental",
  "car-rental", "internet-cafe", "copy-center", "print-shop", "photo-studio",
  "shoe-repair", "key-cutting", "locksmith", "buildings", "other",
];

export const EDUCATION_KIND_LABELS: Record<CityEducationKind, string> = {
  school: "Школа",
  kindergarten: "Дитячий садок",
  university: "Університет",
  "adult-course": "Курси й спеціалізовані школи",
  library: "Бібліотека",
};

export const EVENT_FILTERS = [
  { id: "all",        label: "Усі події",  icon: "event",           color: "var(--event-all)" },
  { id: "Для родини", label: "Для родини", icon: "family_restroom", color: "var(--event-family)" },
  { id: "Діти",       label: "Діти",       icon: "child_care",      color: "var(--event-kids)" },
  { id: "Зустріч",    label: "Зустріч",    icon: "groups",          color: "var(--event-meeting)" },
] as const;

export const EDUCATION_FILTERS: { id: CityEducationKind; label: string; icon: string; color: string }[] = [
  { id: "school",       label: "Школи",        icon: "school",          color: "var(--category-education)" },
  { id: "kindergarten", label: "Садочки",      icon: "child_care",      color: "var(--category-education)" },
  { id: "university",   label: "Університети", icon: "account_balance", color: "var(--category-education)" },
  { id: "adult-course", label: "Курси",        icon: "menu_book",       color: "var(--category-education)" },
  { id: "library",      label: "Бібліотеки",   icon: "local_library",   color: "var(--category-education)" },
];

/** Place categories that make up the Послуги section, parsed from the city data. */
export const SERVICE_CATEGORY_IDS: CityPlaceCategory[] = [
  "services", "beauty", "laundry", "dry-cleaning", "car-repair", "car-wash", "tire-service",
  "shoe-repair", "key-cutting", "locksmith", "photo-studio", "print-shop", "copy-center",
  "optician", "construction", "hardware",
];

export const SERVICE_FILTERS = SERVICE_CATEGORY_IDS.map((id) => ({
  id,
  label: cityPlaceCategories.find((category) => category.id === id)?.label ?? id,
  icon: cityPlaceIcons[id],
  color: CITY_PLACE_CATEGORY_COLORS[id],
}));

export const JOB_FILTERS = [
  { id: "technology",  label: "IT",          icon: "computer",      color: "var(--job-technology)" },
  { id: "hospitality", label: "Гостинність", icon: "restaurant",    color: "var(--job-hospitality)" },
  { id: "retail",      label: "Торгівля",    icon: "shopping_cart", color: "var(--job-retail)" },
  { id: "education",   label: "Освіта",      icon: "school",        color: "var(--category-education)" },
] as const;

export const REAL_ESTATE_FILTERS = [
  { id: "rent",       label: "Оренда",         icon: "home",               color: "var(--category-stay)" },
  { id: "sale",       label: "Продаж",         icon: "real_estate_agent",  color: "var(--category-real-estate)" },
  { id: "commercial", label: "Комерція",       icon: "business",           color: "var(--category-real-estate)" },
  { id: "private",    label: "Приватне житло", icon: "house",              color: "var(--category-stay)" },
] as const;
