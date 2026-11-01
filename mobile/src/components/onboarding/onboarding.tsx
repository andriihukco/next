import { useEffect, useState } from "react";
import { Modal, Pressable, Text, useWindowDimensions, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, fonts, MIN_TOUCH, radius, themed } from "../../lib/theme";

/** Same key as the web (src/features/onboarding/storage.ts), so the meaning stays one. */
export const ONBOARDING_COMPLETE_KEY = "un-onboarding-complete";

/** What the spotlight needs from a native view. */
type Measurable = { measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void };

// Tour targets register their native view here; the spotlight measures them on each step.
const targets = new Map<string, Measurable>();

/** Ref for a tour target, like the web's `data-tour` attribute. */
export function tourTarget(id: string) {
  return (node: Measurable | null): void => {
    if (node) targets.set(id, node);
    else targets.delete(id);
  };
}

// The web steps (src/features/onboarding/steps.ts) for what exists on mobile. The web's
// «Плануйте наперед» step points at events, which the app does not have yet.
const STEPS: {
  target: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  body: string;
}[] = [
  {
    target: "city-sections",
    icon: "explore",
    title: "Місто в одному місці",
    body: "Перемикайтеся між транспортом, місцями, освітою та міськими послугами.",
  },
  {
    target: "map-controls",
    icon: "3d-rotation",
    title: "Керуйте мапою",
    body: "Змінюйте тип мапи, нахиляйте й обертайте її в камері. Компас повертає карту на північ.",
  },
  {
    target: "map-location",
    icon: "my-location",
    title: "Ваше місце — за бажанням",
    body: "Знайдіть себе на мапі, щоб швидше зорієнтуватися. Доступ до геолокації можна не надавати.",
  },
];

const WELCOME_FEATURES = [
  {
    id: "transport",
    icon: "directions-transit",
    label: "Транспорт",
    detail: "Трамваї, тролейбуси й автобуси на мапі за живими GPS-даними. Час прибуття — оцінка за відстанню.",
  },
  { id: "places", icon: "explore", label: "Місця", detail: "Кав’ярні, парки, музеї та інші місця поруч." },
  {
    id: "events",
    icon: "event",
    label: "Події",
    detail: "Афіша з датою, місцем і дорогою туди. З’явиться, коли підключимо перевірене джерело подій.",
  },
] as const;

type Rect = { x: number; y: number; width: number; height: number };
const SPOT_PAD = 6;

/** First-run onboarding, as on the web (DESIGN.md §10): a welcome card, then a spotlight tour. */
export function Onboarding({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const [phase, setPhase] = useState<"welcome" | number>("welcome");
  const [feature, setFeature] = useState<(typeof WELCOME_FEATURES)[number]["id"]>("transport");
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (visible) setPhase("welcome");
  }, [visible]);

  // Measure the step's target. A missing target keeps the card centered without a spotlight.
  useEffect(() => {
    setRect(null);
    if (typeof phase !== "number") return;
    const node = targets.get(STEPS[phase].target);
    node?.measureInWindow((x, y, w, h) => {
      if (w > 0 && h > 0) setRect({ x: x - SPOT_PAD, y: y - SPOT_PAD, width: w + SPOT_PAD * 2, height: h + SPOT_PAD * 2 });
    });
  }, [phase]);

  const finish = (): void => {
    void AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "1");
    onDone();
  };

  const selected = WELCOME_FEATURES.find((item) => item.id === feature) ?? WELCOME_FEATURES[0];
  const step = typeof phase === "number" ? STEPS[phase] : null;
  // Keep the card away from the spotlight: above it when the target is low on the screen.
  const cardOnTop = rect !== null && rect.y + rect.height / 2 > height / 2;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={finish}>
      {step && rect ? (
        <>
          <View style={[styles.scrim, { left: 0, top: 0, width, height: Math.max(rect.y, 0) }]} />
          <View style={[styles.scrim, { left: 0, top: rect.y + rect.height, width, bottom: 0 }]} />
          <View style={[styles.scrim, { left: 0, top: rect.y, width: Math.max(rect.x, 0), height: rect.height }]} />
          <View style={[styles.scrim, { left: rect.x + rect.width, top: rect.y, right: 0, height: rect.height }]} />
          <View pointerEvents="none" style={[styles.spot, { left: rect.x, top: rect.y, width: rect.width, height: rect.height }]} />
        </>
      ) : (
        <View style={[styles.scrim, styles.fill]} />
      )}

      <View
        style={[styles.cardWrap, step ? (cardOnTop ? styles.cardTop : styles.cardBottom) : styles.cardCenter]}
        pointerEvents="box-none"
      >
        <View style={styles.card} accessibilityViewIsModal>
          {step === null ? (
            <>
              <Text style={styles.wordmark} accessibilityRole="header">next</Text>
              <Text style={styles.tagline}>Місто ближче</Text>
              <View style={styles.pills} accessibilityRole="tablist">
                {WELCOME_FEATURES.map((item) => {
                  const active = item.id === feature;
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      onPress={() => setFeature(item.id)}
                      style={[styles.pill, active && styles.pillActive]}
                    >
                      <MaterialIcons name={item.icon} size={18} color={active ? colors.accentForeground : colors.foreground} />
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.body}>{selected.detail}</Text>
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" onPress={finish} style={styles.ghost}>
                  <Text style={styles.ghostText}>Не зараз</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => setPhase(0)} style={styles.primary}>
                  <Text style={styles.primaryText}>Почати тур</Text>
                  <MaterialIcons name="arrow-forward" size={18} color={colors.onPrimary} />
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={styles.stepHead}>
                <View style={styles.stepIcon}>
                  <MaterialIcons name={step.icon} size={22} color={colors.accentForeground} />
                </View>
                <Text style={styles.progress}>
                  {(phase as number) + 1} з {STEPS.length}
                </Text>
              </View>
              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.body}>{step.body}</Text>
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" onPress={finish} style={styles.ghost}>
                  <Text style={styles.ghostText}>Пропустити</Text>
                </Pressable>
                {(phase as number) > 0 && (
                  <Pressable accessibilityRole="button" onPress={() => setPhase((phase as number) - 1)} style={styles.ghost}>
                    <Text style={styles.ghostText}>Назад</Text>
                  </Pressable>
                )}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => ((phase as number) + 1 < STEPS.length ? setPhase((phase as number) + 1) : finish())}
                  style={styles.primary}
                >
                  <Text style={styles.primaryText}>{(phase as number) + 1 < STEPS.length ? "Далі" : "Готово"}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = themed(() => ({
  scrim: { position: "absolute", backgroundColor: colors.scrim },
  fill: { left: 0, top: 0, right: 0, bottom: 0 },
  spot: { position: "absolute", borderRadius: radius.md, borderWidth: 2, borderColor: colors.primaryBorder },
  cardWrap: { position: "absolute", left: 16, right: 16 },
  cardCenter: { top: 0, bottom: 0, justifyContent: "center" },
  cardTop: { top: 64 },
  cardBottom: { bottom: 40 },
  card: {
    gap: 12,
    padding: 20,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  wordmark: { fontFamily: fonts.extrabold, fontSize: 40, letterSpacing: -1.2, color: colors.foreground },
  tagline: { fontFamily: fonts.bold, fontSize: 22, letterSpacing: -0.4, color: colors.foreground, marginTop: -8 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.accent, borderColor: colors.primaryBorder },
  pillText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.foreground },
  pillTextActive: { fontFamily: fonts.bold, color: colors.accentForeground },
  stepHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  progress: { fontFamily: fonts.semibold, fontSize: 12, color: colors.mutedForeground },
  title: { fontFamily: fonts.bold, fontSize: 20, letterSpacing: -0.3, color: colors.foreground },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.mutedForeground },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8, marginTop: 4 },
  ghost: { minHeight: MIN_TOUCH, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  ghostText: { fontFamily: fonts.bold, fontSize: 15, color: colors.foreground },
  primary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: MIN_TOUCH,
    paddingHorizontal: 18,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  primaryText: { fontFamily: fonts.bold, fontSize: 15, color: colors.onPrimary },
}));
