// "Open now" from an OSM `opening_hours` value. Covers the common shapes
// ("24/7", "Mo-Fr 09:00-18:00; Sa 10:00-16:00", "Mo,We 10:00-14:00,15:00-19:00",
// "Mo-Su 10:00-02:00"). Anything else returns null, so the card shows no status
// rather than a guessed one (DESIGN.md §13).

export type OpenStatus = { open: boolean; text: string };

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const DAY_LABELS: Record<string, string> = {
  Mo: "пн", Tu: "вт", We: "ср", Th: "чт", Fr: "пт", Sa: "сб", Su: "нд",
};

type Span = { from: number; to: number };

function minutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function expandDays(spec: string): number[] | null {
  const result: number[] = [];
  for (const part of spec.split(",")) {
    const [start, end] = part.split("-");
    const a = DAYS.indexOf(start as (typeof DAYS)[number]);
    const b = end ? DAYS.indexOf(end as (typeof DAYS)[number]) : a;
    if (a < 0 || b < 0) return null;
    for (let day = a; ; day = (day + 1) % 7) {
      result.push(day);
      if (day === b) break;
    }
  }
  return result;
}

/** Spans per weekday (0 = Sunday), or null when the value is not understood. */
export function parseOpeningHours(value: string): Span[][] | null {
  const week: Span[][] = Array.from({ length: 7 }, () => []);
  const trimmed = value.trim();
  if (trimmed === "24/7") return week.map(() => [{ from: 0, to: 1440 }]);
  for (const rule of trimmed.split(";").map((part) => part.trim()).filter(Boolean)) {
    const match = rule.match(/^([A-Za-z,-]+)\s+(off|closed|[\d:,\s-]+)$/);
    if (!match) return null;
    const days = expandDays(match[1]);
    if (!days) return null;
    const spans: Span[] = [];
    if (match[2] !== "off" && match[2] !== "closed") {
      for (const range of match[2].split(",")) {
        const times = range.trim().match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
        if (!times) return null;
        spans.push({ from: minutes(times[1]), to: minutes(times[2]) });
      }
    }
    for (const day of days) week[day] = spans;
  }
  return week;
}

function clock(total: number): string {
  const value = total % 1440;
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export function openStatus(value: string | undefined, now = new Date()): OpenStatus | null {
  if (!value) return null;
  const week = parseOpeningHours(value);
  if (!week) return null;
  const day = now.getDay();
  const time = now.getHours() * 60 + now.getMinutes();
  if (week.every((spans) => spans.length === 1 && spans[0].from === 0 && spans[0].to >= 1440)) {
    return { open: true, text: "Цілодобово" };
  }
  // Yesterday's span that runs past midnight counts for the early hours.
  const yesterday = week[(day + 6) % 7].find((span) => span.to <= span.from && time < span.to);
  if (yesterday) return { open: true, text: `Відчинено · до ${clock(yesterday.to)}` };
  const current = week[day].find((span) =>
    span.to > span.from ? time >= span.from && time < span.to : time >= span.from,
  );
  if (current) return { open: true, text: `Відчинено · до ${clock(current.to)}` };
  const later = week[day].find((span) => span.from > time);
  if (later) return { open: false, text: `Зачинено · відчиниться о ${clock(later.from)}` };
  for (let offset = 1; offset <= 7; offset += 1) {
    const next = (day + offset) % 7;
    if (week[next].length > 0) {
      return { open: false, text: `Зачинено · відчиниться ${DAY_LABELS[DAYS[next]]} о ${clock(week[next][0].from)}` };
    }
  }
  return { open: false, text: "Зачинено" };
}
