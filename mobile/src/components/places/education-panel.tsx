import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PlaceListCard } from "./place-cards";
import { CategoryTiles } from "./category-tiles";
import { categoryColor } from "../../lib/category-icons";
import { cityEducationKind, type CityEducationKind } from "../../../../src/lib/city-places";
import { distanceKm } from "../../lib/geo";
import type { CityPlace } from "../../lib/places-api";
import { colors, fonts } from "../../lib/theme";

// Same kinds, labels and order as the web «Освіта» (src/components/city-guide/constants.ts).
const EDUCATION_FILTERS: { id: CityEducationKind; label: string; icon: string }[] = [
  { id: "school", label: "Школи", icon: "school" },
  { id: "kindergarten", label: "Садочки", icon: "child_care" },
  { id: "university", label: "Університети", icon: "account_balance" },
  { id: "adult-course", label: "Курси", icon: "menu_book" },
  { id: "library", label: "Бібліотеки", icon: "local_library" },
];

const EDUCATION_KIND_LABELS: Record<CityEducationKind, string> = {
  school: "Школа",
  kindergarten: "Дитячий садок",
  university: "Університет",
  "adult-course": "Курси й спеціалізовані школи",
  library: "Бібліотека",
};

type Props = {
  places: CityPlace[];
  origin: { latitude: number; longitude: number };
  onOpen: (place: CityPlace) => void;
  onShowOnMap: (place: CityPlace) => void;
  onDirections: (place: CityPlace) => void;
};

/** Освіта: schools, kindergartens, universities, courses and libraries from the map data, as on the web. */
export function EducationPanel({ places, origin, onOpen, onShowOnMap, onDirections }: Props) {
  const [kind, setKind] = useState<CityEducationKind>("school");

  const rows = useMemo(
    () =>
      places
        .flatMap((place) => {
          const placeKind = cityEducationKind(place);
          return placeKind === kind
            ? [{ place, meters: distanceKm({ latitude: place.lat, longitude: place.lng }, origin) * 1000 }]
            : [];
        })
        .sort((a, b) => a.meters - b.meters),
    [places, kind, origin],
  );

  const color = categoryColor("education");
  const tiles = EDUCATION_FILTERS.map((filter) => ({ ...filter, color }));

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
      <CategoryTiles items={tiles} value={kind} onChange={(id) => setKind(id as CityEducationKind)} />

      {places.length === 0 ? (
        <Text style={styles.empty}>Наблизьте мапу, щоб побачити заклади поруч.</Text>
      ) : rows.length === 0 ? (
        <Text style={styles.empty}>Закладів цієї категорії на цій ділянці мапи поки немає.</Text>
      ) : (
        <>
          <Text style={styles.count}>Знайдено: {rows.length}</Text>
          <View style={styles.list}>
            {rows.map(({ place, meters }) => (
              <PlaceListCard
                key={place.id}
                place={place}
                categoryLabel={EDUCATION_KIND_LABELS[kind]}
                distanceMeters={meters}
                onOpen={() => onOpen(place)}
                onDirections={() => onDirections(place)}
                onShowOnMap={() => onShowOnMap(place)}
              />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingBottom: 24, gap: 14 },
  count: { fontFamily: fonts.regular, fontSize: 14, color: colors.mutedForeground },
  list: { gap: 12 },
  empty: { fontFamily: fonts.regular, fontSize: 15, color: colors.mutedForeground, paddingVertical: 12 },
});
