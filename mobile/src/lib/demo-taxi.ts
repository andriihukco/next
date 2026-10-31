// Demo data from src/features/super-app/demo-data.ts (web). Fares are estimates, not real prices.
export const TAXI_PLACES = [
  { id: "t-rynok", name: "Площа Ринок", address: "центр міста" },
  { id: "t-train", name: "Залізничний вокзал", address: "вул. Вокзальна, 1" },
  { id: "t-opera", name: "Оперний театр", address: "пл. Святого Юра, 1" },
  { id: "t-uni", name: "Університет, головний корпус", address: "вул. Університетська, 1" },
  { id: "t-park", name: "Стрийський парк", address: "вул. Стрийська" },
  { id: "t-airport", name: "Аеропорт", address: "вул. Угорська, 1" },
] as const;

export const TAXI_CLASSES = [
  { id: "economy", label: "Економ", base: 40, perKm: 14, icon: "directions-car" },
  { id: "comfort", label: "Комфорт", base: 60, perKm: 18, icon: "airport-shuttle" },
  { id: "minivan", label: "Мінівен", base: 90, perKm: 24, icon: "airport-shuttle" },
] as const;

/** Straight-line estimate between two demo places. Labelled «Оцінка» in the UI. */
export function estimateTripKm(fromIndex: number, toIndex: number): number {
  return Math.abs(fromIndex - toIndex) * 1.3 + 1.5;
}

/** Rounds up to the nearest 5 hryvnia, the way fare estimates are shown. */
export function roundFare(amount: number): number {
  return Math.ceil(amount / 5) * 5;
}

