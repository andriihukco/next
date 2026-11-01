import type { ReactNode } from "react";
import { Pressable, StyleSheet, Switch, View, type StyleProp, type ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { colors, themed } from "../lib/theme";
import { iconTileColors, type IconTile } from "../lib/icon-tiles";
import { radiusFor, space, touchMin, useUiPlatform } from "./platform";
import { Txt } from "./text";

export type IconName = keyof typeof MaterialIcons.glyphMap;

// ─── Button ──────────────────────────────────────────────────────────────────────────────────

export type ButtonVariant = "filled" | "tonal" | "outline" | "plain" | "danger";

/**
 * One action. `filled` is the one primary action on a screen; `tonal` and `outline` are secondary;
 * `plain` is a text button. iOS: rounded rectangle and a light haptic. Android: full pill and ripple.
 */
export function Button({
  label,
  icon,
  variant = "filled",
  size = "md",
  onPress,
  disabled = false,
  stretch = false,
  accessibilityHint,
}: {
  label: string;
  icon?: IconName;
  variant?: ButtonVariant;
  size?: "md" | "lg";
  onPress: () => void;
  disabled?: boolean;
  stretch?: boolean;
  accessibilityHint?: string;
}) {
  const platform = useUiPlatform();
  const height = size === "lg" ? 52 : touchMin(platform);
  const shape = { minHeight: height, borderRadius: platform === "ios" ? radiusFor("ios").control + (size === "lg" ? 4 : 0) : radiusFor("android").pill };
  const tint = {
    filled: { bg: colors.primary, fg: "onPrimary" as const, border: colors.primary },
    tonal: { bg: colors.accent, fg: "accent" as const, border: colors.accent },
    outline: { bg: "transparent", fg: "default" as const, border: colors.border },
    plain: { bg: "transparent", fg: "primary" as const, border: "transparent" },
    danger: { bg: "transparent", fg: "danger" as const, border: "transparent" },
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPressIn={() => {
        if (platform === "ios" && variant === "filled") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPress={onPress}
      android_ripple={{ color: colors.border, borderless: false }}
      style={({ pressed }) => [
        styles.button,
        shape,
        { backgroundColor: tint.bg, borderColor: tint.border },
        stretch && styles.stretch,
        variant === "plain" || variant === "danger" ? styles.buttonPlain : null,
        platform === "ios" && pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon ? <MaterialIcons name={icon} size={20} color={toneHex(tint.fg)} /> : null}
      <Txt variant={size === "lg" ? "headline" : "callout"} tone={tint.fg} weight="bold">
        {label}
      </Txt>
    </Pressable>
  );
}

const toneHex = (tone: "onPrimary" | "accent" | "default" | "primary" | "danger"): string =>
  ({
    onPrimary: colors.onPrimary,
    accent: colors.accentForeground,
    default: colors.foreground,
    primary: colors.primary,
    danger: colors.destructive,
  })[tone];

/** Round icon-only button. Always has an accessible label. */
export function IconButton({
  icon,
  label,
  onPress,
  tone = "default",
  filled = true,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  tone?: "default" | "primary";
  filled?: boolean;
}) {
  const platform = useUiPlatform();
  const size = touchMin(platform);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      android_ripple={{ color: colors.border, borderless: true }}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, borderRadius: size / 2 },
        filled && styles.iconButtonFilled,
        platform === "ios" && pressed && styles.pressed,
      ]}
    >
      <MaterialIcons name={icon} size={22} color={tone === "primary" ? colors.primary : colors.foreground} />
    </Pressable>
  );
}

// ─── List row ────────────────────────────────────────────────────────────────────────────────

/**
 * A row in a grouped list. iOS: tinted icon tile, chevron when it navigates, inset separator.
 * Android: plain icon, no chevron (Material lists do not use disclosure arrows), ripple.
 */
export function ListRow({
  icon,
  iconColor,
  iconTile,
  title,
  subtitle,
  value,
  trailing,
  onPress,
  navigates = Boolean(onPress),
  destructive = false,
  disabled = false,
  last = false,
}: {
  icon?: IconName;
  iconColor?: string;
  /** Settings rows: a gradient tile in this color (DESIGN.md §2f). Takes precedence over iconColor. */
  iconTile?: IconTile;
  title: string;
  subtitle?: string;
  value?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  navigates?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  last?: boolean;
}) {
  const platform = useUiPlatform();
  const ios = platform === "ios";
  const content = (
    <>
      {iconTile ? (
        <LinearGradient colors={[...iconTileColors(iconTile)]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.rowIconTile}>
          <MaterialIcons name={icon} size={20} color="#ffffff" />
        </LinearGradient>
      ) : icon ? (
        ios ? (
          <View style={[styles.rowIconTileLegacy, { backgroundColor: iconColor ?? colors.primary }]}>
            <MaterialIcons name={icon} size={18} color="#ffffff" />
          </View>
        ) : (
          <MaterialIcons name={icon} size={24} color={iconColor ?? colors.mutedForeground} style={styles.rowIconAndroid} />
        )
      ) : null}
      <View style={[styles.rowMain, !last && ios && styles.rowSeparator]}>
        <View style={styles.rowCopy}>
          <Txt variant={ios ? "body" : "callout"} tone={destructive ? "danger" : "default"} numberOfLines={2}>
            {title}
          </Txt>
          {subtitle ? (
            <Txt variant={ios ? "footnote" : "subhead"} tone="muted" numberOfLines={2}>
              {subtitle}
            </Txt>
          ) : null}
        </View>
        {value ? (
          <Txt variant={ios ? "body" : "subhead"} tone="muted" numberOfLines={1} style={styles.rowValue}>
            {value}
          </Txt>
        ) : null}
        {trailing}
        {ios && navigates && !trailing ? <MaterialIcons name="chevron-right" size={22} color={colors.border} /> : null}
      </View>
    </>
  );
  const rowStyle = [styles.row, { minHeight: ios ? 44 : 56 }, disabled && styles.disabled];
  if (!onPress) return <View style={rowStyle}>{content}</View>;
  return (
    <Pressable
      accessibilityRole={navigates ? "link" : "button"}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      android_ripple={{ color: colors.border }}
      style={({ pressed }) => [rowStyle, ios && pressed && { backgroundColor: colors.surfaceMuted }]}
    >
      {content}
    </Pressable>
  );
}

/** A row with a switch: the platform switch, tinted with the primary color. */
export function SwitchRow({
  icon,
  iconColor,
  iconTile,
  title,
  subtitle,
  value,
  onValueChange,
  disabled = false,
  last = false,
}: {
  icon?: IconName;
  iconColor?: string;
  iconTile?: IconTile;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  last?: boolean;
}) {
  return (
    <ListRow
      icon={icon}
      iconColor={iconColor}
      iconTile={iconTile}
      title={title}
      subtitle={subtitle}
      disabled={disabled}
      last={last}
      navigates={false}
      trailing={
        <Switch
          accessibilityLabel={title}
          value={value}
          disabled={disabled}
          onValueChange={onValueChange}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      }
    />
  );
}

// ─── Chips and segmented control ─────────────────────────────────────────────────────────────

/** Filter chip. iOS: capsule that fills when selected. Android: Material filter chip with a check. */
export function Chip({
  label,
  selected,
  onPress,
  icon,
  dotColor,
  disabled = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  dotColor?: string;
  disabled?: boolean;
}) {
  const platform = useUiPlatform();
  const ios = platform === "ios";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      android_ripple={{ color: colors.border }}
      style={[
        styles.chip,
        { borderRadius: ios ? radiusFor("ios").pill : 8 },
        selected && styles.chipSelected,
        disabled && styles.disabled,
      ]}
    >
      {!ios && selected ? <MaterialIcons name="check" size={18} color={colors.accentForeground} /> : null}
      {icon ? <MaterialIcons name={icon} size={18} color={selected ? colors.accentForeground : colors.foreground} /> : null}
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <Txt variant="subhead" tone={selected ? "accent" : "default"} weight={selected ? "bold" : "semibold"}>
        {label}
      </Txt>
    </Pressable>
  );
}

/**
 * Two to four exclusive options. iOS: segmented control with a raised thumb.
 * Android: Material segmented buttons with a check on the selected one.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  const platform = useUiPlatform();
  const ios = platform === "ios";
  return (
    <View style={[styles.segment, ios ? styles.segmentIos : styles.segmentAndroid]} accessibilityRole="tablist">
      {options.map((option, index) => {
        const active = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.id)}
            android_ripple={{ color: colors.border }}
            style={[
              styles.segmentItem,
              ios ? styles.segmentItemIos : styles.segmentItemAndroid,
              ios && active && styles.segmentThumbIos,
              !ios && active && styles.segmentActiveAndroid,
              !ios && index > 0 && styles.segmentDividerAndroid,
            ]}
          >
            {!ios && active ? <MaterialIcons name="check" size={18} color={colors.accentForeground} /> : null}
            <Txt variant="subhead" tone={!ios && active ? "accent" : "default"} weight={active ? "bold" : "semibold"}>
              {option.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Small pieces ────────────────────────────────────────────────────────────────────────────

/** Short status label: «Демо», «Оцінка», «Незабаром», «Наживо». */
export function Badge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "accent" | "live" | "warning" }) {
  const look = {
    neutral: { bg: colors.surfaceMuted, fg: "muted" as const },
    accent: { bg: colors.accent, fg: "accent" as const },
    live: { bg: colors.accent, fg: "primary" as const },
    warning: { bg: colors.amberSurface, fg: "default" as const },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: look.bg }]}>
      <Txt variant="caption" tone={look.fg} weight="bold">
        {label}
      </Txt>
    </View>
  );
}

/** Route number on its fleet color (DESIGN.md §2a). */
export function RouteBadge({ route, color, size = "md" }: { route: string; color: string; size?: "md" | "lg" }) {
  return (
    <View style={[styles.route, size === "lg" && styles.routeLarge, { backgroundColor: color }]}>
      <Txt variant={size === "lg" ? "headline" : "subhead"} weight="bold" style={styles.routeText}>
        {route}
      </Txt>
    </View>
  );
}

/** Round colored icon, used for categories, services and list leading icons. */
export function IconOrb({ icon, color, size = 44 }: { icon: IconName; color: string; size?: number }) {
  return (
    <View style={[styles.orb, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <MaterialIcons name={icon} size={Math.round(size * 0.5)} color="#ffffff" />
    </View>
  );
}

/** Nothing to show yet: an icon, one sentence on why, and the next step if there is one. */
export function EmptyState({
  icon,
  title,
  text,
  action,
  style,
}: {
  icon: IconName;
  title: string;
  text?: string;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.empty, style]}>
      <MaterialIcons name={icon} size={36} color={colors.mutedForeground} />
      <Txt variant="headline" style={styles.center}>
        {title}
      </Txt>
      {text ? (
        <Txt variant="subhead" tone="muted" style={styles.center}>
          {text}
        </Txt>
      ) : null}
      {action ? <Button label={action.label} variant="tonal" onPress={action.onPress} /> : null}
    </View>
  );
}

/** Profile entry in a page header: the initial of the user's name, or a person glyph. */
export function AvatarButton({ initial, onPress }: { initial?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Профіль" hitSlop={8} onPress={onPress} style={styles.avatar}>
      {initial ? (
        <Txt variant="subhead" tone="onPrimary" weight="bold">
          {initial}
        </Txt>
      ) : (
        <MaterialIcons name="person" size={20} color={colors.onPrimary} />
      )}
    </Pressable>
  );
}

const styles = themed(() => ({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    paddingHorizontal: space.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  buttonPlain: { paddingHorizontal: space.md },
  stretch: { alignSelf: "stretch" },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  iconButton: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  iconButtonFilled: { backgroundColor: colors.surfaceMuted },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, paddingLeft: space.lg, backgroundColor: colors.card },
  // Settings tiles: the same 36pt gradient square on iOS and Android (DESIGN.md §2f).
  rowIconTile: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowIconTileLegacy: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowIconAndroid: { width: 24 },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    alignSelf: "stretch",
    paddingVertical: space.md,
    paddingRight: space.lg,
  },
  rowSeparator: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowCopy: { flex: 1, gap: 2 },
  rowValue: { maxWidth: "45%" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: "hidden",
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.primaryBorder },
  dot: { width: 8, height: 8, borderRadius: 4 },
  segment: { flexDirection: "row" },
  segmentIos: { padding: 2, borderRadius: 9, backgroundColor: colors.surfaceMuted },
  segmentAndroid: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  segmentItem: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center" },
  segmentItemIos: { minHeight: 32, borderRadius: 7 },
  segmentItemAndroid: { minHeight: 40 },
  segmentThumbIos: {
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  segmentActiveAndroid: { backgroundColor: colors.accent },
  segmentDividerAndroid: { borderLeftWidth: 1, borderLeftColor: colors.border },
  badge: { alignSelf: "flex-start", paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: 999 },
  route: { minWidth: 40, height: 28, paddingHorizontal: space.sm, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  routeLarge: { minWidth: 52, height: 40, borderRadius: 10 },
  routeText: { color: "#ffffff" },
  orb: { alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", gap: space.sm, paddingVertical: space.xxl, paddingHorizontal: space.xl },
  center: { textAlign: "center" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
}));
