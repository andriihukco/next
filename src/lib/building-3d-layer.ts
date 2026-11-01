import * as THREE from "three";
import { MercatorCoordinate } from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import { BuildingModelData, Building3DLayer, LoadedModel } from "./building-3d-types";
import { MAX_TRIANGLES, disposeObject, prepareAsset, applyColor } from "./building-3d-assets";

export { inspectBuildingModel, footprintLongestBearing, suggestedRotationForInspection } from "./building-3d-assets";
export type {
  Building3DLayer,
  BuildingModelData,
  BuildingModelInspection,
  BuildingModelSource,
  BuildingModelUpAxis,
} from "./building-3d-types";

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
        loaded.data.source !== item.source ||
        loaded.data.upAxis !== item.upAxis;

      if (needsRebuild) {
        if (loaded) {
          scene.remove(loaded.group);
          disposeObject(loaded.group);
          models.delete(item.id);
        }
        try {
          const asset = prepareAsset(item.source, item.upAxis, item.color);
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
