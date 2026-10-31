import { StyleSheet, Text, View } from "react-native";
import { FLEET_COLORS, type VehicleType } from "../lib/transit-types";

type Props = { route: string; type: VehicleType; selected: boolean };

/** Round route badge. Colour comes from the vehicle type, never colour alone (route number is shown). */
export function VehicleMarker({ route, type, selected }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: FLEET_COLORS[type] }, selected && styles.selected]}>
      <Text style={styles.text} numberOfLines={1}>
        {route}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  selected: {
    transform: [{ scale: 1.2 }],
  },
  text: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
});
