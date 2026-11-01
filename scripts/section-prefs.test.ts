/**
 * @file section-prefs.test.ts
 * @description Logic tests for the section list: favourites, hidden sections, sorting by hand,
 *   recent or most used, and stale storage. Run with `npm run test:section-prefs`.
 */
import {
  defaultSectionPrefs,
  moveSectionTo,
  normalizeSectionPrefs,
  railSections,
  recordSectionUse,
  sortSectionIds,
  toggleSectionFavorite,
  toggleSectionHidden,
} from "../src/lib/section-prefs";

const results: string[] = [];
const check = (label: string, passed: boolean): void => {
  results.push(`${passed ? "PASS" : "FAIL"} ${label}`);
};

const IDS = ["transport", "places", "education", "services"] as const;
const base = defaultSectionPrefs(IDS);

check("defaults keep every section visible in the given order", railSections(IDS, base).others.join() === IDS.join());

const starred = toggleSectionFavorite(base, "education");
check("a favourite leads the rail", railSections(IDS, starred).favorites.join() === "education");
check("the rest follow the favourite", railSections(IDS, starred).others.join() === "transport,places,services");

const hidden = toggleSectionHidden(starred, "education");
check("a hidden section leaves the rail even when favourite", !railSections(IDS, hidden).favorites.includes("education"));
check("toggling hidden twice shows the section again", !toggleSectionHidden(hidden, "education").hidden.includes("education"));

const dragged = moveSectionTo(base, ["services", "transport", "places", "education"]);
check("a drag sets manual order", dragged.sort === "manual" && railSections(IDS, dragged).others[0] === "services");

const used = recordSectionUse(recordSectionUse(recordSectionUse(base, "places", 100), "places", 200), "services", 300);
check("most used puts the most tapped first", sortSectionIds(IDS, { ...used, sort: "most" })[0] === "places");
check("recent puts the last tapped first", sortSectionIds(IDS, { ...used, sort: "recent" })[0] === "services");
check("ties keep the manual order", sortSectionIds(IDS, { ...base, sort: "most" }).join() === IDS.join());

const stale = normalizeSectionPrefs(
  { order: ["gone", "education", "education"], hidden: ["nope"], favorites: ["transport", 7], sort: "bogus", usage: { gone: { count: 1, last: 1 } } },
  IDS,
);
check("stale storage drops unknown ids and repairs the order", stale.order.join() === "education,transport,places,services");
check("stale storage ignores a wrong sort value", stale.sort === "manual");
check("stale storage keeps valid favourites only", stale.favorites.join() === "transport" && stale.hidden.length === 0);
check("non-object storage falls back to defaults", normalizeSectionPrefs("broken", IDS).order.join() === IDS.join());

console.log(results.join("\n"));
if (results.some((line) => line.startsWith("FAIL"))) process.exit(1);
