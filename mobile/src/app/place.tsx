import { useMemo } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { PrimaryButton } from "../components/primary-button";
import { PlaceExtras } from "../components/places/place-extras";
import { categoryColor, materialIconFor } from "../lib/category-icons";
import { cityPlaceIcons, formatOpeningHours } from "../../../src/lib/city-places";
import type { CityPlace } from "../lib/places-api";
import { colors, fonts, MIN_TOUCH, radius } from "../lib/theme";

const INFO_ICONS: Record<string, string> = { Графік: "schedule", Email: "email", "Wi-Fi": "wifi", Кухня: "restaurant-menu", Оператор: "domain" };
const HIDDEN = ["Тип", "Телефон", "Мобільний", "Сайт"];

/** Full place page: details, contacts, and directions. Opened from the place sheet or list. */
export default function PlaceScreen() {
  const { place: raw } = useLocalSearchParams<{ place?: string }>();
  const place = useMemo<CityPlace | null>(() => {
    try {
      return raw ? (JSON.parse(raw) as CityPlace) : null;
    } catch {
      return null;
    }
  }, [raw]);

  if (!place) {
    return (
      <View style={styles.empty}>
        <Text style={styles.body}>Місце не знайдено.</Text>
        <PrimaryButton label="Назад" onPress={() => router.back()} />
      </View>
    );
  }

  const color = categoryColor(place.category);
  const icon = materialIconFor(cityPlaceIcons[place.category as keyof typeof cityPlaceIcons] ?? "place");
  const phone = place.details["Телефон"] || place.details["Мобільний"];
  const website = place.details["Сайт"];
  const rows = Object.entries(place.details).filter(([label]) => !HIDDEN.includes(label));

  return (
    <View style={styles.screen}>
      <View style={[styles.hero, { backgroundColor: color }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Назад" onPress={() => router.back()} style={styles.back}>
          <MaterialIcons name="chevron-left" size={28} color="#ffffff" />
        </Pressable>
        <MaterialIcons name={icon} size={44} color="#ffffff" />
        <Text style={styles.heroKicker}>{place.categoryLabel}</Text>
        <Text style={styles.heroTitle}>{place.name}</Text>
        {place.address ? <Text style={styles.heroAddress}>{place.address}</Text> : null}
      </View>

      <ScrollView contentContainerStyle={styles.body2} showsVerticalScrollIndicator={false}>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/directions", params: { name: place.name, lat: String(place.lat), lng: String(place.lng) } })}
            style={[styles.action, styles.actionPrimary]}
          >
            <MaterialIcons name="directions" size={20} color="#ffffff" />
            <Text style={styles.actionPrimaryText}>Маршрут</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.navigate("/")} style={[styles.action, styles.actionOutline]}>
            <MaterialIcons name="map" size={20} color={colors.foreground} />
            <Text style={styles.actionText}>На мапі</Text>
          </Pressable>
        </View>

        <PlaceExtras place={place} />

        {phone ? (
          <Pressable accessibilityRole="link" onPress={() => Linking.openURL(`tel:${phone}`)} style={styles.row}>
            <MaterialIcons name="call" size={20} color={colors.primary} />
            <Text style={styles.rowValue}>{phone}</Text>
          </Pressable>
        ) : null}
        {website ? (
          <Pressable accessibilityRole="link" onPress={() => Linking.openURL(website.startsWith("http") ? website : `https://${website}`)} style={styles.row}>
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

        <Text style={styles.source}>Дані: OpenStreetMap</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20, gap: 6, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  back: { position: "absolute", top: 54, left: 12, width: MIN_TOUCH, height: MIN_TOUCH, alignItems: "center", justifyContent: "center" },
  heroKicker: { fontFamily: fonts.semibold, fontSize: 13, color: "#ffffffcc", marginTop: 8 },
  heroTitle: { fontFamily: fonts.extrabold, fontSize: 28, letterSpacing: -0.6, color: "#ffffff" },
  heroAddress: { fontFamily: fonts.regular, fontSize: 15, color: "#ffffffdd" },
  body2: { padding: 16, gap: 12, paddingBottom: 40 },
  actions: { flexDirection: "row", gap: 10 },
  action: { flex: 1, minHeight: MIN_TOUCH + 6, borderRadius: radius.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1 },
  actionPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionPrimaryText: { fontFamily: fonts.bold, fontSize: 16, color: "#ffffff" },
  actionOutline: { backgroundColor: colors.card, borderColor: colors.border },
  actionText: { fontFamily: fonts.bold, fontSize: 16, color: colors.foreground },
  row: { minHeight: MIN_TOUCH, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowCopy: { flex: 1, gap: 2 },
  rowLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.mutedForeground },
  rowValue: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.foreground },
  source: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.mutedForeground, marginTop: 8 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24, backgroundColor: colors.background },
  body: { fontFamily: fonts.regular, fontSize: 16, color: colors.foreground },
});
