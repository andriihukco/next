import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewProps, type StyleProp, type ViewStyle } from "react-native";
import { colors, themed } from "../lib/theme";
import { layout, radiusFor, space, useUiPlatform } from "./platform";
import { Txt } from "./text";

/**
 * A full page under a native header. The first ScrollView lets iOS collapse the large title and
 * keeps content clear of the tab bar (contentInsetAdjustmentBehavior).
 */
export function Page({ children, contentStyle, ...props }: ScrollViewProps & { children: ReactNode; contentStyle?: StyleProp<ViewStyle> }) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.page}
      contentContainerStyle={[styles.pageContent, contentStyle]}
      {...props}
    >
      {children}
    </ScrollView>
  );
}

/**
 * A titled block on a page. `grouped` puts the children on one card surface, like an iOS inset
 * grouped list or a Material list container. Footer text explains the section's data.
 */
export function Section({
  title,
  action,
  footer,
  grouped = false,
  children,
}: {
  title?: string;
  action?: ReactNode;
  footer?: string;
  grouped?: boolean;
  children: ReactNode;
}) {
  const platform = useUiPlatform();
  return (
    <View style={styles.section}>
      {title || action ? (
        <View style={styles.sectionHead}>
          {title ? (
            <Txt
              variant={platform === "ios" ? "headline" : "subhead"}
              tone={platform === "ios" ? "default" : "primary"}
              weight={platform === "ios" ? undefined : "bold"}
              accessibilityRole="header"
            >
              {title}
            </Txt>
          ) : (
            <View />
          )}
          {action}
        </View>
      ) : null}
      {grouped ? <Surface>{children}</Surface> : <View style={styles.sectionBody}>{children}</View>}
      {footer ? (
        <Txt variant="footnote" tone="muted" style={styles.footer}>
          {footer}
        </Txt>
      ) : null}
    </View>
  );
}

/** A card surface. Pressable when it has `onPress`; Android shows a ripple, iOS dims. */
export function Surface({
  children,
  onPress,
  accessibilityLabel,
  style,
  padded = false,
}: {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const platform = useUiPlatform();
  const shape = { borderRadius: radiusFor(platform).card };
  if (!onPress) return <View style={[styles.surface, shape, padded && styles.padded, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      android_ripple={{ color: colors.border }}
      style={({ pressed }) => [styles.surface, shape, padded && styles.padded, platform === "ios" && pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  return <View style={[styles.divider, { marginLeft: inset }]} />;
}

/** Horizontal row of children with the standard gap. */
export function Row({ children, gap = space.sm, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, { gap }, style]}>{children}</View>;
}

const styles = themed(() => ({
  page: { flex: 1, backgroundColor: colors.background },
  pageContent: { paddingHorizontal: layout.screenMargin, paddingTop: space.sm, paddingBottom: space.xxxl, gap: layout.sectionGap },
  section: { gap: space.sm },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 28 },
  sectionBody: { gap: space.md },
  footer: { paddingHorizontal: space.xs },
  surface: { backgroundColor: colors.card, overflow: "hidden" },
  padded: { padding: space.lg, gap: space.md },
  pressed: { opacity: 0.7 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  row: { flexDirection: "row", alignItems: "center" },
}));
