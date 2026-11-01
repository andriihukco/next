import { useMemo, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { tabRootHeaderOptions } from "../../../components/navigation/header";
import { CategoryTiles } from "../../../components/places/category-tiles";
import { PlaceGridCard } from "../../../components/places/place-cards";
import { useCityData } from "../../../lib/city-data";
import { categoryColor, materialIconFor } from "../../../lib/category-icons";
import { cityPlaceCategories, cityPlaceIcons } from "../../../../../src/lib/city-places";
import { distanceKm } from "../../../lib/geo";
import { formatDistance } from "../../../lib/format";
import { goToMap, openPlace } from "../../../lib/navigation";
import { Button, EmptyState, ListRow, Page, Section, Segmented, space, Txt } from "../../../ui";

const PAGE_SIZE = 40; // Same page size as the web app.
const NEARBY_METERS = 1000;

/** Місця: search, category tiles, then a list or grid. A place opens its own page. */
export default function PlacesScreen() {
  const city = useCityData();
  const [category, setCategory] = useState("popular");
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const rows = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("uk");
    return city.places
      .filter((place) => (category === "popular" || category === "nearby" ? true : place.category === category))
      .filter((place) => !needle || place.name.toLocaleLowerCase("uk").includes(needle))
      .map((place) => ({ place, meters: distanceKm({ latitude: place.lat, longitude: place.lng }, city.origin) * 1000 }))
      .filter((row) => category !== "nearby" || row.meters <= NEARBY_METERS)
      // Places carry no ratings in the data, so «Популярне» falls back to distance.
      .sort((a, b) => a.meters - b.meters);
  }, [city.places, city.origin, category, query]);

  const tiles = useMemo(() => {
    const present = new Set(city.places.map((place) => place.category));
    return [
      { id: "popular", label: "Популярне", icon: "award_star", color: "#ee8a3f" },
      ...(city.user ? [{ id: "nearby", label: "Поруч", icon: "near_me", color: "#16804f" }] : []),
      ...cityPlaceCategories
        .filter((item) => present.has(item.id))
        .map((item) => ({
          id: item.id,
          label: item.label,
          icon: cityPlaceIcons[item.id as keyof typeof cityPlaceIcons] ?? "place",
          color: categoryColor(item.id),
        })),
    ];
  }, [city.places, city.user]);

  const shown = rows.slice(0, limit);

  return (
    <>
      <Stack.Screen
        options={{
          ...tabRootHeaderOptions("Місця"),
          headerSearchBarOptions: {
            placeholder: "Пошук місць",
            onChangeText: (event) => setQuery(event.nativeEvent.text),
            hideWhenScrolling: false,
          },
        }}
      />
      <Page>
        <CategoryTiles
          items={tiles}
          value={category}
          onChange={(id) => {
            setCategory(id);
            setLimit(PAGE_SIZE);
          }}
        />

        {city.places.length === 0 ? (
          <EmptyState
            icon="zoom-in"
            title="Наблизьте мапу"
            text="Місця завантажуються для області, яку видно на мапі."
            action={{ label: "Відкрити мапу", onPress: goToMap }}
          />
        ) : (
          <Section
            title={`Знайдено: ${rows.length}`}
            action={
              <View style={{ width: 168 }}>
                <Segmented
                  options={[
                    { id: "list", label: "Список" },
                    { id: "grid", label: "Сітка" },
                  ]}
                  value={layout}
                  onChange={setLayout}
                />
              </View>
            }
            grouped={layout === "list" && rows.length > 0}
          >
            {rows.length === 0 ? (
              <EmptyState icon="search-off" title="Нічого не знайдено" text="Спробуйте іншу категорію або назву." />
            ) : layout === "list" ? (
              shown.map(({ place, meters }, index) => (
                <ListRow
                  key={place.id}
                  icon={materialIconFor(cityPlaceIcons[place.category as keyof typeof cityPlaceIcons] ?? "place")}
                  iconColor={categoryColor(place.category)}
                  title={place.name}
                  subtitle={[place.categoryLabel, place.address].filter(Boolean).join(" · ")}
                  value={formatDistance(meters)}
                  onPress={() => openPlace(place)}
                  last={index === shown.length - 1}
                />
              ))
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: space.md }}>
                {shown.map(({ place, meters }) => (
                  <PlaceGridCard key={place.id} place={place} distanceMeters={meters} onOpen={() => openPlace(place)} />
                ))}
              </View>
            )}
          </Section>
        )}

        {rows.length > shown.length ? (
          <Button label="Показати ще" variant="outline" stretch onPress={() => setLimit((n) => n + PAGE_SIZE)} />
        ) : null}
        {city.places.length > 0 ? (
          <Txt variant="footnote" tone="muted">
            Дані: OpenStreetMap. Місця — для області, яку видно на мапі.
          </Txt>
        ) : null}
      </Page>
    </>
  );
}
