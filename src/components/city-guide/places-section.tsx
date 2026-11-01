import { useState } from "react";
import { Button } from "../ui/button";
import { CategoryTiles } from "../category-tiles";
import { ContextCard } from "../ui/context-card";
import { EntityDetail } from "../entity-detail";
import { MaterialIcon } from "../ui/material-icon";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { UnifiedCard } from "../ui/unified-card";
import {
  CITY_PLACE_CATEGORY_COLORS,
  cityPlaceIcons,
  formatOpeningHours,
  type CityPlace,
  type CityPlaceCategory,
} from "../../lib/city-places";
import type { CityItemActions, PlacesLayout } from "./constants";
import { demoProductsFor, distanceToPlace, formatPlaceDistance, placeInfoRows } from "./helpers";
import "../city-view-switch.css";

export type PlaceFilter = "popular" | "nearby" | CityPlaceCategory;

const PAGE_SIZE = 40;
const LAYOUT_KEY = "eway-places-layout";

type PlacesSectionProps = CityItemActions & {
  places: CityPlace[];
  /** Places after the category filter and search, sorted for display. */
  visiblePlaces: CityPlace[];
  availableCategories: { id: CityPlaceCategory; label: string }[];
  placeCategory: PlaceFilter;
  onPlaceCategoryChange: (filter: PlaceFilter) => void;
  userLocation: [number, number] | null;
  locationError: string | null;
  origin: [number, number];
  placesStatus: "loading" | "ready" | "error";
  placesError: string;
  onRetryPlaces: () => void;
  selectedPlaceId: string | null;
  onOpenPlace: (id: string) => void;
};

/** «Місця»: category tiles, list or grid of nearby places, and the open place. */
export function PlacesSection({
  places,
  visiblePlaces,
  availableCategories,
  placeCategory,
  onPlaceCategoryChange,
  userLocation,
  locationError,
  origin,
  placesStatus,
  placesError,
  onRetryPlaces,
  selectedPlaceId,
  onOpenPlace,
  saved,
  onToggleSaved,
  onShowOnMap,
  onDirections,
}: PlacesSectionProps) {
  const [placeDisplayLimit, setPlaceDisplayLimit] = useState(PAGE_SIZE);
  const [placesLayout, setPlacesLayout] = useState<PlacesLayout>(() =>
    localStorage.getItem(LAYOUT_KEY) === "grid" ? "grid" : "list",
  );
  const changePlacesLayout = (next: PlacesLayout): void => {
    setPlacesLayout(next);
    localStorage.setItem(LAYOUT_KEY, next);
  };
  const shownPlaces = visiblePlaces.slice(0, placeDisplayLimit);

  return (
    <section
      className={`city-section city-places${selectedPlaceId ? " place-detail-page" : ""}`}
      aria-label="Місця"
    >
      {!selectedPlaceId && (
        <CategoryTiles
          label="Категорії місць"
          items={[
            { id: "popular", label: "Популярне", icon: "award_star", color: "var(--category-popular)" },
            ...(userLocation ? [{ id: "nearby", label: "Поруч", icon: "near_me", color: "var(--category-nearby)" }] : []),
            ...availableCategories.map((category) => ({
              id: category.id,
              label: category.label,
              icon: cityPlaceIcons[category.id],
              color: CITY_PLACE_CATEGORY_COLORS[category.id],
            })),
          ]}
          value={placeCategory}
          onChange={(id) => {
            onPlaceCategoryChange(id as PlaceFilter);
            setPlaceDisplayLimit(PAGE_SIZE);
          }}
        />
      )}
      {!selectedPlaceId && (
        <ToggleGroup
          type="single"
          className="city-view-switch"
          aria-label="Вигляд місць"
          value={placesLayout}
          onValueChange={(next) => {
            // Radix reports "" when the selected item is pressed again. Keep one layout.
            if (next === "list" || next === "grid") changePlacesLayout(next);
          }}
        >
          <ToggleGroupItem value="list" className="city-view-switch-item">
            <MaterialIcon name="view_list" size={18} filled={placesLayout === "list"} />
            Список
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" className="city-view-switch-item">
            <MaterialIcon name="grid_view" size={18} filled={placesLayout === "grid"} />
            Сітка
          </ToggleGroupItem>
        </ToggleGroup>
      )}
      {!selectedPlaceId && locationError && (
        <p className="city-location-error" role="status">
          {locationError} Показуємо місця від центру Львова.
        </p>
      )}
      {!selectedPlaceId && placesStatus === "loading" && (
        <div className="city-places-state" role="status">
          <MaterialIcon name="progress_activity" size={20} />
          <span>Завантажуємо місця поруч…</span>
        </div>
      )}
      {!selectedPlaceId && placesStatus === "error" && (
        <div className="city-places-state city-places-error" role="alert">
          <MaterialIcon name="cloud_off" size={20} />
          <span>{placesError}</span>
          <Button type="button" variant="outline" size="sm" onClick={onRetryPlaces}>
            Спробувати ще
          </Button>
        </div>
      )}
      {placesStatus === "ready" &&
        (selectedPlaceId
          ? places.some((p) => p.id === selectedPlaceId)
          : visiblePlaces.length > 0) && (
        <>
          {!selectedPlaceId && (
            <div className="city-place-results-heading">
              <span>Знайдено: {visiblePlaces.length}</span>
            </div>
          )}
          <div
            className={`city-place-list city-osm-place-list${selectedPlaceId ? " place-detail-list" : ""}${placesLayout === "grid" ? " is-grid" : ""}`}
          >
            {shownPlaces
              .filter((place) => !selectedPlaceId || place.id === selectedPlaceId)
              .map((place) => {
                const detailOpen = selectedPlaceId === place.id;
                if (detailOpen) {
                  const phone = place.details["Телефон"] || place.details["Мобільний"];
                  return (
                    <EntityDetail
                      key={place.id}
                      kind={place.category}
                      title={place.name}
                      eyebrow={place.categoryLabel}
                      subtitle={[place.address, formatPlaceDistance(distanceToPlace(place, origin))].filter(Boolean).join(" · ")}
                      icon={cityPlaceIcons[place.category]}
                      iconColor={CITY_PLACE_CATEGORY_COLORS[place.category]}
                      imageUrl={place.imageUrl}
                      place={place}
                      info={placeInfoRows(place)}
                      menu={demoProductsFor(place)}
                      catalog={demoProductsFor(place)}
                      coordinates={[place.lng, place.lat]}
                      phone={phone}
                      website={place.details["Сайт"]}
                      saved={saved.has(place.id)}
                      onToggleSaved={() => onToggleSaved(place.id)}
                      onShowOnMap={() => onShowOnMap([place.lng, place.lat], place.name)}
                      onDirections={() => onDirections([place.lng, place.lat], place.name)}
                    />
                  );
                }
                // List results are context cards (DESIGN.md §7). The grid keeps UnifiedCard's 4:3 photo tiles.
                if (placesLayout === "list") {
                  return (
                    <ContextCard
                      key={place.id}
                      title={place.name}
                      category={place.categoryLabel}
                      icon={cityPlaceIcons[place.category]}
                      iconColor={CITY_PLACE_CATEGORY_COLORS[place.category]}
                      subtitle={[formatPlaceDistance(distanceToPlace(place, origin)), place.address].filter(Boolean).join(" · ")}
                      imageUrl={place.imageUrl}
                      place={place}
                      onOpen={() => onOpenPlace(place.id)}
                      actions={[
                        {
                          label: "Маршрут",
                          icon: "directions",
                          primary: true,
                          onClick: () => onDirections([place.lng, place.lat], place.name),
                        },
                        {
                          label: "На мапі",
                          icon: "map",
                          onClick: () => onShowOnMap([place.lng, place.lat], place.name),
                        },
                      ]}
                    />
                  );
                }
                return (
                  <UnifiedCard
                    key={place.id}
                    variant={place.category === "food" ? "restaurant" : place.category === "stay" ? "hotel" : "place"}
                    onClick={() => onOpenPlace(place.id)}
                  >
                    <UnifiedCard.Header
                      title={place.name}
                      subtitle={[formatPlaceDistance(distanceToPlace(place, origin)), place.address].filter(Boolean).join(" · ")}
                      icon={cityPlaceIcons[place.category]}
                      iconColor={CITY_PLACE_CATEGORY_COLORS[place.category]}
                      category={place.categoryLabel}
                      imageUrl={place.imageUrl}
                      place={place}
                    />
                    {place.details["Графік"] && (
                      <UnifiedCard.Meta
                        label="Графік"
                        value={formatOpeningHours(place.details["Графік"])}
                        icon="schedule"
                      />
                    )}
                  </UnifiedCard>
                );
              })}
          </div>
        </>
      )}
      {!selectedPlaceId && placesStatus === "ready" && shownPlaces.length < visiblePlaces.length && (
        <Button
          type="button"
          variant="outline"
          className="city-show-more"
          onClick={() => setPlaceDisplayLimit((l) => l + PAGE_SIZE)}
        >
          <MaterialIcon name="expand_more" size={18} />
          Показати ще ({visiblePlaces.length - shownPlaces.length})
        </Button>
      )}
      {!selectedPlaceId && placesStatus === "ready" && visiblePlaces.length === 0 && (
        <div className="city-places-state">
          <MaterialIcon name="search_off" size={20} />
          <span>Місць за цим фільтром не знайдено.</span>
        </div>
      )}
    </section>
  );
}
