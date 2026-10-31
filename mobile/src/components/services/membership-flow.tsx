import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../primary-button";
import { CardRow, ChipRow, FlowHeader, FlowInput, FlowResultView, flowText, RadioCard } from "./flow-parts";
import { colors, radius } from "../../lib/theme";
import { formatUAH } from "../../lib/demo-format";
import { GYMS, GYM_PLANS } from "../../lib/demo-care";
import { formatDay, nextDays } from "../../lib/demo-booking";

const STEPS = ["Зал", "План", "Початок", "Контакти"] as const;
const PHONE_DIGITS = 9;

/** Gym membership: gym, plan with its monthly price, start day, contact. Demo only. */
export function MembershipFlow({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [gymId, setGymId] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [startIndex, setStartIndex] = useState<number | null>(null);
  const [trial, setTrial] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reference] = useState(() => String(1000 + Math.floor(Math.random() * 9000)));

  const days = useMemo(() => nextDays(7), []);
  const gym = GYMS.find((item) => item.id === gymId) ?? null;
  const plan = GYM_PLANS.find((item) => item.id === planId) ?? null;
  const startLabel = startIndex === null ? "" : formatDay(days[startIndex]);
  const contactMissing = name.trim().length < 2 || phone.replace(/\D/g, "").length < PHONE_DIGITS;
  const back = () => (step === 0 ? onExit() : setStep(step - 1));

  if (step >= STEPS.length) {
    return (
      <FlowResultView
        title="Заявку створено"
        lines={[`${gym?.name} · ${plan?.label.toLowerCase()} · ${formatUAH(plan?.price ?? 0)}`, `Початок: ${trial ? "пробне заняття" : "абонемент"}, ${startLabel}`, `Заявка №${reference}. Зал зв’яжеться з вами для оплати.`]}
        notice="Демо: заявку нікуди не надіслано."
        onExit={onExit}
      />
    );
  }

  const primary =
    step === 0 ? null
    : step === 1 ? { label: "Далі", disabled: planId === null, hint: "Оберіть тривалість." }
    : step === 2 ? { label: "Далі", disabled: startIndex === null, hint: "Оберіть день початку." }
    : { label: "Оформити заявку", disabled: contactMissing, hint: "Вкажіть імʼя і телефон, щоб оформити заявку." };

  return (
    <View style={styles.flow}>
      <FlowHeader backLabel={step === 0 ? "Сервіси" : "Назад"} onBack={back} step={step} total={STEPS.length} title="Абонемент у зал" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {step === 0 && (
          <>
            <Text style={flowText.heading}>Оберіть зал</Text>
            {GYMS.map((item) => (
              <CardRow
                key={item.id}
                icon="fitness-center"
                title={item.name}
                caption={`${item.address} · ${item.hours}${item.trial ? " · є пробне заняття" : ""}`}
                selected={gymId === item.id}
                trailing="chevron"
                onPress={() => {
                  setGymId(item.id);
                  setTrial(false);
                  setStep(1);
                }}
              />
            ))}
          </>
        )}

        {step === 1 && (
          <>
            <Text style={flowText.heading}>Тривалість</Text>
            {GYM_PLANS.map((item) => (
              <CardRow
                key={item.id}
                icon="calendar-month"
                title={item.label}
                caption={`${formatUAH(item.price)} · ${formatUAH(Math.round(item.price / item.months))} на місяць`}
                selected={planId === item.id}
                trailing="check"
                onPress={() => setPlanId(item.id)}
              />
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <Text style={flowText.heading}>Коли почнете?</Text>
            <ChipRow items={days.map((day, index) => ({ key: index, label: formatDay(day) }))} selected={startIndex} onSelect={setStartIndex} />
            {gym?.trial ? (
              <>
                <Text style={flowText.section}>Пробне заняття</Text>
                <RadioCard title="Спершу пробне заняття" caption="Безкоштовно в цьому залі (демо)" selected={trial} onPress={() => setTrial(!trial)} />
              </>
            ) : null}
          </>
        )}

        {step === 3 && (
          <>
            <Text style={flowText.heading}>Контакти</Text>
            <FlowInput label="Імʼя" value={name} onChangeText={setName} autoComplete="name" />
            <FlowInput label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="+380" />
            {plan ? (
              <View style={styles.summary}>
                <Text style={flowText.caption}>{gym?.name}</Text>
                <Text style={styles.total}>{plan.label} · {formatUAH(plan.price)}</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {primary ? (
        <View style={styles.footer}>
          {primary.disabled ? <Text style={flowText.caption}>{primary.hint}</Text> : null}
          <PrimaryButton label={primary.label} onPress={() => { if (!primary.disabled) setStep(step + 1); }} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flow: { flex: 1, gap: 10 },
  scroll: { gap: 10, paddingBottom: 16 },
  summary: { gap: 6, padding: 14, borderRadius: radius.xl, backgroundColor: colors.surfaceMuted },
  total: { fontFamily: "Manrope_800ExtraBold", fontSize: 18, letterSpacing: -0.3, color: colors.foreground },
  footer: { gap: 8 },
});
