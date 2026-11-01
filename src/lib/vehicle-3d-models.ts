import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Vehicle3DData } from "./vehicle-3d-layer";

type VehicleType = Vehicle3DData["type"];

/** Low-poly tram, trolleybus and bus geometry, merged per vehicle type for instancing. */

export type Face = "front" | "left" | "right";

export const solidCache = new Map<number, THREE.MeshLambertMaterial>();
export function solid(color: number): THREE.MeshLambertMaterial {
  let material = solidCache.get(color);
  if (!material) {
    material = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide });
    solidCache.set(color, material);
  }
  return material;
}

// Marks LED panels while the model is built. Replaced by the atlas shader on merge.
export const LED_PLACEHOLDER = new THREE.MeshBasicMaterial();

export function box(
  w: number, l: number, h: number,
  material: THREE.Material,
  x: number, y: number, z: number,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, l, h), material);
  mesh.position.set(x, y, z);
  return mesh;
}

export function wheel(x: number, y: number, r = 0.5, thickness = 0.3): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, thickness, 14),
    solid(0x1f2937),
  );
  mesh.position.set(x, y, r);
  return mesh;
}

export const FACE_BASIS: Record<Face, [THREE.Vector3, THREE.Vector3, THREE.Vector3]> = {
  front: [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)],
  left: [new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0)],
  right: [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -1, 0)],
};

export function panel(
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

export type BodyOptions = { led?: boolean; front?: boolean; side?: boolean };

// Length runs along +x (front), width along y, height along z (meters).
export function body(
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

export function pole(group: THREE.Group, y: number, z: number, x: number): void {
  const holder = new THREE.Group();
  holder.position.set(x, y, z);
  holder.rotation.z = 0.42;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 6), solid(0x111827));
  arm.rotation.z = Math.PI / 2;
  arm.position.x = -3;
  holder.add(arm);
  group.add(holder);
}

export function createTram(bodyMaterial: THREE.Material): THREE.Group {
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

export function createTrolleybus(bodyMaterial: THREE.Material): THREE.Group {
  const group = body(12, 2.55, 2.9, bodyMaterial, 0, { led: true });
  pole(group, 0.55, 3.6, -2.5);
  pole(group, -0.55, 3.6, -2.5);
  return group;
}

// Keeps only the attributes every merged part must share.
export function pickAttributes(geometry: THREE.BufferGeometry, names: string[]): THREE.BufferGeometry {
  const picked = new THREE.BufferGeometry();
  for (const name of names) {
    const attribute = geometry.getAttribute(name);
    if (attribute) picked.setAttribute(name, attribute);
  }
  if (geometry.index) picked.setIndex(geometry.index);
  return picked;
}

export function withVertexColor(geometry: THREE.BufferGeometry, color: THREE.Color): THREE.BufferGeometry {
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

export function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error("Vehicle model parts do not share attributes.");
  return merged;
}

export type ModelParts = {
  bodyMaterial: THREE.MeshLambertMaterial;
  body: THREE.BufferGeometry;
  trim: THREE.BufferGeometry;
  led: THREE.BufferGeometry;
};

// Builds one vehicle type as three merged geometries: painted body, vertex-colored trim, and LED panels.
export function buildModelParts(type: VehicleType, paint: number): ModelParts {
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
