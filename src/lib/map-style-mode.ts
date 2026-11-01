import type { Map as MapLibreMap } from "maplibre-gl";

/** Base map type, chosen from the map type control (DESIGN.md §7). */
export type MapStyleMode = "standard" | "hybrid" | "satellite";

const SATELLITE_SOURCE = "wayme-satellite";
const SATELLITE_LAYER = "wayme-satellite-raster";
/** Esri World Imagery. Attribution is shown on the map, as its terms require. */
const SATELLITE_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_ATTRIBUTION = "Tiles © Esri, Maxar, Earthstar Geographics";
/** Source of the OpenFreeMap base style. App layers use the `wayme-` prefix and are never touched here. */
const BASE_SOURCE = "openmaptiles";

/** Adds the imagery layer under the base style. Safe to call more than once. */
export function addSatelliteLayer(map: MapLibreMap): void {
  if (map.getSource(SATELLITE_SOURCE)) return;
  map.addSource(SATELLITE_SOURCE, {
    type: "raster",
    tiles: [SATELLITE_TILES],
    tileSize: 256,
    maxzoom: 19,
    attribution: SATELLITE_ATTRIBUTION,
  });
  // Above the background, below every base vector layer.
  const firstBaseLayer = map.getStyle().layers.find((layer) => layer.id !== "background");
  map.addLayer({ id: SATELLITE_LAYER, type: "raster", source: SATELLITE_SOURCE, layout: { visibility: "none" } }, firstBaseLayer?.id);
}

/**
 * Shows the chosen base type by toggling layer visibility, so the app layers and the
 * camera state stay as they are. Standard: the vector map. Hybrid: imagery with roads and
 * labels. Satellite: imagery only.
 */
export function applyMapStyleMode(map: MapLibreMap, mode: MapStyleMode): void {
  if (!map.getLayer(SATELLITE_LAYER)) return;
  map.setLayoutProperty(SATELLITE_LAYER, "visibility", mode === "standard" ? "none" : "visible");
  for (const layer of map.getStyle().layers) {
    if (!("source" in layer) || layer.source !== BASE_SOURCE) continue;
    const visible = (() => {
      if (layer.type === "symbol") return mode === "hybrid";
      if (layer.type === "fill-extrusion" || layer.type === "fill") return mode === "standard";
      if (layer.id.startsWith("road_") && layer.type === "line") return mode !== "satellite";
      return mode === "standard";
    })();
    map.setLayoutProperty(layer.id, "visibility", visible ? "visible" : "none");
  }
}
