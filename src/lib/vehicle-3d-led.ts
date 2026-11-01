import * as THREE from "three";
import { resolveColor } from "./design-colors";

/** LED destination signs: one canvas atlas of route numbers and the shader that samples it per instance. */

// Route numbers are drawn once into a shared LED atlas; each instance picks its cell.
export const LED_DOT = 6;
export const LED_PIXEL_W = 44;
export const LED_PIXEL_H = 12;
export const LED_CELL_W = LED_PIXEL_W * LED_DOT;
export const LED_CELL_H = LED_PIXEL_H * LED_DOT;
export const LED_GRID_COLS = 8;
export const LED_GRID_ROWS = 32;

export const LED_VERTEX_SHADER = `
attribute float ledCell;
varying vec2 vUv;
varying float vCell;
void main() {
  vUv = uv;
  vCell = ledCell;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}
`;

export const LED_FRAGMENT_SHADER = `
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
export function drawLedCell(context: CanvasRenderingContext2D, text: string, column: number, row: number): void {
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

export function createLedAtlas(): { texture: THREE.CanvasTexture; cellFor: (route: string) => number } {
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
