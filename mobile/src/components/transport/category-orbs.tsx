import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fonts, HIT_SLOP } from "../../lib/theme";

export type TransportTab = "nearby" | "bus" | "tram" | "trolleybus" | "taxi";

const TABS: { id: TransportTab; label: string; icon: keyof typeof MaterialIcons.glyphMap; color: string }[] = [
  { id: "nearby", label: "Поруч", icon: "near-me", color: colors.transportNearby },
  { id: "bus", label: "Автобуси", icon: "directions-bus", color: colors.transportBus },
  { id: "tram", label: "Трамваї", icon: "tram", color: colors.transportTram },
  { id: "trolleybus", label: "Тролейбуси", icon: "bolt", color: colors.transportTrolleybus },
  { id: "taxi", label: "Таксі", icon: "local-taxi", color: colors.transportTaxi },
];

/** Round category orbs with a count badge. Horizontal scroll, like the web. */
export function CategoryOrbs({
  value,
  counts,
  onChange,
}: {
  value: TransportTab;
  counts: Record<TransportTab, number>;
  onChange: (next: TransportTab) => void;
}) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const active = tab.id === value;
        const count = counts[tab.id];
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${tab.label}, ${count}`}
            hitSlop={HIT_SLOP}
            onPress={() => onChange(tab.id)}
            style={styles.item}
          >
            <View style={[styles.orb, { backgroundColor: tab.color }, active && styles.orbActive]}>
              <MaterialIcons name={tab.icon} size={28} color="#ffffff" />
              {count > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{count}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  item: { width: 76, alignItems: "center", gap: 8 },
  orb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  orbActive: { borderWidth: 3, borderColor: colors.card },
  badge: {
    position: "absolute",
    top: -2,
    right: -4,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  badgeText: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.primary },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.foreground, textAlign: "center" },
  labelActive: { fontFamily: fonts.extrabold, color: colors.primary },
});
