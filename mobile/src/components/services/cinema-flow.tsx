import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { PrimaryButton } from "../primary-button";
import { CardRow, ChipRow, FlowHeader, FlowResultView, flowText, RadioCard } from "./flow-parts";
import { colors, fonts, MIN_TOUCH, radius } from "../../lib/theme";
import { formatUAH } from "../../lib/demo-format";
import { FILMS, formatDay, isSeatTaken, MAX_SEATS, nextDays, SEAT_ROWS, SEATS_PER_ROW, SESSION_TEMPLATES } from "../../lib/demo-booking";

const STEPS = ["Фільм", "Сеанс", "Місця", "Оплата"] as const;
const DISCOUNT = 0.5;

/** Cinema tickets: film, session, seats, checkout. Demo only; no ticket is sold. */
export function CinemaFlow({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [filmId, setFilmId] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [seats, setSeats] = useState<string[]>([]);
  const [discount, setDiscount] = useState(false);
  const [paymentIndex, setPaymentIndex] = useState(0);
  const [ticketNumber] = useState(() => String(100000 + Math.floor(Math.random() * 900000)));

  const days = useMemo(() => nextDays(3), []);
  const film = FILMS.find((item) => item.id === filmId) ?? null;
  const filmIndex = film ? FILMS.indexOf(film) : 0;
  const session = SESSION_TEMPLATES.find((item) => item.id === sessionId) ?? null;
  const unitPrice = session ? (discount ? session.price * DISCOUNT : session.price) : 0;
  const total = unitPrice * seats.length;
  const back = () => (step === 0 ? onExit() : setStep(step - 1));

  const toggleSeat = (seat: string) => {
    setSeats((current) => {
      if (current.includes(seat)) return current.filter((item) => item !== seat);
      if (current.length >= MAX_SEATS) return current;
      return [...current, seat];
    });
  };

  if (step >= STEPS.length) {
    return (
      <FlowResultView
        title="Квитки куплено"
        lines={[
          `${film?.title} · ${formatDay(days[dayIndex])}, ${session?.time} · ${session?.format}`,
          `Місця: ${[...seats].sort().join(", ")}`,
          `Квиток №${ticketNumber} · разом ${formatUAH(total)}`,
        ]}
        notice="Демо: квиток не продано. QR-код з’явиться після оплати в реальному застосунку."
        onExit={onExit}
      />
    );
  }

  const primary =
    step === 0 ? { label: "Далі", disabled: filmId === null }
    : step === 1 ? { label: "Далі", disabled: sessionId === null }
    : step === 2 ? { label: "Далі", disabled: seats.length === 0 }
    : { label: "Купити квитки", disabled: false };

  return (
    <View style={styles.flow}>
      <FlowHeader backLabel={step === 0 ? "Сервіси" : "Назад"} onBack={back} step={step} total={STEPS.length} title="Квитки в кіно" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {step === 0 && (
          <>
            <Text style={flowText.heading}>Сьогодні в кіно</Text>
            {FILMS.map((item) => (
              <CardRow
                key={item.id}
                icon="movie"
                title={item.title}
                caption={`${item.meta}\n${item.description}`}
                selected={filmId === item.id}
                trailing="chevron"
                onPress={() => {
                  setFilmId(item.id);
                  setSessionId(null);
                  setSeats([]);
                  setStep(1);
                }}
              />
            ))}
          </>
        )}

        {step === 1 && film && (
          <>
            <Text style={flowText.heading}>{film.title}</Text>
            <ChipRow items={days.map((day, index) => ({ key: index, label: formatDay(day) }))} selected={dayIndex} onSelect={(index) => { setDayIndex(index); setSessionId(null); setSeats([]); }} />
            {SESSION_TEMPLATES.map((item) => (
              <CardRow
                key={`${item.id}-${dayIndex}`}
                icon="schedule"
                title={`${item.time} · ${item.format}`}
                caption={`Кінотеатр «Демо» · ${formatUAH(item.price)}`}
                selected={sessionId === item.id}
                trailing="chevron"
                onPress={() => {
                  setSessionId(item.id);
                  setSeats([]);
                  setStep(2);
                }}
              />
            ))}
            <Text style={flowText.caption}>Ціна орієнтовна, вказана для демо.</Text>
          </>
        )}

        {step === 2 && film && (
          <>
            <Text style={flowText.heading}>Оберіть місця</Text>
            <Text style={flowText.caption}>До {MAX_SEATS}. Зайняті місця закреслені.</Text>
            <View style={styles.hall}>
              <View style={styles.screenBar}>
                <Text style={styles.screenText}>Екран</Text>
              </View>
              {SEAT_ROWS.map((row, rowIndex) => (
                <View key={row} style={styles.seatRow}>
                  <Text style={styles.rowLabel}>{row}</Text>
                  {Array.from({ length: SEATS_PER_ROW }, (_, colIndex) => {
                    const seat = `${row}${colIndex + 1}`;
                    const taken = isSeatTaken(rowIndex, colIndex, dayIndex, filmIndex);
                    const selected = seats.includes(seat);
                    return (
                      <Pressable
                        key={seat}
                        accessibilityRole="button"
                        accessibilityLabel={`Ряд ${row}, місце ${colIndex + 1}, ${taken ? "зайняте" : selected ? "обране" : "вільне"}`}
                        accessibilityState={{ selected, disabled: taken }}
                        disabled={taken}
                        onPress={() => toggleSeat(seat)}
                        style={[styles.seat, selected && styles.seatSelected, taken && styles.seatTaken]}
                      >
                        {taken ? (
                          <MaterialIcons name="close" size={14} color={colors.mutedForeground} />
                        ) : (
                          <Text style={[styles.seatText, selected && styles.seatTextSelected]}>{colIndex + 1}</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
            <Text style={flowText.caption}>Обрано: {seats.length} з {MAX_SEATS}</Text>
          </>
        )}

        {step === 3 && session && (
          <>
            <Text style={flowText.heading}>Квитки</Text>
            <RadioCard title={`Звичайний · ${formatUAH(session.price)}`} selected={!discount} onPress={() => setDiscount(false)} />
            <RadioCard title={`Пільговий −50%`} selected={discount} onPress={() => setDiscount(true)} />
            <Text style={flowText.section}>Оплата</Text>
            <RadioCard title="Картою онлайн" selected={paymentIndex === 0} onPress={() => setPaymentIndex(0)} />
            <RadioCard title="Готівкою в касі" selected={paymentIndex === 1} onPress={() => setPaymentIndex(1)} />
            <View style={styles.summary}>
              <Text style={flowText.caption}>{seats.length} × {formatUAH(unitPrice)} · {[...seats].sort().join(", ")}</Text>
              <Text style={styles.total}>Разом {formatUAH(total)}</Text>
            </View>
          </>
        )}
      </ScrollView>

      {step === 0 ? null : (
        <View style={styles.footer}>
          {primary.disabled ? <Text style={flowText.caption}>{step === 2 ? "Оберіть хоча б одне місце." : "Оберіть варіант, щоб продовжити."}</Text> : null}
          <PrimaryButton label={primary.label} onPress={() => { if (!primary.disabled) setStep(step + 1); }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flow: { flex: 1, gap: 10 },
  scroll: { gap: 10, paddingBottom: 16 },
  hall: { gap: 6, padding: 12, borderRadius: radius.xl, borderCurve: "continuous", backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  screenBar: { alignSelf: "center", width: "70%", paddingVertical: 4, borderBottomWidth: 3, borderBottomColor: colors.border, alignItems: "center", marginBottom: 6 },
  screenText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.mutedForeground },
  seatRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowLabel: { width: 18, fontFamily: fonts.bold, fontSize: 13, color: colors.mutedForeground, textAlign: "center" },
  seat: { width: MIN_TOUCH - 6, height: MIN_TOUCH - 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" },
  seatSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  seatTaken: { backgroundColor: colors.surfaceMuted, opacity: 0.6 },
  seatText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.foreground },
  seatTextSelected: { color: "#ffffff" },
  summary: { gap: 6, padding: 14, borderRadius: radius.xl, backgroundColor: colors.surfaceMuted },
  total: { fontFamily: fonts.extrabold, fontSize: 20, letterSpacing: -0.3, color: colors.foreground },
  footer: { gap: 8 },
});
