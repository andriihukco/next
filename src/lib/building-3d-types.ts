import * as THREE from "three";
import type { CustomLayerInterface } from "maplibre-gl";

/** Types shared by the building model layer, the model store and the editor. */

export type BuildingModelUpAxis = "auto" | "y" | "z";

/**
 * The uploaded file as the user gave it. OBJ is text. FBX is stored as bytes,
 * because it is often binary and IndexedDB keeps an ArrayBuffer as is.
 */
export type BuildingModelSource =
  | { format: "obj"; text: string }
  | { format: "fbx"; buffer: ArrayBuffer };

/**
 * A user-uploaded building model anchored to a real OSM building.
 *
 * `heightMeters` is the desired real-world height. The mesh is uniformly
 * scaled so its bounding box matches that height, which keeps the proportions
 * of the uploaded asset intact while fitting it into the map.
 */
export type BuildingModelData = {
  /** Matches the CityPlace id of the building the model belongs to. */
  id: string;
  name: string;
  lng: number;
  lat: number;
  fileName: string;
  source: BuildingModelSource;
  heightMeters: number;
  scale: number;
  /** Degrees, clockwise (compass bearing) around the vertical axis. */
  rotation: number;
  /** Meters added on top of the terrain elevation. */
  elevationOffset: number;
  color: string;
  upAxis: BuildingModelUpAxis;
  updatedAt: number;
};

export type BuildingModelInspection = {
  /** Height of the asset after it has been rotated into Z-up map space. */
  height: number;
  width: number;
  depth: number;
  triangles: number;
  detectedUpAxis: "y" | "z";
  longAxis: "x" | "y";
};

export type Building3DLayer = CustomLayerInterface & {
  setModels: (models: BuildingModelData[]) => void;
};

export type PreparedAsset = {
  group: THREE.Group;
  assetHeight: number;
  width: number;
  depth: number;
  triangles: number;
  detectedUpAxis: "y" | "z";
  longAxis: "x" | "y";
};

export type LoadedModel = {
  data: BuildingModelData;
  group: THREE.Group;
  assetHeight: number;
  lastElevation: number;
};
