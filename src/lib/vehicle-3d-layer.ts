import * as THREE from "three";
import { MercatorCoordinate } from "maplibre-gl";
import type {
  CustomLayerInterface,
  Map as MapLibreMap,
} from "maplibre-gl";
import { vehicleFleetColor } from "./fleet";

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

type PlateCardStep = { step: HTMLElement; value: HTMLElement };
type PlateCard = {
  route: HTMLElement;
  start: PlateCardStep;
  next: PlateCardStep;
  end: PlateCardStep;
};

type VehicleModel = {
  key: string;
  group: THREE.Group;
  plate: HTMLButtonElement;
  plateText: HTMLSpanElement;
  plateCard: PlateCard;
  metersInMercatorUnits: number;
  // Absolute mercator position; the group is placed relative to the map center each frame.
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  targetBearing: number;
  selected: boolean;
  placed: boolean;
};

type Face = "front" | "left" | "right";

const TILE_SIZE = 512;
const PLATE_HEIGHT_M = 3.6;
const PLATE_MIN_ZOOM = 14;
// Below this zoom, unselected vehicles show only the route number; details appear when zoomed in.
const PLATE_DETAIL_MIN_ZOOM = 16;

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

// Orange dot-matrix route display, same look as the prototype's LED boards.
const ledCache = new Map<string, THREE.MeshBasicMaterial>();
function ledMaterial(text: string): THREE.MeshBasicMaterial {
  const cached = ledCache.get(text);
  if (cached) return cached;
  const GW = 44;
  const GH = 12;
  const K = 6;
  const source = document.createElement("canvas");
  source.width = GW;
  source.height = GH;
  const output = document.createElement("canvas");
  output.width = GW * K;
  output.height = GH * K;
  const sourceContext = source.getContext("2d");
  const outputContext = output.getContext("2d");
  if (sourceContext && outputContext) {
    sourceContext.font = "bold 11px Arial";
    sourceContext.textAlign = "center";
    sourceContext.fillStyle = "#fff";
    sourceContext.fillText(text, GW / 2, GH - 1.5);
    const pixels = sourceContext.getImageData(0, 0, GW, GH).data;
    outputContext.fillStyle = "#07070a";
    outputContext.fillRect(0, 0, output.width, output.height);
    for (let y = 0; y < GH; y += 1) {
      for (let x = 0; x < GW; x += 1) {
        outputContext.fillStyle = pixels[(y * GW + x) * 4 + 3] > 110 ? "#ff9d1c" : "#1b1109";
        outputContext.beginPath();
        outputContext.arc(x * K + K / 2, y * K + K / 2, 2.3, 0, Math.PI * 2);
        outputContext.fill();
      }
    }
  }
  const texture = new THREE.CanvasTexture(output);
  texture.anisotropy = 4;
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  ledCache.set(text, material);
  return material;
}

type BodyOptions = { route?: string; front?: boolean; side?: boolean };

// Length runs along +x (front), width along y, height along z (meters).
function body(
  length: number,
  width: number,
  height: number,
  color: number,
  offset: number,
  options: BodyOptions = {},
): THREE.Group {
  const group = new THREE.Group();
  const base = 0.55;
  const dark = solid(0x0f172a);

  group.add(box(length, width, height, solid(color), offset, 0, base + height / 2));
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
  if (options.route) {
    const led = ledMaterial(options.route);
    const ledZ = base + height * 0.86;
    if (options.front !== false) {
      group.add(panel(width * 0.72, (width * 0.72 * 12) / 44, led, "front", [offset + length / 2 + 0.07, 0, ledZ]));
    }
    if (options.side !== false) {
      const sides: [Face, number][] = [
        ["left", width / 2 + 0.03],
        ["right", -width / 2 - 0.03],
      ];
      for (const [face, y] of sides) {
        group.add(panel(1.9, (1.9 * 12) / 44, led, face, [offset + length * 0.3, y, ledZ]));
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

function parseColor(hex: string): number {
  return Number.parseInt(hex.replace("#", ""), 16);
}

function createTram(route: string, color: number): THREE.Group {
  const group = new THREE.Group();
  group.add(body(9, 2.4, 3, color, 4.8, { route }));
  group.add(body(9, 2.4, 3, color, -4.8, { route, front: false }));
  group.add(box(1.4, 2.2, 2.6, solid(0x111827), 0, 0, 1.9));
  const pantograph = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2), solid(0x111827));
  pantograph.position.set(4.5, 0, 4.8);
  pantograph.rotation.z = 0.9;
  group.add(pantograph);
  return group;
}

function createTrolleybus(route: string, color: number): THREE.Group {
  const group = body(12, 2.55, 2.9, color, 0, { route });
  pole(group, 0.55, 3.6, -2.5);
  pole(group, -0.55, 3.6, -2.5);
  return group;
}

function createVehicleTemplate(type: Vehicle3DData["type"], route: string, paint: string): THREE.Group {
  const color = parseColor(paint);
  const group =
    type === "tram"
      ? createTram(route, color)
      : type === "trolleybus"
        ? createTrolleybus(route, color)
        : body(12, 2.55, 2.8, color, 0, { route });
  group.traverse((object) => {
    object.frustumCulled = false;
  });
  return group;
}

// Models are built once per type/route/paint and cloned per vehicle, so geometry and materials are shared.
const templates = new Map<string, THREE.Group>();
function vehicleTemplate(type: Vehicle3DData["type"], route: string, paint: string): THREE.Group {
  const key = `${type}|${route}|${paint}`;
  let template = templates.get(key);
  if (!template) {
    template = createVehicleTemplate(type, route, paint);
    templates.set(key, template);
  }
  return template;
}

// "м. Дубляни - пл. Галицька" -> ["м. Дубляни", "пл. Галицька"]. Without a separator the whole text is the end.
function splitTripEnds(destination: string): [string | null, string] {
  const parts = destination.split(" - ");
  if (parts.length < 2) return [null, destination];
  return [parts[0], parts.slice(1).join(" - ")];
}

function setPlateCardStep(step: PlateCardStep, value: string | null): void {
  step.step.hidden = !value;
  step.value.textContent = value ?? "";
}

export function createVehicle3DLayer(options: Vehicle3DLayerOptions = {}): Vehicle3DLayer {
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const models = new Map<string, VehicleModel>();
  const plateLayer = document.createElement("div");
  plateLayer.className = "vehicle-plates";
  const originMatrix = new THREE.Matrix4();
  let map: MapLibreMap | null = null;
  let renderer: THREE.WebGLRenderer | null = null;

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const sunlight = new THREE.DirectionalLight(0xffffff, 0.75);
  sunlight.position.set(-30, -40, 80);
  scene.add(sunlight);

  const createPlate = (
    id: string,
    route: string,
    paint: string,
  ): Pick<VehicleModel, "plate" | "plateText" | "plateCard"> => {
    const plate = document.createElement("button");
    plate.type = "button";
    plate.className = "vehicle-plate";

    const main = document.createElement("span");
    main.className = "vehicle-plate-main";
    const flag = document.createElement("b");
    flag.textContent = "UA";
    const text = document.createElement("span");
    main.append(flag, text);

    const card = document.createElement("span");
    card.className = "vehicle-plate-card";
    const cardRoute = document.createElement("i");
    cardRoute.className = "vehicle-plate-card-route";
    cardRoute.textContent = route;
    cardRoute.style.setProperty("--route-color", paint);
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
    plate.addEventListener("click", () => options.onSelect?.(id));
    plateLayer.appendChild(plate);
    return { plate, plateText: text, plateCard };
  };

  const setVehicles = (vehicles: Vehicle3DData[]): void => {
    if (!map) return;
    const visibleIds = new Set(vehicles.map((vehicle) => vehicle.id));
    for (const [id, model] of models) {
      if (visibleIds.has(id)) continue;
      scene.remove(model.group);
      model.plate.remove();
      models.delete(id);
    }
    for (const vehicle of vehicles) {
      const paint = vehicleFleetColor(vehicle.type);
      const key = `${vehicle.type}|${vehicle.route}|${paint}`;
      let model = models.get(vehicle.id);
      if (!model || model.key !== key) {
        if (model) {
          scene.remove(model.group);
          model.plate.remove();
        }
        const group = vehicleTemplate(vehicle.type, vehicle.route, paint).clone();
        scene.add(group);
        model = {
          key,
          group,
          ...createPlate(vehicle.id, vehicle.route, paint),
          metersInMercatorUnits: 0,
          position: new THREE.Vector3(),
          targetPosition: new THREE.Vector3(),
          targetBearing: 0,
          selected: false,
          placed: false,
        };
        models.set(vehicle.id, model);
      }
      const point = maplibreglMercatorPoint(vehicle.lng, vehicle.lat);
      model.metersInMercatorUnits = point.metersInMercatorUnits;
      model.targetPosition.set(point.x, point.y, point.z);
      // Models face +x; compass bearing is clockwise from north, and mercator y points south.
      model.targetBearing = (vehicle.bearing * Math.PI) / 180 - Math.PI / 2;
      model.selected = vehicle.selected;
      model.plate.classList.toggle("selected", vehicle.selected);
      model.plateText.textContent = vehicle.plate;
      const [tripStart, tripEnd] = splitTripEnds(vehicle.destination);
      setPlateCardStep(model.plateCard.start, tripStart);
      setPlateCardStep(model.plateCard.next, vehicle.stopName ?? "—");
      setPlateCardStep(model.plateCard.end, tripEnd);
      if (!model.placed) {
        model.position.copy(model.targetPosition);
        model.group.rotation.z = model.targetBearing;
        model.placed = true;
      }
    }
    map.triggerRepaint();
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
      const sizeScale = legibilityScale(zoom);
      const pixelsPerMercatorUnit = TILE_SIZE * Math.pow(2, zoom);
      const showPlates = zoom >= PLATE_MIN_ZOOM;
      const showDetails = zoom >= PLATE_DETAIL_MIN_ZOOM;
      let needsRepaint = false;

      for (const model of models.values()) {
        model.position.lerp(model.targetPosition, 0.16);
        model.group.position.set(
          model.position.x - origin.x,
          model.position.y - origin.y,
          model.position.z,
        );
        model.group.rotation.z = smoothAngle(
          model.group.rotation.z,
          model.targetBearing,
          0.16,
        );
        if (
          model.position.distanceToSquared(model.targetPosition) > 1e-16 ||
          Math.abs(shortestAngleDelta(model.group.rotation.z, model.targetBearing)) >
            0.001
        ) {
          needsRepaint = true;
        }
        const unitScale =
          model.metersInMercatorUnits *
          sizeScale *
          (model.selected ? 1.12 : 1);
        model.group.scale.setScalar(unitScale);

        const anchor = map.project(
          new MercatorCoordinate(model.position.x, model.position.y).toLngLat(),
        );
        const lift = PLATE_HEIGHT_M * unitScale * pixelsPerMercatorUnit * 0.75 + 8;
        model.plate.style.display = showPlates ? "" : "none";
        model.plate.classList.toggle("is-compact", !showDetails && !model.selected);
        model.plate.style.transform = `translate(${anchor.x}px, ${anchor.y - lift}px) translate(-50%, -100%)`;
      }

      renderer.resetState();
      renderer.render(scene, camera);
      renderer.resetState();
      if (needsRepaint) map.triggerRepaint();
    },
    onRemove: () => {
      for (const model of models.values()) model.plate.remove();
      models.clear();
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
