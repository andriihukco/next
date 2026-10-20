import * as THREE from "three";
import { MercatorCoordinate } from "maplibre-gl";
import type {
  CustomLayerInterface,
  Map as MapLibreMap,
} from "maplibre-gl";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

export type BuildingModelUpAxis = "auto" | "y" | "z";

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
  objText: string;
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

type PreparedAsset = {
  group: THREE.Group;
  assetHeight: number;
  width: number;
  depth: number;
  triangles: number;
  detectedUpAxis: "y" | "z";
  longAxis: "x" | "y";
};

type LoadedModel = {
  data: BuildingModelData;
  group: THREE.Group;
  assetHeight: number;
  lastElevation: number;
};

const MAX_TRIANGLES = 4_000_000;

function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  if (Array.isArray(material)) material.forEach((item) => item.dispose());
  else material.dispose();
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    disposeMaterial(child.material);
  });
}

function applyModelMaterials(source: THREE.Group, color: string): void {
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

function countTriangles(object: THREE.Object3D): number {
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
 * Parse an OBJ file, orient it into the map's Z-up coordinate system and
 * recenter it so that its bottom sits at z = 0 and its footprint center is
 * at the origin. The returned group is ready to be scaled and placed.
 */
function prepareAsset(
  objText: string,
  upAxis: BuildingModelUpAxis,
  color: string,
): PreparedAsset {
  const source = new OBJLoader().parse(objText);
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
    throw new Error("The OBJ file does not contain readable geometry.");
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
export function inspectObjModel(
  objText: string,
  upAxis: BuildingModelUpAxis = "auto",
): BuildingModelInspection {
  const asset = prepareAsset(objText, upAxis, "#ffffff");
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

function applyColor(model: LoadedModel, color: string): void {
  model.group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const material = child.material;
    if (!(material instanceof THREE.MeshStandardMaterial)) return;
    if (material.vertexColors) return;
    material.color.set(color);
  });
}

export function createBuilding3DLayer(): Building3DLayer {
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const models = new Map<string, LoadedModel>();
  let map: MapLibreMap | null = null;
  let renderer: THREE.WebGLRenderer | null = null;

  scene.add(new THREE.HemisphereLight(0xdfefff, 0x6b6257, 1.55));
  const sunlight = new THREE.DirectionalLight(0xfff5e6, 2.3);
  sunlight.position.set(-55, -70, 120);
  scene.add(sunlight);
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));

  // TEMP-DEBUG
  const debugMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      depthTest: false,
      depthWrite: false,
    }),
  );
  scene.add(debugMesh);

  const refreshPlacement = (model: LoadedModel): boolean => {
    if (!map) return false;
    const elevation =
      map.queryTerrainElevation([model.data.lng, model.data.lat]) ?? 0;
    model.lastElevation = elevation;
    const point = MercatorCoordinate.fromLngLat(
      [model.data.lng, model.data.lat],
      elevation + model.data.elevationOffset,
    );
    const metersInMercatorUnits = point.meterInMercatorCoordinateUnits();
    const fitScale = model.data.heightMeters / model.assetHeight;
    model.group.position.set(point.x, point.y, point.z);
    model.group.scale.setScalar(
      metersInMercatorUnits * fitScale * Math.max(0.01, model.data.scale),
    );
    model.group.rotation.z = (model.data.rotation * Math.PI) / 180;
    return true;
  };

  const setModels = (data: BuildingModelData[]): void => {
    const visibleIds = new Set(data.map((model) => model.id));
    for (const [id, model] of models) {
      if (visibleIds.has(id)) continue;
      scene.remove(model.group);
      disposeObject(model.group);
      models.delete(id);
    }

    for (const item of data) {
      let loaded = models.get(item.id);
      const needsRebuild =
        !loaded ||
        loaded.data.objText !== item.objText ||
        loaded.data.upAxis !== item.upAxis;

      if (needsRebuild) {
        if (loaded) {
          scene.remove(loaded.group);
          disposeObject(loaded.group);
          models.delete(item.id);
        }
        try {
          const asset = prepareAsset(item.objText, item.upAxis, item.color);
          if (asset.triangles > MAX_TRIANGLES) {
            throw new Error(
              `The model has ${asset.triangles.toLocaleString("uk-UA")} triangles. ` +
                `Please simplify it to ${MAX_TRIANGLES.toLocaleString("uk-UA")} or fewer.`,
            );
          }
          scene.add(asset.group);
          loaded = {
            data: item,
            group: asset.group,
            assetHeight: asset.assetHeight,
            lastElevation: 0,
          };
          models.set(item.id, loaded);
        } catch (error) {
          console.error(`Could not prepare the 3D model for ${item.name}.`, error);
          continue;
        }
      } else {
        const previousColor = loaded.data.color;
        loaded.data = item;
        if (item.color !== previousColor) {
          applyColor(loaded, item.color);
        }
      }
      refreshPlacement(loaded);
    }
    map?.triggerRepaint();
  };

  // TEMP-DEBUG
  if (typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>).__building3d = {
      get map() {
        return map;
      },
      canvasRect: () => {
        const rect = map?.getCanvas().getBoundingClientRect();
        return rect
          ? [rect.left, rect.top, rect.width, rect.height]
          : null;
      },
      queryAt: (x: number, y: number) =>
        map
          ? map
              .queryRenderedFeatures([x, y])
              .filter((feature) => feature.sourceLayer === "building")
              .slice(0, 3)
              .map((feature) => ({
                id: feature.id,
                properties: feature.properties,
                geometry: feature.geometry,
              }))
          : [],
      unproject: (x: number, y: number) =>
        map ? map.unproject([x, y]).toArray() : null,
      snapshot: () =>
        Array.from(models.values()).map((model) => {
          const vertices: THREE.Vector3[] = [];
          model.group.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            const position = child.geometry.getAttribute("position");
            if (!position) return;
            for (let index = 0; index < position.count; index += 1) {
              vertices.push(
                new THREE.Vector3(
                  position.getX(index),
                  position.getY(index),
                  position.getZ(index),
                ).applyMatrix4(child.matrixWorld),
              );
            }
          });
          return {
            id: model.data.id,
            position: model.group.position.toArray(),
            scale: model.group.scale.toArray(),
            rotation: model.group.rotation.toArray(),
            visible: model.group.visible,
            children: model.group.children.length,
            matrix: (
              window as unknown as { __b3dMatrix?: number[] }
            ).__b3dMatrix ?? null,
            sampleWorld: vertices[0]?.toArray() ?? null,
            topWorld: vertices.reduce<THREE.Vector3 | null>(
              (top, vertex) =>
                !top || vertex.z > top.z ? vertex.clone() : top,
              null,
            )?.toArray() ?? null,
            vertCount: vertices.length,
            screen: map
              ? (() => {
                  const point = map.project([model.data.lng, model.data.lat]);
                  return [point.x, point.y];
                })()
              : null,
            canvas: map
              ? [map.getCanvas().width, map.getCanvas().height]
              : null,
            dpr: window.devicePixelRatio,
            center: map ? map.getCenter().toArray() : null,
          };
        }),
    };
  }

  const refreshElevations = (): void => {
    if (!map) return;
    let changed = false;
    for (const model of models.values()) {
      const elevation =
        map.queryTerrainElevation([model.data.lng, model.data.lat]) ?? 0;
      if (Math.abs(elevation - model.lastElevation) < 0.01) continue;
      refreshPlacement(model);
      changed = true;
    }
    if (changed) map.triggerRepaint();
  };

  const layer: Building3DLayer = {
    id: "wayme-building-models-3d",
    type: "custom",
    renderingMode: "3d",
    setModels,
    onAdd: (mapInstance, gl) => {
      map = mapInstance;
      // TEMP-DEBUG: a magenta cube at the map centre, 40 m tall.
      const center = MercatorCoordinate.fromLngLat(mapInstance.getCenter());
      const centerMeters = center.meterInMercatorCoordinateUnits();
      debugMesh.position.set(center.x, center.y, center.z + 20 * centerMeters);
      debugMesh.scale.setScalar(centerMeters * 40);
      renderer = new THREE.WebGLRenderer({
        canvas: mapInstance.getCanvas(),
        context: gl,
        antialias: true,
      });
      renderer.autoClear = false;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.06;
      mapInstance.on("idle", refreshElevations);
      mapInstance.on("terrain", refreshElevations);
    },
    render: (_gl, { defaultProjectionData }) => {
      if (!map || !renderer || models.size === 0) return;
      (window as unknown as { __b3dMatrix?: number[] }).__b3dMatrix =
        Array.from(defaultProjectionData.mainMatrix);
      camera.projectionMatrix.fromArray(defaultProjectionData.mainMatrix);
      renderer.resetState();
      renderer.render(scene, camera);
      renderer.resetState();
    },
    onRemove: () => {
      for (const model of models.values()) disposeObject(model.group);
      models.clear();
      scene.clear();
      if (map) {
        map.off("idle", refreshElevations);
        map.off("terrain", refreshElevations);
      }
      renderer?.dispose();
      renderer = null;
      map = null;
    },
  };

  return layer;
}
