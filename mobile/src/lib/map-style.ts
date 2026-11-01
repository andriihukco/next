// Map type, the same three options as the web map controls (DESIGN.md §7, src/lib/map-style-mode.ts).
export type MapStyleMode = "standard" | "hybrid" | "satellite";

/** Esri World Imagery, the imagery source of the web app. Its attribution must stay visible. */
export const SATELLITE_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
export const SATELLITE_ATTRIBUTION = "Знімки © Esri, Maxar, Earthstar Geographics";

/** One imagery tile over a point, for the map type previews. */
export function satellitePreviewUrl(latitude: number, longitude: number, zoom: number): string {
  const scale = 2 ** zoom;
  const x = Math.floor(((longitude + 180) / 360) * scale);
  const latRad = (latitude * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale);
  return SATELLITE_TILES.replace("{z}", String(zoom)).replace("{y}", String(y)).replace("{x}", String(x));
}
