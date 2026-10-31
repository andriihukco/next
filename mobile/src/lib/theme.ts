// Tokens ported from src/index.css and DESIGN.md (§2, §2a). Keep in sync with the web tokens.
export const colors = {
  background: "#f8faf9",
  foreground: "#18251f",
  card: "#ffffff",
  surfaceMuted: "#f1f4f2",
  mutedForeground: "#5f6e66",
  border: "#dce5df",
  primary: "#087a50",
  primaryHover: "#066a45",
  primaryBorder: "#a9d3bf",
  onPrimary: "#ffffff",
  accent: "#e5f2eb",
  accentForeground: "#075c3d",
  ring: "#11835b",
  destructive: "#b42318",
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
} as const;

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
