import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MercatorCoordinate } from "maplibre-gl";
import type {
  CustomLayerInterface,
  Map as MapLibreMap,
} from "maplibre-gl";
import { vehicleFleetColor } from "./fleet";
import { resolveColor } from "./design-colors";

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

type Face = "front" | "left" | "right";

const TILE_SIZE = 512;
const PLATE_HEIGHT_M = 3.6;
const PLATE_MIN_ZOOM = 14;
const MOVE_EASE = 0.16;
const INSTANCE_CAPACITY = 2048;

// Route numbers are drawn once into a shared LED atlas; each instance picks its cell.
const LED_DOT = 6;
const LED_PIXEL_W = 44;
const LED_PIXEL_H = 12;
const LED_CELL_W = LED_PIXEL_W * LED_DOT;
const LED_CELL_H = LED_PIXEL_H * LED_DOT;
const LED_GRID_COLS = 8;
const LED_GRID_ROWS = 32;

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

const solidCache = new Map<number, THREE.MeshLambertMaterial>();
function solid(color: number): THREE.MeshLambertMaterial {
  let material = solidCache.get(color);
  if (!material) {
    material = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide });
    solidCache.set(color, material);
  }
  return material;
}

// Marks LED panels while the model is built. Replaced by the atlas shader on merge.
const LED_PLACEHOLDER = new THREE.MeshBasicMaterial();

function box(
  w: number, l: number, h: number,
  material: THREE.Material,
  x: number, y: number, z: number,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, l, h), material);
  mesh.position.set(x, y, z);
  return mesh;
}

function wheel(x: number, y: number, r = 0.5, thickness = 0.3): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, thickness, 14),
    solid(0x1f2937),
  );
  mesh.position.set(x, y, r);
  return mesh;
}

const FACE_BASIS: Record<Face, [THREE.Vector3, THREE.Vector3, THREE.Vector3]> = {
  front: [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)],
  left: [new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0)],
  right: [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -1, 0)],
};

function panel(
  width: number,
  height: number,
  material: THREE.Material,
  face: Face,
  position: [number, number, number],
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.quaternion.setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(...FACE_BASIS[face]),
  );
  mesh.position.set(...position);
  return mesh;
}

type BodyOptions = { led?: boolean; front?: boolean; side?: boolean };

// Length runs along +x (front), width along y, height along z (meters).
function body(
  length: number,
  width: number,
  height: number,
  material: THREE.Material,
  offset: number,
  options: BodyOptions = {},
): THREE.Group {
  const group = new THREE.Group();
  const base = 0.55;
  const dark = solid(0x0f172a);

  group.add(box(length, width, height, material, offset, 0, base + height / 2));
  group.add(box(length * 0.94, width + 0.05, height * 0.36, solid(0x1e293b), offset, 0, base + height * 0.55));
  group.add(box(length * 0.9, width * 0.9, 0.12, solid(0xe5e7eb), offset, 0, base + height + 0.06));
  group.add(box(0.1, width * 0.88, height * 0.42, dark, offset + length / 2, 0, base + height * 0.52));
  group.add(box(0.14, width * 0.8, 0.08, solid(0x111827), offset + length / 2, 0, base + 0.12));
  for (const side of [-1, 1]) {
    group.add(box(0.12, 0.35, 0.22, solid(0xfff7c2), offset + length / 2, side * width * 0.32, base + 0.35));
  }
  for (const along of [-0.33, 0.33]) {
    for (const side of [-1, 1]) {
      group.add(wheel(offset + length * along, (side * width) / 2));
    }
  }
  if (options.led) {
    const ledZ = base + height * 0.86;
    if (options.front !== false) {
      group.add(panel(width * 0.72, (width * 0.72 * 12) / 44, LED_PLACEHOLDER, "front", [offset + length / 2 + 0.07, 0, ledZ]));
    }
    if (options.side !== false) {
      const sides: [Face, number][] = [
        ["left", width / 2 + 0.03],
        ["right", -width / 2 - 0.03],
      ];
      for (const [face, y] of sides) {
        group.add(panel(1.9, (1.9 * 12) / 44, LED_PLACEHOLDER, face, [offset + length * 0.3, y, ledZ]));
      }
    }
  }
  return group;
}

function pole(group: THREE.Group, y: number, z: number, x: number): void {
  const holder = new THREE.Group();
  holder.position.set(x, y, z);
  holder.rotation.z = 0.42;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 6), solid(0x111827));
  arm.rotation.z = Math.PI / 2;
  arm.position.x = -3;
  holder.add(arm);
  group.add(holder);
}

function createTram(bodyMaterial: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  group.add(body(9, 2.4, 3, bodyMaterial, 4.8, { led: true }));
  group.add(body(9, 2.4, 3, bodyMaterial, -4.8, { led: true, front: false }));
  group.add(box(1.4, 2.2, 2.6, solid(0x111827), 0, 0, 1.9));
  const pantograph = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2), solid(0x111827));
  pantograph.position.set(4.5, 0, 4.8);
  pantograph.rotation.z = 0.9;
  group.add(pantograph);
  return group;
}

function createTrolleybus(bodyMaterial: THREE.Material): THREE.Group {
  const group = body(12, 2.55, 2.9, bodyMaterial, 0, { led: true });
  pole(group, 0.55, 3.6, -2.5);
  pole(group, -0.55, 3.6, -2.5);
  return group;
}

// Keeps only the attributes every merged part must share.
function pickAttributes(geometry: THREE.BufferGeometry, names: string[]): THREE.BufferGeometry {
  const picked = new THREE.BufferGeometry();
  for (const name of names) {
    const attribute = geometry.getAttribute(name);
    if (attribute) picked.setAttribute(name, attribute);
  }
  if (geometry.index) picked.setIndex(geometry.index);
  return picked;
}

function withVertexColor(geometry: THREE.BufferGeometry, color: THREE.Color): THREE.BufferGeometry {
  const count = geometry.getAttribute("position").count;
  const colors = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error("Vehicle model parts do not share attributes.");
  return merged;
}

type ModelParts = {
  bodyMaterial: THREE.MeshLambertMaterial;
  body: THREE.BufferGeometry;
  trim: THREE.BufferGeometry;
  led: THREE.BufferGeometry;
};

// Builds one vehicle type as three merged geometries: painted body, vertex-colored trim, and LED panels.
function buildModelParts(type: VehicleType, paint: number): ModelParts {
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: paint, side: THREE.DoubleSide });
  const root =
    type === "tram"
      ? createTram(bodyMaterial)
      : type === "trolleybus"
        ? createTrolleybus(bodyMaterial)
        : body(12, 2.55, 2.8, bodyMaterial, 0, { led: true });
  root.updateMatrixWorld(true);

  const bodyParts: THREE.BufferGeometry[] = [];
  const trimParts: THREE.BufferGeometry[] = [];
  const ledParts: THREE.BufferGeometry[] = [];
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
    if (object.material === bodyMaterial) {
      bodyParts.push(pickAttributes(geometry, ["position", "normal"]));
    } else if (object.material === LED_PLACEHOLDER) {
      ledParts.push(pickAttributes(geometry, ["position", "normal", "uv"]));
    } else {
      const color = (object.material as THREE.MeshLambertMaterial).color;
      trimParts.push(withVertexColor(pickAttributes(geometry, ["position", "normal"]), color));
    }
  });
  return {
    bodyMaterial,
    body: mergeParts(bodyParts),
    trim: mergeParts(trimParts),
    led: mergeParts(ledParts),
  };
}

const LED_VERTEX_SHADER = `
attribute float ledCell;
varying vec2 vUv;
varying float vCell;
void main() {
  vUv = uv;
  vCell = ledCell;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}
`;

const LED_FRAGMENT_SHADER = `
uniform sampler2D atlas;
uniform vec2 grid;
varying vec2 vUv;
varying float vCell;
void main() {
  float column = mod(vCell, grid.x);
  float row = floor(vCell / grid.x);
  vec2 atlasUv = vec2((column + vUv.x) / grid.x, 1.0 - (row + 1.0 - vUv.y) / grid.y);
  gl_FragColor = texture2D(atlas, atlasUv);
}
`;

// Orange dot-matrix route display, same look as the prototype's LED boards.
function drawLedCell(context: CanvasRenderingContext2D, text: string, column: number, row: number): void {
  const source = document.createElement("canvas");
  source.width = LED_PIXEL_W;
  source.height = LED_PIXEL_H;
  const sourceContext = source.getContext("2d");
  if (!sourceContext) return;
  sourceContext.font = "bold 11px Arial";
  sourceContext.textAlign = "center";
  sourceContext.fillStyle = resolveColor("var(--art-white)");
  sourceContext.fillText(text, LED_PIXEL_W / 2, LED_PIXEL_H - 1.5);
  const pixels = sourceContext.getImageData(0, 0, LED_PIXEL_W, LED_PIXEL_H).data;

  const originX = column * LED_CELL_W;
  const originY = row * LED_CELL_H;
  context.fillStyle = resolveColor("var(--led-off)");
  context.fillRect(originX, originY, LED_CELL_W, LED_CELL_H);
  const ledOn = resolveColor("var(--led-on)");
  const ledDim = resolveColor("var(--led-dim)");
  for (let y = 0; y < LED_PIXEL_H; y += 1) {
    for (let x = 0; x < LED_PIXEL_W; x += 1) {
      context.fillStyle = pixels[(y * LED_PIXEL_W + x) * 4 + 3] > 110 ? ledOn : ledDim;
      context.beginPath();
      context.arc(originX + x * LED_DOT + LED_DOT / 2, originY + y * LED_DOT + LED_DOT / 2, 2.3, 0, Math.PI * 2);
      context.fill();
    }
  }
}

function createLedAtlas(): { texture: THREE.CanvasTexture; cellFor: (route: string) => number } {
  const canvas = document.createElement("canvas");
  canvas.width = LED_GRID_COLS * LED_CELL_W;
  canvas.height = LED_GRID_ROWS * LED_CELL_H;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  const cells = new Map<string, number>();
  const cellFor = (route: string): number => {
    const existing = cells.get(route);
    if (existing !== undefined) return existing;
    const index = cells.size;
    // Past the atlas capacity a route reuses cell 0. Real fleets stay well below 256 routes.
    if (!context || index >= LED_GRID_COLS * LED_GRID_ROWS) return 0;
    cells.set(route, index);
    drawLedCell(context, route, index % LED_GRID_COLS, Math.floor(index / LED_GRID_COLS));
    texture.needsUpdate = true;
    return index;
  };
  return { texture, cellFor };
}

function splitTripEnds(destination: string): [string | null, string] {
  const parts = destination.split(" - ");
  if (parts.length < 2) return [null, destination];
  return [parts[0], parts.slice(1).join(" - ")];
}

function parseColor(hex: string): number {
  return Number.parseInt(hex.replace("#", ""), 16);
}

type PlateCardStep = { step: HTMLElement; value: HTMLElement };
type PlateCard = {
  route: HTMLElement;
  start: PlateCardStep;
  next: PlateCardStep;
  end: PlateCardStep;
};

function setPlateCardStep(step: PlateCardStep, value: string | null): void {
  step.step.hidden = !value;
  step.value.textContent = value ?? "";
}

// The only DOM vehicle element: the trip card of the selected vehicle.
function createSelectedPlate(onSelect: () => void): {
  plate: HTMLButtonElement;
  plateText: HTMLSpanElement;
  plateCard: PlateCard;
} {
  const plate = document.createElement("button");
  plate.type = "button";
  plate.className = "vehicle-plate selected";
  plate.addEventListener("click", onSelect);

  const main = document.createElement("span");
  main.className = "vehicle-plate-main";
  const flag = document.createElement("b");
  flag.textContent = "UA";
  const plateText = document.createElement("span");
  main.append(flag, plateText);

  const card = document.createElement("span");
  card.className = "vehicle-plate-card";
  const cardRoute = document.createElement("i");
  cardRoute.className = "vehicle-plate-card-route";
  const steps = document.createElement("span");
  steps.className = "vehicle-plate-card-steps";
  const createStep = (icon: string, label: string, modifier?: string): PlateCardStep => {
    const step = document.createElement("span");
    step.className = modifier ? `vehicle-plate-step ${modifier}` : "vehicle-plate-step";
    const glyph = document.createElement("span");
    glyph.className = "material-symbols-rounded";
    glyph.setAttribute("aria-hidden", "true");
    glyph.textContent = icon;
    const text = document.createElement("span");
    text.className = "vehicle-plate-step-text";
    const caption = document.createElement("small");
    caption.textContent = label;
    const value = document.createElement("b");
    text.append(caption, value);
    step.append(glyph, text);
    steps.appendChild(step);
    return { step, value };
  };
  const plateCard: PlateCard = {
    route: cardRoute,
    start: createStep("trip_origin", "Початкова"),
    next: createStep("location_on", "Наступна", "is-next"),
    end: createStep("flag", "Кінцева"),
  };
  card.append(cardRoute, steps);
  plate.append(card, main);
  return { plate, plateText, plateCard };
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
