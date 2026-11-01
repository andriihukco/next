import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { router, Stack } from "expo-router";
import { tabRootHeaderOptions } from "../../../components/navigation/header";
import { useCityData } from "../../../lib/city-data";
import { distanceKm } from "../../../lib/geo";
import { formatDistance } from "../../../lib/format";
import { openStop } from "../../../lib/navigation";
import { FLEET_COLORS, VEHICLE_LABELS, type VehicleType } from "../../../lib/transit-types";
import { Badge, Button, Chip, EmptyState, ListRow, Page, RouteBadge, Row, Section, space, Surface, Txt } from "../../../ui";

type Filter = "all" | VehicleType;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Усі" },
  { id: "bus", label: "Автобуси" },
  { id: "tram", label: "Трамваї" },
  { id: "trolleybus", label: "Тролейбуси" },
  { id: "taxi", label: "Таксі" },
];
const NEARBY_STOPS = 5;

/** Транспорт: routes on the line now, and the stops nearest to you. Each row opens its own page. */
export default function TransportScreen() {
  const city = useCityData();
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const result: Record<Filter, number> = { all: city.vehicles.length, bus: 0, tram: 0, trolleybus: 0, taxi: 0 };
    for (const vehicle of city.vehicles) result[vehicle.type] += 1;
    return result;
  }, [city.vehicles]);

  const routes = useMemo(() => {
    const groups = new Map<string, { key: string; route: string; type: VehicleType; count: number; destination: string }>();
    for (const vehicle of city.vehicles) {
      if (filter !== "all" && vehicle.type !== filter) continue;
      const key = `${vehicle.type}-${vehicle.route}`;
      const group = groups.get(key) ?? { key, route: vehicle.route, type: vehicle.type, count: 0, destination: vehicle.destination };
      group.count += 1;
      groups.set(key, group);
    }
    return [...groups.values()].sort((a, b) => a.route.localeCompare(b.route, "uk", { numeric: true }));
  }, [city.vehicles, filter]);

  const nearbyStops = useMemo(() => {
    if (!city.user) return [];
    const user = city.user;
    return city.stops
      .map((stop) => ({ stop, meters: distanceKm(user, { latitude: stop.lat, longitude: stop.lng }) * 1000 }))
      .sort((a, b) => a.meters - b.meters)
      .slice(0, NEARBY_STOPS);
  }, [city.stops, city.user]);

  return (
    <>
      <Stack.Screen options={tabRootHeaderOptions("Транспорт")} />
      <Page>
        {city.simulated ? (
          <Surface padded>
            <Row style={{ justifyContent: "space-between" }}>
              <Badge label="Симуляція" tone="warning" />
              <Button label="GPS-наживо" variant="plain" onPress={city.useLiveFeed} />
            </Row>
            <Txt variant="subhead" tone="muted">
              Зараз на мапі змодельований транспорт, не GPS-позиції.
            </Txt>
          </Surface>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {FILTERS.filter((item) => item.id === "all" || counts[item.id] > 0).map((item) => (
            <Chip
              key={item.id}
              label={`${item.label} · ${counts[item.id]}`}
              selected={filter === item.id}
              onPress={() => setFilter(item.id)}
            />
          ))}
        </ScrollView>

        <Section
          title="Зупинки поруч"
          grouped
          footer={city.user ? undefined : "Дозвольте геолокацію, щоб бачити найближчі зупинки."}
        >
          {city.user ? (
            nearbyStops.map(({ stop, meters }, index) => (
              <ListRow
                key={stop.id}
                icon="signpost"
                title={stop.name}
                subtitle={stop.routes.slice(0, 8).join(" · ")}
                value={formatDistance(meters)}
                onPress={() => openStop(stop.id)}
                last={index === nearbyStops.length - 1}
              />
            ))
          ) : (
            <ListRow icon="my-location" title="Знайти зупинки поруч" onPress={() => void city.locate()} last />
          )}
        </Section>

        <Section title="Маршрути на лінії" grouped footer="Позиції з GPS-потоку міста. Час прибуття — оцінка за відстанню.">
          {routes.length === 0 ? (
            <EmptyState icon="directions-bus" title="Немає транспорту з GPS" text="Коли транспорт вийде на лінію, він з’явиться тут." />
          ) : (
            routes.map((group, index) => (
              <View key={group.key}>
                <ListRow
                  title={group.destination || `Маршрут ${group.route}`}
                  subtitle={`${VEHICLE_LABELS[group.type]} · ${group.count} на лінії`}
                  trailing={<RouteBadge route={group.route} color={FLEET_COLORS[group.type]} />}
                  onPress={() => router.push({ pathname: "/route/[key]", params: { key: group.key } })}
                  last={index === routes.length - 1}
                />
              </View>
            ))
          )}
        </Section>
      </Page>
    </>
  );
}
