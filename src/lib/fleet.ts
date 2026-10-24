type TransitType = "tram" | "trolleybus" | "bus" | "taxi";

export const TRANSIT_TYPE_COLORS: Record<TransitType, string> = {
  bus: "var(--fleet-bus)",
  tram: "var(--fleet-tram)",
  trolleybus: "var(--fleet-trolleybus)",
  taxi: "var(--fleet-taxi)",
};

export function vehicleFleetColor(type: TransitType): string {
  return TRANSIT_TYPE_COLORS[type];
}

export function vehicleModelDescription(type: TransitType): string {
  if (type === "tram") return "Міський трамвай";
  if (type === "trolleybus") return "Міський тролейбус";
  if (type === "taxi") return "Таксі";
  return "Низькопідлоговий міський автобус";
}

export function getRidershipEstimate(identity: string): {
  current: number;
  daily: { day: string; passengers: number }[];
} {
  const seed = [...identity].reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    7,
  );
  const current = 18 + (seed % 43);
  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
  const daily = dayNames.map((day, index) => ({
    day,
    passengers:
      340 +
      ((seed >>> (index * 3)) % 360) +
      (index < 5 ? 170 : 0),
  }));
  return { current, daily };
}
