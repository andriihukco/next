import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { DemoNotice } from "./demo-notice";
import { TaxiFlow } from "./taxi-flow";
import { ShopFlow } from "./shop-flow";
import { TableFlow } from "./table-flow";
import { CinemaFlow } from "./cinema-flow";
import { AppointmentFlow } from "./appointment-flow";
import { MembershipFlow } from "./membership-flow";
import { SERVICES, type ServiceId } from "../../lib/services";
import { colors, fonts, MIN_TOUCH, radius } from "../../lib/theme";

type Props = { onFlowChange?: (open: boolean) => void };

/** Послуги: a hub of demo services. Each service opens a full-height flow. */
export function ServicesPanel({ onFlowChange }: Props) {
  const [active, setActive] = useState<ServiceId | null>(null);

  useEffect(() => {
    onFlowChange?.(active !== null);
  }, [active, onFlowChange]);

  const exit = () => setActive(null);

  if (active) {
    const flow = (() => {
      switch (active) {
        case "groceries":
        case "delivery":
          return <ShopFlow mode={active} onExit={exit} />;
        case "restaurants":
          return <TableFlow onExit={exit} />;
        case "cinema":
          return <CinemaFlow onExit={exit} />;
        case "doctors":
          return <AppointmentFlow onExit={exit} />;
        case "gyms":
          return <MembershipFlow onExit={exit} />;
        case "taxi":
          return <TaxiFlow onExit={exit} />;
      }
    })();
    return <View style={styles.flexFill}>{flow}</View>;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.hub}>
      <Text style={styles.largeTitle} accessibilityRole="header">Сервіси</Text>
      <Text style={styles.intro}>Доставка, столик, запис до лікаря, квитки, абонемент і таксі.</Text>

      <Pressable accessibilityRole="button" onPress={() => setActive("groceries")} style={styles.promo}>
        <View style={styles.promoCopy}>
          <Text style={styles.promoKicker}>Демо</Text>
          <Text style={styles.promoTitle}>Продукти до дверей</Text>
          <Text style={styles.promoText}>Оберіть магазин, зберіть кошик і виберіть час доставки.</Text>
        </View>
        <View style={styles.promoButton}>
          <Text style={styles.promoButtonText}>Почати</Text>
        </View>
      </Pressable>

      <View style={styles.grid}>
        {SERVICES.map((service) => (
          <Pressable
            key={service.id}
            accessibilityRole="button"
            accessibilityLabel={service.label}
            onPress={() => setActive(service.id)}
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
          >
            <View style={[styles.tileIcon, { backgroundColor: service.color }]}>
              <MaterialIcons name={service.icon as keyof typeof MaterialIcons.glyphMap} size={22} color="#ffffff" />
            </View>
            <Text style={styles.tileTitle}>{service.label}</Text>
            <Text style={styles.tileDescription} numberOfLines={2}>{service.description}</Text>
          </Pressable>
        ))}
      </View>

      <DemoNotice text="Сервіси в демонстраційному режимі. Замовлення, бронювання і оплата нічого не надсилають." />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flexFill: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
  hub: { gap: 14, paddingHorizontal: 16, paddingBottom: 28, paddingTop: 4 },
  largeTitle: { fontFamily: fonts.extrabold, fontSize: 28, letterSpacing: -0.6, color: colors.foreground },
  intro: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.mutedForeground, marginTop: -8 },
  promo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    backgroundColor: colors.primary,
  },
  promoCopy: { flex: 1, gap: 4 },
  promoKicker: { fontFamily: fonts.bold, fontSize: 12, color: "#c9ecd9", textTransform: "uppercase", letterSpacing: 0.6 },
  promoTitle: { fontFamily: fonts.extrabold, fontSize: 19, letterSpacing: -0.3, color: "#ffffff" },
  promoText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 19, color: "#e6f6ee" },
  promoButton: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: "#ffffff",
    justifyContent: "center",
  },
  promoButtonText: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
  tile: {
    width: "48%",
    minHeight: 136,
    padding: 14,
    gap: 6,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tilePressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  tileIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  tileTitle: { fontFamily: fonts.extrabold, fontSize: 16, letterSpacing: -0.2, color: colors.foreground, marginTop: 6 },
  tileDescription: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.mutedForeground },
});
