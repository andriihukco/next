/**
 * @file demo-data.ts
 * @description Demo catalogs for the services hub. Nothing here is a real
 *   provider, price list, or availability. Every screen that shows this data
 *   carries a «Демо» label (DESIGN.md §13).
 */

export type DemoStore = {
  id: string;
  name: string;
  kind: string;
  address: string;
  hours: string;
  /** Estimated delivery or preparation time. Shown as an estimate. */
  eta: string;
};

export type DemoItem = {
  id: string;
  name: string;
  unit: string;
  price: number;
};

export type DemoSpecialty = { id: string; label: string; icon: string };
export type DemoDoctor = { id: string; name: string; specialtyId: string; clinic: string };
export type DemoFilm = { id: string; title: string; meta: string; description: string };
export type DemoGym = { id: string; name: string; address: string; hours: string; trial: boolean };
export type DemoPlace = { id: string; name: string; address: string };

const UAH_FORMAT = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "UAH",
  maximumFractionDigits: 0,
});

/** Formats an amount in hryvnia, for example «₴ 1 250». */
export function formatUAH(amount: number): string {
  return UAH_FORMAT.format(amount);
}

// ─── Shop: groceries and delivery ────────────────────────────────────────────

export const GROCERY_STORES: DemoStore[] = [
  {
    id: "g-central",
    name: "Магазин «Центральний»",
    kind: "Продукти",
    address: "вул. Городоцька, 40",
    hours: "08:00–23:00",
    eta: "20–30 хв",
  },
  {
    id: "g-market",
    name: "Крамниця «Ринок»",
    kind: "Продукти",
    address: "пл. Ринок, 1",
    hours: "09:00–22:00",
    eta: "30–40 хв",
  },
];

export const GROCERY_CATALOG: DemoItem[] = [
  { id: "milk", name: "Молоко 2,5%", unit: "1 л", price: 42 },
  { id: "bread", name: "Хліб житній", unit: "400 г", price: 36 },
  { id: "eggs", name: "Яйця курячі", unit: "10 шт", price: 98 },
  { id: "apples", name: "Яблука", unit: "1 кг", price: 64 },
  { id: "tomatoes", name: "Томати", unit: "500 г", price: 58 },
  { id: "cheese", name: "Сир твердий", unit: "200 г", price: 129 },
  { id: "water", name: "Вода мінеральна", unit: "1,5 л", price: 24 },
  { id: "coffee", name: "Кава мелена", unit: "250 г", price: 189 },
];

// ─── Restaurants: delivery menus and table booking ───────────────────────────

export const RESTAURANTS: DemoStore[] = [
  {
    id: "r-sonce",
    name: "Бістро «Сонце»",
    kind: "Українська кухня",
    address: "вул. Руська, 12",
    hours: "10:00–23:00",
    eta: "30–40 хв",
  },
  {
    id: "r-pasta",
    name: "Тратторія «Демо»",
    kind: "Італійська кухня",
    address: "пл. Митна, 3",
    hours: "11:00–24:00",
    eta: "35–45 хв",
  },
  {
    id: "r-sushi",
    name: "Суші-бар «Хвиля»",
    kind: "Японська кухня",
    address: "просп. Свободи, 28",
    hours: "12:00–23:00",
    eta: "40–50 хв",
  },
];

export const MENUS: Record<string, DemoItem[]> = {
  "r-sonce": [
    { id: "borsch", name: "Борщ з пампушками", unit: "400 г", price: 165 },
    { id: "varenyky", name: "Вареники з картоплею", unit: "300 г", price: 139 },
    { id: "salo-plate", name: "Тарілка сала", unit: "250 г", price: 210 },
    { id: "kompot", name: "Узвар", unit: "400 мл", price: 60 },
  ],
  "r-pasta": [
    { id: "carbonara", name: "Карбонара", unit: "320 г", price: 189 },
    { id: "margherita", name: "Піца Маргарита", unit: "30 см", price: 175 },
    { id: "tiramisu", name: "Тірамісу", unit: "150 г", price: 119 },
    { id: "lemonade", name: "Лимонад домашній", unit: "400 мл", price: 85 },
  ],
  "r-sushi": [
    { id: "philadelphia", name: "Філадельфія", unit: "8 шт", price: 240 },
    { id: "tempura", name: "Темпура з креветкою", unit: "6 шт", price: 185 },
    { id: "miso", name: "Місо-суп", unit: "300 мл", price: 95 },
    { id: "matcha", name: "Матча латте", unit: "350 мл", price: 110 },
  ],
};

// ─── Doctors ─────────────────────────────────────────────────────────────────

export const SPECIALTIES: DemoSpecialty[] = [
  { id: "therapist", label: "Терапевт", icon: "stethoscope" },
  { id: "pediatrician", label: "Педіатр", icon: "child_care" },
  { id: "dentist", label: "Стоматолог", icon: "dentistry" },
  { id: "ophthalmologist", label: "Офтальмолог", icon: "visibility" },
  { id: "dermatologist", label: "Дерматолог", icon: "dermatology" },
];

export const DOCTORS: DemoDoctor[] = [
  {
    id: "d-t1",
    name: "Олена Коваленко",
    specialtyId: "therapist",
    clinic: "Клініка «Здоров'я» (демо)",
  },
  {
    id: "d-t2",
    name: "Андрій Мельник",
    specialtyId: "therapist",
    clinic: "Медцентр «Поділ» (демо)",
  },
  {
    id: "d-p1",
    name: "Ірина Шевчук",
    specialtyId: "pediatrician",
    clinic: "Дитяча клініка (демо)",
  },
  {
    id: "d-p2",
    name: "Максим Бондар",
    specialtyId: "pediatrician",
    clinic: "Медцентр «Поділ» (демо)",
  },
  {
    id: "d-d1",
    name: "Наталія Гнатюк",
    specialtyId: "dentist",
    clinic: "Стоматологія «Посмішка» (демо)",
  },
  {
    id: "d-d2",
    name: "Тарас Василюк",
    specialtyId: "dentist",
    clinic: "Клініка «Здоров'я» (демо)",
  },
  {
    id: "d-o1",
    name: "Ольга Гайдук",
    specialtyId: "ophthalmologist",
    clinic: "Офтальмоцентр (демо)",
  },
  {
    id: "d-o2",
    name: "Роман Кривий",
    specialtyId: "ophthalmologist",
    clinic: "Клініка «Здоров'я» (демо)",
  },
  {
    id: "d-s1",
    name: "Світлана Ткач",
    specialtyId: "dermatologist",
    clinic: "Шкіра і косметологія (демо)",
  },
  {
    id: "d-s2",
    name: "Юрій Савчук",
    specialtyId: "dermatologist",
    clinic: "Медцентр «Поділ» (демо)",
  },
];

// ─── Cinema ──────────────────────────────────────────────────────────────────

export const FILMS: DemoFilm[] = [
  {
    id: "f-1",
    title: "Місто над Полтвою",
    meta: "Драма · 118 хв · 12+",
    description: "Історія двох сусідів, які щодня зустрічаються на трамвайній зупинці.",
  },
  {
    id: "f-2",
    title: "Тихий маршрут",
    meta: "Трилер · 104 хв · 16+",
    description: "Диспетчер нічного автобуса помічає те, чого не мав би бачити.",
  },
  {
    id: "f-3",
    title: "Зоряні сади",
    meta: "Родинне · 96 хв · 6+",
    description: "Мандрівка до саду, де ростуть ліхтарі.",
  },
  {
    id: "f-4",
    title: "Гра в тінях",
    meta: "Комедія · 109 хв · 12+",
    description: "Команда аматорів береться за постановку, якої ніхто не чекав.",
  },
];

export const SESSION_TEMPLATES: { id: string; time: string; format: string; price: number }[] = [
  { id: "s-1", time: "10:30", format: "2D", price: 150 },
  { id: "s-2", time: "13:45", format: "2D", price: 180 },
  { id: "s-3", time: "17:20", format: "IMAX", price: 240 },
  { id: "s-4", time: "20:40", format: "2D", price: 180 },
];

export const SEAT_ROWS = ["A", "B", "C", "D", "E", "F"];
export const SEATS_PER_ROW = 8;
export const MAX_SEATS = 6;

// ─── Gyms ────────────────────────────────────────────────────────────────────

export const GYMS: DemoGym[] = [
  {
    id: "gym-1",
    name: "Зал «Залізо» (демо)",
    address: "вул. Зелена, 22",
    hours: "06:00–23:00",
    trial: true,
  },
  {
    id: "gym-2",
    name: "Фітнес-клуб «Баланс» (демо)",
    address: "вул. Личаківська, 5",
    hours: "07:00–22:00",
    trial: false,
  },
  {
    id: "gym-3",
    name: "Студія «Рух» (демо)",
    address: "просп. Шевченка, 9",
    hours: "08:00–21:00",
    trial: true,
  },
];

export const GYM_PLANS: { id: string; label: string; months: number; price: number }[] = [
  { id: "month", label: "1 місяць", months: 1, price: 890 },
  { id: "quarter", label: "3 місяці", months: 3, price: 2290 },
  { id: "year", label: "12 місяців", months: 12, price: 7990 },
];

// ─── Taxi ────────────────────────────────────────────────────────────────────

export const TAXI_PLACES: DemoPlace[] = [
  { id: "t-rynok", name: "Площа Ринок", address: "центр міста" },
  { id: "t-train", name: "Залізничний вокзал", address: "вул. Вокзальна, 1" },
  { id: "t-opera", name: "Оперний театр", address: "пл. Святого Юра, 1" },
  { id: "t-uni", name: "Університет, головний корпус", address: "вул. Університетська, 1" },
  { id: "t-park", name: "Стрийський парк", address: "вул. Стрийська" },
  { id: "t-airport", name: "Аеропорт", address: "вул. Угорська, 1" },
];

export const TAXI_CLASSES: {
  id: string;
  label: string;
  base: number;
  perKm: number;
  icon: string;
}[] = [
  { id: "economy", label: "Економ", base: 40, perKm: 14, icon: "directions_car" },
  { id: "comfort", label: "Комфорт", base: 60, perKm: 18, icon: "airport_shuttle" },
  { id: "minivan", label: "Мінівен", base: 90, perKm: 24, icon: "airport_shuttle" },
];

/** Straight-line estimate between two demo places. Labeled «Оцінка» in the UI. */
export function estimateTripKm(fromIndex: number, toIndex: number): number {
  return Math.abs(fromIndex - toIndex) * 1.3 + 1.5;
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

/** Next seven calendar days, starting today. */
export function nextDays(count: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() + index);
    return day;
  });
}

export function formatDay(day: Date): string {
  return day.toLocaleDateString("uk-UA", { weekday: "short", day: "numeric", month: "short" });
}

/** Deterministic demo availability, so the same slot is always open or always taken. */
export function isDemoSlotFree(seed: number): boolean {
  return seed % 3 !== 0;
}

export const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "18:00",
];
