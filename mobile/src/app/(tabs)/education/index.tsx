import { useMemo, useState } from "react";
import { Stack } from "expo-router";
import { tabRootHeaderOptions } from "../../../components/navigation/header";
import { CategoryTiles } from "../../../components/places/category-tiles";
import { useCityData } from "../../../lib/city-data";
import { categoryColor } from "../../../lib/category-icons";
import { cityEducationKind, type CityEducationKind } from "../../../../../src/lib/city-places";
import { distanceKm } from "../../../lib/geo";
import { formatDistance } from "../../../lib/format";
import { goToMap, openPlace } from "../../../lib/navigation";
import { EmptyState, ListRow, Page, Section, type IconName } from "../../../ui";

// Same kinds, labels and order as the web «Освіта» (src/components/city-guide/constants.ts).
const KINDS: { id: CityEducationKind; label: string; icon: string; row: IconName; single: string }[] = [
  { id: "school", label: "Школи", icon: "school", row: "school", single: "Школа" },
  { id: "kindergarten", label: "Садочки", icon: "child_care", row: "child-care", single: "Дитячий садок" },
  { id: "university", label: "Університети", icon: "account_balance", row: "account-balance", single: "Університет" },
  { id: "adult-course", label: "Курси", icon: "menu_book", row: "menu-book", single: "Курси й спеціалізовані школи" },
  { id: "library", label: "Бібліотеки", icon: "local_library", row: "local-library", single: "Бібліотека" },
];

/** Освіта: schools, kindergartens, universities, courses and libraries from the map data. */
export default function EducationScreen() {
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

  return (
    <>
      <Stack.Screen options={tabRootHeaderOptions("Освіта")} />
      <Page>
        <CategoryTiles items={KINDS.map((item) => ({ ...item, color }))} value={kind} onChange={(id) => setKind(id as CityEducationKind)} />
        {city.places.length === 0 ? (
          <EmptyState
            icon="zoom-in"
            title="Наблизьте мапу"
            text="Заклади завантажуються для області, яку видно на мапі."
            action={{ label: "Відкрити мапу", onPress: goToMap }}
          />
        ) : (
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
        )}
      </Page>
    </>
  );
}
