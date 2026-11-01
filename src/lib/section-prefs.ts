/**
 * @file section-prefs.ts
 * @description The user's section list: which sections show, their order, favourites and
 *   how the list is sorted. Pure functions, so the web rail, the settings dialog and the
 *   mobile list (mobile/src/lib/section-prefs.ts, same shape) share one rule set.
 *   Stored only on this device. Nothing is sent.
 */

export const SECTION_PREFS_KEY = "eway-section-prefs";

/** Manual keeps the dragged order. Recent and most use the tap history. */
export type SectionSort = "manual" | "recent" | "most";

export type SectionUsage = { count: number; last: number };

export type SectionPrefs = {
  /** Every known section id, in the manual order. */
  order: string[];
  /** Section ids the user turned off. */
  hidden: string[];
  /** Section ids pinned to the favourites group at the front of the rail. */
  favorites: string[];
  sort: SectionSort;
  usage: Record<string, SectionUsage>;
};

export const SECTION_SORTS: { id: SectionSort; label: string }[] = [
  { id: "manual", label: "Вручну" },
  { id: "recent", label: "Нещодавні" },
  { id: "most", label: "Найчастіші" },
];

export function defaultSectionPrefs(ids: readonly string[]): SectionPrefs {
  return { order: [...ids], hidden: [], favorites: [], sort: "manual", usage: {} };
}

/** Drops unknown ids, removes duplicates and appends new sections, so stale storage never breaks the list. */
export function normalizeSectionPrefs(raw: unknown, ids: readonly string[]): SectionPrefs {
  const known = new Set(ids);
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<Record<keyof SectionPrefs, unknown>>;
  const pick = (value: unknown): string[] =>
    Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === "string" && known.has(id)))] : [];

  const ordered = pick(source.order);
  const order = [...ordered, ...ids.filter((id) => !ordered.includes(id))];
  const sort: SectionSort = source.sort === "recent" || source.sort === "most" ? source.sort : "manual";
  const usage: Record<string, SectionUsage> = {};
  if (typeof source.usage === "object" && source.usage !== null) {
    for (const [id, value] of Object.entries(source.usage as Record<string, Partial<SectionUsage>>)) {
      if (!known.has(id) || typeof value?.count !== "number" || typeof value?.last !== "number") continue;
      usage[id] = { count: value.count, last: value.last };
    }
  }
  return { order, hidden: pick(source.hidden), favorites: pick(source.favorites), sort, usage };
}

export function readSectionPrefs(ids: readonly string[]): SectionPrefs {
  try {
    const raw = localStorage.getItem(SECTION_PREFS_KEY);
    return normalizeSectionPrefs(raw ? JSON.parse(raw) : null, ids);
  } catch (error) {
    console.error("Could not read the section list.", error);
    return defaultSectionPrefs(ids);
  }
}

export function writeSectionPrefs(prefs: SectionPrefs): void {
  try {
    localStorage.setItem(SECTION_PREFS_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error("Could not save the section list.", error);
  }
}

/** Sorts ids by the chosen mode. Manual uses `prefs.order`; recent and most use the tap history. */
export function sortSectionIds<T extends string>(ids: readonly T[], prefs: SectionPrefs): T[] {
  const rank = (id: string) => prefs.order.indexOf(id);
  if (prefs.sort === "manual") return [...ids].sort((a, b) => rank(a) - rank(b));
  const usage = (id: string) => prefs.usage[id] ?? { count: 0, last: 0 };
  return [...ids].sort((a, b) =>
    prefs.sort === "recent"
      ? usage(b).last - usage(a).last || rank(a) - rank(b)
      : usage(b).count - usage(a).count || rank(a) - rank(b),
  );
}

/** The rail: visible favourites first, then the other visible sections. Hidden sections never show. */
export function railSections<T extends string>(ids: readonly T[], prefs: SectionPrefs): { favorites: T[]; others: T[] } {
  const visible = sortSectionIds(
    ids.filter((id) => !prefs.hidden.includes(id)),
    prefs,
  );
  return {
    favorites: visible.filter((id) => prefs.favorites.includes(id)),
    others: visible.filter((id) => !prefs.favorites.includes(id)),
  };
}

/** Records one tap on a section. Only the sort modes read this history. */
export function recordSectionUse(prefs: SectionPrefs, id: string, now = Date.now()): SectionPrefs {
  const current = prefs.usage[id] ?? { count: 0, last: 0 };
  return { ...prefs, usage: { ...prefs.usage, [id]: { count: current.count + 1, last: now } } };
}

export function toggleSectionFavorite(prefs: SectionPrefs, id: string): SectionPrefs {
  const favorites = prefs.favorites.includes(id)
    ? prefs.favorites.filter((item) => item !== id)
    : [...prefs.favorites, id];
  return { ...prefs, favorites };
}

export function toggleSectionHidden(prefs: SectionPrefs, id: string): SectionPrefs {
  const hidden = prefs.hidden.includes(id) ? prefs.hidden.filter((item) => item !== id) : [...prefs.hidden, id];
  return { ...prefs, hidden };
}

/** Moving a section by hand switches the list to manual order, so the drag is what the user sees. */
export function moveSectionTo(prefs: SectionPrefs, order: string[]): SectionPrefs {
  return { ...prefs, order, sort: "manual" };
}
