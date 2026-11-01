import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import { Button } from "./ui/button";
import { LocateFixed, MaterialIcon } from "./ui/material-icon";
import { Toggle } from "./ui/toggle";
import { CITY_PLACE_CATEGORY_COLORS, cityPlaceCategories, type CityPlaceCategory } from "../lib/city-places";

/** Button steps: one press turns the view 15° and tilts it 10°. */
const STEP_BEARING = 15;
const STEP_PITCH = 10;
/** Drag sensitivity: degrees per pixel of pointer movement. */
const DRAG_BEARING = 0.4;
const DRAG_PITCH = 0.25;

type MapControlsProps = {
  hidden: boolean;
  pitch: number;
  bearing: number;
  terrainEnabled: boolean;
  onToggleTerrain: () => void;
  onResetOrientation: () => void;
  onToggleMapMode: () => void;
  /** Turns the bearing and tilts the pitch by degrees. Duration 0 applies at once (drags). */
  onOrbit: (bearingDelta: number, pitchDelta: number, duration: number) => void;
  /** Called when the camera popover opens, so the mobile sheet can drop out of its way. */
  onCameraOpen: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  settingsRef: RefObject<HTMLDivElement | null>;
  settingsOpen: boolean;
  onToggleSettings: () => void;
  layerCategories: Set<CityPlaceCategory>;
  onToggleLayerCategory: (id: CityPlaceCategory) => void;
  onClearLayers: () => void;
};

/** Floating map controls: compass, 2D/3D, terrain, camera popover, zoom, locate, and map layer chips. */
export function MapControls({
  hidden,
  pitch,
  bearing,
  terrainEnabled,
  onToggleTerrain,
  onResetOrientation,
  onToggleMapMode,
  onOrbit,
  onCameraOpen,
  onZoomIn,
  onZoomOut,
  onLocate,
  settingsRef,
  settingsOpen,
  onToggleSettings,
  layerCategories,
  onToggleLayerCategory,
  onClearLayers,
}: MapControlsProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  // Close the camera popover on an outside click or Escape.
  useEffect(() => {
    if (!cameraOpen) return;
    const handleOutside = (event: MouseEvent): void => {
      if (cameraRef.current && !cameraRef.current.contains(event.target as Node)) setCameraOpen(false);
    };
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setCameraOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [cameraOpen]);

  const handleCenterDown = (event: PointerEvent<HTMLButtonElement>): void => {
    dragRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handleCenterMove = (event: PointerEvent<HTMLButtonElement>): void => {
    const last = dragRef.current;
    if (!last) return;
    dragRef.current = { x: event.clientX, y: event.clientY };
    // Dragging up tilts toward the horizon, the same way the up arrow does.
    onOrbit((event.clientX - last.x) * DRAG_BEARING, (last.y - event.clientY) * DRAG_PITCH, 0);
  };
  const handleCenterEnd = (): void => {
    dragRef.current = null;
  };

  return (
    <div
      className={`map-controls${pitch >= 0.5 ? " map-controls-3d" : " map-controls-2d"}`}
      role="group"
      aria-label="Керування мапою"
      data-tour="map-controls"
      hidden={hidden}
    >
      <div className="map-control-set" role="group" aria-label="Вигляд мапи">
        <Button
          type="button"
          variant="ghost"
          className="map-control map-compass"
          aria-label="Компас: повернути карту на північ"
          title="Компас: повернути карту на північ"
          onClick={onResetOrientation}
        >
          <span className="map-compass-needle" style={{ transform: `rotate(${-bearing}deg)` }}>
            <MaterialIcon name="navigation" size={20} />
          </span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="map-control map-mode-control"
          aria-label={pitch < 0.5 ? "Перейти до 3D-вигляду" : "Перейти до вигляду 2D зверху"}
          aria-pressed={pitch >= 0.5}
          title={pitch < 0.5 ? "Перейти до 3D-вигляду" : "Перейти до вигляду 2D зверху"}
          onClick={onToggleMapMode}
        >
          3D
        </Button>
        {pitch >= 0.5 && (
          <Button
            type="button"
            variant="ghost"
            className={`map-control terrain-control${terrainEnabled ? " active" : ""}`}
            aria-label={terrainEnabled ? "Вимкнути рельєф і лісові масиви" : "Увімкнути рельєф і лісові масиви"}
            aria-pressed={terrainEnabled}
            title={terrainEnabled ? "Вимкнути рельєф і лісові масиви" : "Увімкнути рельєф і лісові масиви"}
            onClick={onToggleTerrain}
          >
            <MaterialIcon name="terrain" size={20} />
          </Button>
        )}
        <div className="map-camera-wrap" ref={cameraRef}>
          <Button
            type="button"
            variant="ghost"
            className="map-control map-camera-btn"
            aria-label="Камера: нахил і поворот"
            aria-expanded={cameraOpen}
            aria-haspopup="dialog"
            title="Камера: нахил і поворот"
            onClick={() => {
              if (!cameraOpen) onCameraOpen();
              setCameraOpen((open) => !open);
            }}
          >
            <MaterialIcon name="photo_camera" size={20} />
          </Button>
          {cameraOpen && (
            <div className="map-settings-popover map-camera-popover" role="dialog" aria-label="Камера">
              <div className="map-settings-header">
                <span className="map-settings-title">Камера</span>
              </div>
              <div className="map-camera-pad" role="group" aria-label="Нахил і поворот карти">
                <span className="map-camera-label map-camera-label-top" aria-hidden="true">Нахил до горизонту</span>
                <span className="map-camera-label map-camera-label-left" aria-hidden="true">Повернути ліворуч</span>
                <div className="map-camera-grid">
                  <span aria-hidden="true" />
                  <Button type="button" variant="ghost" className="map-control" aria-label="Нахил до горизонту" title="Нахил до горизонту" onClick={() => onOrbit(0, STEP_PITCH, 250)}><MaterialIcon name="keyboard_arrow_up" size={22} /></Button>
                  <span aria-hidden="true" />
                  <Button type="button" variant="ghost" className="map-control" aria-label="Повернути ліворуч" title="Повернути ліворуч" onClick={() => onOrbit(-STEP_BEARING, 0, 250)}><MaterialIcon name="keyboard_arrow_left" size={22} /></Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="map-control map-camera-center"
                    aria-label="Перетягніть, щоб повернути й нахилити карту"
                    title="Перетягніть, щоб повернути й нахилити карту"
                    onPointerDown={handleCenterDown}
                    onPointerMove={handleCenterMove}
                    onPointerUp={handleCenterEnd}
                    onPointerCancel={handleCenterEnd}
                  >
                    <span aria-hidden="true" className="map-camera-dot" />
                  </Button>
                  <Button type="button" variant="ghost" className="map-control" aria-label="Повернути праворуч" title="Повернути праворуч" onClick={() => onOrbit(STEP_BEARING, 0, 250)}><MaterialIcon name="keyboard_arrow_right" size={22} /></Button>
                  <span aria-hidden="true" />
                  <Button type="button" variant="ghost" className="map-control" aria-label="Вид зверху" title="Вид зверху" onClick={() => onOrbit(0, -STEP_PITCH, 250)}><MaterialIcon name="keyboard_arrow_down" size={22} /></Button>
                  <span aria-hidden="true" />
                </div>
                <span className="map-camera-label map-camera-label-right" aria-hidden="true">Повернути праворуч</span>
                <span className="map-camera-label map-camera-label-bottom" aria-hidden="true">Вид зверху</span>
              </div>
              <p className="map-settings-hint">Перетягніть точку в центрі, щоб повертати й нахиляти разом.</p>
            </div>
          )}
        </div>
      </div>
      <div className="map-control-set map-zoom-controls" role="group" aria-label="Масштаб">
        <Button type="button" variant="ghost" className="map-control" aria-label="Збільшити масштаб" title="Збільшити масштаб" onClick={onZoomIn}><MaterialIcon name="add" size={22} /></Button>
        <Button type="button" variant="ghost" className="map-control" aria-label="Зменшити масштаб" title="Зменшити масштаб" onClick={onZoomOut}><MaterialIcon name="remove" size={22} /></Button>
      </div>
      <div className="map-control-set" role="group" aria-label="Додаткові дії">
        <Button type="button" variant="ghost" className="map-control" aria-label="Моє місцезнаходження" title="Моє місцезнаходження" data-tour="map-location" onClick={onLocate}><LocateFixed size={20} /></Button>
        <div className="map-settings-wrap" ref={settingsRef}>
          <Button
            type="button"
            variant="ghost"
            className={`map-control map-settings-btn${settingsOpen ? " active" : ""}`}
            aria-label="Що показувати на мапі"
            aria-expanded={settingsOpen}
            aria-haspopup="dialog"
            title="Шари мапи"
            onClick={() => onToggleSettings()}
          >
            <MaterialIcon name="layers" size={20} />
            {layerCategories.size > 0 && (
              <span className="map-settings-badge">{layerCategories.size}</span>
            )}
          </Button>
          {settingsOpen && (
            <div
              className="map-settings-popover"
              role="dialog"
              aria-label="Шари мапи"
            >
              <div className="map-settings-header">
                <span className="map-settings-title">Що показувати</span>
                {layerCategories.size > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="map-settings-clear"
                    onClick={onClearLayers}
                  >
                    Скинути
                  </Button>
                )}
              </div>
              <p className="map-settings-hint">
                До 3 категорій одночасно
              </p>
              <div className="map-settings-chips" role="group" aria-label="Категорії місць">
                {cityPlaceCategories.map((cat) => {
                  const isActive = layerCategories.has(cat.id);
                  const atLimit = !isActive && layerCategories.size >= 3;
                  return (
                    <Toggle variant="pill"
                      key={cat.id}
                      size="sm"

                      disabled={atLimit}
                      className="map-layer-chip"
                      style={{ "--chip-color": CITY_PLACE_CATEGORY_COLORS[cat.id] } as React.CSSProperties}
                      onClick={() => onToggleLayerCategory(cat.id)} pressed={isActive}>
                      <span
                        className="map-layer-chip-dot"
                        aria-hidden="true"
                      />
                      {cat.label}
                    </Toggle>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
