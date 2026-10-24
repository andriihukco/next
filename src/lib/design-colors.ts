/**
 * Resolves a `var(--token)` color to its computed value.
 *
 * DOM styles can use `var(--token)` directly. Canvas, MapLibre paint, and 3D
 * code cannot read CSS variables, so they call this at the point of use.
 * A value that is not a `var()` reference is returned unchanged.
 */
export function resolveColor(color: string): string {
  const match = /^var\((--[\w-]+)\)$/.exec(color.trim());
  if (!match || typeof document === "undefined") return color;
  const value = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
  return value || color;
}
