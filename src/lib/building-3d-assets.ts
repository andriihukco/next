import { resolveColor } from "./design-colors";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import {
  BuildingModelUpAxis,
  BuildingModelSource,
  BuildingModelInspection,
  PreparedAsset,
  LoadedModel,
} from "./building-3d-types";

/** Parsing, measuring and colouring building models (OBJ, FBX, glTF) before they join the scene. */

export const MAX_TRIANGLES = 4_000_000;

export function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  if (Array.isArray(material)) material.forEach((item) => item.dispose());
  else material.dispose();
}

export function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    disposeMaterial(child.material);
  });
}

export function applyModelMaterials(source: THREE.Group, color: string): void {
  source.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const vertexColors = Boolean(child.geometry.getAttribute("color"));
    const previous = child.material;
    child.material = new THREE.MeshStandardMaterial({
      color: vertexColors ? 0xffffff : color,
      vertexColors,
      roughness: 0.78,
      metalness: 0.04,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    });
    disposeMaterial(previous);
    child.castShadow = true;
    child.receiveShadow = true;
    // Custom layers bypass MapLibre's own culling; the model matrix is tiny in
    // mercator units, so keep three.js from rejecting it against a frustum
    // built from the map's projection matrix.
    child.frustumCulled = false;
  });
}

export function countTriangles(object: THREE.Object3D): number {
  let triangles = 0;
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const geometry = child.geometry;
    const index = geometry.getIndex();
    const position = geometry.getAttribute("position");
    if (index) triangles += index.count / 3;
    else if (position) triangles += position.count / 3;
  });
  return Math.round(triangles);
}

/**
 * Parse an OBJ or FBX file, orient it into the map's Z-up coordinate system and
 * recenter it so that its bottom sits at z = 0 and its footprint center is
 * at the origin. The returned group is ready to be scaled and placed.
 */
export function parseSource(source: BuildingModelSource): THREE.Group {
  return source.format === "obj"
    ? new OBJLoader().parse(source.text)
    : new FBXLoader().parse(source.buffer, "");
}

export function prepareAsset(
  modelSource: BuildingModelSource,
  upAxis: BuildingModelUpAxis,
  color: string,
): PreparedAsset {
  const source = parseSource(modelSource);
  applyModelMaterials(source, color);

  // The orientation fix lives on an inner node so that the yaw applied to the
  // outer node stays a pure rotation around the map's vertical (Z) axis.
  const oriented = new THREE.Group();
  oriented.add(source);

  // OBJ files are conventionally Y-up; Z-up models are common in Blender and
  // CAD exports. `auto` follows the OBJ convention and the UI allows a manual
  // override for files that were authored Z-up.
  const detectedUpAxis: "y" | "z" = upAxis === "z" ? "z" : "y";
  if (detectedUpAxis === "y") {
    oriented.rotation.x = Math.PI / 2;
  }

  const group = new THREE.Group();
  group.add(oriented);
  group.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  if (!Number.isFinite(size.x) || !Number.isFinite(size.y) || !Number.isFinite(size.z)) {
    disposeObject(group);
    throw new Error("The model file does not contain readable geometry.");
  }
  const center = box.getCenter(new THREE.Vector3());

  // Move the pivot to the footprint center and the bottom of the model.
  oriented.position.set(-center.x, -center.y, -box.min.z);
  group.updateMatrixWorld(true);

  return {
    group,
    assetHeight: Math.max(size.z, 1e-6),
    width: size.x,
    depth: size.y,
    triangles: countTriangles(group),
    detectedUpAxis,
    longAxis: size.x >= size.y ? "x" : "y",
  };
}

/**
 * Parse an uploaded OBJ and report its dimensions so the editor can show a
 * useful preview and choose a sensible default height.
 */
export function inspectBuildingModel(
  source: BuildingModelSource,
  upAxis: BuildingModelUpAxis = "auto",
): BuildingModelInspection {
  const asset = prepareAsset(source, upAxis, resolveColor("var(--card)"));
  const inspection: BuildingModelInspection = {
    height: asset.assetHeight,
    width: asset.width,
    depth: asset.depth,
    triangles: asset.triangles,
    detectedUpAxis: asset.detectedUpAxis,
    longAxis: asset.longAxis,
  };
  disposeObject(asset.group);
  return inspection;
}

/**
 * Longest footprint edge as a compass bearing (degrees clockwise from north).
 * Used to give a freshly uploaded model a sensible starting rotation.
 */
export function footprintLongestBearing(
  footprint: [number, number][] | undefined,
): number | null {
  if (!footprint || footprint.length < 2) return null;
  let bestLength = 0;
  let bestBearing = 0;
  for (let index = 0; index < footprint.length - 1; index += 1) {
    const [lngA, latA] = footprint[index];
    const [lngB, latB] = footprint[index + 1];
    const latitude = ((latA + latB) / 2) * (Math.PI / 180);
    const dx = (lngB - lngA) * Math.cos(latitude);
    const dy = latB - latA;
    const length = Math.hypot(dx, dy);
    if (length > bestLength) {
      bestLength = length;
      bestBearing = (Math.atan2(dx, dy) * 180) / Math.PI;
    }
  }
  if (bestLength === 0) return null;
  return ((bestBearing + 180) % 360) - 180;
}

/**
 * Suggest a rotation that aligns the model's long horizontal axis with the
 * longest edge of the building footprint.
 */
export function suggestedRotationForInspection(
  inspection: BuildingModelInspection | null,
  footprint: [number, number][] | undefined,
): number {
  const bearing = footprintLongestBearing(footprint);
  if (bearing === null) return 0;
  if (!inspection) return bearing;
  // With rotation = 0 the asset's long X axis points east (bearing 90°) and
  // its long Y axis points south (bearing 180°).
  const defaultBearing = inspection.longAxis === "x" ? 90 : 180;
  return (((bearing - defaultBearing + 180) % 360) + 360) % 360 - 180;
}

export function applyColor(model: LoadedModel, color: string): void {
  model.group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const material = child.material;
    if (!(material instanceof THREE.MeshStandardMaterial)) return;
    if (material.vertexColors) return;
    material.color.set(color);
  });
}
