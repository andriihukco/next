import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { PrimaryButton } from "../primary-button";
import { CardRow, FlowHeader, FlowInput, FlowResultView, flowText, RadioCard } from "./flow-parts";
import { colors, MIN_TOUCH, radius } from "../../lib/theme";
import { estimateTripKm, roundFare, TAXI_CLASSES, TAXI_PLACES } from "../../lib/demo-taxi";
import { formatUAH } from "../../lib/demo-format";

const STEPS = ["Маршрут", "Авто", "Оплата"] as const;
const PAYMENTS = ["Картою", "Готівкою водію"] as const;

/** Taxi: route, car class with a fare estimate, then payment. Demo only; no driver is assigned. */
export function TaxiFlow({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [fromIndex, setFromIndex] = useState<number | null>(null);
  const [toIndex, setToIndex] = useState<number | null>(null);
  const [classId, setClassId] = useState<string>(TAXI_CLASSES[0].id);
  const [paymentIndex, setPaymentIndex] = useState(0);
  const [comment, setComment] = useState("");
  const [picking, setPicking] = useState<"from" | "to">("from");

  const routeReady = fromIndex !== null && toIndex !== null && fromIndex !== toIndex;
  const km = fromIndex !== null && toIndex !== null ? estimateTripKm(fromIndex, toIndex) : 0;
  const pickupMinutes = fromIndex === null ? 0 : 3 + (fromIndex % 4);
  const car = TAXI_CLASSES.find((item) => item.id === classId) ?? TAXI_CLASSES[0];
  const fare = roundFare(car.base + car.perKm * km);
  const from = fromIndex === null ? null : TAXI_PLACES[fromIndex];
  const to = toIndex === null ? null : TAXI_PLACES[toIndex];
  const back = () => (step === 0 ? onExit() : setStep(step - 1));

  if (step >= STEPS.length) {
    return (
      <FlowResultView
        title="Шукаємо водія"
        lines={[`${from?.name} → ${to?.name}`, `${car.label} · оцінка ${formatUAH(fare)} · подача приблизно ${pickupMinutes} хв`]}
        notice="Водій не призначений: це демонстрація."
        onExit={onExit}
      />
    );
  }

  const primaryDisabled = (step === 0 && !routeReady);
  const hint = step === 0 && fromIndex !== null && fromIndex === toIndex ? "Початок і кінець мають відрізнятися." : step === 0 && !routeReady ? "Оберіть звідки і куди." : null;

  return (
    <View style={styles.flow}>
      <FlowHeader backLabel={step === 0 ? "Сервіси" : "Назад"} onBack={back} step={step} total={STEPS.length} title="Таксі" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {step === 0 && (
          <>
            <View style={styles.routeBox}>
              <Pressable accessibilityRole="button" onPress={() => setPicking("from")} style={[styles.routeRow, picking === "from" && styles.routeRowActive]}>
                <View style={styles.dotFrom} />
                <View style={styles.routeCopy}>
                  <Text style={flowText.caption}>Звідки</Text>
                  <Text style={styles.routeName}>{from?.name ?? "Оберіть місце"}</Text>
                </View>
              </Pressable>
              <View style={styles.routeLine} />
              <Pressable accessibilityRole="button" onPress={() => setPicking("to")} style={[styles.routeRow, picking === "to" && styles.routeRowActive]}>
                <MaterialIcons name="place" size={16} color={colors.primary} />
                <View style={styles.routeCopy}>
                  <Text style={flowText.caption}>Куди</Text>
                  <Text style={styles.routeName}>{to?.name ?? "Оберіть місце"}</Text>
                </View>
              </Pressable>
            </View>

            <Text style={flowText.section}>{picking === "from" ? "Звідки поїдемо?" : "Куди поїдемо?"}</Text>
            {TAXI_PLACES.map((place, index) => {
              const selected = picking === "from" ? fromIndex === index : toIndex === index;
              return (
                <CardRow
                  key={place.id}
                  icon="place"
                  title={place.name}
                  caption={place.address}
                  selected={selected}
                  trailing="check"
                  onPress={() => {
                    if (picking === "from") {
                      setFromIndex(index);
                      setPicking("to");
                    } else {
                      setToIndex(index);
                    }
                  }}
                />
              );
            })}
            {routeReady && from && to ? (
              <Text style={flowText.caption}>Близько {km.toFixed(1).replace(".", ",")} км (оцінка)</Text>
            ) : null}
          </>
        )}

        {step === 1 && (
          <>
            <Text style={flowText.heading}>Оберіть клас</Text>
            {TAXI_CLASSES.map((item) => {
              const itemFare = roundFare(item.base + item.perKm * km);
              return (
                <CardRow
                  key={item.id}
                  icon={item.icon as keyof typeof MaterialIcons.glyphMap}
                  title={item.label}
                  caption={`Оцінка ${formatUAH(itemFare)} · подача ${pickupMinutes} хв`}
                  selected={classId === item.id}
                  trailing="check"
                  onPress={() => setClassId(item.id)}
                />
              );
            })}
            <Text style={flowText.caption}>Оцінка може змінитися після підтвердження маршруту.</Text>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={flowText.heading}>Оплата</Text>
            {PAYMENTS.map((option, index) => (
              <RadioCard key={option} title={option} selected={paymentIndex === index} onPress={() => setPaymentIndex(index)} />
            ))}
            <FlowInput label="Коментар водієві (необов’язково)" value={comment} onChangeText={setComment} placeholder="Наприклад, біля входу" />
            <View style={styles.summary}>
              <Text style={flowText.caption}>{car.label} · {from?.name} → {to?.name}</Text>
              <Text style={styles.total}>Оцінка {formatUAH(fare)}</Text>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {hint ? <Text style={flowText.caption}>{hint}</Text> : null}
        <PrimaryButton
          label={step === 0 ? "Далі" : step === 1 ? "Обрати авто" : "Замовити таксі"}
          onPress={() => {
            if (primaryDisabled) return;
            setStep(step + 1);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flow: { flex: 1, gap: 10 },
  scroll: { gap: 10, paddingBottom: 16 },
  routeBox: { padding: 12, gap: 4, borderRadius: radius.xl, borderCurve: "continuous", backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  routeRow: { minHeight: MIN_TOUCH, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 8, borderRadius: radius.lg },
  routeRowActive: { backgroundColor: colors.accent },
  dotFrom: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.foreground, marginHorizontal: 3 },
  routeLine: { width: 2, height: 10, backgroundColor: colors.border, marginLeft: 18 },
  routeCopy: { flex: 1, gap: 1 },
  routeName: { fontFamily: "Manrope_700Bold", fontSize: 16, color: colors.foreground },
  summary: { gap: 6, padding: 14, borderRadius: radius.xl, backgroundColor: colors.surfaceMuted },
  total: { fontFamily: "Manrope_800ExtraBold", fontSize: 20, letterSpacing: -0.3, color: colors.foreground },
  footer: { gap: 8 },
});
