import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { PlaceGridCard, PlaceListCard } from "./place-cards";
import { CategoryTiles } from "./category-tiles";
import { categoryColor, materialIconFor } from "../../lib/category-icons";
import { cityPlaceCategories, cityPlaceIcons } from "../../../../src/lib/city-places";
import { distanceKm } from "../../lib/geo";
import type { CityPlace } from "../../lib/places-api";
import { colors, fonts, HIT_SLOP, MIN_TOUCH, radius } from "../../lib/theme";

const PAGE_SIZE = 40; // Same page size as the web app.
const NEARBY_METERS = 1000;

type Layout = "list" | "grid";
type Category = "popular" | "nearby" | string;

type Props = {
  places: CityPlace[];
  origin: { latitude: number; longitude: number };
  hasUserLocation: boolean;
  onOpen: (place: CityPlace) => void;
  onShowOnMap: (place: CityPlace) => void;
  onDirections: (place: CityPlace) => void;
};

/** Місця: category orbs, list or grid, and the place cards, as in the web app. */
export function PlacesPanel({ places, origin, hasUserLocation, onOpen, onShowOnMap, onDirections }: Props) {
  const [category, setCategory] = useState<Category>("popular");
  const [layout, setLayout] = useState<Layout>("list");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const withDistance = useMemo(
    () =>
      places.map((place) => ({
        place,
        meters: distanceKm({ latitude: place.lat, longitude: place.lng }, origin) * 1000,
      })),
    [places, origin],
  );

  // Categories that exist in the visible area, in the web app's order.
  const available = useMemo(() => {
    const present = new Set(places.map((p) => p.category));
    return cityPlaceCategories.filter((c) => present.has(c.id));
  }, [places]);

  const filtered = useMemo(() => {
    let rows = withDistance;
    if (category === "nearby") rows = rows.filter((row) => row.meters <= NEARBY_METERS);
    else if (category !== "popular") rows = rows.filter((row) => row.place.category === category);
    // Places carry no ratings in the data, so "Популярне" falls back to distance.
    return [...rows].sort((a, b) => a.meters - b.meters);
  }, [withDistance, category]);

  const shown = filtered.slice(0, limit);

  const chooseCategory = (next: Category) => {
    setCategory(next);
    setLimit(PAGE_SIZE);
  };

  const tiles: { id: string; label: string; icon: string; color: string }[] = [
    { id: "popular", label: "Популярне", icon: "award_star", color: "#ee8a3f" },
    ...(hasUserLocation ? [{ id: "nearby", label: "Поруч", icon: "near_me", color: "#16804f" }] : []),
    ...available.map((c) => ({
      id: c.id,
      label: c.label,
      icon: cityPlaceIcons[c.id as keyof typeof cityPlaceIcons] ?? "place",
      color: categoryColor(c.id),
    })),
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
      <CategoryTiles items={tiles} value={category} onChange={chooseCategory} />

      <View style={styles.segment} accessibilityRole="tablist">
        {(
          [
            { id: "list", label: "Список", icon: "format-list-bulleted" },
            { id: "grid", label: "Сітка", icon: "grid-view" },
          ] as const
        ).map((option) => {
          const active = layout === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setLayout(option.id)}
              style={[styles.segmentItem, active && styles.segmentActive]}
            >
              <MaterialIcons name={option.icon} size={18} color={active ? "#ffffff" : colors.foreground} />
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {places.length === 0 ? (
        <Text style={styles.empty}>Наблизьте мапу, щоб побачити місця поруч.</Text>
      ) : filtered.length === 0 ? (
        <Text style={styles.empty}>У цій області місць у цій категорії немає.</Text>
      ) : (
        <>
          <Text style={styles.count}>Знайдено: {filtered.length}</Text>
          <View style={layout === "grid" ? styles.grid : styles.list}>
            {shown.map(({ place, meters }) =>
              layout === "list" ? (
                <PlaceListCard
                  key={place.id}
                  place={place}
                  distanceMeters={meters}
                  onOpen={() => onOpen(place)}
                  onDirections={() => onDirections(place)}
                  onShowOnMap={() => onShowOnMap(place)}
                />
              ) : (
                <PlaceGridCard key={place.id} place={place} distanceMeters={meters} onOpen={() => onOpen(place)} />
              ),
            )}
          </View>
          {filtered.length > shown.length ? (
            <Pressable accessibilityRole="button" onPress={() => setLimit((n) => n + PAGE_SIZE)} style={styles.more}>
              <Text style={styles.moreText}>Показати ще</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingBottom: 24, gap: 14 },
  segment: {
    flexDirection: "row",
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  segmentItem: {
    flex: 1,
    minHeight: MIN_TOUCH,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { fontFamily: fonts.bold, fontSize: 15, color: colors.foreground },
  segmentTextActive: { color: "#ffffff" },
  count: { fontFamily: fonts.regular, fontSize: 14, color: colors.mutedForeground },
  list: { gap: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  empty: { fontFamily: fonts.regular, fontSize: 15, color: colors.mutedForeground, paddingVertical: 12 },
  more: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  moreText: { fontFamily: fonts.bold, fontSize: 15, color: colors.foreground },
});
