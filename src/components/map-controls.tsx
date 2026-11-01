import type { RefObject } from "react";
import { Button } from "./ui/button";
import { LocateFixed, MaterialIcon } from "./ui/material-icon";
import { Toggle } from "./ui/toggle";
import { CITY_PLACE_CATEGORY_COLORS, cityPlaceCategories, type CityPlaceCategory } from "../lib/city-places";

export type PanDirection = "up" | "down" | "left" | "right";

type MapControlsProps = {
  hidden: boolean;
  pitch: number;
  bearing: number;
  terrainEnabled: boolean;
  onToggleTerrain: () => void;
  onResetOrientation: () => void;
  onToggleMapMode: () => void;
  onPan: (direction: PanDirection) => void;
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

/** Floating map controls: compass, 2D/3D, terrain, pan pad, zoom, locate, and map layer chips. */
export function MapControls({
  hidden,
  pitch,
  bearing,
  terrainEnabled,
  onToggleTerrain,
  onResetOrientation,
  onToggleMapMode,
  onPan,
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
      </div>
      <div className="map-control-set map-pan-pad" role="group" aria-label="Перемістити карту">
        <span aria-hidden="true" />
        <Button type="button" variant="ghost" className="map-control" aria-label="Перемістити карту вгору" title="Вгору" onClick={() => onPan("up")}><MaterialIcon name="keyboard_arrow_up" size={22} /></Button>
        <span aria-hidden="true" />
        <Button type="button" variant="ghost" className="map-control" aria-label="Перемістити карту ліворуч" title="Ліворуч" onClick={() => onPan("left")}><MaterialIcon name="keyboard_arrow_left" size={22} /></Button>
        <span aria-hidden="true" className="map-pan-center" />
        <Button type="button" variant="ghost" className="map-control" aria-label="Перемістити карту праворуч" title="Праворуч" onClick={() => onPan("right")}><MaterialIcon name="keyboard_arrow_right" size={22} /></Button>
        <span aria-hidden="true" />
        <Button type="button" variant="ghost" className="map-control" aria-label="Перемістити карту донизу" title="Донизу" onClick={() => onPan("down")}><MaterialIcon name="keyboard_arrow_down" size={22} /></Button>
        <span aria-hidden="true" />
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
