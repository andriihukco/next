/**
 * The cities NEXTCOM is divided by. One page per city: `/<slug>`.
 * `live` is true only where the product works today (see DESIGN.md §5 and §13).
 * Every other city is «незабаром»: a page with a waitlist, never a promise of a date.
 * Regional centers from the city picker roster (`lib/ukraine-city-regions.ts`), without
 * the occupied and frontline cities, which we do not list.
 */
export type City = {
  slug: string;
  name: string;
  live: boolean;
  /** Genitive for «мапу …» in live copy. Only needed where a live city is named in a phrase. */
  genitive?: string;
};

export const CITIES: readonly City[] = [
  { slug: "lviv", name: "Львів", live: true, genitive: "Львова" },
  { slug: "kyiv", name: "Київ", live: false },
  { slug: "odesa", name: "Одеса", live: false },
  { slug: "kharkiv", name: "Харків", live: false },
  { slug: "dnipro", name: "Дніпро", live: false },
  { slug: "zaporizhzhia", name: "Запоріжжя", live: false },
  { slug: "vinnytsia", name: "Вінниця", live: false },
  { slug: "lutsk", name: "Луцьк", live: false },
  { slug: "zhytomyr", name: "Житомир", live: false },
  { slug: "uzhhorod", name: "Ужгород", live: false },
  { slug: "ivano-frankivsk", name: "Івано-Франківськ", live: false },
  { slug: "kropyvnytskyi", name: "Кропивницький", live: false },
  { slug: "mykolaiv", name: "Миколаїв", live: false },
  { slug: "poltava", name: "Полтава", live: false },
  { slug: "rivne", name: "Рівне", live: false },
  { slug: "sumy", name: "Суми", live: false },
  { slug: "ternopil", name: "Тернопіль", live: false },
  { slug: "kherson", name: "Херсон", live: false },
  { slug: "khmelnytskyi", name: "Хмельницький", live: false },
  { slug: "cherkasy", name: "Черкаси", live: false },
  { slug: "chernivtsi", name: "Чернівці", live: false },
  { slug: "chernihiv", name: "Чернігів", live: false },
];

export const LIVE_CITIES = CITIES.filter((city) => city.live);

/** Live cities first, then the rest in roster order. */
export const CITIES_BY_STATUS = [...LIVE_CITIES, ...CITIES.filter((city) => !city.live)];

export function findCity(slug: string): City | undefined {
  return CITIES.find((city) => city.slug === slug);
}

/** Lead `source` for a city page, so the waitlist records which city the sign-up came from. */
export function citySource(city: City): string {
  return `landing:${city.slug}`;
}
