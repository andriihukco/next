/**
 * @file icon-tiles.ts
 * @description Settings icon tiles (DESIGN.md §2f). Each row gets one tile color, picked by a stable
 *   hash of its title, so the page looks varied but does not change between renders. Values live in
 *   design/tokens.json and src/index.css (--tile-<name>-top / -bottom).
 */

export const ICON_TILES = ["blue", "orange", "violet", "pink", "teal", "amber", "rose", "indigo", "green"] as const;

export type IconTile = (typeof ICON_TILES)[number];

export function iconTileFor(key: string): IconTile {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return ICON_TILES[hash % ICON_TILES.length];
}
