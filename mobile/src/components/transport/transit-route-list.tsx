import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fonts, MIN_TOUCH, radius } from "../../lib/theme";
import { FLEET_COLORS, type Vehicle, type VehicleType } from "../../lib/transit-types";

type Route = { route: string; type: VehicleType; items: Vehicle[] };

/** Groups live vehicles by route. Same row layout as the web app's route list. */
export function TransitRouteList({
  vehicles,
  onSelectVehicle,
}: {
  vehicles: Vehicle[];
  onSelectVehicle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const routes = useMemo<Route[]>(() => {
    const groups = new Map<string, Route>();
    for (const vehicle of vehicles) {
      const key = `${vehicle.type}-${vehicle.route}`;
      const group = groups.get(key) ?? { route: vehicle.route, type: vehicle.type, items: [] };
      group.items.push(vehicle);
      groups.set(key, group);
    }
    return [...groups.values()].sort((a, b) => a.route.localeCompare(b.route, "uk", { numeric: true }));
  }, [vehicles]);

  if (routes.length === 0) {
    return <Text style={styles.empty}>Наразі немає транспорту з GPS поруч.</Text>;
  }

  return (
    <View>
      {routes.map((group) => {
        const key = `${group.type}-${group.route}`;
        const open = expanded === key;
        return (
          <View key={key} style={styles.group}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              onPress={() => setExpanded(open ? null : key)}
              style={styles.row}
            >
              <View style={[styles.number, { backgroundColor: FLEET_COLORS[group.type] }]}>
                <Text style={styles.numberText}>{group.route}</Text>
              </View>
              <View style={styles.copy}>
                <Text style={styles.title} numberOfLines={1}>
                  {group.items[0]?.destination || `Маршрут ${group.route}`}
                </Text>
                <Text style={styles.caption}>{group.items.length} одиниць на лінії</Text>
              </View>
              <MaterialIcons name={open ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={22} color={colors.mutedForeground} />
            </Pressable>

            {open &&
              group.items.map((vehicle) => (
                <Pressable
                  key={vehicle.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Борт ${vehicle.plate}`}
                  onPress={() => onSelectVehicle(vehicle.id)}
                  style={styles.vehicleRow}
                >
                  <Text style={styles.caption}>Борт {vehicle.plate}</Text>
                  <MaterialIcons name="chevron-right" size={20} color={colors.mutedForeground} />
                </Pressable>
              ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  row: { minHeight: MIN_TOUCH + 16, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  number: { minWidth: 52, height: 40, paddingHorizontal: 8, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  numberText: { fontFamily: fonts.extrabold, fontSize: 17, color: "#ffffff" },
  copy: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.foreground },
  caption: { fontFamily: fonts.regular, fontSize: 13, color: colors.mutedForeground },
  vehicleRow: {
    minHeight: MIN_TOUCH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 64,
    paddingRight: 4,
  },
  empty: { fontFamily: fonts.regular, fontSize: 15, color: colors.mutedForeground, paddingVertical: 16 },
});
