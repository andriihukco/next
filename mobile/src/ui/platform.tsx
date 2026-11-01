import { createContext, useContext, type ReactNode } from "react";
import { Platform } from "react-native";
import { tokens } from "../lib/tokens.generated";
import { fonts } from "../lib/theme";

/** Which platform rules a component follows: Apple HIG or Material 3 (design/platforms.md). */
export type UiPlatform = "ios" | "android";

const Override = createContext<UiPlatform | null>(null);

/** Forces a platform for everything inside. The design library uses it to show both variants. */
export function PlatformOverride({ platform, children }: { platform: UiPlatform; children: ReactNode }) {
  return <Override.Provider value={platform}>{children}</Override.Provider>;
}

export function useUiPlatform(): UiPlatform {
  return useContext(Override) ?? (Platform.OS === "android" ? "android" : "ios");
}

export type TypeRole = keyof typeof tokens.type.ios;

const WEIGHT_FONT = {
  regular: fonts.regular,
  semibold: fonts.semibold,
  bold: fonts.bold,
  extrabold: fonts.extrabold,
} as const;

/** Font, size, line height and tracking of a text role on a platform. */
export function typeStyle(platform: UiPlatform, role: TypeRole) {
  const spec = tokens.type[platform][role];
  return {
    fontFamily: WEIGHT_FONT[spec.weight as keyof typeof WEIGHT_FONT],
    fontSize: spec.size,
    lineHeight: spec.line,
    letterSpacing: spec.tracking,
  };
}

export const space = tokens.space;
export const layout = tokens.layout;

export function radiusFor(platform: UiPlatform) {
  return tokens.radius[platform];
}

/** Minimum touch target: 44 pt on iOS (HIG), 48 dp on Android (Material). */
export function touchMin(platform: UiPlatform): number {
  return platform === "android" ? layout.androidTouchMin : layout.touchMin;
}
