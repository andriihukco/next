import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from "react-native";
import { tokens } from "./tokens.generated";

// Core colors come from design/tokens.json (npm run design:tokens), the same values as the web.
// The rest are mobile-only roles: accents, map route states and surfaces over the map.
const light = {
  ...tokens.light,
  onPrimary: tokens.light.primaryForeground,
  // Transport orbs (DESIGN.md §2a, Transport).
  transportNearby: "#1caa63",
  transportBus: "#d89418",
  transportTram: "#247bad",
  transportTrolleybus: "#0284c7",
  transportTaxi: "#bd5681",
  // Map route states.
  routeWalked: "#087a50",
  routeAhead: "#94a3b8",
  walker: "#0874df",
  mapMarkerAlert: "#dc2626",
  amberSurface: "#fff8e6",
  amberText: "#7a4f00",
  // Surfaces over the map when liquid glass is not available, and shadow tint.
  glass: "rgba(255,255,255,0.94)",
  glassSoft: "rgba(255,255,255,0.86)",
  shadow: "#0f172a",
};

export type Palette = Record<keyof typeof light, string>;

/** Dark core colors from design/tokens.json (web DESIGN.md §2b). Accents keep their values. */
const dark: Palette = {
  ...light,
  ...tokens.dark,
  onPrimary: tokens.dark.primaryForeground,
  routeWalked: "#34b87e",
  walker: "#3b9cff",
  amberSurface: "#3a2f14",
  amberText: "#f0c060",
  glass: "rgba(23,34,29,0.94)",
  glassSoft: "rgba(23,34,29,0.86)",
  shadow: "#000000",
};

export type ColorScheme = "light" | "dark";

let active: Palette = light;
let activeScheme: ColorScheme = "light";

/** Called by ThemeProvider during render, before any themed style is read. */
export function setActiveScheme(scheme: ColorScheme): void {
  activeScheme = scheme;
  active = scheme === "dark" ? dark : light;
}

export function activeColorScheme(): ColorScheme {
  return activeScheme;
}

/** The active palette. Read it during render; the app re-renders from the root on a theme change. */
export const colors: Palette = new Proxy({} as Palette, {
  get: (_target, key) => active[key as keyof Palette],
});

/**
 * StyleSheet that follows the theme: built from `colors` once per palette, on first use.
 * Use `themed(() => ({ ... }))` where a plain `StyleSheet.create({ ... })` would go.
 */
export function themed<T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(factory: () => T): T {
  const cache = new Map<Palette, T>();
  return new Proxy({} as T, {
    get: (_target, key) => {
      const sheet = cache.get(active) ?? StyleSheet.create(factory());
      cache.set(active, sheet);
      return sheet[key as keyof T];
    },
  });
}

export const radius = {
  sm: 6,
  md: 8,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export const fonts = {
  regular: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  extrabold: "Manrope_800ExtraBold",
} as const;

// iOS-style type scale (pt), Manrope to match the web app.
export const type = {
  largeTitle: { fontFamily: fonts.extrabold, fontSize: 34, lineHeight: 40, letterSpacing: -0.6 },
  title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  body: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  footnote: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, letterSpacing: -0.1 },
  footnoteStrong: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, letterSpacing: -0.1 },
} as const;

// Apple HIG: every tappable zone is at least 44×44 pt.
export const HIT_SLOP = 10;
export const MIN_TOUCH = 44;
