/**
 * @file city-guide.tsx
 * @description City guide panel with tabbed sections: Transport, Places,
 *   Education, Services, Jobs, Real Estate, Events.
 *
 *   Transport section has been redesigned per the 2026 UX audit:
 *   - "Nearby" tab: all vehicle types grouped by walk-distance buckets
 *   - Per-type tabs (Bus / Tram / Trolleybus / Taxi): list of routes,
 *     each expandable to show vehicles currently on that route
 *   - Directions inputs removed — they live in the Map view instead
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MaterialIcon } from "./ui/material-icon";
import {
  CITY_PLACE_CATEGORY_COLORS,
  cityEducationKind,
  cityPlaceCategories,
  cityPlaceIcons,
  formatOpeningHours,
  type CityEducationKind,
  type CityPlaceCategory,
} from "../lib/city-places";
import type { CityDirectoryListing } from "../lib/listing-types";
import { sampleJobListings, sampleRealEstateListings } from "../lib/features";
import { Button } from "./ui/button";
import { CategoryTiles } from "./category-tiles";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import "./city-view-switch.css";
import { EntityDetail } from "./entity-detail";
import { useSavedItems } from "../lib/use-saved-items";
import { UnifiedCard } from "./ui/unified-card";
import { ContextCard } from "./ui/context-card";
import {
  type CitySection,
  type PlacesLayout,
  type TransportTab,
  type CityTransitType,
  type CityGuideProps,
  TRANSPORT_TABS,
  CITY_SECTIONS,
  CITY_CENTER,
  FEATURED_CATEGORIES,
  EXCLUDED_PLACE_CATEGORIES,
  POPULAR_CATEGORY_ORDER,
  EDUCATION_KIND_LABELS,
  EVENT_FILTERS,
  EDUCATION_FILTERS,
  SERVICE_CATEGORY_IDS,
  SERVICE_FILTERS,
  JOB_FILTERS,
  REAL_ESTATE_FILTERS,
} from "./city-guide/constants";
import {
  distanceToPlace,
  formatPlaceDistance,
  demoProductsFor,
  placeInfoRows,
} from "./city-guide/helpers";
import { EducationCard } from "./city-guide/education-card";
import { ComingSoonState, DirectoryListingPage } from "./city-guide/directory-listing-page";
import { NearbyTransportTab, RouteListTab } from "./city-guide/transport-tabs";

// ─── Main Component ────────────────────────────────────────────────────────────

export function CityGuide({
  userLocation,
  locationError,
  onShowOnMap,
  onDirections,
  onPageNavigationChange,
  places,
  placesStatus,
  placesError,
  onRetryPlaces,
  onPlacesChange,
  cityEvents,
  transportVehicles,
  transitDataStatus,
  transportIsSimulated,
  onUseLiveTransit,
  onSelectTransportVehicle,
  searchQuery,
}: CityGuideProps) {
  const cityServiceListings = useMemo<CityDirectoryListing[]>(
    () =>
      places
        .filter((place) => SERVICE_CATEGORY_IDS.includes(place.category))
        .map((place) => ({
          id: place.id,
          name: place.name,
          category: place.category,
          summary: place.categoryLabel,
          details: place.address,
          location: place.address,
          coordinates: [place.lng, place.lat],
        })),
    [places],
  );

  const [section, setSection] = useState<CitySection>(() => {
    const saved = localStorage.getItem("eway-last-section");
    return (saved as CitySection) || "transport";
  });
  const [transportTab, setTransportTab] = useState<TransportTab>(() => {
    const saved = localStorage.getItem("eway-last-transport-tab");
    return (saved as TransportTab) || "nearby";
  });
  const [placeCategory, setPlaceCategory] = useState<
    "popular" | "nearby" | CityPlaceCategory
  >("popular");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [placeDisplayLimit, setPlaceDisplayLimit] = useState(40);
  const [placesLayout, setPlacesLayout] = useState<PlacesLayout>(() =>
    localStorage.getItem("eway-places-layout") === "grid" ? "grid" : "list",
  );
  const [educationKind, setEducationKind] = useState<CityEducationKind>("school");
  const [selectedEducationId, setSelectedEducationId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [eventCategory, setEventCategory] = useState("all");

  const origin = userLocation ?? CITY_CENTER;
  const [saved, toggleSaved] = useSavedItems();

  // Keep the active section tab visible when it changes or the list reopens.
  const sectionNavRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const nav = sectionNavRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active) return;
    nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
  }, [section]);

  const availableCategories = useMemo(
    () =>
      cityPlaceCategories.filter(
        ({ id }) =>
          !EXCLUDED_PLACE_CATEGORIES.has(id) &&
          (FEATURED_CATEGORIES.includes(id) ||
            places.some((place) => place.category === id)),
      ),
    [places],
  );

  const visiblePlaces = useMemo(
    () =>
      places
        .filter((place) => {
          if (EXCLUDED_PLACE_CATEGORIES.has(place.category)) return false;
          const matchesCategory =
            placeCategory === "nearby" ||
            placeCategory === "popular" ||
            place.category === placeCategory;
          const matchesSearch =
            `${place.name} ${place.categoryLabel} ${place.address}`
              .toLocaleLowerCase("uk-UA")
              .includes(searchQuery.trim().toLocaleLowerCase("uk-UA"));
          return matchesCategory && matchesSearch;
        })
        .sort((a, b) => {
          if (placeCategory === "popular") {
            const diff =
              POPULAR_CATEGORY_ORDER.indexOf(a.category) -
              POPULAR_CATEGORY_ORDER.indexOf(b.category);
            if (diff !== 0) return diff;
          }
          return distanceToPlace(a, origin) - distanceToPlace(b, origin);
        }),
    [origin, placeCategory, searchQuery, places],
  );

  const shownPlaces = visiblePlaces.slice(0, placeDisplayLimit);

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

  const selectedEducation = educationPlaces.find(
    ({ place }) => place.id === selectedEducationId,
  );
  const selectedEvent = cityEvents.find((event) => event.id === selectedEventId);

  const isDetailPage = Boolean(selectedPlaceId || selectedEducationId || selectedEventId || selectedListingId);

  const changePlacesLayout = (next: PlacesLayout): void => {
    setPlacesLayout(next);
    localStorage.setItem("eway-places-layout", next);
  };

  const returnToSection = (): void => {
    setSelectedPlaceId(null);
    setSelectedEducationId(null);
    setSelectedEventId(null);
    setSelectedListingId(null);
    onPageNavigationChange(false, returnToSection);
  };

  useEffect(() => {
    if (placesStatus === "ready") {
      const filteredPlaces = (() => {
        switch (section) {
          case "places":
            return visiblePlaces;
          case "market":
            return places.filter((p) => p.category === "market");
          case "parking":
            return places.filter((p) => p.category === "parking");
          case "fuel":
            return places.filter((p) => p.category === "fuel");
          case "charging":
            return places.filter((p) => p.category === "charging-station");
          default:
            return [];
        }
      })();
      onPlacesChange(filteredPlaces);
    }
  }, [onPlacesChange, placesStatus, section, visiblePlaces, places]);

  useEffect(() => {
    if (!userLocation && placeCategory === "nearby") {
      setPlaceCategory("popular");
    }
  }, [placeCategory, userLocation]);



  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="city-guide">

      {/* ── Section navigation ─────────────────────────────────────────────── */}
      <nav
        ref={sectionNavRef}
        className="city-section-nav"
        aria-label="Розділи міста"
        data-tour="city-sections"
        hidden={isDetailPage}
      >
        {CITY_SECTIONS.map((item) => (
          <button
            type="button"
            key={item.id}
            data-tour={item.id === "events" ? "city-events" : undefined}
            className={section === item.id ? "active" : ""}
            aria-current={section === item.id ? "page" : undefined}
            onClick={() => {
              setSelectedPlaceId(null);
              setSelectedEducationId(null);
              setSelectedEventId(null);
              setSelectedListingId(null);
              setSection(item.id);
              localStorage.setItem("eway-last-section", item.id);
              if (item.id === "places") setPlaceCategory("popular");
              onPageNavigationChange(false, returnToSection);
            }}
          >
            <MaterialIcon name={item.icon} size={24} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* ── Transport section ──────────────────────────────────────────────── */}
      {section === "transport" && (
        <section className="city-section city-transport-page" aria-label="Транспорт">

          {/* Live data status banner */}
          {transportIsSimulated ? (
            <div className="city-transit-source is-simulated">
              <span>Симуляція — не GPS-наживо.</span>
              <Button type="button" variant="outline" size="sm" onClick={onUseLiveTransit}>
                GPS-наживо
              </Button>
            </div>
          ) : transitDataStatus === "loading" ? (
            <p className="city-transit-source" role="status">
              Завантажуємо GPS…
            </p>
          ) : null}

          <CategoryTiles
            label="Тип транспорту"
            items={TRANSPORT_TABS.map((tab) => ({
              ...tab,
              count: tab.id === "nearby" ? 0 : transportVehicles.filter((v) => v.type === tab.id).length,
            }))}
            value={transportTab}
            onChange={(id) => {
              setTransportTab(id as TransportTab);
              localStorage.setItem("eway-last-transport-tab", id);
            }}
          />

          {/* Tab content */}
          {transportTab === "nearby" ? (
            <NearbyTransportTab
              vehicles={transportVehicles}
              userLocation={userLocation}
              onRequestLocation={() => {
                // The parent handles geolocation; we signal via onShowOnMap with a
                // special key. A cleaner approach would be a prop, but for now we
                // re-use the pattern the map view uses.
                // Parent listens for this via onSelectTransportVehicle("__locate__")
                onSelectTransportVehicle("__locate__");
              }}
              onSelectVehicle={onSelectTransportVehicle}
              transitDataStatus={transitDataStatus}
            />
          ) : (
            <RouteListTab
              type={transportTab as CityTransitType}
              vehicles={transportVehicles}
              searchQuery={searchQuery}
              onSelectVehicle={onSelectTransportVehicle}
              transitDataStatus={transitDataStatus}
            />
          )}
        </section>
      )}

      {/* ── Places section ─────────────────────────────────────────────────── */}
      {section === "places" && (
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
                setPlaceCategory(id as typeof placeCategory);
                setPlaceDisplayLimit(40);
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
                          onToggleSaved={() => toggleSaved(place.id)}
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
                          onOpen={() => {
                            setSelectedPlaceId(place.id);
                            onPageNavigationChange(true, returnToSection);
                          }}
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
                        onClick={() => {
                          setSelectedPlaceId(place.id);
                          onPageNavigationChange(true, returnToSection);
                        }}
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
              onClick={() => setPlaceDisplayLimit((l) => l + 40)}
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
      )}

      {/* ── Education section ─────────────────────────────────────────────── */}
      {section === "education" && (
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
                onToggleSaved={() => toggleSaved(selectedEducation.place.id)}
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
                      onOpen={() => {
                        setSelectedEducationId(place.id);
                        onPageNavigationChange(true, returnToSection);
                      }}
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
      )}

      {/* ── Directory sections ────────────────────────────────────────────── */}
      {section === "services" && (
        <DirectoryListingPage
          title="Послуги"
          kind="service"
          selectedId={selectedListingId}
          onSelect={(id) => {
            setSelectedListingId(id);
            onPageNavigationChange(true, returnToSection);
          }}
          saved={saved}
          onToggleSaved={toggleSaved}
          onDirections={onDirections}
          listings={cityServiceListings}
          filters={SERVICE_FILTERS}
          onShowOnMap={onShowOnMap}
        />
      )}
      {section === "jobs" && (
        <DirectoryListingPage
          title="Робота у Львові"
          kind="job"
          selectedId={selectedListingId}
          onSelect={(id) => {
            setSelectedListingId(id);
            onPageNavigationChange(true, returnToSection);
          }}
          saved={saved}
          onToggleSaved={toggleSaved}
          onDirections={onDirections}
          listings={sampleJobListings}
          sample
          filters={JOB_FILTERS}
          onShowOnMap={onShowOnMap}
        />
      )}
      {section === "real-estate" && (
        <DirectoryListingPage
          title="Нерухомість"
          kind="home"
          selectedId={selectedListingId}
          onSelect={(id) => {
            setSelectedListingId(id);
            onPageNavigationChange(true, returnToSection);
          }}
          saved={saved}
          onToggleSaved={toggleSaved}
          onDirections={onDirections}
          listings={sampleRealEstateListings}
          sample
          filters={REAL_ESTATE_FILTERS}
          onShowOnMap={onShowOnMap}
        />
      )}

      {/* ── Events section ────────────────────────────────────────────────── */}
      {section === "events" && (
        <section className="city-section" aria-label="Події">
          {!selectedEvent && (
            <>
              <CategoryTiles
                label="Категорії подій"
                items={EVENT_FILTERS}
                value={eventCategory}
                onChange={setEventCategory}
              />
            </>
          )}
          <div className="city-event-list">
            {cityEvents
              .filter(
                (event) =>
                  (!selectedEvent || event.id === selectedEvent.id) &&
                  (selectedEvent ||
                    eventCategory === "all" ||
                    event.category === eventCategory),
              )
              .map((event) =>
                event.id === selectedEventId ? (
                  <EntityDetail
                    key={event.id}
                    kind="event"
                    title={event.name}
                    eyebrow={event.category}
                    subtitle={`${event.time} · ${event.venue}`}
                    date={{ day: event.day, month: event.month }}
                    demo
                    description={event.summary}
                    info={[
                      { icon: "schedule", label: "Час", value: `${event.day} ${event.month}, ${event.time}` },
                      { icon: "location_on", label: "Місце", value: event.venue },
                    ]}
                    coordinates={event.coordinates}
                    saved={saved.has(event.id)}
                    onToggleSaved={() => toggleSaved(event.id)}
                    onShowOnMap={() => onShowOnMap(event.coordinates, event.venue)}
                    onDirections={() => onDirections(event.coordinates, event.venue)}
                  />
                ) : (
                  <UnifiedCard
                    key={event.id}
                    variant="event"
                    onClick={() => {
                      setSelectedEventId(event.id);
                      onPageNavigationChange(true, returnToSection);
                    }}
                  >
                    <UnifiedCard.Header
                      title={event.name}
                      subtitle={`${event.time} · ${event.venue}`}
                      category={`${event.category} · демо`}
                      date={{ day: event.day, month: event.month }}
                    />
                    <UnifiedCard.Action
                      label="На мапі"
                      icon="location_on"
                      variant="outline"
                      onClick={() => onShowOnMap(event.coordinates, event.venue)}
                    />
                  </UnifiedCard>
                ),
              )}
            {cityEvents.length === 0 && <ComingSoonState />}
            {cityEvents.length > 0 &&
              !selectedEvent &&
              !cityEvents.some(
                (event) => eventCategory === "all" || event.category === eventCategory,
              ) && (
                <div className="city-places-state">
                  <MaterialIcon name="event_busy" size={20} />
                  <span>Подій у цій категорії поки немає.</span>
                </div>
              )}
          </div>
        </section>
      )}

      {/* ── Market section ─────────────────────────────────────────────────── */}
      {section === "market" && (
        <section className="city-section" aria-label="Ринок">
          <div className="city-category-heading">
            <h2>Ринки та барахолки</h2>
          </div>
          <div className="city-place-list">
            {visiblePlaces.filter((p) => p.category === "market").map((place) => (
              <UnifiedCard key={place.id} variant="directory">
                <UnifiedCard.Header
                  title={place.name}
                  subtitle={place.address}
                  icon="store"
                />
                <UnifiedCard.Action
                  label="На мапі"
                  icon="location_on"
                  variant="outline"
                  onClick={() => onShowOnMap([place.lng, place.lat], place.name)}
                />
              </UnifiedCard>
            ))}
            {visiblePlaces.filter((p) => p.category === "market").length === 0 && (
              <div className="city-places-state">
                <MaterialIcon name="store" size={20} />
                <span>Ринків поки немає.</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Parking section ────────────────────────────────────────────────── */}
      {section === "parking" && (
        <section className="city-section" aria-label="Парковка">
          <div className="city-category-heading">
            <h2>Парковки</h2>
          </div>
          <div className="city-place-list">
            {visiblePlaces.filter((p) => p.category === "parking").map((place) => (
              <UnifiedCard key={place.id} variant="directory">
                <UnifiedCard.Header
                  title={place.name}
                  subtitle={place.address}
                  icon="local_parking"
                />
                <UnifiedCard.Action
                  label="На мапі"
                  icon="location_on"
                  variant="outline"
                  onClick={() => onShowOnMap([place.lng, place.lat], place.name)}
                />
              </UnifiedCard>
            ))}
            {visiblePlaces.filter((p) => p.category === "parking").length === 0 && (
              <div className="city-places-state">
                <MaterialIcon name="local_parking" size={20} />
                <span>Парковок поки немає.</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Fuel section ───────────────────────────────────────────────────── */}
      {section === "fuel" && (
        <section className="city-section" aria-label="АЗС">
          <div className="city-category-heading">
            <h2>АЗС (Заправки)</h2>
          </div>
          <div className="city-place-list">
            {visiblePlaces.filter((p) => p.category === "fuel").map((place) => (
              <UnifiedCard key={place.id} variant="directory">
                <UnifiedCard.Header
                  title={place.name}
                  subtitle={place.address}
                  icon="local_gas_station"
                />
                <UnifiedCard.Action
                  label="На мапі"
                  icon="location_on"
                  variant="outline"
                  onClick={() => onShowOnMap([place.lng, place.lat], place.name)}
                />
              </UnifiedCard>
            ))}
            {visiblePlaces.filter((p) => p.category === "fuel").length === 0 && (
              <div className="city-places-state">
                <MaterialIcon name="local_gas_station" size={20} />
                <span>АЗС поки немає.</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Charging section ───────────────────────────────────────────────── */}
      {section === "charging" && (
        <section className="city-section" aria-label="Електрозарядка">
          <div className="city-category-heading">
            <h2>Електрозарядні станції</h2>
          </div>
          <div className="city-place-list">
            {visiblePlaces.filter((p) => p.category === "charging-station").map((place) => (
              <UnifiedCard key={place.id} variant="directory">
                <UnifiedCard.Header
                  title={place.name}
                  subtitle={place.address}
                  icon="ev_station"
                />
                <UnifiedCard.Action
                  label="На мапі"
                  icon="location_on"
                  variant="outline"
                  onClick={() => onShowOnMap([place.lng, place.lat], place.name)}
                />
              </UnifiedCard>
            ))}
            {visiblePlaces.filter((p) => p.category === "charging-station").length === 0 && (
              <div className="city-places-state">
                <MaterialIcon name="ev_station" size={20} />
                <span>Електрозарядних станцій поки немає.</span>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
