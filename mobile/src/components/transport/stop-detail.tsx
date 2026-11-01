import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { arrivalsAt } from "../../lib/transit-eta";
import { FLEET_COLORS, VEHICLE_LABELS, type Stop, type Vehicle } from "../../lib/transit-types";
import { colors, fonts, HIT_SLOP, MIN_TOUCH, radius, type, themed } from "../../lib/theme";

type StopTab = "overview" | "schedule" | "facilities" | "contacts" | "reviews";

// Same tabs, labels and order as the web StopInspector (src/features/transport/stop-inspector.tsx).
const STOP_TABS: { id: StopTab; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { id: "overview", label: "Огляд", icon: "info" },
  { id: "schedule", label: "Розклад", icon: "schedule" },
  { id: "facilities", label: "Зручності", icon: "accessible" },
  { id: "contacts", label: "Контакти", icon: "call" },
  { id: "reviews", label: "Відгуки", icon: "star" },
];

type Props = {
  stop: Stop;
  vehicles: Vehicle[];
  /** Meters from the user, or null when the location is unknown. */
  distanceMeters: number | null;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onBack: () => void;
};

/** Only https links open (same rule as safeStopWebsite on the web). */
function safeWebsite(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function formatMeters(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} м` : `${(meters / 1000).toFixed(1).replace(".", ",")} км`;
}

/** Stop detail with tabs, matching the web stop inspector. Mount with `key={stop.id}` to reset the tab. */
export function StopDetail({ stop, vehicles, distanceMeters, onSelectVehicle, onBack }: Props) {
  const [tab, setTab] = useState<StopTab>("overview");
  const arrivals = arrivalsAt(stop, vehicles);
  const website = safeWebsite(stop.website);

  return (
    <View style={styles.root}>
      <Pressable accessibilityRole="button" accessibilityLabel="Назад" hitSlop={HIT_SLOP} onPress={onBack} style={styles.back}>
        <MaterialIcons name="arrow-back" size={20} color={colors.accentForeground} />
        <Text style={styles.backText}>Транспорт на мапі</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.eyebrow}>Зупинка · міський транспорт</Text>
        <Text style={styles.title} numberOfLines={2}>{stop.name}</Text>
        <Text style={styles.caption}>
          {stop.routes.length} {stop.routes.length === 1 ? "маршрут" : "маршрутів"} проходить тут
        </Text>
      </View>

      {distanceMeters !== null && (
        <View style={styles.distance}>
          <MaterialIcons name="near-me" size={18} color={colors.accentForeground} />
          <Text style={styles.distanceText}>
            Від вашого місця <Text style={styles.distanceStrong}>{formatMeters(distanceMeters)}</Text> до зупинки
          </Text>
        </View>
      )}

      <View style={styles.tabs} accessibilityRole="tablist">
        {STOP_TABS.map((item) => {
          const active = tab === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
              onPress={() => setTab(item.id)}
              style={styles.tab}
            >
              <View style={[styles.tabOrb, active && styles.tabOrbActive]}>
                <MaterialIcons name={item.icon} size={22} color={active ? colors.onPrimary : colors.foreground} />
              </View>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={styles.panel} showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelBody}>
        {tab === "overview" && (
          <>
            <Text style={styles.heading}>Маршрути тут</Text>
            <View style={styles.chipRow}>
              {stop.routes.map((route) => (
                <View key={route} style={styles.routeChip}>
                  <Text style={styles.routeChipText}>{route}</Text>
                </View>
              ))}
            </View>
            <View style={styles.headingRow}>
              <Text style={styles.heading}>Транспорт поруч</Text>
              <Text style={styles.caption}>Оцінка за GPS</Text>
            </View>
            {arrivals.length ? (
              arrivals.map(({ vehicle, minutes }) => (
                <Pressable
                  key={vehicle.id}
                  accessibilityRole="button"
                  onPress={() => onSelectVehicle(vehicle)}
                  style={({ pressed }) => [styles.arrival, pressed && styles.pressed]}
                >
                  <View style={[styles.fleetChip, { backgroundColor: FLEET_COLORS[vehicle.type] }]}>
                    <Text style={styles.fleetChipText}>{vehicle.route}</Text>
                  </View>
                  <View style={styles.arrivalCopy}>
                    <Text style={styles.body} numberOfLines={1}>{vehicle.destination || VEHICLE_LABELS[vehicle.type]}</Text>
                    <Text style={styles.caption}>Борт {vehicle.plate}</Text>
                  </View>
                  <Text style={styles.eta}>{minutes} хв</Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.empty}>Наразі немає транспорту з GPS поруч.</Text>
            )}
          </>
        )}

        {tab === "schedule" && (
          <>
            <View style={styles.headingRow}>
              <Text style={styles.heading}>Відправлення</Text>
              <Text style={styles.caption}>{stop.timetable?.length ? "Розклад" : "Оцінка GPS"}</Text>
            </View>
            {stop.timetable?.length ? (
              stop.timetable.map((entry, index) => (
                <View key={`${entry.route}-${entry.departure}-${index}`} style={styles.row}>
                  <View style={styles.routeChip}><Text style={styles.routeChipText}>{entry.route}</Text></View>
                  <Text style={styles.eta}>{entry.departure}</Text>
                </View>
              ))
            ) : arrivals.length ? (
              <>
                {arrivals.map(({ vehicle, minutes }) => (
                  <View key={vehicle.id} style={styles.row}>
                    <View style={styles.routeChip}><Text style={styles.routeChipText}>{vehicle.route}</Text></View>
                    <Text style={[styles.body, styles.flex]} numberOfLines={1}>{vehicle.destination || VEHICLE_LABELS[vehicle.type]}</Text>
                    <Text style={styles.eta}>~{minutes} хв</Text>
                  </View>
                ))}
                <Text style={styles.caption}>Орієнтовний час за відстанню та GPS, не офіційний розклад.</Text>
              </>
            ) : (
              <Text style={styles.empty}>Розклад і GPS-прибуття для цієї зупинки зараз недоступні.</Text>
            )}
          </>
        )}

        {tab === "facilities" && (
          <>
            <Text style={styles.heading}>Зручності на зупинці</Text>
            {stop.facilities?.length ? (
              stop.facilities.map((facility) => (
                <View key={facility} style={styles.row}>
                  <MaterialIcons name="check-circle" size={18} color={colors.primary} />
                  <Text style={styles.body}>{facility}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.empty}>Про павільйон, доступність чи інші зручності даних немає.</Text>
            )}
          </>
        )}

        {tab === "contacts" && (
          <>
            <Text style={styles.heading}>Контактна інформація</Text>
            {stop.address ? (
              <View style={styles.row}>
                <MaterialIcons name="location-on" size={18} color={colors.mutedForeground} />
                <Text style={styles.body}>{stop.address}</Text>
              </View>
            ) : null}
            {stop.phone ? (
              <Pressable
                accessibilityRole="link"
                onPress={() => void Linking.openURL(`tel:${stop.phone?.replace(/[^\d+]/g, "")}`)}
                style={styles.row}
              >
                <MaterialIcons name="call" size={18} color={colors.mutedForeground} />
                <Text style={styles.link}>{stop.phone}</Text>
              </Pressable>
            ) : null}
            {website ? (
              <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(website)} style={styles.row}>
                <MaterialIcons name="language" size={18} color={colors.mutedForeground} />
                <Text style={styles.link}>Вебсайт перевізника</Text>
                <MaterialIcons name="open-in-new" size={16} color={colors.mutedForeground} />
              </Pressable>
            ) : null}
            {!stop.address && !stop.phone && !website && (
              <Text style={styles.empty}>Контакти не передаються у поточному наборі даних зупинок.</Text>
            )}
          </>
        )}

        {tab === "reviews" && (
          <>
            <Text style={styles.heading}>Оцінка пасажирів</Text>
            {stop.rating !== undefined ? (
              <View style={styles.row}>
                <MaterialIcons name="star" size={24} color={colors.transportBus} />
                <Text style={styles.eta}>{stop.rating.toFixed(1)}</Text>
                <Text style={styles.caption}>{stop.reviewCount ?? 0} відгуків</Text>
              </View>
            ) : (
              <Text style={styles.empty}>Рейтинг і відгуки для зупинок ще не надходять із міського джерела даних.</Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = themed(() => ({
  root: { gap: 12 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 32 },
  backText: { fontFamily: fonts.bold, fontSize: 14, color: colors.accentForeground },
  header: { gap: 2 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 12, color: colors.mutedForeground },
  title: { ...type.title, color: colors.foreground },
  caption: { ...type.footnote, color: colors.mutedForeground },
  body: { ...type.body, color: colors.foreground },
  distance: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  distanceText: { ...type.footnote, color: colors.accentForeground, flex: 1 },
  distanceStrong: { fontFamily: fonts.extrabold },
  tabs: { flexDirection: "row", justifyContent: "space-between" },
  tab: { flex: 1, alignItems: "center", gap: 4, minHeight: MIN_TOUCH },
  tabOrb: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  tabOrbActive: { backgroundColor: colors.primary },
  tabLabel: { fontFamily: fonts.semibold, fontSize: 11, color: colors.mutedForeground },
  tabLabelActive: { fontFamily: fonts.bold, color: colors.primary },
  panel: { maxHeight: 280 },
  panelBody: { gap: 8, paddingBottom: 4 },
  heading: { fontFamily: fonts.bold, fontSize: 15, color: colors.foreground },
  headingRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  routeChip: {
    minWidth: 36,
    height: 26,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  routeChipText: { fontFamily: fonts.bold, fontSize: 13, color: colors.foreground },
  arrival: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: MIN_TOUCH },
  pressed: { opacity: 0.6 },
  fleetChip: {
    minWidth: 40,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  fleetChipText: { color: colors.onPrimary, fontSize: 14, fontFamily: fonts.bold },
  arrivalCopy: { flex: 1 },
  eta: { ...type.bodyStrong, color: colors.foreground },
  row: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 36 },
  flex: { flex: 1 },
  link: { ...type.body, color: colors.accentForeground, flex: 1 },
  empty: { ...type.footnote, color: colors.mutedForeground, paddingVertical: 8 },
}));
