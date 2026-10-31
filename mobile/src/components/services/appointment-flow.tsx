import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../primary-button";
import { CardRow, ChipRow, FlowHeader, FlowInput, FlowResultView, flowText } from "./flow-parts";
import { colors, radius } from "../../lib/theme";
import { DOCTORS, SPECIALTIES } from "../../lib/demo-care";
import { formatDay, isDemoSlotFree, nextDays, TIME_SLOTS } from "../../lib/demo-booking";
import { materialIconFor } from "../../lib/category-icons";

const STEPS = ["Спеціальність", "Лікар", "Час", "Пацієнт"] as const;
const PHONE_DIGITS = 9;

/** Doctor appointment: specialty, doctor, slot, patient. Busy slots stay visible, struck through. Demo only. */
export function AppointmentFlow({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [specialtyId, setSpecialtyId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [patient, setPatient] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [reference] = useState(() => String(10000 + Math.floor(Math.random() * 90000)));

  const days = useMemo(() => nextDays(5), []);
  const specialty = SPECIALTIES.find((item) => item.id === specialtyId) ?? null;
  const doctors = DOCTORS.filter((item) => item.specialtyId === specialtyId);
  const doctor = DOCTORS.find((item) => item.id === doctorId) ?? null;
  const doctorIndex = doctor ? DOCTORS.indexOf(doctor) : 0;
  const patientMissing = patient.trim().length < 2 || phone.replace(/\D/g, "").length < PHONE_DIGITS;
  const dayLabel = dayIndex === null ? "" : formatDay(days[dayIndex]);
  const back = () => (step === 0 ? onExit() : setStep(step - 1));

  if (step >= STEPS.length) {
    return (
      <FlowResultView
        title="Запис створено"
        lines={[`${doctor?.name} · ${specialty?.label.toLowerCase()}`, `${dayLabel}, ${slot} · ${doctor?.clinic}`, `Запис №${reference}. Клініка підтверджує візит телефоном.`]}
        notice="Демо: запис нікуди не надіслано."
        onExit={onExit}
      />
    );
  }

  const primary =
    step === 0 ? null
    : step === 1 ? { label: "Далі", disabled: doctorId === null, hint: "Оберіть лікаря." }
    : step === 2 ? { label: "Далі", disabled: dayIndex === null || slot === null, hint: "Оберіть день і час." }
    : { label: "Записатися", disabled: patientMissing, hint: "Вкажіть імʼя і телефон пацієнта." };

  return (
    <View style={styles.flow}>
      <FlowHeader backLabel={step === 0 ? "Сервіси" : "Назад"} onBack={back} step={step} total={STEPS.length} title="Запис до лікаря" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {step === 0 && (
          <>
            <Text style={flowText.heading}>Яка потрібна спеціальність?</Text>
            {SPECIALTIES.map((item) => (
              <CardRow
                key={item.id}
                icon={materialIconFor(item.icon)}
                title={item.label}
                selected={specialtyId === item.id}
                trailing="chevron"
                onPress={() => {
                  setSpecialtyId(item.id);
                  setDoctorId(null);
                  setSlot(null);
                  setStep(1);
                }}
              />
            ))}
          </>
        )}

        {step === 1 && (
          <>
            <Text style={flowText.heading}>{specialty?.label}</Text>
            {doctors.map((item) => (
              <CardRow
                key={item.id}
                icon="person"
                title={item.name}
                caption={item.clinic}
                selected={doctorId === item.id}
                trailing="check"
                onPress={() => {
                  setDoctorId(item.id);
                  setDayIndex(null);
                  setSlot(null);
                }}
              />
            ))}
          </>
        )}

        {step === 2 && doctor && (
          <>
            <Text style={flowText.section}>День</Text>
            <ChipRow items={days.map((day, index) => ({ key: index, label: formatDay(day) }))} selected={dayIndex} onSelect={(index) => { setDayIndex(index); setSlot(null); }} />
            <Text style={flowText.section}>Вільний час</Text>
            {dayIndex === null ? (
              <Text style={flowText.caption}>Спершу оберіть день.</Text>
            ) : (
              <ChipRow
                items={TIME_SLOTS.map((time, index) => ({ key: time, label: time, disabled: !isDemoSlotFree(doctorIndex * 31 + dayIndex * 7 + index) }))}
                selected={slot}
                onSelect={setSlot}
              />
            )}
            <Text style={flowText.caption}>Закреслені години зайняті.</Text>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={flowText.heading}>Пацієнт</Text>
            <FlowInput label="Імʼя та прізвище" value={patient} onChangeText={setPatient} autoComplete="name" />
            <FlowInput label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="+380" />
            <FlowInput label="Причина візиту (необов’язково)" value={reason} onChangeText={setReason} placeholder="Наприклад, профілактика" />
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
  footer: { gap: 8 },
});
