import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { PrimaryButton } from "../primary-button";
import { DemoNotice } from "./demo-notice";
import { FlowHeader, FlowInput } from "./flow-parts";
import { colors, fonts, MIN_TOUCH, radius } from "../../lib/theme";
import { formatUAH } from "../../lib/demo-format";
import { GROCERY_CATALOG, GROCERY_STORES, MENUS, RESTAURANTS, type DemoItem, type DemoStore } from "../../lib/demo-shop";

export type ShopMode = "groceries" | "delivery";

const STEPS = ["Заклад", "Меню", "Кошик", "Доставка", "Оплата"] as const;
const TIMES = [
  { id: "asap", label: "Якомога швидше", hint: "Приготуємо одразу" },
  { id: "h1", label: "Через 1 годину", hint: "Доставка у вибраний час" },
  { id: "h2", label: "Через 2 години", hint: "Доставка у вибраний час" },
] as const;
const PAYMENTS = [
  { id: "card", label: "Картою онлайн", icon: "credit-card" },
  { id: "cash", label: "Готівкою при отриманні", icon: "payments" },
] as const;

const COPY: Record<ShopMode, { title: string; storesTitle: string; storesIntro: string; storeIcon: keyof typeof MaterialIcons.glyphMap }> = {
  groceries: { title: "Продукти", storesTitle: "Магазини поруч", storesIntro: "Складіть кошик і заберіть самі або замовте доставку.", storeIcon: "shopping-basket" },
  delivery: { title: "Доставка", storesTitle: "Заклади з доставкою", storesIntro: "Меню, кошик і доставка або самовивіз.", storeIcon: "restaurant" },
};

/**
 * Groceries and delivery: store cards, a menu grid with a sticky cart bar, then
 * cart, delivery time, and payment, one step at a time. Demo only.
 */
export function ShopFlow({ mode, onExit }: { mode: ShopMode; onExit: () => void }) {
  const copy = COPY[mode];
  const stores: DemoStore[] = mode === "groceries" ? GROCERY_STORES : RESTAURANTS;
  const [step, setStep] = useState(0);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("delivery");
  const [timeId, setTimeId] = useState<(typeof TIMES)[number]["id"]>("asap");
  const [address, setAddress] = useState("");
  const [paymentId, setPaymentId] = useState<(typeof PAYMENTS)[number]["id"]>("card");
  const [orderNumber] = useState(() => String(1000 + Math.floor(Math.random() * 9000)));

  const store = stores.find((item) => item.id === storeId) ?? null;
  const catalog: DemoItem[] = useMemo(() => {
    if (!storeId) return [];
    return mode === "groceries" ? GROCERY_CATALOG : (MENUS[storeId] ?? []);
  }, [mode, storeId]);

  const lines = catalog.flatMap((item) => {
    const qty = cart[item.id] ?? 0;
    return qty > 0 ? [{ item, qty, total: qty * item.price }] : [];
  });
  const itemCount = lines.reduce((sum, line) => sum + line.qty, 0);
  const total = lines.reduce((sum, line) => sum + line.total, 0);
  const addressMissing = fulfillment === "delivery" && address.trim().length < 5;
  const time = TIMES.find((item) => item.id === timeId) ?? TIMES[0];
  const payment = PAYMENTS.find((item) => item.id === paymentId) ?? PAYMENTS[0];

  const setQty = (id: string, qty: number) => setCart((current) => ({ ...current, [id]: Math.max(0, qty) }));
  const back = () => (step === 0 ? onExit() : setStep(step - 1));

  if (step >= STEPS.length) {
    return (
      <View style={styles.result}>
        <View style={styles.resultIcon}>
          <MaterialIcons name="check" size={36} color="#ffffff" />
        </View>
        <Text style={styles.resultTitle} accessibilityRole="header">Замовлення прийнято</Text>
        <Text style={styles.resultBody}>№{orderNumber} · {store?.name}</Text>
        <Text style={styles.resultBody}>
          {fulfillment === "pickup" ? `Заберіть у закладі: ${store?.address}` : `Доставка на адресу: ${address.trim()}`}
        </Text>
        <Text style={styles.resultBody}>
          {time.label} · {payment.label.toLowerCase()} · разом {formatUAH(total)}
        </Text>
        <DemoNotice text="Демо: замовлення нікуди не надіслано." />
        <PrimaryButton label="До сервісів" onPress={onExit} />
      </View>
    );
  }

  const cartBar = step === 1 && itemCount > 0;
  const primaryLabel = step === 0 ? "Далі" : step === 2 ? "До доставки" : step === 3 ? "До оплати" : "Підтвердити замовлення";
  const primaryDisabled = (step === 2 && itemCount === 0) || (step === 3 && addressMissing);
  const onPrimary = () => {
    if (primaryDisabled) return;
    setStep(step + 1);
  };

  return (
    <View style={styles.flow}>
      <FlowHeader backLabel={step === 0 ? "Сервіси" : "Назад"} onBack={back} step={step} total={STEPS.length} title={copy.title} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {step === 0 && (
          <>
            <Text style={styles.heading}>{copy.storesTitle}</Text>
            <Text style={styles.caption}>{copy.storesIntro}</Text>
            {stores.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.name}
                onPress={() => {
                  setStoreId(item.id);
                  setCart({});
                  setStep(1);
                }}
                style={({ pressed }) => [styles.storeCard, pressed && styles.pressed]}
              >
                <View style={styles.storeThumb}>
                  <MaterialIcons name={copy.storeIcon} size={28} color={colors.primary} />
                </View>
                <View style={styles.storeCopy}>
                  <Text style={styles.storeName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.caption} numberOfLines={1}>{item.kind} · {item.hours}</Text>
                  <View style={styles.etaPill}>
                    <MaterialIcons name="schedule" size={14} color={colors.accentForeground} />
                    <Text style={styles.etaText}>{item.eta}</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </>
        )}

        {step === 1 && store && (
          <>
            <View style={styles.storeHead}>
              <Text style={styles.heading}>{store.name}</Text>
              <Text style={styles.caption}>Доставка {store.eta} · {store.address}</Text>
            </View>
            <View style={styles.menuGrid}>
              {catalog.map((item) => {
                const qty = cart[item.id] ?? 0;
                return (
                  <View key={item.id} style={styles.menuCard}>
                    <View style={styles.menuThumb}>
                      <MaterialIcons name={copy.storeIcon} size={26} color={colors.primary} />
                    </View>
                    <Text style={styles.menuName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.caption}>{item.unit}</Text>
                    <View style={styles.menuFoot}>
                      <Text style={styles.price}>{formatUAH(item.price)}</Text>
                      {qty === 0 ? (
                        <Pressable accessibilityRole="button" accessibilityLabel={`Додати: ${item.name}`} onPress={() => setQty(item.id, 1)} style={styles.addBtn}>
                          <MaterialIcons name="add" size={22} color="#ffffff" />
                        </Pressable>
                      ) : (
                        <View style={styles.inlineStepper}>
                          <Pressable accessibilityRole="button" accessibilityLabel={`Менше: ${item.name}`} onPress={() => setQty(item.id, qty - 1)} style={styles.stepBtn}>
                            <MaterialIcons name="remove" size={18} color={colors.primary} />
                          </Pressable>
                          <Text style={styles.stepCount}>{qty}</Text>
                          <Pressable accessibilityRole="button" accessibilityLabel={`Більше: ${item.name}`} onPress={() => setQty(item.id, qty + 1)} style={styles.stepBtn}>
                            <MaterialIcons name="add" size={18} color={colors.primary} />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.heading}>Кошик</Text>
            {lines.length === 0 ? (
              <Text style={styles.caption}>Кошик порожній. Поверніться до меню.</Text>
            ) : (
              lines.map(({ item, qty, total: lineTotal }) => (
                <View key={item.id} style={styles.line}>
                  <View style={styles.lineCopy}>
                    <Text style={styles.menuName}>{item.name}</Text>
                    <Text style={styles.caption}>{formatUAH(lineTotal)}</Text>
                  </View>
                  <View style={styles.inlineStepper}>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Менше: ${item.name}`} onPress={() => setQty(item.id, qty - 1)} style={styles.stepBtn}>
                      <MaterialIcons name="remove" size={18} color={colors.primary} />
                    </Pressable>
                    <Text style={styles.stepCount}>{qty}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Більше: ${item.name}`} onPress={() => setQty(item.id, qty + 1)} style={styles.stepBtn}>
                      <MaterialIcons name="add" size={18} color={colors.primary} />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
            <Pressable accessibilityRole="button" onPress={() => setStep(1)} style={styles.link}>
              <MaterialIcons name="add" size={18} color={colors.primary} />
              <Text style={styles.linkText}>Додати ще</Text>
            </Pressable>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.heading}>Як отримати?</Text>
            <View style={styles.segment}>
              {(["delivery", "pickup"] as const).map((option) => {
                const active = fulfillment === option;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    onPress={() => setFulfillment(option)}
                    style={[styles.segmentItem, active && styles.segmentActive]}
                  >
                    <MaterialIcons name={option === "delivery" ? "delivery-dining" : "storefront"} size={18} color={active ? "#ffffff" : colors.foreground} />
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option === "delivery" ? "Доставка" : "Самовивіз"}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.section}>Коли</Text>
            {TIMES.map((option) => {
              const active = timeId === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => setTimeId(option.id)}
                  style={[styles.choice, active && styles.choiceActive]}
                >
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                  <View style={styles.lineCopy}>
                    <Text style={styles.choiceTitle}>{option.label}</Text>
                    <Text style={styles.caption}>{option.hint}{option.id === "asap" && store ? ` · ${store.eta}` : ""}</Text>
                  </View>
                </Pressable>
              );
            })}

            {fulfillment === "delivery" ? (
              <>
                <Text style={styles.section}>Адреса</Text>
                <FlowInput label="Адреса доставки" value={address} onChangeText={setAddress} placeholder="вул., будинок, квартира" autoComplete="street-address" />
              </>
            ) : null}
          </>
        )}

        {step === 4 && (
          <>
            <Text style={styles.heading}>Оплата</Text>
            {PAYMENTS.map((option) => {
              const active = paymentId === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => setPaymentId(option.id)}
                  style={[styles.choice, active && styles.choiceActive]}
                >
                  <MaterialIcons name={option.icon} size={22} color={active ? colors.primary : colors.mutedForeground} />
                  <Text style={[styles.choiceTitle, styles.lineCopy]}>{option.label}</Text>
                  {active ? <MaterialIcons name="check-circle" size={22} color={colors.primary} /> : null}
                </Pressable>
              );
            })}

            <View style={styles.summary}>
              <Text style={styles.caption}>{itemCount} шт · {fulfillment === "pickup" ? "самовивіз" : "доставка"} · {time.label.toLowerCase()}</Text>
              <Text style={styles.summaryTotal}>Разом {formatUAH(total)}</Text>
            </View>
          </>
        )}
      </ScrollView>

      {cartBar ? (
        <Pressable accessibilityRole="button" onPress={() => setStep(2)} style={styles.cartBar}>
          <View style={styles.cartCount}>
            <Text style={styles.cartCountText}>{itemCount}</Text>
          </View>
          <Text style={styles.cartLabel}>Кошик</Text>
          <Text style={styles.cartTotal}>{formatUAH(total)}</Text>
          <MaterialIcons name="chevron-right" size={22} color="#ffffff" />
        </Pressable>
      ) : step === 0 || step === 1 ? null : (
        <View style={styles.footer}>
          {step === 3 && addressMissing ? <Text style={styles.caption}>Вкажіть адресу доставки, щоб продовжити.</Text> : null}
          <PrimaryButton label={primaryLabel} onPress={onPrimary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flow: { flex: 1, gap: 10 },
  scroll: { gap: 12, paddingBottom: 96 },
  heading: { fontFamily: fonts.extrabold, fontSize: 22, letterSpacing: -0.4, color: colors.foreground },
  section: { fontFamily: fonts.extrabold, fontSize: 17, letterSpacing: -0.2, color: colors.foreground, marginTop: 8 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.mutedForeground },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  storeCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: radius.xl, borderCurve: "continuous", backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  storeThumb: { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  storeCopy: { flex: 1, gap: 3 },
  storeName: { fontFamily: fonts.extrabold, fontSize: 16, letterSpacing: -0.2, color: colors.foreground },
  etaPill: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.accent, marginTop: 2 },
  etaText: { fontFamily: fonts.bold, fontSize: 12, color: colors.accentForeground },
  storeHead: { gap: 2 },
  menuGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
  menuCard: { width: "48%", padding: 12, gap: 4, borderRadius: radius.xl, borderCurve: "continuous", backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  menuThumb: { height: 64, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  menuName: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 19, color: colors.foreground },
  menuFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  price: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.foreground },
  addBtn: { width: MIN_TOUCH - 6, height: MIN_TOUCH - 6, borderRadius: (MIN_TOUCH - 6) / 2, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  inlineStepper: { flexDirection: "row", alignItems: "center", borderRadius: radius.pill, backgroundColor: colors.accent },
  stepBtn: { width: MIN_TOUCH - 8, height: MIN_TOUCH - 8, alignItems: "center", justifyContent: "center" },
  stepCount: { minWidth: 18, textAlign: "center", fontFamily: fonts.extrabold, fontSize: 15, color: colors.accentForeground },
  line: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  lineCopy: { flex: 1, gap: 2 },
  link: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: MIN_TOUCH, alignSelf: "flex-start" },
  linkText: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
  segment: { flexDirection: "row", padding: 3, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  segmentItem: { flex: 1, minHeight: MIN_TOUCH, borderRadius: radius.pill, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { fontFamily: fonts.bold, fontSize: 15, color: colors.foreground },
  segmentTextActive: { color: "#ffffff" },
  choice: { minHeight: MIN_TOUCH + 16, flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.xl, borderCurve: "continuous", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  choiceActive: { borderColor: colors.primary, backgroundColor: colors.accent },
  choiceTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.foreground },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  summary: { gap: 4, padding: 14, borderRadius: radius.xl, backgroundColor: colors.surfaceMuted },
  summaryTotal: { fontFamily: fonts.extrabold, fontSize: 20, letterSpacing: -0.3, color: colors.foreground },
  footer: { gap: 8 },
  cartBar: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: MIN_TOUCH + 12, paddingLeft: 8, paddingRight: 14, borderRadius: radius.pill, backgroundColor: colors.primary },
  cartCount: { minWidth: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  cartCountText: { fontFamily: fonts.extrabold, fontSize: 14, color: "#ffffff" },
  cartLabel: { flex: 1, fontFamily: fonts.bold, fontSize: 16, color: "#ffffff" },
  cartTotal: { fontFamily: fonts.extrabold, fontSize: 16, color: "#ffffff" },
  result: { alignItems: "center", gap: 12, paddingVertical: 16 },
  resultIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  resultTitle: { fontFamily: fonts.extrabold, fontSize: 22, letterSpacing: -0.4, color: colors.foreground },
  resultBody: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22, color: colors.foreground, textAlign: "center" },
});
