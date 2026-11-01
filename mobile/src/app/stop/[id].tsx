import { Linking, ScrollView } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCityData } from "../../lib/city-data";
import { distanceKm } from "../../lib/geo";
import { formatDistance } from "../../lib/format";
import { arrivalsAt } from "../../lib/transit-eta";
import { goToMap, openVehicle } from "../../lib/navigation";
import { FLEET_COLORS, VEHICLE_LABELS } from "../../lib/transit-types";
import { Button, Chip, EmptyState, ListRow, Page, RouteBadge, Section, space, Txt } from "../../ui";

/** Only https links open (same rule as safeStopWebsite on the web). */
function safeWebsite(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * A stop as one page. The web's tabs (Огляд, Розклад, Зручності, Контакти, Відгуки) become
 * sections here: on a phone a scrolling page reads better than five tabs (design/screens.md#stop).
 */
export default function StopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const city = useCityData();
  const stop = city.stops.find((item) => item.id === id) ?? null;

  if (!stop) {
    return (
      <Page>
        <EmptyState icon="signpost" title="Зупинку не знайдено" text="Можливо, її прибрали з набору даних міста." />
      </Page>
    );
  }

  const arrivals = arrivalsAt(stop, city.vehicles);
  const meters = city.user ? distanceKm(city.user, { latitude: stop.lat, longitude: stop.lng }) * 1000 : null;
  const website = safeWebsite(stop.website);

  return (
    <>
      <Stack.Screen options={{ title: "" }} />
      <Page>
        <Txt variant="title">{stop.name}</Txt>
        <Txt variant="subhead" tone="muted" style={{ marginTop: -space.lg }}>
          Зупинка · {stop.routes.length} {stop.routes.length === 1 ? "маршрут" : "маршрутів"}
          {meters !== null ? ` · ${formatDistance(meters)} від вас` : ""}
        </Txt>

        <Button
          label="Показати на мапі"
          icon="map"
          variant="tonal"
          stretch
          onPress={() => {
            city.showOnMap({ point: { latitude: stop.lat, longitude: stop.lng }, selection: { kind: "stop", id: stop.id } });
            goToMap();
          }}
        />

        <Section title="Маршрути тут">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
            {stop.routes.map((route) => (
              <Chip key={route} label={route} selected={false} onPress={() => {}} disabled />
            ))}
          </ScrollView>
        </Section>

        <Section title="Транспорт поруч" grouped footer="Оцінка за GPS і відстанню, не офіційний розклад.">
          {arrivals.length ? (
            arrivals.map(({ vehicle, minutes }, index) => (
              <ListRow
                key={vehicle.id}
                title={vehicle.destination || VEHICLE_LABELS[vehicle.type]}
                subtitle={`${VEHICLE_LABELS[vehicle.type]} ${vehicle.route} · борт ${vehicle.plate}`}
                value={`~${minutes} хв`}
                trailing={<RouteBadge route={vehicle.route} color={FLEET_COLORS[vehicle.type]} />}
                onPress={() => openVehicle(vehicle.id)}
                last={index === arrivals.length - 1}
              />
            ))
          ) : (
            <EmptyState icon="schedule" title="Зараз нічого не їде" text="Немає транспорту з GPS на маршрутах цієї зупинки." />
          )}
        </Section>

        {stop.timetable?.length ? (
          <Section title="Розклад" grouped>
            {stop.timetable.map((entry, index) => (
              <ListRow
                key={`${entry.route}-${entry.departure}-${index}`}
                title={entry.departure}
                trailing={<RouteBadge route={entry.route} color={FLEET_COLORS.bus} />}
                last={index === (stop.timetable?.length ?? 0) - 1}
              />
            ))}
          </Section>
        ) : null}

        <Section
          title="Зручності"
          grouped={Boolean(stop.facilities?.length)}
          footer={stop.facilities?.length ? undefined : "Про павільйон і доступність даних немає."}
        >
          {stop.facilities?.map((facility, index, all) => (
            <ListRow key={facility} icon="check-circle" title={facility} last={index === all.length - 1} />
          ))}
        </Section>

        {stop.address || stop.phone || website ? (
          <Section title="Контакти" grouped>
            {stop.address ? <ListRow icon="location-on" title={stop.address} last={!stop.phone && !website} /> : null}
            {stop.phone ? (
              <ListRow
                icon="call"
                title={stop.phone}
                onPress={() => void Linking.openURL(`tel:${stop.phone?.replace(/[^\d+]/g, "")}`)}
                last={!website}
              />
            ) : null}
            {website ? (
              <ListRow icon="language" title="Вебсайт перевізника" onPress={() => void Linking.openURL(website)} last />
            ) : null}
          </Section>
        ) : null}

        {stop.rating !== undefined ? (
          <Section title="Оцінка пасажирів" grouped>
            <ListRow icon="star" title={stop.rating.toFixed(1)} value={`${stop.reviewCount ?? 0} відгуків`} last />
          </Section>
        ) : null}
      </Page>
    </>
  );
}
