import { ScrollView, StyleSheet, Text, View } from "react-native";
import { arrivalsAt } from "../lib/transit-eta";
import type { Shelter } from "../lib/alerts-api";
import type { CityPlace } from "../lib/places-api";
import { FLEET_COLORS, VEHICLE_LABELS, type Stop, type Vehicle } from "../lib/transit-types";
import { colors, MIN_TOUCH, type } from "../lib/theme";

export type SheetContent =
  | { kind: "shelter"; shelter: Shelter; nearestMeters: number | null }
  | { kind: "vehicle"; vehicle: Vehicle }
  | { kind: "stop"; stop: Stop; vehicles: Vehicle[] }
  | { kind: "place"; place: CityPlace };

/** Content for the bottom glass sheet. Every label says where its data comes from. */
export function CitySheet({ content }: { content: SheetContent }) {
  if (content.kind === "vehicle") {
    const { vehicle } = content;
    return (
      <View style={styles.block}>
        <View style={styles.headRow}>
          <RouteChip route={vehicle.route} color={FLEET_COLORS[vehicle.type]} />
          <View style={styles.headCopy}>
            <Text style={styles.title} numberOfLines={2}>
              {vehicle.destination || VEHICLE_LABELS[vehicle.type]}
            </Text>
            <Text style={styles.caption}>
              {VEHICLE_LABELS[vehicle.type]} · борт {vehicle.plate}
            </Text>
          </View>
        </View>
        <Text style={styles.live}>Наживо · позиція з GPS-потоку</Text>
        {vehicle.lowFloor && <Text style={styles.caption}>Низька підлога</Text>}
      </View>
    );
  }

  if (content.kind === "stop") {
    const arrivals = arrivalsAt(content.stop, content.vehicles);
    return (
      <View style={styles.block}>
        <Text style={styles.title} numberOfLines={2}>
          {content.stop.name}
        </Text>
        <Text style={styles.caption}>Маршрути: {content.stop.routes.join(", ") || "немає даних"}</Text>
        {arrivals.length === 0 ? (
          <Text style={styles.caption}>Зараз немає транспорту з GPS поруч.</Text>
        ) : (
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {arrivals.map(({ vehicle, minutes }) => (
              <View key={vehicle.id} style={styles.row}>
                <RouteChip route={vehicle.route} color={FLEET_COLORS[vehicle.type]} />
                <Text style={styles.rowText} numberOfLines={1}>
                  {vehicle.destination || VEHICLE_LABELS[vehicle.type]}
                </Text>
                <Text style={styles.eta}>~{minutes} хв</Text>
              </View>
            ))}
          </ScrollView>
        )}
        <Text style={styles.caption}>Оцінка за GPS, не офіційний розклад.</Text>
      </View>
    );
  }

  if (content.kind === "shelter") {
    const { shelter, nearestMeters } = content;
    return (
      <View style={styles.block}>
        <Text style={styles.title} numberOfLines={2}>
          {shelter.address}
        </Text>
        <Text style={styles.caption}>
          {shelter.objectType || "Укриття"} · {shelter.district}
        </Text>
        <Text style={styles.body}>
          {shelter.status}
          {shelter.access24_7 ? " · цілодобово" : ""}
        </Text>
        {shelter.capacity ? <Text style={styles.caption}>Місткість: {shelter.capacity}</Text> : null}
        {nearestMeters !== null ? (
          <Text style={styles.live}>Найближче до вас · {formatMeters(nearestMeters)}</Text>
        ) : null}
        <Text style={styles.caption}>Дані: відкриті дані Львівської міської ради</Text>
      </View>
    );
  }

  const { place } = content;
  return (
    <View style={styles.block}>
      <Text style={styles.title} numberOfLines={2}>
        {place.name}
      </Text>
      <Text style={styles.caption}>{place.categoryLabel}</Text>
      <Text style={styles.body}>{place.address || "Адреса не вказана"}</Text>
      {Object.entries(place.details)
        .slice(0, 3)
        .map(([label, value]) => (
          <Text key={label} style={styles.caption}>
            {label}: {value}
          </Text>
        ))}
      <Text style={styles.caption}>Дані: OpenStreetMap</Text>
    </View>
  );
}

function formatMeters(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} м` : `${(meters / 1000).toFixed(1).replace(".", ",")} км`;
}

function RouteChip({ route, color }: { route: string; color: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: color }]}>
      <Text style={styles.chipText}>{route}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  headRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headCopy: { flex: 1, gap: 2 },
  title: { ...type.title, color: colors.foreground },
  body: { ...type.body, color: colors.foreground },
  caption: { ...type.footnote, color: colors.mutedForeground },
  live: { ...type.footnote, color: colors.primary, fontWeight: "600" },
  list: { maxHeight: 240 },
  row: {
    minHeight: MIN_TOUCH,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowText: { ...type.body, color: colors.foreground, flex: 1 },
  eta: { ...type.bodyStrong, color: colors.foreground },
  chip: {
    minWidth: 40,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
});
