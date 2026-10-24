import type { Map as MapLibreMap } from "maplibre-gl";

// Map paint is set once when the style loads, so a theme change has to recolor
// the layers that already exist. Each layer color is matched by value against
// the palette the map was last painted with, then swapped for the new palette.
// Category pins and place accents keep their colors across themes.

const MAP_PALETTE_TOKENS = [
  "map-background",
  "map-landuse",
  "map-wood",
  "map-grass",
  "map-water",
  "map-casing",
  "map-surface",
  "card",
  "map-outline",
  "map-hillshade-shadow",
  "map-hillshade-highlight",
  "map-hillshade-accent",
  "map-label",
  "map-label-strong",
  "map-marker-alert",
  "map-marker-teal",
  "map-marker-muted",
  "map-label-alert",
  "map-route",
  "brand-blue",
] as const;

type Palette = Record<string, string>;

let appliedPalette: Palette = {};

function normalizeHex(value: string): string {
  const lower = value.trim().toLowerCase();
  return /^#[0-9a-f]{3}$/.test(lower) ? `#${lower[1]}${lower[1]}${lower[2]}${lower[2]}${lower[3]}${lower[3]}` : lower;
}

function readPalette(): Palette {
  const styles = getComputedStyle(document.documentElement);
  const palette: Palette = {};
  for (const token of MAP_PALETTE_TOKENS) {
    palette[token] = normalizeHex(styles.getPropertyValue(`--${token}`));
  }
  return palette;
}

/** Call when the style loads, so the first theme change knows the starting colors. */
export function snapshotMapPalette(): void {
  appliedPalette = readPalette();
}

/** Call after the document theme changes. Recolors the existing map layers. */
export function recolorMapForTheme(map: MapLibreMap): void {
  const next = readPalette();
  const swaps = new Map<string, string>();
  for (const token of MAP_PALETTE_TOKENS) {
    const from = appliedPalette[token];
    const to = next[token];
    if (from && to && from !== to) swaps.set(from, to);
  }
  appliedPalette = next;
  if (swaps.size === 0) return;

  const swap = (value: unknown): unknown => {
    if (typeof value === "string") return swaps.get(normalizeHex(value)) ?? value;
    if (Array.isArray(value)) return value.map(swap);
    return value;
  };

  for (const layer of map.getStyle().layers) {
    for (const property of Object.keys(layer.paint ?? {})) {
      if (!property.includes("color")) continue;
      const current = map.getPaintProperty(layer.id, property as never);
      const updated = swap(current);
      if (JSON.stringify(updated) !== JSON.stringify(current)) {
        map.setPaintProperty(layer.id, property as never, updated as never);
      }
    }
  }
}
