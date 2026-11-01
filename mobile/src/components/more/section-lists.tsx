import { useMemo, useState } from "react";
import { CategoryTiles } from "../places/category-tiles";
import { useCityData } from "../../lib/city-data";
import { categoryColor } from "../../lib/category-icons";
import { cityEducationKind, type CityEducationKind } from "../../../../src/lib/city-places";
import { distanceKm } from "../../lib/geo";
import { formatDistance } from "../../lib/format";
import { goToMap, openPlace } from "../../lib/navigation";
import { EmptyState, ListRow, Section, type IconName } from "../../ui";

// Same kinds, labels and order as the web «Освіта» (src/components/city-guide/constants.ts).
const KINDS: { id: CityEducationKind; label: string; icon: string; row: IconName; single: string }[] = [
  { id: "school", label: "Школи", icon: "school", row: "school", single: "Школа" },
  { id: "kindergarten", label: "Садочки", icon: "child_care", row: "child-care", single: "Дитячий садок" },
  { id: "university", label: "Університети", icon: "account_balance", row: "account-balance", single: "Університет" },
  { id: "adult-course", label: "Курси", icon: "menu_book", row: "menu-book", single: "Курси й спеціалізовані школи" },
  { id: "library", label: "Бібліотеки", icon: "local_library", row: "local-library", single: "Бібліотека" },
];

/** Map categories behind each section. Events have no map source yet, so their list stays empty. */
const SECTION_CATEGORIES: Record<string, readonly string[]> = {
  events: [],
  jobs: ["jobs"],
  "real-estate": ["real-estate"],
  market: ["market"],
  parking: ["parking", "bicycle-parking", "motorcycle-parking"],
  fuel: ["fuel"],
  charging: ["charging-station"],
};

/** Освіта: schools, kindergartens, universities, courses and libraries from the map data. */
export function EducationList() {
  const city = useCityData();
  const [kind, setKind] = useState<CityEducationKind>("school");
  const current = KINDS.find((item) => item.id === kind) ?? KINDS[0];
  const color = categoryColor("education");

  const rows = useMemo(
    () =>
      city.places
        .filter((place) => cityEducationKind(place) === kind)
        .map((place) => ({ place, meters: distanceKm({ latitude: place.lat, longitude: place.lng }, city.origin) * 1000 }))
        .sort((a, b) => a.meters - b.meters),
    [city.places, city.origin, kind],
  );

  if (city.places.length === 0) {
    return (
      <EmptyState
        icon="zoom-in"
        title="Наблизьте мапу"
        text="Заклади завантажуються для області, яку видно на мапі."
        action={{ label: "Відкрити мапу", onPress: goToMap }}
      />
    );
  }

  return (
    <>
      <CategoryTiles items={KINDS.map((item) => ({ ...item, color }))} value={kind} onChange={(id) => setKind(id as CityEducationKind)} />
      <Section title={`${current.label}: ${rows.length}`} grouped={rows.length > 0} footer="Дані: OpenStreetMap.">
        {rows.length === 0 ? (
          <EmptyState icon="search-off" title="Поруч немає" text="Закладів цієї категорії на цій ділянці мапи поки немає." />
        ) : (
          rows.map(({ place, meters }, index) => (
            <ListRow
              key={place.id}
              icon={current.row}
              iconColor={color}
              title={place.name}
              subtitle={[current.single, place.address].filter(Boolean).join(" · ")}
              value={formatDistance(meters)}
              onPress={() => openPlace(place)}
              last={index === rows.length - 1}
            />
          ))
        )}
      </Section>
    </>
  );
}

/** A section that lists the map places of its categories, nearest first. */
export function CategoryList({ id, icon }: { id: string; icon: IconName }) {
  const city = useCityData();
  const categories = SECTION_CATEGORIES[id] ?? [];
  const color = categoryColor(categories[0] ?? "other");

  const rows = useMemo(
    () =>
      city.places
        .filter((place) => categories.includes(place.category))
        .map((place) => ({ place, meters: distanceKm({ latitude: place.lat, longitude: place.lng }, city.origin) * 1000 }))
        .sort((a, b) => a.meters - b.meters),
    [city.places, city.origin, categories],
  );

  if (categories.length === 0) {
    return (
      <EmptyState
        icon="event"
        title="Афіші ще немає"
        text="Події з’являться тут, коли підключимо їхнє джерело. На вебі вони вже є."
        action={{ label: "Відкрити мапу", onPress: goToMap }}
      />
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="search-off"
        title="Поруч немає"
        text="У видимій частині мапи таких місць поки немає."
        action={{ label: "Відкрити мапу", onPress: goToMap }}
      />
    );
  }

  return (
    <Section title={`Знайдено: ${rows.length}`} grouped footer="Дані: OpenStreetMap.">
      {rows.map(({ place, meters }, index) => (
        <ListRow
          key={place.id}
          icon={icon}
          iconColor={color}
          title={place.name}
          subtitle={place.address || undefined}
          value={formatDistance(meters)}
          onPress={() => openPlace(place)}
          last={index === rows.length - 1}
        />
      ))}
    </Section>
  );
}
