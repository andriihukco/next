import { useMemo } from "react";
import { Linking } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { PlaceExtras } from "../components/places/place-extras";
import { useCityData } from "../lib/city-data";
import { categoryColor, materialIconFor } from "../lib/category-icons";
import { cityPlaceIcons, formatOpeningHours } from "../../../src/lib/city-places";
import { distanceKm } from "../lib/geo";
import { formatDistance } from "../lib/format";
import { goToMap, openDirections } from "../lib/navigation";
import type { CityPlace } from "../lib/places-api";
import { Button, EmptyState, IconOrb, ListRow, Page, Row, Section, space, Txt, type IconName } from "../ui";

const INFO_ICONS: Record<string, string> = { Графік: "schedule", Email: "email", "Wi-Fi": "wifi", Кухня: "restaurant-menu", Оператор: "domain" };
const HIDDEN = ["Тип", "Телефон", "Мобільний", "Сайт"];

/**
 * A place as one page: who and where, two actions, then contacts, facts and reviews.
 * Same order as the web EntityDetail (DESIGN.md §7, design/screens.md#place).
 */
export default function PlaceScreen() {
  const { place: raw } = useLocalSearchParams<{ place?: string }>();
  const city = useCityData();
  const place = useMemo<CityPlace | null>(() => {
    try {
      return raw ? (JSON.parse(raw) as CityPlace) : null;
    } catch {
      return null;
    }
  }, [raw]);

  if (!place) {
    return (
      <Page>
        <EmptyState icon="place" title="Місце не знайдено" />
      </Page>
    );
  }

  const color = categoryColor(place.category);
  const icon = materialIconFor(cityPlaceIcons[place.category as keyof typeof cityPlaceIcons] ?? "place");
  const phone = place.details["Телефон"] || place.details["Мобільний"];
  const website = place.details["Сайт"];
  const rows = Object.entries(place.details).filter(([label]) => !HIDDEN.includes(label));
  const meters = distanceKm(city.origin, { latitude: place.lat, longitude: place.lng }) * 1000;

  return (
    <>
      <Stack.Screen options={{ title: "" }} />
      <Page>
        <Row gap={space.lg}>
          <IconOrb icon={icon} color={color} size={56} />
          <Txt variant="subhead" tone="muted" style={{ flex: 1 }}>
            {[place.categoryLabel, formatDistance(meters)].join(" · ")}
          </Txt>
        </Row>
        <Txt variant="largeTitle" style={{ marginTop: -space.sm }}>
          {place.name}
        </Txt>
        {place.address ? (
          <Txt variant="callout" tone="muted" style={{ marginTop: -space.lg }}>
            {place.address}
          </Txt>
        ) : null}

        <Row gap={space.sm}>
          <Button label="Маршрут" icon="directions" onPress={() => openDirections(place)} />
          <Button
            label="На мапі"
            icon="map"
            variant="tonal"
            onPress={() => {
              city.showOnMap({ point: { latitude: place.lat, longitude: place.lng }, selection: { kind: "place", id: place.id } });
              goToMap();
            }}
          />
        </Row>

        {phone || website ? (
          <Section title="Контакти" grouped>
            {phone ? (
              <ListRow icon="call" title={phone} onPress={() => void Linking.openURL(`tel:${phone}`)} last={!website} />
            ) : null}
            {website ? (
              <ListRow
                icon="language"
                title={website}
                onPress={() => void Linking.openURL(website.startsWith("http") ? website : `https://${website}`)}
                last
              />
            ) : null}
          </Section>
        ) : null}

        {rows.length ? (
          <Section title="Інформація" grouped footer="Дані: OpenStreetMap">
            {rows.map(([label, value], index) => (
              <ListRow
                key={label}
                icon={materialIconFor(INFO_ICONS[label] ?? "info") as IconName}
                title={label === "Графік" ? formatOpeningHours(value) : value}
                subtitle={label}
                last={index === rows.length - 1}
              />
            ))}
          </Section>
        ) : null}

        <PlaceExtras place={place} />
      </Page>
    </>
  );
}
