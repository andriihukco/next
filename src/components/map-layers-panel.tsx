import { useState } from "react";
import { Button } from "./ui/button";
import { DetailSection, ListRow } from "./ui/detail-layout";
import { MaterialIcon } from "./ui/material-icon";
import { Switch } from "./ui/switch";
import { Toggle } from "./ui/toggle";
import { MapPanel } from "./map-panel";
import { CITY_PLACE_CATEGORY_COLORS, cityPlaceCategories, cityPlaceGroupCategories, cityPlaceGroups } from "../lib/city-place-categories";
import { iconTileFor } from "../lib/icon-tiles";
import {
  setCategoriesVisible,
  setTransportVisible,
  useMapLayerPrefs,
} from "../lib/map-layers";

const ALL_CATEGORY_IDS = cityPlaceCategories.map((category) => category.id);

/**
 * «Що показувати». Transport layers, then the place groups. A group switch shows or hides every
 * category in the group; the chevron opens its categories for one-by-one control.
 */
export function MapLayersPanel({ onClose }: { onClose: () => void }) {
  const prefs = useMapLayerPrefs();
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set());
  const hidden = new Set(prefs.hiddenCategories);
  const hiddenTransport = new Set(prefs.hiddenTransport);
  const shownCount = ALL_CATEGORY_IDS.filter((id) => !hidden.has(id)).length;

  const toggleGroupOpen = (groupId: string): void => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  return (
    <MapPanel title="Що показувати" onClose={onClose}>
      <p className="map-panel-summary">
        Показано {shownCount} з {ALL_CATEGORY_IDS.length} категорій
      </p>
      <div className="map-panel-bulk">
        <Button type="button" variant="outline" size="sm" onClick={() => setCategoriesVisible(ALL_CATEGORY_IDS, true)}>
          Показати все
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setCategoriesVisible(ALL_CATEGORY_IDS, false)}>
          Сховати все
        </Button>
      </div>

      <DetailSection title="Транспорт">
        <ListRow
          leading={<MaterialIcon name="directions_bus" size={20} />}
          tile={iconTileFor("layer-vehicles")}
          title="Транспорт на лінії"
          subtitle="Автобуси, трамваї, тролейбуси"
          trailing={
            <Switch
              aria-label="Транспорт на лінії"
              checked={!hiddenTransport.has("vehicles")}
              onCheckedChange={(checked) => setTransportVisible("vehicles", checked)}
            />
          }
        />
        <ListRow
          leading={<MaterialIcon name="departure_board" size={20} />}
          tile={iconTileFor("layer-stops")}
          title="Зупинки"
          subtitle="Позначки зупинок від 13 рівня масштабу"
          trailing={
            <Switch
              aria-label="Зупинки"
              checked={!hiddenTransport.has("stops")}
              onCheckedChange={(checked) => setTransportVisible("stops", checked)}
            />
          }
        />
      </DetailSection>

      <DetailSection title="Місця">
        {cityPlaceGroups.map((group) => {
          const categories = cityPlaceGroupCategories(group.id);
          if (categories.length === 0) return null;
          const shown = categories.filter((category) => !hidden.has(category.id)).length;
          const open = openGroups.has(group.id);
          const subtitle =
            shown === categories.length ? `Усі ${categories.length}` : shown === 0 ? "Приховано" : `${shown} з ${categories.length}`;
          return (
            <div className="map-layer-group" key={group.id}>
              <ListRow
                leading={<MaterialIcon name={group.icon} size={20} />}
                tile={iconTileFor(`layer-${group.id}`)}
                title={group.label}
                subtitle={subtitle}
                trailing={
                  <>
                    <Switch
                      aria-label={`${group.label}: показувати`}
                      checked={shown > 0}
                      onCheckedChange={(checked) => setCategoriesVisible(categories.map((category) => category.id), checked)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`${open ? "Згорнути" : "Розгорнути"} ${group.label}`}
                      aria-expanded={open}
                      onClick={() => toggleGroupOpen(group.id)}
                    >
                      <MaterialIcon name={open ? "expand_less" : "expand_more"} size={20} />
                    </Button>
                  </>
                }
              />
              {open && (
                <div className="map-layer-chips" role="group" aria-label={group.label}>
                  {categories.map((category) => {
                    const isShown = !hidden.has(category.id);
                    return (
                      <Toggle
                        key={category.id}
                        variant="pill"
                        size="sm"
                        className="map-layer-chip"
                        style={{ "--chip-color": CITY_PLACE_CATEGORY_COLORS[category.id] } as React.CSSProperties}
                        pressed={isShown}
                        onClick={() => setCategoriesVisible([category.id], !isShown)}
                      >
                        <span className="map-layer-chip-dot" aria-hidden="true" />
                        {category.label}
                      </Toggle>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </DetailSection>
    </MapPanel>
  );
}
