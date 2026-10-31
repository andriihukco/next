// Replaces web-only modules when the layer runs inside the WebView.
// maplibre-gl is already loaded by the page; it is handed over on window.
export const MercatorCoordinate = {
  fromLngLat(lngLat: [number, number]) {
    return (window as unknown as { __maplibre: { MercatorCoordinate: { fromLngLat: (p: [number, number]) => unknown } } })
      .__maplibre.MercatorCoordinate.fromLngLat(lngLat);
  },
};

// Fleet colours from the web tokens (DESIGN.md §2a). CSS variables do not exist in the WebView.
const TOKENS: Record<string, string> = {
  "--fleet-bus": "#22c55e",
  "--fleet-tram": "#f97316",
  "--fleet-trolleybus": "#3b82f6",
  "--fleet-taxi": "#eab308",
};

export function resolveColor(color: string): string {
  const match = /^var\((--[\w-]+)\)$/.exec(color.trim());
  if (!match) return color;
  return TOKENS[match[1]] ?? color;
}
