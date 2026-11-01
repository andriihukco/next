import * as THREE from "three";
import { MercatorCoordinate } from "maplibre-gl";
import type { CustomLayerInterface, Map as MapLibreMap } from "maplibre-gl";
import { vehicleFleetColor } from "./fleet";
import { buildModelParts } from "./vehicle-3d-models";
import {
  LED_GRID_COLS,
  LED_GRID_ROWS,
  LED_VERTEX_SHADER,
  LED_FRAGMENT_SHADER,
  createLedAtlas,
} from "./vehicle-3d-led";
import {
  splitTripEnds,
  parseColor,
  setPlateCardStep,
  createSelectedPlate,
} from "./vehicle-3d-plate";

export type Vehicle3DData = {
  id: string;
  type: "tram" | "trolleybus" | "bus";
  route: string;
  /** Route start and end, as shown on the vehicle, e.g. "м. Дубляни - пл. Галицька". */
  destination: string;
  plate: string;
  /** Next stop on the trip, or null when unknown. */
  stopName: string | null;
  lat: number;
  lng: number;
  bearing: number;
  selected: boolean;
};

export type Vehicle3DLayerOptions = {
  onSelect?: (id: string) => void;
};

export type Vehicle3DLayer = CustomLayerInterface & {
  setVehicles: (vehicles: Vehicle3DData[]) => void;
};

type VehicleType = Vehicle3DData["type"];

type VehicleState = {
  data: Vehicle3DData;
  metersInMercatorUnits: number;
  // Absolute mercator position; instances are placed relative to the map center each frame.
  position: THREE.Vector3;
  target: THREE.Vector3;
  rotation: number;
  targetRotation: number;
  moving: boolean;
};

// One set of instanced meshes per vehicle type. `visible` holds the vehicles
// inside the viewport, in instance order.
type Fleet = {
  body: THREE.InstancedMesh;
  meshes: THREE.InstancedMesh[];
  ledCells: THREE.InstancedBufferAttribute;
  visible: VehicleState[];
};


const TILE_SIZE = 512;
const PLATE_HEIGHT_M = 3.6;
const PLATE_MIN_ZOOM = 14;
const MOVE_EASE = 0.16;
const INSTANCE_CAPACITY = 2048;


// Pixel-space readability: vehicles grow as the map zooms out, like the prototype.
function legibilityScale(zoom: number): number {
  return Math.min(6, Math.max(1, Math.pow(2, 18.3 - zoom)));
}

function shortestAngleDelta(current: number, target: number): number {
  const diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  return diff < -Math.PI ? diff + Math.PI * 2 : diff;
}

function smoothAngle(current: number, target: number, amount: number): number {
  return current + shortestAngleDelta(current, target) * amount;
}


const zAxis = new THREE.Vector3(0, 0, 1);

export function createVehicle3DLayer(options: Vehicle3DLayerOptions = {}): Vehicle3DLayer {
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const states = new Map<string, VehicleState>();
  const fleets = new Map<VehicleType, Fleet>();
  const originMatrix = new THREE.Matrix4();
  const instanceMatrix = new THREE.Matrix4();
  const tmpPosition = new THREE.Vector3();
  const tmpQuaternion = new THREE.Quaternion();
  const tmpScale = new THREE.Vector3();
  const plateLayer = document.createElement("div");
  plateLayer.className = "vehicle-plates";
  const selectedPlate = createSelectedPlate(() => {
    if (selectedId) options.onSelect?.(selectedId);
  });
  plateLayer.appendChild(selectedPlate.plate);
  let selectedId: string | null = null;
  let selectedState: VehicleState | null = null;
  let map: MapLibreMap | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let dirty = true;
  let visibleKey = "";

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const sunlight = new THREE.DirectionalLight(0xffffff, 0.75);
  sunlight.position.set(-30, -40, 80);
  scene.add(sunlight);

  const atlas = createLedAtlas();
  const ledMaterial = new THREE.ShaderMaterial({
    uniforms: {
      atlas: { value: atlas.texture },
      grid: { value: new THREE.Vector2(LED_GRID_COLS, LED_GRID_ROWS) },
    },
    vertexShader: LED_VERTEX_SHADER,
    fragmentShader: LED_FRAGMENT_SHADER,
    side: THREE.DoubleSide,
  });
  const trimMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });

  for (const type of ["bus", "tram", "trolleybus"] as const) {
    const parts = buildModelParts(type, parseColor(vehicleFleetColor(type)));
    const body = new THREE.InstancedMesh(parts.body, parts.bodyMaterial, INSTANCE_CAPACITY);
    const trim = new THREE.InstancedMesh(parts.trim, trimMaterial, INSTANCE_CAPACITY);
    const led = new THREE.InstancedMesh(parts.led, ledMaterial, INSTANCE_CAPACITY);
    // All three meshes share one matrix buffer, so each frame uploads matrices once.
    body.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    trim.instanceMatrix = body.instanceMatrix;
    led.instanceMatrix = body.instanceMatrix;
    const ledCells = new THREE.InstancedBufferAttribute(new Float32Array(INSTANCE_CAPACITY), 1);
    led.geometry.setAttribute("ledCell", ledCells);
    const meshes = [body, trim, led];
    for (const mesh of meshes) {
      mesh.frustumCulled = false;
      mesh.count = 0;
      scene.add(mesh);
    }
    fleets.set(type, { body, meshes, ledCells, visible: [] });
  }

  const createState = (vehicle: Vehicle3DData): VehicleState => {
    const point = maplibreglMercatorPoint(vehicle.lng, vehicle.lat);
    const rotation = (vehicle.bearing * Math.PI) / 180 - Math.PI / 2;
    return {
      data: vehicle,
      metersInMercatorUnits: point.metersInMercatorUnits,
      position: new THREE.Vector3(point.x, point.y, point.z),
      target: new THREE.Vector3(point.x, point.y, point.z),
      rotation,
      targetRotation: rotation,
      moving: false,
    };
  };

  const updatePlateCard = (vehicle: Vehicle3DData): void => {
    const { plate, plateText, plateCard } = selectedPlate;
    plate.classList.add("selected");
    plateText.textContent = vehicle.plate;
    plateCard.route.textContent = vehicle.route;
    plateCard.route.style.setProperty("--route-color", vehicleFleetColor(vehicle.type));
    const [tripStart, tripEnd] = splitTripEnds(vehicle.destination);
    setPlateCardStep(plateCard.start, tripStart);
    setPlateCardStep(plateCard.next, vehicle.stopName ?? "—");
    setPlateCardStep(plateCard.end, tripEnd);
  };

  const setVehicles = (vehicles: Vehicle3DData[]): void => {
    const present = new Set<string>();
    selectedId = null;
    selectedState = null;
    for (const vehicle of vehicles) {
      present.add(vehicle.id);
      const point = maplibreglMercatorPoint(vehicle.lng, vehicle.lat);
      const state = states.get(vehicle.id);
      if (state) {
        state.data = vehicle;
        state.metersInMercatorUnits = point.metersInMercatorUnits;
        state.target.set(point.x, point.y, point.z);
        state.targetRotation = (vehicle.bearing * Math.PI) / 180 - Math.PI / 2;
      } else {
        states.set(vehicle.id, createState(vehicle));
      }
      if (vehicle.selected) {
        selectedId = vehicle.id;
        selectedState = states.get(vehicle.id) ?? null;
      }
    }
    for (const id of states.keys()) {
      if (!present.has(id)) states.delete(id);
    }
    if (selectedState) updatePlateCard(selectedState.data);
    dirty = true;
    map?.triggerRepaint();
  };

  // Packs the vehicles inside the padded viewport into each fleet's instances.
  // The selected vehicle is always kept, so its trip card stays anchored.
  const repack = (west: number, south: number, east: number, north: number): void => {
    for (const fleet of fleets.values()) fleet.visible.length = 0;
    for (const state of states.values()) {
      const { lng, lat, selected } = state.data;
      const inside = lng >= west && lng <= east && lat >= south && lat <= north;
      if (!selected && !inside) continue;
      const fleet = fleets.get(state.data.type);
      if (!fleet || fleet.visible.length >= INSTANCE_CAPACITY) continue;
      fleet.visible.push(state);
    }
    for (const fleet of fleets.values()) {
      fleet.visible.forEach((state, index) => {
        fleet.ledCells.setX(index, atlas.cellFor(state.data.route));
      });
      fleet.ledCells.needsUpdate = true;
      for (const mesh of fleet.meshes) mesh.count = fleet.visible.length;
    }
  };

  const ease = (state: VehicleState): void => {
    const gap = state.position.distanceToSquared(state.target);
    const turn = shortestAngleDelta(state.rotation, state.targetRotation);
    state.moving = gap > 1e-16 || Math.abs(turn) > 0.001;
    state.position.lerp(state.target, MOVE_EASE);
    state.rotation = smoothAngle(state.rotation, state.targetRotation, MOVE_EASE);
  };

  const layer: Vehicle3DLayer = {
    id: "un-vehicles-3d",
    type: "custom",
    renderingMode: "3d",
    setVehicles,
    onAdd: (mapInstance, gl) => {
      map = mapInstance;
      mapInstance.getContainer().appendChild(plateLayer);
      renderer = new THREE.WebGLRenderer({
        canvas: mapInstance.getCanvas(),
        context: gl,
        antialias: true,
      });
      renderer.autoClear = false;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    },
    render: (_gl, { defaultProjectionData }) => {
      if (!map || !renderer) return;
      const zoom = map.getZoom();
      const center = map.getCenter();
      const origin = MercatorCoordinate.fromLngLat([center.lng, center.lat]);
      // Projection is applied around the map center in double precision, so vehicles
      // are positioned relative to it instead of at absolute mercator coordinates
      // (which lose ~1 m of detail in float32 and make the models look broken).
      camera.projectionMatrix
        .fromArray(defaultProjectionData.mainMatrix)
        .multiply(originMatrix.makeTranslation(origin.x, origin.y, 0));

      // Viewport culling: repack only when the padded bounds move or the data changes.
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const lngPad = (ne.lng - sw.lng) * 0.5;
      const latPad = (ne.lat - sw.lat) * 0.5;
      const west = sw.lng - lngPad;
      const south = sw.lat - latPad;
      const east = ne.lng + lngPad;
      const north = ne.lat + latPad;
      const key = [west, south, east, north].map((value) => value.toFixed(4)).join(",");
      if (dirty || key !== visibleKey) {
        visibleKey = key;
        dirty = false;
        repack(west, south, east, north);
      }

      const sizeScale = legibilityScale(zoom);
      const pixelsPerMercatorUnit = TILE_SIZE * Math.pow(2, zoom);
      let needsRepaint = false;

      for (const state of states.values()) ease(state);

      for (const fleet of fleets.values()) {
        fleet.visible.forEach((state, index) => {
          if (state.moving) needsRepaint = true;
          const unitScale =
            state.metersInMercatorUnits * sizeScale * (state.data.selected ? 1.12 : 1);
          tmpPosition.set(
            state.position.x - origin.x,
            state.position.y - origin.y,
            state.position.z,
          );
          tmpQuaternion.setFromAxisAngle(zAxis, state.rotation);
          tmpScale.setScalar(unitScale);
          instanceMatrix.compose(tmpPosition, tmpQuaternion, tmpScale);
          fleet.body.setMatrixAt(index, instanceMatrix);
        });
        fleet.body.instanceMatrix.needsUpdate = true;
      }

      if (selectedState && zoom >= PLATE_MIN_ZOOM) {
        const unitScale = selectedState.metersInMercatorUnits * sizeScale * 1.12;
        const anchor = map.project(
          new MercatorCoordinate(selectedState.position.x, selectedState.position.y).toLngLat(),
        );
        const lift = PLATE_HEIGHT_M * unitScale * pixelsPerMercatorUnit * 0.75 + 8;
        selectedPlate.plate.style.display = "";
        selectedPlate.plate.style.transform = `translate(${anchor.x}px, ${anchor.y - lift}px) translate(-50%, -100%)`;
      } else {
        selectedPlate.plate.style.display = "none";
      }

      renderer.resetState();
      renderer.render(scene, camera);
      renderer.resetState();
      if (needsRepaint) map.triggerRepaint();
    },
    onRemove: () => {
      for (const fleet of fleets.values()) {
        for (const mesh of fleet.meshes) mesh.geometry.dispose();
        fleet.body.dispose();
      }
      fleets.clear();
      states.clear();
      scene.clear();
      plateLayer.remove();
      renderer?.dispose();
      renderer = null;
      map = null;
    },
  };
  return layer;
}

function maplibreglMercatorPoint(
  lng: number,
  lat: number,
): { x: number; y: number; z: number; metersInMercatorUnits: number } {
  const coordinate = MercatorCoordinate.fromLngLat([lng, lat]);
  return {
    x: coordinate.x,
    y: coordinate.y,
    z: coordinate.z,
    metersInMercatorUnits: coordinate.meterInMercatorCoordinateUnits(),
  };
}
