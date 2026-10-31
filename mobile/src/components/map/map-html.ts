// MapLibre GL JS page for the WebView. It uses the same OpenFreeMap style as the web app,
// so the 3D building layer is the same. Native code talks to it with JSON messages.
import { VEHICLE_3D_BUNDLE_BASE64, VEHICLE_PLATE_CSS } from "./vehicle-3d.generated";

export const MAP_HTML = `<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<link href="https://cdn.jsdelivr.net/npm/maplibre-gl@6.14.0/dist/maplibre-gl.css" rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
<style>
  /* Design tokens from DESIGN.md §2, used by the vehicle trip card copied from the web stylesheet. */
  :root { --background: #f8faf9; --foreground: #18251f; --card: #ffffff; --surface-muted: #f1f4f2; --muted-foreground: #5f6e66; --border: #dce5df; --primary: #087a50; --primary-border: #a9d3bf; --accent: #e5f2eb; --accent-foreground: #075c3d; --fleet-bus: #22c55e; --fleet-tram: #f97316; --fleet-trolleybus: #3b82f6; --fleet-taxi: #eab308; }
  ${VEHICLE_PLATE_CSS}
  html, body, #map { margin: 0; height: 100%; width: 100%; background: #f8faf9; overflow: hidden; }
  .maplibregl-ctrl-bottom-right, .maplibregl-ctrl-bottom-left { display: none; }
  /* Stop tooltip: a glass card above the stop, like the web's map overlays. */
  .stop-tip .maplibregl-popup-content { background: rgba(255,255,255,0.86); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-radius: 16px; padding: 10px 14px; box-shadow: 0 8px 24px rgba(15,23,42,0.16); border: 1px solid rgba(255,255,255,0.7); font-family: Manrope, Arial, sans-serif; color: #18251f; min-width: 140px; }
  .stop-tip .maplibregl-popup-tip { border-top-color: rgba(255,255,255,0.86); }
  .stop-tip-title { font-weight: 700; font-size: 15px; letter-spacing: -0.2px; }
  .stop-tip-sub { font-size: 13px; color: #5f6e66; margin-top: 2px; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  // The web's 3D vehicle layer, bundled by scripts/build-map-3d.mjs and decoded here.
  (function () { var s = document.createElement("script"); s.textContent = atob("${VEHICLE_3D_BUNDLE_BASE64}"); document.head.appendChild(s); })();
</script>
<script type="module">
import * as maplibregl from "https://cdn.jsdelivr.net/npm/maplibre-gl@6.14.0/dist/maplibre-gl.mjs";
window.__maplibre = maplibregl;

const post = (message) => window.ReactNativeWebView?.postMessage(JSON.stringify(message));
const EMPTY = { type: "FeatureCollection", features: [] };
const CLICKABLE = ["vehicles-hit", "shelters-circle", "stops-circle", "route-stops-circle", "places-circle"];
let stopTip = null;
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let vehicle3d = null;
let lastVehicles = [];
const FLEET = ["match", ["get", "type"], "bus", "#22c55e", "tram", "#f97316", "trolleybus", "#3b82f6", "taxi", "#eab308", "#22c55e"];

const state = { selectedId: null, nearestShelterId: null, shelters: [] };
let ready = false;
const pending = [];

const map = new maplibregl.Map({
  container: "map",
  style: "https://tiles.openfreemap.org/styles/liberty",
  center: [24.0315, 49.8419],
  zoom: 14.2,
  pitch: 50,
  bearing: -15,
  maxPitch: 60,
  attributionControl: false,
});

function sourceData(id, data) {
  map.getSource(id)?.setData(data ?? EMPTY);
}

function emitRegion() {
  const b = map.getBounds();
  const c = map.getCenter();
  post({
    type: "region",
    latitude: c.lat,
    longitude: c.lng,
    latitudeDelta: b.getNorth() - b.getSouth(),
    longitudeDelta: b.getEast() - b.getWest(),
  });
}

map.on("load", () => {
  for (const id of ["vehicles", "stops", "shelters", "places", "route", "user", "walk-ahead", "walk-walked", "walker", "route-stops"]) {
    map.addSource(id, { type: "geojson", data: EMPTY });
  }

  map.addLayer({
    id: "route-line", type: "line", source: "route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": ["coalesce", ["get", "color"], "#087a50"], "line-width": 5 },
  });
  map.addLayer({
    id: "stops-circle", type: "circle", source: "stops", minzoom: 15,
    paint: { "circle-radius": 5, "circle-color": "#ffffff", "circle-stroke-color": "#334155", "circle-stroke-width": 2 },
  });
  map.addLayer({
    id: "places-circle", type: "circle", source: "places", minzoom: 14.5,
    paint: { "circle-radius": 6, "circle-color": "#0f766e", "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 },
  });
  map.addLayer({
    id: "shelters-circle", type: "circle", source: "shelters",
    layout: { visibility: "none" },
    paint: {
      "circle-radius": ["case", ["==", ["get", "id"], ""], 9, 6],
      "circle-color": "#16804f",
      "circle-stroke-color": "#ffffff", "circle-stroke-width": 2,
    },
  });
  // Invisible hit area for taps; the visible vehicle is the 3D model below.
  map.addLayer({
    id: "vehicles-hit", type: "circle", source: "vehicles",
    paint: { "circle-radius": 22, "circle-color": "#000000", "circle-opacity": 0 },
  });
  vehicle3d = window.__vehicle3d.createVehicle3DLayer({
    onSelect: (id) => post({ type: "select", kind: "vehicle", id }),
  });
  map.addLayer(vehicle3d);
  map.addLayer({
    id: "route-stops-circle", type: "circle", source: "route-stops",
    paint: { "circle-radius": 6, "circle-color": "#ffffff", "circle-stroke-color": "#18251f", "circle-stroke-width": 2 },
  });
  map.addLayer({
    id: "route-stops-label", type: "symbol", source: "route-stops", minzoom: 14,
    layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-size": 11, "text-offset": [0, 1.1], "text-anchor": "top", "text-optional": true },
    paint: { "text-color": "#18251f", "text-halo-color": "#ffffff", "text-halo-width": 1.5 },
  });
  map.addLayer({
    id: "user-dot", type: "circle", source: "user",
    paint: { "circle-radius": 8, "circle-color": "#0874df", "circle-stroke-color": "#ffffff", "circle-stroke-width": 3 },
  });

  map.addLayer({
    id: "walk-ahead-line", type: "line", source: "walk-ahead",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#94a3b8", "line-width": 5, "line-dasharray": [0.5, 2] },
  });
  map.addLayer({
    id: "walk-walked-line", type: "line", source: "walk-walked",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#087a50", "line-width": 6 },
  });
  map.addLayer({
    id: "walker-dot", type: "circle", source: "walker",
    paint: { "circle-radius": 9, "circle-color": "#0874df", "circle-stroke-color": "#ffffff", "circle-stroke-width": 3 },
  });

  ready = true;
  for (const message of pending.splice(0)) apply(message);
  paintSelection();
  paintShelters();
  post({ type: "ready" });
  emitRegion();
});

map.on("moveend", emitRegion);

map.on("click", (event) => {
  const hit = map.queryRenderedFeatures(event.point, { layers: CLICKABLE })[0];
  if (!hit) return post({ type: "deselect" });
  const kind = { "vehicles-hit": "vehicle", "shelters-circle": "shelter", "stops-circle": "stop", "route-stops-circle": "stop", "places-circle": "place" }[hit.layer.id];
  post({ type: "select", kind, id: String(hit.properties.id) });
});

function applyVehicles3D() {
  if (!vehicle3d) return;
  vehicle3d.setVehicles(
    lastVehicles.map((v) => ({
      id: v.id,
      type: v.type === "tram" ? "tram" : v.type === "trolleybus" ? "trolleybus" : "bus",
      route: v.route,
      destination: v.destination ?? "",
      plate: v.plate ?? "",
      stopName: null,
      lat: v.lat,
      lng: v.lng,
      bearing: v.bearing ?? 0,
      selected: v.id === state.selectedId,
    })),
  );
}

function paintSelection() {
  applyVehicles3D();
}

function paintShelters() {
  if (!map.getLayer("shelters-circle")) return;
  sourceData("shelters", {
    type: "FeatureCollection",
    features: state.shelters.map((s) => ({ type: "Feature", geometry: { type: "Point", coordinates: [s.lng, s.lat] }, properties: { id: s.id } })),
  });
  const nearest = state.nearestShelterId ?? "";
  map.setPaintProperty("shelters-circle", "circle-radius", ["case", ["==", ["get", "id"], nearest], 9, 6]);
}

let walkFitted = false;
function lineFeature(coords) {
  return { type: "Feature", geometry: { type: "LineString", coordinates: coords.map(([lat, lng]) => [lng, lat]) }, properties: {} };
}

/** Onboarding walk: the track, the walked part, and the walker. Fits the track once. */
function applyWalk(walk) {
  if (!map.getSource("walk-ahead")) return;
  sourceData("walk-ahead", lineFeature(walk.track));
  sourceData("walk-walked", walk.walked.length > 1 ? lineFeature(walk.walked) : null);
  sourceData("walker", walk.walker ? { type: "Feature", geometry: { type: "Point", coordinates: [walk.walker.lng, walk.walker.lat] }, properties: {} } : null);
  if (!walkFitted) {
    walkFitted = true;
    const lngs = walk.track.map(([, lng]) => lng);
    const lats = walk.track.map(([lat]) => lat);
    map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], {
      padding: { top: 120, left: 40, right: 40, bottom: walk.bottomInset ?? 0 },
      duration: 0,
      maxZoom: 16,
    });
  }
  if (walk.follow && walk.walker) {
    map.easeTo({ center: [walk.walker.lng, walk.walker.lat], duration: 250 });
  }
}

function apply(message) {
  if (!ready) return pending.push(message);
  if ("vehicles" in message) {
    lastVehicles = message.vehicles;
    sourceData("vehicles", {
      type: "FeatureCollection",
      features: message.vehicles.map((v) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [v.lng, v.lat] },
        properties: { id: v.id, route: v.route, type: v.type },
      })),
    });
    applyVehicles3D();
  }
  if ("stops" in message) {
    sourceData("stops", {
      type: "FeatureCollection",
      features: message.stops.map((s) => ({ type: "Feature", geometry: { type: "Point", coordinates: [s.lng, s.lat] }, properties: { id: s.id } })),
    });
  }
  if ("shelters" in message) {
    state.shelters = message.shelters;
    paintShelters();
  }
  if ("places" in message) {
    sourceData("places", {
      type: "FeatureCollection",
      features: message.places.map((p) => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.lng, p.lat] }, properties: { id: p.id } })),
    });
  }
  if ("route" in message) {
    sourceData("route", message.route ? { type: "Feature", geometry: { type: "LineString", coordinates: message.route.map(([lat, lng]) => [lng, lat]) }, properties: { color: message.routeColor } } : null);
  }
  if ("user" in message) {
    sourceData("user", message.user ? { type: "Feature", geometry: { type: "Point", coordinates: [message.user.longitude, message.user.latitude] }, properties: {} } : null);
  }
  if ("selectedId" in message) {
    state.selectedId = message.selectedId;
    paintSelection();
  }
  if ("showShelters" in message && map.getLayer("shelters-circle")) {
    map.setLayoutProperty("shelters-circle", "visibility", message.showShelters ? "visible" : "none");
  }
  if ("walk" in message) applyWalk(message.walk);
  if ("fit" in message) {
    const pts = message.fit.map(([lat, lng]) => [lng, lat]);
    const lngs = pts.map((p) => p[0]);
    const lats = pts.map((p) => p[1]);
    map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], {
      padding: { top: 140, left: 60, right: 60, bottom: 260 },
      duration: 400,
      maxZoom: 16,
    });
  }
  if ("routeStops" in message) {
    sourceData("route-stops", {
      type: "FeatureCollection",
      features: message.routeStops.map((s) => ({ type: "Feature", geometry: { type: "Point", coordinates: [s.lng, s.lat] }, properties: { id: s.id, name: s.name } })),
    });
  }
  if ("tooltip" in message) {
    stopTip?.remove();
    stopTip = null;
    if (message.tooltip) {
      stopTip = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 16, className: "stop-tip" })
        .setLngLat([message.tooltip.lng, message.tooltip.lat])
        .setHTML('<div class="stop-tip-title">' + escapeHtml(message.tooltip.title) + '</div><div class="stop-tip-sub">' + escapeHtml(message.tooltip.subtitle) + '</div>')
        .addTo(map);
    }
  }
  if ("flyTo" in message) {
    map.flyTo({ center: [message.flyTo[1], message.flyTo[0]], zoom: 16, duration: 900 });
  }
  if ("nearestShelterId" in message) {
    state.nearestShelterId = message.nearestShelterId;
    paintShelters();
  }
}

// Messages from React Native (WebView.postMessage on both platforms).
window.addEventListener("message", (event) => {
  try { apply(JSON.parse(event.data)); } catch (error) { post({ type: "error", message: String(error) }); }
});
document.addEventListener("message", (event) => {
  try { apply(JSON.parse(event.data)); } catch (error) { post({ type: "error", message: String(error) }); }
});
</script>
</body>
</html>`;
