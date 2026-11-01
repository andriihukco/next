import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { CategoryTiles } from "../category-tiles";
import { EntityDetail } from "../entity-detail";
import { MaterialIcon } from "../ui/material-icon";
import { cityEducationKind, type CityEducationKind, type CityPlace } from "../../lib/city-places";
import { EDUCATION_FILTERS, EDUCATION_KIND_LABELS, type CityItemActions } from "./constants";
import { EducationCard } from "./education-card";
import { demoProductsFor, placeInfoRows } from "./helpers";

type EducationSectionProps = CityItemActions & {
  places: CityPlace[];
  placesStatus: "loading" | "ready" | "error";
  placesError: string;
  onRetryPlaces: () => void;
  selectedId: string | null;
  onOpen: (id: string) => void;
};

/** «Освіта»: schools, kindergartens, universities and libraries from the map data. */
export function EducationSection({
  places,
  placesStatus,
  placesError,
  onRetryPlaces,
  selectedId,
  onOpen,
  saved,
  onToggleSaved,
  onShowOnMap,
  onDirections,
}: EducationSectionProps) {
  const [educationKind, setEducationKind] = useState<CityEducationKind>("school");
  const educationPlaces = useMemo(
    () =>
      places.flatMap((place) => {
        const kind = cityEducationKind(place);
        return kind ? [{ place, kind }] : [];
      }),
    [places],
  );
  const filteredEducationPlaces = useMemo(
    () => educationPlaces.filter(({ kind }) => kind === educationKind),
    [educationKind, educationPlaces],
  );
  const selectedEducation = educationPlaces.find(({ place }) => place.id === selectedId);

  return (
    <section className="city-section" aria-label="Освіта">
      {selectedEducation ? (
        <>
          <EntityDetail
            kind={selectedEducation.kind === "library" ? "library" : selectedEducation.kind}
            title={selectedEducation.place.name}
            eyebrow={EDUCATION_KIND_LABELS[selectedEducation.kind]}
            subtitle={selectedEducation.place.address}
            imageUrl={selectedEducation.place.imageUrl}
            icon={EDUCATION_FILTERS.find((filter) => filter.id === selectedEducation.kind)?.icon ?? "school"}
            info={placeInfoRows(selectedEducation.place)}
            catalog={demoProductsFor(selectedEducation.place)}
            coordinates={[selectedEducation.place.lng, selectedEducation.place.lat]}
            phone={selectedEducation.place.details["Телефон"] || selectedEducation.place.details["Мобільний"]}
            website={selectedEducation.place.details["Сайт"]}
            saved={saved.has(selectedEducation.place.id)}
            onToggleSaved={() => onToggleSaved(selectedEducation.place.id)}
            onShowOnMap={() => onShowOnMap([selectedEducation.place.lng, selectedEducation.place.lat], selectedEducation.place.name)}
            onDirections={() => onDirections([selectedEducation.place.lng, selectedEducation.place.lat], selectedEducation.place.name)}
          />
        </>
      ) : (
        <>
          <CategoryTiles
            label="Тип закладу"
            items={EDUCATION_FILTERS}
            value={educationKind}
            onChange={(id) => setEducationKind(id as CityEducationKind)}
          />
          {placesStatus === "loading" ? (
            <div className="city-places-state" role="status">
              <MaterialIcon name="sync" size={20} />
              <span>Завантажуємо заклади…</span>
            </div>
          ) : placesStatus === "error" ? (
            <div className="city-places-state">
              <MaterialIcon name="error_outline" size={20} />
              <span>{placesError || "Не вдалося завантажити місця з карти."}</span>
              <Button type="button" variant="outline" onClick={onRetryPlaces}>Повторити</Button>
            </div>
          ) : (
            <div className="city-place-list">
              {filteredEducationPlaces.map(({ place, kind }) => (
                <EducationCard
                  key={place.id}
                  place={place}
                  kind={kind}
                  onShowOnMap={onShowOnMap}
                  onOpen={() => onOpen(place.id)}
                  detailPage={false}
                />
              ))}
              {filteredEducationPlaces.length === 0 && (
                <div className="city-places-state">
                  <MaterialIcon name="search_off" size={20} />
                  <span>Закладів цієї категорії на цій ділянці мапи поки немає.</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
