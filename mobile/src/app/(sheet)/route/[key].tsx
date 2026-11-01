import { useMemo } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCityData } from "../../../lib/city-data";
import { distanceKm } from "../../../lib/geo";
import { formatDistance } from "../../../lib/format";
import { openVehicle } from "../../../lib/navigation";
import { FLEET_COLORS, VEHICLE_LABELS, type VehicleType } from "../../../lib/transit-types";
import { EmptyState, ListRow, Page, RouteBadge, Row, Section, Txt } from "../../../ui";

/** One route: every vehicle on the line now. Each opens its own page. */
export default function RouteScreen() {
  const { key = "" } = useLocalSearchParams<{ key: string }>();
  const city = useCityData();
  const [type, ...rest] = key.split("-");
  const route = rest.join("-");
  const vehicles = useMemo(
    () =>
      city.vehicles
        .filter((vehicle) => vehicle.type === type && vehicle.route === route)
        .map((vehicle) => ({
          vehicle,
          meters: city.user ? distanceKm(city.user, { latitude: vehicle.lat, longitude: vehicle.lng }) * 1000 : null,
        }))
        .sort((a, b) => (a.meters ?? 0) - (b.meters ?? 0)),
    [city.vehicles, city.user, type, route],
  );
  const vehicleType = (type as VehicleType) in FLEET_COLORS ? (type as VehicleType) : "bus";

  return (
    <>
      <Stack.Screen options={{ title: `Маршрут ${route}` }} />
      <Page>
        <Row gap={16}>
          <RouteBadge route={route} color={FLEET_COLORS[vehicleType]} size="lg" />
          <Txt variant="title" style={{ flex: 1 }} numberOfLines={2}>
            {vehicles[0]?.vehicle.destination || VEHICLE_LABELS[vehicleType]}
          </Txt>
        </Row>
        <Section
          title={`На лінії: ${vehicles.length}`}
          grouped
          footer={city.user ? "Відсортовано за відстанню від вас." : "Позиції з GPS-потоку міста."}
        >
          {vehicles.length === 0 ? (
            <EmptyState icon="directions-bus" title="Зараз немає на лінії" text="Маршрут з’явиться, щойно транспорт передасть GPS." />
          ) : (
            vehicles.map(({ vehicle, meters }, index) => (
              <ListRow
                key={vehicle.id}
                title={vehicle.destination || VEHICLE_LABELS[vehicle.type]}
                subtitle={`Борт ${vehicle.plate}${vehicle.lowFloor ? " · низька підлога" : ""}`}
                value={meters !== null ? formatDistance(meters) : undefined}
                onPress={() => openVehicle(vehicle.id)}
                last={index === vehicles.length - 1}
              />
            ))
          )}
        </Section>
      </Page>
    </>
  );
}
