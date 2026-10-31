import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { colors } from "../lib/theme";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Liquid glass on iOS 26+. Older iOS gets a near-opaque card so text stays readable.
 */
export function GlassSurface({ children, style }: Props) {
  if (isLiquidGlassAvailable()) {
    return (
      <GlassView glassEffectStyle="regular" style={[styles.base, style]}>
        {children}
      </GlassView>
    );
  }
  return (
    <View style={[styles.base, styles.fallback, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 28,
    borderCurve: "continuous",
    padding: 16,
    overflow: "hidden",
  },
  fallback: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
