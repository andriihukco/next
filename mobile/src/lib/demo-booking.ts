// Demo data from src/features/super-app/demo-data.ts (web): tables, films and seats.

export const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "18:00",
] as const;

/** Deterministic demo availability, so the same slot is always open or always taken. */
export function isDemoSlotFree(seed: number): boolean {
  return seed % 3 !== 0;
}

export type DemoFilm = { id: string; title: string; meta: string; description: string };
export const FILMS: DemoFilm[] = [
  { id: "f-1", title: "Місто над Полтвою", meta: "Драма · 118 хв · 12+", description: "Історія двох сусідів, які щодня зустрічаються на трамвайній зупинці." },
  { id: "f-2", title: "Тихий маршрут", meta: "Трилер · 104 хв · 16+", description: "Диспетчер нічного автобуса помічає те, чого не мав би бачити." },
  { id: "f-3", title: "Зоряні сади", meta: "Родинне · 96 хв · 6+", description: "Мандрівка до саду, де ростуть ліхтарі." },
  { id: "f-4", title: "Гра в тінях", meta: "Комедія · 109 хв · 12+", description: "Команда аматорів береться за постановку, якої ніхто не чекав." },
];

export const SESSION_TEMPLATES = [
  { id: "s-1", time: "10:30", format: "2D", price: 150 },
  { id: "s-2", time: "13:45", format: "2D", price: 180 },
  { id: "s-3", time: "17:20", format: "IMAX", price: 240 },
  { id: "s-4", time: "20:40", format: "2D", price: 180 },
] as const;

export const SEAT_ROWS = ["A", "B", "C", "D", "E", "F"] as const;
export const SEATS_PER_ROW = 8;
export const MAX_SEATS = 6;

/** Deterministic demo seat map: about one seat in seven is already taken. */
export function isSeatTaken(row: number, col: number, seedDay: number, seedFilm: number): boolean {
  return (row * 5 + col * 3 + seedDay * 2 + seedFilm) % 7 === 0;
}

/** The next `count` calendar days, starting today. */
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
