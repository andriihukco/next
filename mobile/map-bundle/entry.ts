// Entry for the map page's 3D vehicle layer. Built by scripts/build-map-3d.mjs.
// The layer itself lives in the web app (src/lib/vehicle-3d-layer.ts) and is reused as-is.
import { createVehicle3DLayer } from "../../src/lib/vehicle-3d-layer";

declare global {
  interface Window {
    __vehicle3d: { createVehicle3DLayer: typeof createVehicle3DLayer };
  }
}
window.__vehicle3d = { createVehicle3DLayer };
