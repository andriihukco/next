import { useEffect, useRef, useState, type PointerEvent, type ReactNode, type RefObject } from "react";
import { AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { MaterialIcon } from "./ui/material-icon";
import { Switch } from "./ui/switch";
import { CENTER } from "../lib/app-constants";
import { MapLayersPanel } from "./map-layers-panel";
import { MapPanel } from "./map-panel";
import { useMediaQuery } from "../lib/use-media-query";
import { useMapLayerPrefs } from "../lib/map-layers";
import { satellitePreviewUrl, type MapStyleMode } from "../lib/map-style-mode";

/** Button steps: one press turns the view 15° and tilts it 10°. */
const STEP_BEARING = 15;
const STEP_PITCH = 10;
/** Drag sensitivity: degrees per pixel of pointer movement. */
const DRAG_BEARING = 0.4;
const DRAG_PITCH = 0.25;

/** Imagery preview for the map type tiles: one tile over the city center. */
const SATELLITE_PREVIEW = satellitePreviewUrl(CENTER, 15);

const MAP_STYLE_OPTIONS: { mode: MapStyleMode; label: string; icon: string }[] = [
  { mode: "standard", label: "Стандартна", icon: "map" },
  { mode: "hybrid", label: "Гібридна", icon: "layers" },
  { mode: "satellite", label: "Супутник", icon: "satellite_alt" },
];

type MapControlsProps = {
  hidden: boolean;
  pitch: number;
  bearing: number;
  mapStyleMode: MapStyleMode;
  onChangeMapStyle: (mode: MapStyleMode) => void;
  onResetOrientation: () => void;
  onToggleMapMode: () => void;
  /** Turns the bearing and tilts the pitch by degrees. Duration 0 applies at once (drags). */
  onOrbit: (bearingDelta: number, pitchDelta: number, duration: number) => void;
  /** Called when the camera panel opens, so the mobile sheet can drop out of its way. */
  onCameraOpen: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  settingsOpen: boolean;
  onToggleSettings: () => void;
};

/** Closes a popover on an outside click or Escape. Runs only while the popover is open. */
function useDismissOnOutside(
  open: boolean,
  setOpen: (open: boolean) => void,
  ref: RefObject<HTMLDivElement | null>,
): void {
  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: MouseEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, setOpen, ref]);
}

/** Floating map controls, top to bottom: map type and location, compass, camera, zoom, layers. */
export function MapControls({
  hidden,
  pitch,
  bearing,
  mapStyleMode,
  onChangeMapStyle,
  onResetOrientation,
  onToggleMapMode,
  onOrbit,
  onCameraOpen,
  onZoomIn,
  onZoomOut,
  onLocate,
  settingsOpen,
  onToggleSettings,
}: MapControlsProps) {
  const layerPrefs = useMapLayerPrefs();
  const hiddenLayerCount = layerPrefs.hiddenCategories.length + layerPrefs.hiddenTransport.length;
  // On mobile every map popover becomes a bottom sheet (DESIGN.md §5).
  const mobile = useMediaQuery("(max-width: 800px)");
  const [styleOpen, setStyleOpen] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  useDismissOnOutside(styleOpen, setStyleOpen, styleRef);
  useDismissOnOutside(cameraOpen, setCameraOpen, cameraRef);

  const is3D = pitch >= 0.5;

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
      className={`map-controls${is3D ? " map-controls-3d" : " map-controls-2d"}`}
      role="group"
      aria-label="Керування мапою"
      data-tour="map-controls"
      hidden={hidden}
    >
      <div className="map-control-set" role="group" aria-label="Карта і місцезнаходження">
        <div className="map-style-wrap" ref={styleRef}>
          <Button
            type="button"
            variant="ghost"
            className={`map-control map-style-btn${styleOpen ? " active" : ""}`}
            aria-label="Тип мапи"
            aria-expanded={styleOpen}
            aria-haspopup="dialog"
            title="Тип мапи"
            onClick={() => setStyleOpen((open) => !open)}
          >
            <MaterialIcon name={MAP_STYLE_OPTIONS.find((option) => option.mode === mapStyleMode)?.icon ?? "map"} size={20} />
          </Button>
          <MapPopoverSwitch
            open={styleOpen}
            mobile={mobile}
            title="Тип мапи"
            className="map-style-popover"
            onClose={() => setStyleOpen(false)}
          >
            <div className="map-style-options" role="group" aria-label="Тип мапи">
              {MAP_STYLE_OPTIONS.map((option) => {
                  const selected = option.mode === mapStyleMode;
                  const isImagery = option.mode !== "standard";
                  return (
                    <button
                      key={option.mode}
                      type="button"
                      className="map-style-tile"
                      aria-pressed={selected}
                      onClick={() => onChangeMapStyle(option.mode)}
                    >
                      <span
                        className={`map-style-preview map-style-preview-${option.mode}`}
                        style={isImagery ? { backgroundImage: `url("${SATELLITE_PREVIEW}")` } : undefined}
                      >
                        {!isImagery && <MaterialIcon name={option.icon} size={24} filled={selected} />}
                      </span>
                      <span className="map-style-label">{option.label}</span>
                    </button>
                  );
                })}
              </div>
          </MapPopoverSwitch>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="map-control map-locate-btn"
          aria-label="Моє місцезнаходження"
          title="Моє місцезнаходження"
          data-tour="map-location"
          onClick={onLocate}
        >
          <MaterialIcon name="my_location" size={20} />
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        className="map-compass"
        aria-label="Компас: повернути карту на північ"
        title="Компас: повернути карту на північ"
        onClick={onResetOrientation}
      >
        <svg
          className="map-compass-needle"
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{ transform: `rotate(${-bearing}deg)` }}
        >
          <polygon points="12,3 15.5,12 12,10.5 8.5,12" fill="var(--destructive)" />
          <polygon points="12,21 15.5,12 12,13.5 8.5,12" fill="var(--muted-foreground)" />
        </svg>
      </Button>

      <div className="map-control-set" role="group" aria-label="Камера">
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
            <MaterialIcon name="360" size={20} />
          </Button>
          <MapPopoverSwitch
            open={cameraOpen}
            mobile={mobile}
            title="Камера"
            className="map-camera-popover"
            onClose={() => setCameraOpen(false)}
          >
              <div className="map-settings-header">
                <span className="map-settings-title">Камера</span>
                <div className="map-camera-3d">
                  <Label htmlFor="map-3d-switch">3D</Label>
                  <Switch
                    id="map-3d-switch"
                    checked={is3D}
                    onCheckedChange={(checked) => {
                      if (checked !== is3D) onToggleMapMode();
                    }}
                  />
                </div>
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
          </MapPopoverSwitch>
        </div>
      </div>

      <div className="map-control-set map-zoom-controls" role="group" aria-label="Масштаб">
        <Button type="button" variant="ghost" className="map-control" aria-label="Збільшити масштаб" title="Збільшити масштаб" onClick={onZoomIn}><MaterialIcon name="add" size={22} /></Button>
        <Button type="button" variant="ghost" className="map-control" aria-label="Зменшити масштаб" title="Зменшити масштаб" onClick={onZoomOut}><MaterialIcon name="remove" size={22} /></Button>
      </div>

      <div className="map-control-set" role="group" aria-label="Шари">
        <div className="map-settings-wrap">
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
            {hiddenLayerCount > 0 && <span className="map-settings-badge" aria-hidden="true" />}
          </Button>
          <AnimatePresence>{settingsOpen && <MapLayersPanel onClose={onToggleSettings} />}</AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/** A map popover on desktop; the same content as a map panel sheet on mobile. */
function MapPopoverSwitch({
  open,
  mobile,
  title,
  className,
  onClose,
  children,
}: {
  open: boolean;
  mobile: boolean;
  title: string;
  className: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  if (mobile) {
    return (
      <AnimatePresence>
        <MapPanel title={title} onClose={onClose}>
          {children}
        </MapPanel>
      </AnimatePresence>
    );
  }
  return (
    <div className={`map-settings-popover ${className}`} role="dialog" aria-label={title}>
      {children}
    </div>
  );
}
