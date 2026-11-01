import { formatOpeningHours, type CityPlace } from "../../lib/city-places";
import { type InfoRow } from "../entity-detail";
import { type CityTransitVehicle } from "./constants";

/** Distances and info rows for city guide cards. */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "All categories" disclosure above a category row. */
/** Haversine approximation using flat-earth for short distances */
export function distanceToPlace(place: CityPlace, origin: [number, number]): number {
  const latDiff = (place.lat - origin[1]) * 111_000;
  const lngDiff = (place.lng - origin[0]) * Math.cos((origin[1] * Math.PI) / 180) * 111_000;
  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
}

export function distanceToVehicle(
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

export function formatPlaceDistance(meters: number): string {
  return meters >= 1000
    ? `${new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(meters / 1000)} км`
    : `${Math.round(meters / 10) * 10} м`;
}

export type DemoProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export function demoProductsFor(place: CityPlace): DemoProduct[] {
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

export const PLACE_INFO_ICONS: Record<string, string> = {
  Графік: "schedule",
  Email: "email",
  "Wi-Fi": "wifi",
  Кухня: "restaurant_menu",
  Оператор: "domain",
  Доступність: "accessible",
  Тераса: "deck",
  "З собою": "takeout_dining",
  Доставка: "delivery_dining",
  Вегетаріанське: "eco",
  "Оплата карткою": "credit_card",
  Зірки: "hotel_class",
  Опис: "notes",
};

const OSM_VALUES: Record<string, string> = {
  yes: "Так", no: "Ні", limited: "Частково", only: "Лише", wlan: "Так", free: "Безкоштовно",
  customers: "Для відвідувачів", designated: "Так",
};

function readableValue(value: string): string {
  return value
    .split(";")
    .map((part) => OSM_VALUES[part.trim()] ?? part.trim().replace(/_/g, " "))
    .join(", ");
}

/** Amenity chips for a place card, from OSM tags only. "no" values are left out. */
const AMENITIES: { key: string; icon: string; short: string }[] = [
  { key: "Wi-Fi", icon: "wifi", short: "Wi-Fi" },
  { key: "Доступність", icon: "accessible", short: "Доступно" },
  { key: "Тераса", icon: "deck", short: "Тераса" },
  { key: "З собою", icon: "takeout_dining", short: "З собою" },
  { key: "Доставка", icon: "delivery_dining", short: "Доставка" },
  { key: "Вегетаріанське", icon: "eco", short: "Вегетаріанське" },
  { key: "Оплата карткою", icon: "credit_card", short: "Картка" },
];

export function placeAmenities(place: CityPlace): { icon: string; label: string }[] {
  return AMENITIES.filter(({ key }) => {
    const value = place.details[key];
    return value !== undefined && value !== "no";
  }).map(({ icon, short, key }) => ({
    icon,
    label: key === "Доступність" && place.details[key] === "limited" ? "Частково доступно" : short,
  }));
}

/** The second card line: category, cuisine or hotel stars, when OSM has them. */
export function placeKindLine(place: CityPlace): string {
  const cuisine = place.details["Кухня"];
  const stars = Number.parseInt(place.details["Зірки"] ?? "", 10);
  return [
    place.categoryLabel,
    cuisine ? readableValue(cuisine) : "",
    Number.isFinite(stars) && stars > 0 ? `${stars}★ готель` : "",
  ].filter(Boolean).join(" · ");
}

/** Detail rows shown for a place. Phone and website are actions, not rows. */
export function placeInfoRows(place: CityPlace): InfoRow[] {
  return Object.entries(place.details)
    .filter(([label]) => !["Тип", "Телефон", "Мобільний", "Сайт"].includes(label))
    .map(([label, value]) => ({
      icon: PLACE_INFO_ICONS[label] ?? "info",
      label,
      value: label === "Графік" ? formatOpeningHours(value) : label === "Email" || label === "Опис" ? value : readableValue(value),
      href: label === "Email" ? `mailto:${value}` : undefined,
    }));
}
