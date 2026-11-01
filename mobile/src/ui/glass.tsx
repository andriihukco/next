import type { ReactNode } from "react";
import { StyleSheet, View, type ColorValue, type StyleProp, type ViewStyle } from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { colors, themed } from "../lib/theme";
import { useUiPlatform, radiusFor } from "./platform";

export type GlassVariant = "regular" | "clear" | "tinted";

type GlassProps = {
  children?: ReactNode;
  variant?: GlassVariant;
  /** Primary-colored glass for a selected state. Only the tinted variant takes a tint. */
  tint?: ColorValue;
  /** Press feedback on iOS liquid glass. */
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Liquid glass for floating chrome (design/foundations.md, DESIGN.md §2e). iOS 26+ gets the real
 * material; everything else gets the opaque fallback, so text stays readable and Android keeps its
 * own surfaces. Never stack glass on glass.
 */
export function Glass({ children, variant = "regular", tint, interactive = false, style }: GlassProps) {
  const platform = useUiPlatform();
  const radius = { borderRadius: radiusFor(platform).card };
  if (platform === "ios" && isLiquidGlassAvailable()) {
    return (
      <GlassView
        glassEffectStyle={variant === "clear" ? "clear" : "regular"}
        tintColor={variant === "tinted" ? (tint ?? colors.accent) : undefined}
        isInteractive={interactive}
        style={[styles.base, radius, style]}
      >
        {children}
      </GlassView>
    );
  }
  const fallback = variant === "tinted" ? styles.tinted : variant === "clear" ? styles.clear : styles.regular;
  return <View style={[styles.base, radius, fallback, style]}>{children}</View>;
}

const styles = themed(() => ({
  base: {
    overflow: "hidden",
    borderCurve: "continuous",
  },
  regular: {
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  clear: {
    backgroundColor: colors.glassSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tinted: {
    backgroundColor: colors.accent,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryBorder,
  },
}));
