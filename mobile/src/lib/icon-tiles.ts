import { tokens } from "./tokens.generated";

/**
 * Settings icon tiles (DESIGN.md §2f). Same rule as the web: a stable hash of the row's key picks
 * one tile color, drawn as a top-to-bottom gradient. Values come from design/tokens.json.
 */
export type IconTile = keyof typeof tokens.iconTiles;

const NAMES = Object.keys(tokens.iconTiles) as IconTile[];

export function iconTileFor(key: string): IconTile {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return NAMES[hash % NAMES.length];
}

/** Top and bottom colors of a tile, in the order the gradient runs. */
export function iconTileColors(tile: IconTile): readonly [string, string] {
  const pair = tokens.iconTiles[tile];
  return [pair.top, pair.bottom];
}
