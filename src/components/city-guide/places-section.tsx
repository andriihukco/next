import { useMemo, useState, type CSSProperties } from "react";
import { Button } from "../ui/button";
import { ContextCard } from "../ui/context-card";
import { EntityDetail } from "../entity-detail";
import { IconButton } from "../ui/icon-button";
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
import { openStatus } from "../../lib/opening-hours";
import { cityPlaceGroupOf, cityPlaceGroups } from "../../lib/city-place-categories";
import { useHiddenCategories } from "../../lib/category-prefs";
import { CategorySettings } from "./category-settings";
import { MyPlacesView } from "./my-places-view";
import {
  demoProductsFor,
  distanceToPlace,
  formatPlaceDistance,
  placeAmenities,
  placeInfoRows,
  placeKindLine,
} from "./helpers";
import "../city-view-switch.css";
import "./places-section.css";

export type PlaceFilter = "popular" | "nearby" | CityPlaceCategory;

/** Tabs of «Місця». «Категорії» shows the category grid, and a chosen category opens its list. */
type PlacesTab = "nearby" | "mine" | "popular" | "categories";

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

/** «Місця»: tabs (Поруч, Мої місця, Популярне | Категорії, settings), then the chosen list or grid. */
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
  const [tab, setTab] = useState<PlacesTab>(() =>
    placeCategory === "nearby" ? "nearby" : placeCategory === "popular" ? "popular" : "categories",
  );
  const [hiddenCategories, setCategoryShown, resetCategories] = useHiddenCategories();
  const [categorySettingsOpen, setCategorySettingsOpen] = useState(false);

  /** A category picked from the grid. «popular» or «nearby» means no category is chosen. */
  const chosenCategory = placeCategory === "popular" || placeCategory === "nearby" ? null : placeCategory;
  const showList = selectedPlaceId !== null || (tab !== "mine" && !(tab === "categories" && !chosenCategory));

  const selectTab = (next: PlacesTab): void => {
    setTab(next);
    setPlaceDisplayLimit(PAGE_SIZE);
    if (next === "nearby" || next === "popular") onPlaceCategoryChange(next);
    if (next === "categories" && !chosenCategory) onPlaceCategoryChange("popular");
  };
  const pickCategory = (id: CityPlaceCategory): void => {
    onPlaceCategoryChange(id);
    setPlaceDisplayLimit(PAGE_SIZE);
  };

  const listPlaces = selectedPlaceId ? places.filter((place) => place.id === selectedPlaceId) : visiblePlaces.slice(0, placeDisplayLimit);
  const counts = useMemo(() => {
    const byCategory = new Map<CityPlaceCategory, number>();
    for (const place of places) byCategory.set(place.category, (byCategory.get(place.category) ?? 0) + 1);
    return byCategory;
  }, [places]);
  const groups = [
    ...cityPlaceGroups.map((item) => ({ id: item.id, label: item.label, icon: item.icon })),
  ];
  const shownCategories = availableCategories.filter((category) => !hiddenCategories.has(category.id));
  const chosenLabel = chosenCategory ? availableCategories.find((category) => category.id === chosenCategory)?.label : undefined;

  return (
    <section
      className={`city-section city-places${selectedPlaceId ? " place-detail-page" : ""}`}
      aria-label="Місця"
    >
      {!selectedPlaceId && (
        <nav className="places-tabs" aria-label="Вкладки місць">
          <div className="places-tab-group" role="group" aria-label="Місця поруч і популярні">
            {userLocation && (
              <button type="button" className="places-tab" aria-pressed={tab === "nearby"} onClick={() => selectTab("nearby")}>
                <MaterialIcon name="near_me" size={18} filled={tab === "nearby"} />
                Поруч
              </button>
            )}
            <button type="button" className="places-tab" aria-pressed={tab === "mine"} onClick={() => selectTab("mine")}>
              <MaterialIcon name="bookmarks" size={18} filled={tab === "mine"} />
              Мої місця
            </button>
            <button type="button" className="places-tab" aria-pressed={tab === "popular"} onClick={() => selectTab("popular")}>
              <MaterialIcon name="award_star" size={18} filled={tab === "popular"} />
              Популярне
            </button>
          </div>
          <span className="places-tab-divider" aria-hidden="true" />
          <button type="button" className="places-tab" aria-pressed={tab === "categories"} onClick={() => selectTab("categories")}>
            <MaterialIcon name="category" size={18} filled={tab === "categories"} />
            Категорії
          </button>
          <IconButton label="Налаштування категорій" className="places-tab-settings" onClick={() => setCategorySettingsOpen(true)}>
            <MaterialIcon name="tune" size={20} />
          </IconButton>
        </nav>
      )}

      {!selectedPlaceId && tab === "mine" && (
        <MyPlacesView places={places} saved={saved} userLocation={userLocation} onOpenPlace={onOpenPlace} />
      )}

      {!selectedPlaceId && tab === "categories" && !chosenCategory && (
        <div className="category-grid" aria-label="Усі категорії">
          {groups.map((group) => {
            const items = shownCategories.filter((category) => cityPlaceGroupOf(category.id) === group.id);
            if (items.length === 0) return null;
            return (
              <section key={group.id} className="category-grid-group" aria-label={group.label}>
                <h3 className="category-grid-title">
                  <MaterialIcon name={group.icon} size={18} />
                  {group.label}
                </h3>
                <div className="category-grid-tiles">
                  {items.map((category) => {
                    const count = counts.get(category.id) ?? 0;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        className="category-grid-tile"
                        data-filter={category.id}
                        onClick={() => pickCategory(category.id)}
                      >
                        <span className="category-tile-orb" style={{ "--category-color": CITY_PLACE_CATEGORY_COLORS[category.id] } as CSSProperties}>
                          <MaterialIcon name={cityPlaceIcons[category.id]} size={30} />
                          {count > 0 && <span className="category-tile-count">{count}</span>}
                        </span>
                        <span className="category-tile-label">{category.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {!selectedPlaceId && tab === "categories" && chosenCategory && (
        <div className="places-category-head">
          <IconButton label="Усі категорії" onClick={() => onPlaceCategoryChange("popular")}>
            <MaterialIcon name="arrow_back" size={20} />
          </IconButton>
          <span>{chosenLabel}</span>
        </div>
      )}

      {!selectedPlaceId && showList && (
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
      {!selectedPlaceId && showList && locationError && (
        <p className="city-location-error" role="status">
          {locationError} Показуємо місця від центру Львова.
        </p>
      )}
      {!selectedPlaceId && showList && placesStatus === "loading" && (
        <div className="city-places-state" role="status">
          <MaterialIcon name="progress_activity" size={20} />
          <span>Завантажуємо місця поруч…</span>
        </div>
      )}
      {!selectedPlaceId && showList && placesStatus === "error" && (
        <div className="city-places-state city-places-error" role="alert">
          <MaterialIcon name="cloud_off" size={20} />
          <span>{placesError}</span>
          <Button type="button" variant="outline" size="sm" onClick={onRetryPlaces}>
            Спробувати ще
          </Button>
        </div>
      )}
      {showList &&
        placesStatus === "ready" &&
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
            {listPlaces.map((place) => {
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
                      description={place.details["Опис"]}
                      info={placeInfoRows(place).filter((row) => row.label !== "Опис")}
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
                  const phone = place.details["Телефон"] || place.details["Мобільний"];
                  const site = place.details["Сайт"];
                  const website = site && !/^https?:\/\//.test(site) ? `https://${site}` : site;
                  return (
                    <ContextCard
                      key={place.id}
                      title={place.name}
                      category={placeKindLine(place)}
                      status={openStatus(place.details["Графік"])}
                      amenities={placeAmenities(place)}
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
                        ...(phone
                          ? [{ label: "Дзвінок", icon: "call", onClick: () => window.open(`tel:${phone.split(";")[0].trim()}`, "_self") }]
                          : []),
                        ...(website
                          ? [{ label: "Сайт", icon: "language", onClick: () => window.open(website, "_blank", "noopener") }]
                          : []),
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
                        value={openStatus(place.details["Графік"])?.text ?? formatOpeningHours(place.details["Графік"])}
                        icon="schedule"
                      />
                    )}
                  </UnifiedCard>
                );
              })}
          </div>
        </>
      )}
      {!selectedPlaceId && showList && placesStatus === "ready" && listPlaces.length < visiblePlaces.length && (
        <Button
          type="button"
          variant="outline"
          className="city-show-more"
          onClick={() => setPlaceDisplayLimit((l) => l + PAGE_SIZE)}
        >
          <MaterialIcon name="expand_more" size={18} />
          Показати ще ({visiblePlaces.length - listPlaces.length})
        </Button>
      )}
      {!selectedPlaceId && showList && placesStatus === "ready" && visiblePlaces.length === 0 && (
        <div className="city-places-state">
          <MaterialIcon name="search_off" size={20} />
          <span>Місць за цим фільтром не знайдено.</span>
        </div>
      )}

      <CategorySettings
        open={categorySettingsOpen}
        onOpenChange={setCategorySettingsOpen}
        categories={availableCategories}
        hidden={hiddenCategories}
        onShownChange={setCategoryShown}
        onReset={resetCategories}
      />
    </section>
  );
}
