import { MaterialIcons } from "@expo/vector-icons";
import { CATEGORY_COLORS } from "./category-colors";
export type IconName = keyof typeof MaterialIcons.glyphMap;

/** Material Symbols name (web) → MaterialIcons name (native), with a fallback when missing. */
export function materialIconFor(symbolName: string): IconName {
  const candidate = symbolName.replace(/_/g, "-") as IconName;
  return candidate in MaterialIcons.glyphMap ? candidate : "place";
}

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#64746b";
}
