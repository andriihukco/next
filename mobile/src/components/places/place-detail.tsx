import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { formatDistance } from "./place-cards";
import { categoryColor, materialIconFor } from "../../lib/category-icons";
import { cityPlaceIcons, formatOpeningHours } from "../../../../src/lib/city-places";
import type { CityPlace } from "../../lib/places-api";
import { colors, fonts, MIN_TOUCH, radius } from "../../lib/theme";

// Info rows the web app shows. Phone and website are actions, not rows (same as the web).
const INFO_ICONS: Record<string, string> = {
  Графік: "schedule",
  Email: "email",
  "Wi-Fi": "wifi",
  Кухня: "restaurant-menu",
  Оператор: "domain",
};
const HIDDEN_ROWS = ["Тип", "Телефон", "Мобільний", "Сайт"];

type Props = {
  place: CityPlace;
  distanceMeters: number;
  onBack: () => void;
  onShowOnMap: () => void;
  onDirections: () => void;
  onOpenPage: () => void;
};

/** Place detail, in the bottom sheet. Demo menus and bookings from the web are not ported. */
export function PlaceDetail({ place, distanceMeters, onBack, onShowOnMap, onDirections, onOpenPage }: Props) {
  const color = categoryColor(place.category);
  const icon = materialIconFor(cityPlaceIcons[place.category as keyof typeof cityPlaceIcons] ?? "place");
  const phone = place.details["Телефон"] || place.details["Мобільний"];
  const website = place.details["Сайт"];
  const rows = Object.entries(place.details).filter(([label]) => !HIDDEN_ROWS.includes(label));

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.head}>
        <Pressable accessibilityRole="button" accessibilityLabel="Назад до списку" onPress={onBack} style={styles.back}>
          <MaterialIcons name="chevron-left" size={28} color={colors.primary} />
        </Pressable>
        <View style={[styles.iconCircle, { backgroundColor: color }]}>
          <MaterialIcons name={icon} size={24} color="#ffffff" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{place.categoryLabel}</Text>
          <Text style={styles.title}>{place.name}</Text>
          <Text style={styles.caption}>
            {[formatDistance(distanceMeters), place.address].filter(Boolean).join(" · ")}
          </Text>
        </View>
      </View>

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

      {phone ? (
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(`tel:${phone}`)} style={styles.row}>
          <MaterialIcons name="call" size={20} color={colors.primary} />
          <Text style={styles.rowValue}>{phone}</Text>
        </Pressable>
      ) : null}
      {website ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(website.startsWith("http") ? website : `https://${website}`)}
          style={styles.row}
        >
          <MaterialIcons name="language" size={20} color={colors.primary} />
          <Text style={styles.rowValue} numberOfLines={1}>{website}</Text>
        </Pressable>
      ) : null}

      {rows.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <MaterialIcons name={materialIconFor(INFO_ICONS[label] ?? "info")} size={20} color={colors.mutedForeground} />
          <View style={styles.rowCopy}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{label === "Графік" ? formatOpeningHours(value) : value}</Text>
          </View>
        </View>
      ))}

      <Pressable accessibilityRole="button" onPress={onOpenPage} style={styles.more}>
        <Text style={styles.moreText}>Детальна сторінка</Text>
        <MaterialIcons name="chevron-right" size={20} color={colors.foreground} />
      </Pressable>

      <Text style={styles.source}>Дані: OpenStreetMap</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 420 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  back: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: "center", justifyContent: "center", marginLeft: -10 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, gap: 2 },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 12, color: colors.mutedForeground },
  title: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.foreground, letterSpacing: -0.4 },
  caption: { fontFamily: fonts.regular, fontSize: 13, color: colors.mutedForeground },
  actions: { flexDirection: "row", gap: 8, marginTop: 14, marginBottom: 6 },
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
  row: {
    minHeight: MIN_TOUCH,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  rowCopy: { flex: 1, gap: 2 },
  rowLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.mutedForeground },
  rowValue: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.foreground },
  more: { minHeight: MIN_TOUCH, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginTop: 10 },
  moreText: { fontFamily: fonts.bold, fontSize: 15, color: colors.foreground },
  source: { fontFamily: fonts.regular, fontSize: 12, color: colors.mutedForeground, marginTop: 12 },
});
