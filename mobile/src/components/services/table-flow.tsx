import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../primary-button";
import { ChipRow, CardRow, FlowHeader, FlowInput, FlowResultView, flowText, QuantityStepper } from "./flow-parts";
import { colors, fonts, MIN_TOUCH, radius } from "../../lib/theme";
import { formatUAH } from "../../lib/demo-format";
import { MENUS, RESTAURANTS } from "../../lib/demo-shop";
import { formatDay, isDemoSlotFree, nextDays, TIME_SLOTS } from "../../lib/demo-booking";

const STEPS = ["Заклад", "Дата і час", "Меню", "Контакти"] as const;
const PHONE_DIGITS = 9;

/** Table booking: restaurant cards, date and time grid, optional pre-order, then contact. Demo only. */
export function TableFlow({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [guests, setGuests] = useState(2);
  const [preorder, setPreorder] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reference] = useState(() => String(100 + Math.floor(Math.random() * 900)));

  const days = useMemo(() => nextDays(7), []);
  const restaurant = RESTAURANTS.find((item) => item.id === restaurantId) ?? null;
  const menu = restaurantId ? (MENUS[restaurantId] ?? []) : [];
  const preorderLines = menu.flatMap((item) => {
    const qty = preorder[item.id] ?? 0;
    return qty > 0 ? [{ item, qty }] : [];
  });
  const preorderTotal = preorderLines.reduce((sum, { item, qty }) => sum + item.price * qty, 0);
  const contactMissing = name.trim().length < 2 || phone.replace(/\D/g, "").length < PHONE_DIGITS;
  const dayLabel = dayIndex === null ? "" : formatDay(days[dayIndex]);
  const back = () => (step === 0 ? onExit() : setStep(step - 1));

  if (step >= STEPS.length) {
    return (
      <FlowResultView
        title="Столик заброньовано"
        lines={[
          `${restaurant?.name} · ${dayLabel}, ${slot} · ${guests} гост.`,
          `Бронь №${reference}. Заклад підтверджує бронь телефоном.`,
          ...(preorderLines.length > 0 ? [`Передзамовлення: ${formatUAH(preorderTotal)}`] : []),
        ]}
        notice="Демо: бронь нікуди не надіслано."
        onExit={onExit}
      />
    );
  }

  const primary = step === 0 ? null : step === 1 ? { label: "Далі", disabled: dayIndex === null || slot === null, hint: "Оберіть день і час." }
    : step === 2 ? { label: preorderLines.length > 0 ? "Далі" : "Пропустити", disabled: false, hint: null }
    : { label: "Підтвердити бронь", disabled: contactMissing, hint: "Вкажіть імʼя і телефон, щоб підтвердити." };
  const onPrimary = () => {
    if (!primary || primary.disabled) return;
    setStep(step + 1);
  };

  return (
    <View style={styles.flow}>
      <FlowHeader backLabel={step === 0 ? "Сервіси" : "Назад"} onBack={back} step={step} total={STEPS.length} title="Столик" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {step === 0 && (
          <>
            <Text style={flowText.heading}>Заклади поруч</Text>
            <Text style={flowText.caption}>Оберіть заклад, день і час.</Text>
            {RESTAURANTS.map((item) => (
              <CardRow
                key={item.id}
                icon="restaurant"
                title={item.name}
                caption={`${item.kind} · ${item.hours} · ${item.address}`}
                selected={restaurantId === item.id}
                trailing="chevron"
                onPress={() => {
                  setRestaurantId(item.id);
                  setPreorder({});
                  setStep(1);
                }}
              />
            ))}
          </>
        )}

        {step === 1 && (
          <>
            <Text style={flowText.heading}>{restaurant?.name}</Text>
            <Text style={flowText.section}>День</Text>
            <ChipRow
              items={days.map((day, index) => ({ key: index, label: formatDay(day) }))}
              selected={dayIndex}
              onSelect={(index) => {
                setDayIndex(index);
                setSlot(null);
              }}
            />
            <Text style={flowText.section}>Час</Text>
            {dayIndex === null ? (
              <Text style={flowText.caption}>Спершу оберіть день.</Text>
            ) : (
              <ChipRow
                items={TIME_SLOTS.map((time, index) => ({ key: time, label: time, disabled: !isDemoSlotFree(dayIndex * 7 + index) }))}
                selected={slot}
                onSelect={setSlot}
              />
            )}
            <Text style={flowText.section}>Гості</Text>
            <View style={styles.guests}>
              <Text style={flowText.caption}>Кількість гостей</Text>
              <QuantityStepper label="Кількість гостей" value={guests} min={1} max={8} onChange={setGuests} />
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={flowText.heading}>Передзамовлення</Text>
            <Text style={flowText.caption}>Необов’язково. Страви подадуть після вашого приходу.</Text>
            <View style={styles.grid}>
              {menu.map((item) => (
                <View key={item.id} style={styles.card}>
                  <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                  <Text style={flowText.caption}>{item.unit}</Text>
                  <View style={styles.cardFoot}>
                    <Text style={styles.price}>{formatUAH(item.price)}</Text>
                    <QuantityStepper
                      label={item.name}
                      value={preorder[item.id] ?? 0}
                      onChange={(qty) => setPreorder((current) => ({ ...current, [item.id]: qty }))}
                    />
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={flowText.heading}>Контакти</Text>
            <FlowInput label="Імʼя" value={name} onChangeText={setName} autoComplete="name" />
            <FlowInput label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
          </>
        )}
      </ScrollView>

      {primary ? (
        <View style={styles.footer}>
          {primary.hint && primary.disabled ? <Text style={flowText.caption}>{primary.hint}</Text> : null}
          <PrimaryButton label={primary.label} onPress={onPrimary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flow: { flex: 1, gap: 10 },
  scroll: { gap: 12, paddingBottom: 16 },
  guests: { gap: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
  card: { width: "48%", padding: 12, gap: 4, borderRadius: radius.xl, borderCurve: "continuous", backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  cardName: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 19, color: colors.foreground },
  cardFoot: { gap: 6, marginTop: 6 },
  price: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.foreground },
  footer: { gap: 8 },
});
