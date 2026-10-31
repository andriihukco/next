import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fonts, MIN_TOUCH, radius } from "../../lib/theme";

/** Section heading in the iOS grouped style: small, uppercase, muted. */
export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

/** One row of a grouped list: a tinted icon, a title and a subtitle, and an optional trailing control. */
export function SettingsRow({
  icon,
  title,
  subtitle,
  trailing,
  onPress,
  disabled = false,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const content = (
    <>
      <View style={[styles.icon, disabled && styles.iconDisabled]}>
        <MaterialIcons name={icon} size={20} color={disabled ? colors.mutedForeground : colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, disabled && styles.textDisabled]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing}
      {onPress && !trailing ? <MaterialIcons name="chevron-right" size={22} color={colors.mutedForeground} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 13, letterSpacing: -0.1, color: colors.mutedForeground, textTransform: "uppercase", paddingLeft: 16 },
  group: { borderRadius: radius.xl, borderCurve: "continuous", backgroundColor: colors.card, overflow: "hidden" },
  row: { minHeight: MIN_TOUCH + 12, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 8 },
  pressed: { backgroundColor: colors.surfaceMuted },
  icon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  iconDisabled: { backgroundColor: colors.surfaceMuted },
  copy: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bold, fontSize: 16, letterSpacing: -0.2, color: colors.foreground },
  textDisabled: { color: colors.mutedForeground },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.mutedForeground },
});
