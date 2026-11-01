import { BuildingModelEditor } from "../../components/building-model-editor";
import { EntityDetail } from "../../components/entity-detail";
import { SheetNavBar } from "../../components/ui/detail-layout";
import { placeInfoRows } from "../../lib/app-formatters";
import type { BuildingModelData } from "../../lib/building-3d-layer";
import { CITY_PLACE_CATEGORY_COLORS, cityPlaceIcons, type CityPlace } from "../../lib/city-places";

type PlaceInspectorProps = {
  place: CityPlace;
  saved: boolean;
  onToggleSaved: () => void;
  onShowOnMap: () => void;
  onDirections: () => void;
  onBack: () => void;
  buildingModels: {
    models: BuildingModelData[];
    status: "loading" | "ready" | "error";
    error: string;
    setPreview: (model: BuildingModelData | null) => void;
    save: (model: BuildingModelData) => Promise<void>;
    remove: (id: string) => Promise<void>;
  };
};

/** Detail sheet for a place. Buildings also get the 3D model editor. */
export function PlaceInspector({
  place,
  saved,
  onToggleSaved,
  onShowOnMap,
  onDirections,
  onBack,
  buildingModels,
}: PlaceInspectorProps) {
  return (
    <section className="inspector place-inspector">
      <SheetNavBar title="Місця" onBack={onBack} />
      <div className="place-inspector-body">
        <EntityDetail
          kind={place.category}
          title={place.name}
          eyebrow={place.categoryLabel}
          subtitle={place.address}
          icon={cityPlaceIcons[place.category]}
          iconColor={CITY_PLACE_CATEGORY_COLORS[place.category]}
          place={place}
          info={placeInfoRows(place)}
          phone={place.details["Телефон"]}
          website={place.details["Сайт"]}
          coordinates={[place.lng, place.lat]}
          saved={saved}
          onToggleSaved={onToggleSaved}
          onShowOnMap={onShowOnMap}
          onDirections={onDirections}
        >
          {place.category === "buildings" && (
            <>
              <BuildingModelEditor
                key={place.id}
                knownHeight={place.heightMeters ?? null}
                model={buildingModels.models.find((model) => model.id === place.id)}
                onDelete={buildingModels.remove}
                onPreview={buildingModels.setPreview}
                onSave={buildingModels.save}
                place={place}
              />
              {buildingModels.status === "error" && (
                <p className="building-model-message error">{buildingModels.error}</p>
              )}
            </>
          )}
        </EntityDetail>
      </div>
    </section>
  );
}
