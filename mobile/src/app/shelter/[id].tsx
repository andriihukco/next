import { Stack, useLocalSearchParams } from "expo-router";
import { useCityData } from "../../lib/city-data";
import { distanceKm } from "../../lib/geo";
import { formatDistance } from "../../lib/format";
import { goToMap } from "../../lib/navigation";
import { Badge, Button, EmptyState, ListRow, Page, Row, Section, Txt } from "../../ui";

/** A shelter during an air alert: address, status, access, and how far it is. */
export default function ShelterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const city = useCityData();
  const shelter = city.shelters.find((item) => item.id === id) ?? null;

  if (!shelter) {
    return (
      <Page>
        <EmptyState icon="shield" title="Укриття не знайдено" />
      </Page>
    );
  }

  const meters = city.user ? distanceKm(city.user, { latitude: shelter.lat, longitude: shelter.lng }) * 1000 : null;
  const nearest = city.nearestShelter?.shelter.id === shelter.id;

  return (
    <>
      <Stack.Screen options={{ title: "Укриття" }} />
      <Page>
        <Txt variant="title">{shelter.address}</Txt>
        <Row>
          {nearest ? <Badge label="Найближче до вас" tone="live" /> : null}
          {shelter.access24_7 ? <Badge label="Цілодобово" tone="accent" /> : null}
        </Row>
        <Button
          label="Показати на мапі"
          icon="map"
          variant="filled"
          stretch
          onPress={() => {
            city.showOnMap({ point: { latitude: shelter.lat, longitude: shelter.lng }, selection: { kind: "shelter", id: shelter.id } });
            goToMap();
          }}
        />
        <Section title="Дані" grouped footer="Дані: відкриті дані Львівської міської ради">
          <ListRow icon="shield" title="Тип" value={shelter.objectType || "Укриття"} />
          <ListRow icon="location-city" title="Район" value={shelter.district} />
          <ListRow icon="info" title="Стан" value={shelter.status} />
          {shelter.capacity ? <ListRow icon="groups" title="Місткість" value={String(shelter.capacity)} /> : null}
          <ListRow icon="near-me" title="Від вас" value={meters !== null ? formatDistance(meters) : "Невідомо"} last />
        </Section>
      </Page>
    </>
  );
}
