import { useMemo } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCityData } from "../../../lib/city-data";
import { distanceKm } from "../../../lib/geo";
import { formatDistance } from "../../../lib/format";
import { goToMap, openStop } from "../../../lib/navigation";
import { FLEET_COLORS, VEHICLE_LABELS } from "../../../lib/transit-types";
import { Badge, Button, EmptyState, ListRow, Page, RouteBadge, Row, Section, Txt } from "../../../ui";

/** A vehicle on the line: route, destination, plate, and the stops of its route nearest to it. */
export default function VehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const city = useCityData();
  const vehicle = city.vehicles.find((item) => item.id === id) ?? null;

  const stopsAhead = useMemo(() => {
    if (!vehicle) return [];
    return city.stops
      .filter((stop) => stop.routes.includes(vehicle.route))
      .map((stop) => ({ stop, meters: distanceKm({ latitude: vehicle.lat, longitude: vehicle.lng }, { latitude: stop.lat, longitude: stop.lng }) * 1000 }))
      .sort((a, b) => a.meters - b.meters)
      .slice(0, 6);
  }, [vehicle, city.stops]);

  if (!vehicle) {
    return (
      <Page>
        <EmptyState icon="gps-off" title="Транспорт зник з лінії" text="Він більше не передає GPS. Спробуйте інший на цьому маршруті." />
      </Page>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `${VEHICLE_LABELS[vehicle.type]} ${vehicle.route}` }} />
      <Page>
        <Row gap={16}>
          <RouteBadge route={vehicle.route} color={FLEET_COLORS[vehicle.type]} size="lg" />
          <Txt variant="title" style={{ flex: 1 }} numberOfLines={2}>
            {vehicle.destination || VEHICLE_LABELS[vehicle.type]}
          </Txt>
        </Row>
        <Row>
          <Badge label="Наживо · GPS" tone="live" />
          {vehicle.lowFloor ? <Badge label="Низька підлога" /> : null}
        </Row>

        <Button
          label="Показати на мапі"
          icon="map"
          variant="tonal"
          stretch
          onPress={() => {
            city.showOnMap({ point: { latitude: vehicle.lat, longitude: vehicle.lng }, selection: { kind: "vehicle", id: vehicle.id } });
            goToMap();
          }}
        />

        <Section title="Дані" grouped>
          <ListRow icon="directions-bus" title="Вид" value={VEHICLE_LABELS[vehicle.type]} />
          <ListRow icon="pin" title="Бортовий номер" value={vehicle.plate} last />
        </Section>

        <Section title="Зупинки маршруту поруч" grouped footer="Найближчі до транспорту зараз, не розклад.">
          {stopsAhead.map(({ stop, meters }, index) => (
            <ListRow
              key={stop.id}
              icon="signpost"
              title={stop.name}
              value={formatDistance(meters)}
              onPress={() => openStop(stop.id)}
              last={index === stopsAhead.length - 1}
            />
          ))}
        </Section>
      </Page>
    </>
  );
}
