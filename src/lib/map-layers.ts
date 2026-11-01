import { useSyncExternalStore } from "react";
import { cityPlaceCategories, type CityPlaceCategory } from "./city-place-categories";

// What the map shows (DESIGN.md §5, «Шари мапи»). Everything is visible by default. The user hides
// single categories or whole groups, and the transport layers. Stored on the device only.

export type TransportLayer = "vehicles" | "stops";

export type MapLayerPrefs = {
  hiddenCategories: CityPlaceCategory[];
  hiddenTransport: TransportLayer[];
};

const STORAGE_KEY = "eway-map-layers";
const TRANSPORT_LAYERS: TransportLayer[] = ["vehicles", "stops"];
const CATEGORY_IDS = new Set<string>(cityPlaceCategories.map((category) => category.id));
const listeners = new Set<() => void>();

const DEFAULT_PREFS: MapLayerPrefs = { hiddenCategories: [], hiddenTransport: [] };

function readPrefs(): MapLayerPrefs {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<MapLayerPrefs> | null;
    if (!stored) return DEFAULT_PREFS;
    return {
      hiddenCategories: Array.isArray(stored.hiddenCategories)
        ? stored.hiddenCategories.filter((id): id is CityPlaceCategory => CATEGORY_IDS.has(id))
        : [],
      hiddenTransport: Array.isArray(stored.hiddenTransport)
        ? stored.hiddenTransport.filter((id): id is TransportLayer => TRANSPORT_LAYERS.includes(id))
        : [],
    };
  } catch (error) {
    console.error("Could not read the map layer preferences.", error);
    return DEFAULT_PREFS;
  }
}

let current: MapLayerPrefs = readPrefs();

function write(next: MapLayerPrefs): void {
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.error("Could not save the map layer preferences.", error);
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Shows or hides several categories at once (bulk actions and whole groups). */
export function setCategoriesVisible(ids: CityPlaceCategory[], visible: boolean): void {
  const hidden = new Set(current.hiddenCategories);
  for (const id of ids) {
    if (visible) hidden.delete(id);
    else hidden.add(id);
  }
  write({ ...current, hiddenCategories: [...hidden] });
}

export function setTransportVisible(layer: TransportLayer, visible: boolean): void {
  const hidden = new Set(current.hiddenTransport);
  if (visible) hidden.delete(layer);
  else hidden.add(layer);
  write({ ...current, hiddenTransport: [...hidden] });
}

export function useMapLayerPrefs(): MapLayerPrefs {
  return useSyncExternalStore(subscribe, () => current, () => DEFAULT_PREFS);
}
