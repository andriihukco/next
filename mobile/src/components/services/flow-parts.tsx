import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fonts, MIN_TOUCH, radius } from "../../lib/theme";
import { DemoNotice } from "./demo-notice";
import { PrimaryButton } from "../primary-button";

/** Back link and step label at the top of every service flow. */
export function FlowHeader({ backLabel, onBack, step, total, title }: { backLabel: string; onBack: () => void; step: number; total: number; title: string }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
        <MaterialIcons name="chevron-left" size={26} color={colors.primary} />
        <Text style={styles.backText}>{backLabel}</Text>
      </Pressable>
      <Text style={styles.stepText}>{title} · крок {step + 1} з {total}</Text>
    </View>
  );
}

export function Chips({ items, selected, onSelect }: { items: readonly string[]; selected: number | null; onSelect: (index: number) => void }) {
  return (
    <View style={styles.chips}>
      {items.map((label, index) => {
        const active = selected === index;
        return (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(index)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Labelled text field with a 44 pt height. */
export function FlowInput({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput placeholderTextColor={colors.mutedForeground} style={styles.input} {...props} />
    </View>
  );
}

/** − count + stepper. Each button is a 44 pt zone. */
export function QuantityStepper({
  label,
  value,
  onChange,
  min = 0,
  max = Infinity,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}) {
  const canDecrease = value > min;
  const canIncrease = value < max;
  return (
    <View style={styles.stepper} accessibilityLabel={`${label}, ${value}`}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Менше: ${label}`} disabled={!canDecrease} onPress={() => onChange(value - 1)} style={styles.stepBtn}>
        <MaterialIcons name="remove" size={20} color={canDecrease ? colors.foreground : colors.border} />
      </Pressable>
      <Text style={styles.count}>{value}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Більше: ${label}`} disabled={!canIncrease} onPress={() => onChange(value + 1)} style={styles.stepBtn}>
        <MaterialIcons name="add" size={20} color={canIncrease ? colors.primary : colors.border} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4 },
  back: { flexDirection: "row", alignItems: "center", minHeight: MIN_TOUCH, marginLeft: -8 },
  backText: { fontFamily: fonts.bold, fontSize: 17, color: colors.primary },
  stepText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.mutedForeground },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: MIN_TOUCH, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, justifyContent: "center" },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.primaryBorder },
  chipText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.foreground },
  chipTextActive: { color: colors.accentForeground, fontFamily: fonts.extrabold },
  stepper: { flexDirection: "row", alignItems: "center", borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  stepBtn: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: "center", justifyContent: "center" },
  field: { gap: 6 },
  fieldLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.mutedForeground },
  input: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.foreground,
  },
  chipDisabled: { opacity: 0.4 },
  chipTextDisabled: { textDecorationLine: "line-through" },
  count: { minWidth: 28, textAlign: "center", fontFamily: fonts.bold, fontSize: 16, color: colors.foreground },
});

/** Typography for flow content, matching the shop flow. */
export const flowText = StyleSheet.create({
  heading: { fontFamily: fonts.extrabold, fontSize: 22, letterSpacing: -0.4, color: colors.foreground },
  section: { fontFamily: fonts.extrabold, fontSize: 17, letterSpacing: -0.2, color: colors.foreground, marginTop: 8 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.mutedForeground },
});

/** Tappable card row with an icon, a title and a caption. Used for every choice list. */
export function CardRow({
  icon,
  iconColor = colors.primary,
  title,
  caption,
  selected = false,
  onPress,
  trailing,
}: {
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  title: string;
  caption?: string;
  selected?: boolean;
  onPress: () => void;
  trailing?: "check" | "chevron";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [cardStyles.card, selected && cardStyles.cardSelected, pressed && cardStyles.pressed]}
    >
      {icon ? (
        <View style={[cardStyles.icon, { backgroundColor: selected ? colors.primary : colors.accent }]}>
          <MaterialIcons name={icon} size={22} color={selected ? "#ffffff" : iconColor} />
        </View>
      ) : null}
      <View style={cardStyles.copy}>
        <Text style={cardStyles.title} numberOfLines={2}>{title}</Text>
        {caption ? <Text style={flowText.caption} numberOfLines={2}>{caption}</Text> : null}
      </View>
      {trailing === "check" && selected ? <MaterialIcons name="check-circle" size={22} color={colors.primary} /> : null}
      {trailing === "chevron" ? <MaterialIcons name="chevron-right" size={22} color={colors.mutedForeground} /> : null}
    </Pressable>
  );
}

/** Round-radio card for single choices such as time or payment. */
export function RadioCard({ title, caption, selected, onPress }: { title: string; caption?: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [cardStyles.card, selected && cardStyles.cardSelected, pressed && cardStyles.pressed]}
    >
      <View style={[cardStyles.radio, selected && cardStyles.radioActive]}>
        {selected ? <View style={cardStyles.radioDot} /> : null}
      </View>
      <View style={cardStyles.copy}>
        <Text style={cardStyles.title}>{title}</Text>
        {caption ? <Text style={flowText.caption}>{caption}</Text> : null}
      </View>
    </Pressable>
  );
}

/** Pill chips in a wrapping row. Used for small single choices. */
export function ChipRow<T extends string | number>({
  items,
  selected,
  onSelect,
  disabledIndex,
}: {
  items: { key: T; label: string; disabled?: boolean }[];
  selected: T | null;
  onSelect: (key: T) => void;
  disabledIndex?: (key: T) => boolean;
}) {
  return (
    <View style={styles.chips}>
      {items.map((item) => {
        const active = selected === item.key;
        const disabled = item.disabled ?? disabledIndex?.(item.key) ?? false;
        return (
          <Pressable
            key={String(item.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled }}
            disabled={disabled}
            onPress={() => onSelect(item.key)}
            style={[styles.chip, active && styles.chipActive, disabled && styles.chipDisabled]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive, disabled && styles.chipTextDisabled]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Success screen shared by every flow. */
export function FlowResultView({ title, lines, onExit, notice }: { title: string; lines: string[]; onExit: () => void; notice: string }) {
  return (
    <View style={resultStyles.wrap}>
      <View style={resultStyles.icon}>
        <MaterialIcons name="check" size={36} color="#ffffff" />
      </View>
      <Text style={resultStyles.title} accessibilityRole="header">{title}</Text>
      {lines.map((line) => (
        <Text key={line} style={resultStyles.line}>{line}</Text>
      ))}
      <DemoNotice text={notice} />
      <PrimaryButton label="До сервісів" onPress={onExit} />
    </View>
  );
}


const cardStyles = StyleSheet.create({
  card: {
    minHeight: MIN_TOUCH + 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardSelected: { borderColor: colors.primary, borderWidth: 1.5 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  icon: { width: 44, height: 44, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 21, letterSpacing: -0.2, color: colors.foreground },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
});

const resultStyles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 12, paddingVertical: 16 },
  icon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.extrabold, fontSize: 22, letterSpacing: -0.4, color: colors.foreground },
  line: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22, color: colors.foreground, textAlign: "center" },
});
