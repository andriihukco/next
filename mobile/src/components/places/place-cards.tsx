import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { categoryColor, materialIconFor } from "../../lib/category-icons";
import { cityPlaceIcons } from "../../../../src/lib/city-places";
import type { CityPlace } from "../../lib/places-api";
import { colors, fonts, MIN_TOUCH, radius } from "../../lib/theme";

export function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1).replace(".", ",")} км`
    : `${Math.round(meters / 10) * 10} м`;
}

type CardProps = {
  place: CityPlace;
  /** Overrides the category label, e.g. «Школа» in Освіта. */
  categoryLabel?: string;
  distanceMeters: number;
  onOpen: () => void;
  onDirections: () => void;
  onShowOnMap: () => void;
};

/** List card: category icon, name, distance and address, then the two actions from the web. */
export function PlaceListCard({ place, categoryLabel, distanceMeters, onOpen, onDirections, onShowOnMap }: CardProps) {
  const color = categoryColor(place.category);
  const icon = materialIconFor(cityPlaceIcons[place.category as keyof typeof cityPlaceIcons] ?? "place");
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={place.name} onPress={onOpen} style={styles.cardHead}>
        <View style={[styles.iconCircle, { backgroundColor: color }]}>
          <MaterialIcons name={icon} size={22} color="#ffffff" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.category}>{categoryLabel ?? place.categoryLabel}</Text>
          <Text style={styles.title} numberOfLines={2}>{place.name}</Text>
          <Text style={styles.caption} numberOfLines={1}>
            {[formatDistance(distanceMeters), place.address].filter(Boolean).join(" · ")}
          </Text>
        </View>
      </Pressable>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onDirections} style={[styles.button, styles.buttonPrimary]}>
          <MaterialIcons name="directions" size={18} color="#ffffff" />
          <Text style={styles.buttonPrimaryText}>Маршрут</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onShowOnMap} style={[styles.button, styles.buttonOutline]}>
          <MaterialIcons name="map" size={18} color={colors.foreground} />
          <Text style={styles.buttonText}>На мапі</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Grid tile: colour block with icon, then name and distance. */
export function PlaceGridCard({ place, distanceMeters, onOpen }: Omit<CardProps, "onDirections" | "onShowOnMap">) {
  const color = categoryColor(place.category);
  const icon = materialIconFor(cityPlaceIcons[place.category as keyof typeof cityPlaceIcons] ?? "place");
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={place.name} onPress={onOpen} style={styles.tile}>
      <View style={[styles.tileTop, { backgroundColor: color }]}>
        <MaterialIcons name={icon} size={28} color="#ffffff" />
      </View>
      <View style={styles.tileBody}>
        <Text style={styles.title} numberOfLines={2}>{place.name}</Text>
        <Text style={styles.caption} numberOfLines={1}>{formatDistance(distanceMeters)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 14,
    gap: 14,
  },
  cardHead: { flexDirection: "row", gap: 12, alignItems: "center" },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, gap: 2 },
  category: { fontFamily: fonts.semibold, fontSize: 12, color: colors.mutedForeground },
  title: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.foreground, letterSpacing: -0.3 },
  caption: { fontFamily: fonts.regular, fontSize: 13, color: colors.mutedForeground },
  actions: { flexDirection: "row", gap: 8 },
  button: {
    flex: 1,
    minHeight: MIN_TOUCH,
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
  },
  buttonPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  buttonPrimaryText: { fontFamily: fonts.bold, fontSize: 15, color: "#ffffff" },
  buttonOutline: { backgroundColor: colors.card, borderColor: colors.border },
  buttonText: { fontFamily: fonts.bold, fontSize: 15, color: colors.foreground },
  tile: {
    width: "48%",
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: "hidden",
  },
  tileTop: { height: 72, alignItems: "center", justifyContent: "center" },
  tileBody: { padding: 10, gap: 2 },
});
