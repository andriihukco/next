import { VectorTile } from "@mapbox/vector-tile";
import Pbf from "pbf";
import {
  cityPlacesFromMapFeatures,
  type CityPlace,
} from "../../../src/lib/city-places";

/** Same vector tiles as the web map (OpenFreeMap, OpenMapTiles schema). */
const TILESET_URL = "https://tiles.openfreemap.org/planet";
const TILE_ZOOM = 14;

type Bounds = { south: number; west: number; north: number; east: number };

let tileTemplate: Promise<string> | null = null;
const tileCache = new Map<string, Promise<CityPlace[]>>();

function getTileTemplate(): Promise<string> {
  tileTemplate ??= fetch(TILESET_URL)
    .then((response) => response.json() as Promise<{ tiles: string[] }>)
    .then((tileJson) => tileJson.tiles[0])
    .catch((error: unknown) => {
      tileTemplate = null; // Retry on the next request.
      throw error;
    });
  return tileTemplate;
}

function lngOfTile(x: number, z: number): number {
  return (x / 2 ** z) * 360 - 180;
}

function latOfTile(y: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function tileX(lng: number, z: number): number {
  return Math.floor(((lng + 180) / 360) * 2 ** z);
}

function tileY(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z);
}

/** Decodes one POI tile into CityPlace records, using the web app's classifier. */
async function loadTile(template: string, z: number, x: number, y: number): Promise<CityPlace[]> {
  const url = template.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Tile ${z}/${x}/${y} returned ${response.status}`);
  const tile = new VectorTile(new Pbf(new Uint8Array(await response.arrayBuffer())));
  const layer = tile.layers.poi;
  if (!layer) return [];

  const features = [];
  for (let i = 0; i < layer.length; i++) {
    const feature = layer.feature(i);
    const [[point]] = feature.loadGeometry();
    if (!point) continue;
    const extent = layer.extent;
    features.push({
      id: feature.id,
      geometry: {
        type: "Point",
        coordinates: [
          lngOfTile(x + point.x / extent, z),
          latOfTile(y + point.y / extent, z),
        ],
      },
      properties: feature.properties,
    });
  }
  return cityPlacesFromMapFeatures(features);
}

/** Places inside the visible bounds, from the POI tiles that cover them. */
export async function fetchPlacesIn(bounds: Bounds): Promise<CityPlace[]> {
  const template = await getTileTemplate();
  const x0 = tileX(bounds.west, TILE_ZOOM);
  const x1 = tileX(bounds.east, TILE_ZOOM);
  const y0 = tileY(bounds.north, TILE_ZOOM);
  const y1 = tileY(bounds.south, TILE_ZOOM);

  const jobs: Promise<CityPlace[]>[] = [];
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      const key = `${TILE_ZOOM}/${x}/${y}`;
      let job = tileCache.get(key);
      if (!job) {
        job = loadTile(template, TILE_ZOOM, x, y).catch(() => []);
        tileCache.set(key, job);
      }
      jobs.push(job);
    }
  }

  const places = (await Promise.all(jobs)).flat();
  return places.filter(
    (place) =>
      place.lat >= bounds.south &&
      place.lat <= bounds.north &&
      place.lng >= bounds.west &&
      place.lng <= bounds.east,
  );
}

export type { CityPlace };
