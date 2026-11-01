import type * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import { resolveColor } from "./design-colors";

/** Repaints the OpenFreeMap base style with the app tokens and hides its own labels. */
export function paintBaseStyle(map: MapLibreMap): void {
  const style = map.getStyle();
  if (map.getLayer("background")) {
    map.setPaintProperty("background", "background-color", resolveColor("var(--map-background)"));
  }
  for (const [layerId, color] of [
    ["landuse_residential", resolveColor("var(--map-landuse)")],
    ["landcover_wood", resolveColor("var(--map-wood)")],
    ["landcover_grass", resolveColor("var(--map-grass)")],
    ["water", resolveColor("var(--map-water)")],
  ] as const) {
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, "fill-color", color);
    }
  }
  for (const layer of style.layers) {
    if (layer.id.startsWith("road_") && layer.type === "line") {
      map.setPaintProperty(
        layer.id,
        "line-color",
        layer.id.includes("casing") ? resolveColor("var(--map-casing)") : resolveColor("var(--map-surface)"),
      );
    }
    if (layer.type === "symbol") {
      map.setLayoutProperty(layer.id, "visibility", "none");
    }
  }
}

/** Extrudes OSM buildings, reusing the style's own extrusion layer when it has one. */
export function addBuildingExtrusions(map: MapLibreMap): void {
  const style = map.getStyle();
  const buildingLayer = style.layers.find(
    (layer) =>
      "source-layer" in layer &&
      layer["source-layer"] === "building" &&
      "source" in layer,
  );
  if (buildingLayer?.type === "fill") {
    map.setPaintProperty(buildingLayer.id, "fill-color", resolveColor("var(--card)"));
    map.setPaintProperty(buildingLayer.id, "fill-outline-color", resolveColor("var(--map-outline)"));
  }
  const buildingSourceId =
    buildingLayer && "source" in buildingLayer ? buildingLayer.source : undefined;
  const buildingSource = buildingSourceId ? style.sources[buildingSourceId] : undefined;
  const existingExtrusion = style.layers.find(
    (layer) =>
      layer.type === "fill-extrusion" &&
      "source-layer" in layer &&
      layer["source-layer"] === "building",
  );
  if (existingExtrusion) {
    map.setPaintProperty(existingExtrusion.id, "fill-extrusion-color", resolveColor("var(--card)"));
    map.setPaintProperty(existingExtrusion.id, "fill-extrusion-opacity", 1);
    return;
  }
  if (!buildingSourceId || buildingSource?.type !== "vector") return;
  const firstLabel = style.layers.find((layer) => layer.type === "symbol");
  const extrusionLayer: maplibregl.FillExtrusionLayerSpecification = {
    id: "wayme-building-extrusions",
    type: "fill-extrusion",
    source: buildingSourceId,
    "source-layer": "building",
    minzoom: 14,
    filter: ["any", ["has", "render_height"], ["has", "height"]],
    paint: {
      "fill-extrusion-color": resolveColor("var(--card)"),
      "fill-extrusion-height": [
        "max",
        ["to-number", ["get", "render_height"], 0],
        ["to-number", ["get", "height"], 0],
        3,
      ],
      "fill-extrusion-base": [
        "max",
        ["to-number", ["get", "render_min_height"], 0],
        ["to-number", ["get", "min_height"], 0],
      ],
      "fill-extrusion-opacity": 1,
      "fill-extrusion-vertical-gradient": true,
    },
  };
  map.addLayer(extrusionLayer, firstLabel?.id);
}

/** Terrain source and the hillshade layer. Both stay hidden until terrain is turned on. */
export function addTerrain(map: MapLibreMap): void {
  map.addSource("wayme-dem", {
    type: "raster-dem",
    tiles: ["https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png"],
    tileSize: 256,
    maxzoom: 15,
    encoding: "terrarium",
    attribution:
      '<a href="https://registry.opendata.aws/terrain-tiles/" target="_blank">AWS Terrain Tiles</a> · <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank">Mapzen</a>',
  });
  map.addLayer({
    id: "wayme-terrain-hillshade",
    type: "hillshade",
    source: "wayme-dem",
    layout: { visibility: "none" },
    paint: {
      "hillshade-shadow-color": resolveColor("var(--map-hillshade-shadow)"),
      "hillshade-highlight-color": resolveColor("var(--map-hillshade-highlight)"),
      "hillshade-accent-color": resolveColor("var(--map-hillshade-accent)"),
      "hillshade-exaggeration": 0.35,
    },
  });
}
