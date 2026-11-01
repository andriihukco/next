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
import { cityPlaceCategories } from "../lib/city-places";
import type { CityDirectoryListing } from "../lib/listing-types";
import { sampleJobListings, sampleRealEstateListings } from "../lib/features";
import { useSavedItems } from "../lib/use-saved-items";
import {
  type CitySection,
  type CityGuideProps,
  type CityTab,
  CITY_SECTIONS,
  CITY_TABS,
  cityTabOf,
  CITY_CENTER,
  FEATURED_CATEGORIES,
  EXCLUDED_PLACE_CATEGORIES,
  POPULAR_CATEGORY_ORDER,
  SERVICE_CATEGORY_IDS,
  SERVICE_FILTERS,
  JOB_FILTERS,
  REAL_ESTATE_FILTERS,
} from "./city-guide/constants";
import { distanceToPlace } from "./city-guide/helpers";
import { DirectoryListingPage } from "./city-guide/directory-listing-page";
import { EducationSection } from "./city-guide/education-section";
import { EventsSection } from "./city-guide/events-section";
import { PlacesSection, type PlaceFilter } from "./city-guide/places-section";
import { SIMPLE_PLACE_SECTIONS, SimplePlaceSection } from "./city-guide/simple-place-section";
import { TransportSection } from "./city-guide/transport-section";
import { MoreList } from "./city-guide/more-list";

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

  const [section, setSection] = useState<CitySection | "more">(() => {
    const saved = localStorage.getItem("eway-last-section");
    const known = CITY_SECTIONS.some((item) => item.id === saved) || saved === "more";
    return known ? (saved as CitySection | "more") : "transport";
  });
  const tab: CityTab = section === "more" ? "more" : cityTabOf(section);
  const [placeCategory, setPlaceCategory] = useState<PlaceFilter>("popular");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedEducationId, setSelectedEducationId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  const origin = userLocation ?? CITY_CENTER;
  const [saved, toggleSaved] = useSavedItems();
  const actions = { saved, onToggleSaved: toggleSaved, onShowOnMap, onDirections };

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

  const isDetailPage = Boolean(selectedPlaceId || selectedEducationId || selectedEventId || selectedListingId);

  const returnToSection = (): void => {
    setSelectedPlaceId(null);
    setSelectedEducationId(null);
    setSelectedEventId(null);
    setSelectedListingId(null);
    onPageNavigationChange(false, returnToSection);
  };
  /** Opens a detail page in the current section; «Назад» comes back to the list. */
  const openDetail = (select: (id: string) => void) => (id: string): void => {
    select(id);
    onPageNavigationChange(true, returnToSection);
  };

  useEffect(() => {
    if (!userLocation && placeCategory === "nearby") {
      setPlaceCategory("popular");
    }
  }, [placeCategory, userLocation]);



  /** Leaves any open detail page and shows a rail tab. Tapping «Більше» shows its list. */
  const showTab = (next: CitySection | "more"): void => {
    setSelectedPlaceId(null);
    setSelectedEducationId(null);
    setSelectedEventId(null);
    setSelectedListingId(null);
    setSection(next);
    localStorage.setItem("eway-last-section", next);
    if (next === "places") setPlaceCategory("popular");
    onPageNavigationChange(false, returnToSection);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="city-guide">
      {/* ── Section navigation: four fixed tabs (design/navigation.md) ─────── */}
      <nav
        ref={sectionNavRef}
        className="city-section-nav"
        aria-label="Розділи міста"
        data-tour="city-sections"
        hidden={isDetailPage}
      >
        {CITY_TABS.map((item) => (
          <button
            type="button"
            key={item.id}
            data-tour={item.id === "more" ? "city-more" : undefined}
            className={tab === item.id ? "active" : ""}
            aria-current={tab === item.id ? "page" : undefined}
            onClick={() => showTab(item.id === "more" ? "more" : item.id)}
          >
            <MaterialIcon name={item.icon} size={24} />
            {item.label}
          </button>
        ))}
      </nav>

      {section === "more" && <MoreList onOpen={(id) => showTab(id)} />}
      {tab === "more" && section !== "more" && (
        <button type="button" className="city-more-back" onClick={() => showTab("more")}>
          <MaterialIcon name="arrow_back" size={20} />
          Більше
        </button>
      )}
      {section === "transport" && (
        <TransportSection
          vehicles={transportVehicles}
          transitDataStatus={transitDataStatus}
          simulated={transportIsSimulated}
          onUseLiveTransit={onUseLiveTransit}
          userLocation={userLocation}
          searchQuery={searchQuery}
          onSelectVehicle={onSelectTransportVehicle}
        />
      )}
      {section === "places" && (
        <PlacesSection
          {...actions}
          places={places}
          visiblePlaces={visiblePlaces}
          availableCategories={availableCategories}
          placeCategory={placeCategory}
          onPlaceCategoryChange={setPlaceCategory}
          userLocation={userLocation}
          locationError={locationError}
          origin={origin}
          placesStatus={placesStatus}
          placesError={placesError}
          onRetryPlaces={onRetryPlaces}
          selectedPlaceId={selectedPlaceId}
          onOpenPlace={openDetail(setSelectedPlaceId)}
        />
      )}
      {section === "education" && (
        <EducationSection
          {...actions}
          places={places}
          placesStatus={placesStatus}
          placesError={placesError}
          onRetryPlaces={onRetryPlaces}
          selectedId={selectedEducationId}
          onOpen={openDetail(setSelectedEducationId)}
        />
      )}
      {/* ── Directory sections ────────────────────────────────────────────── */}
      {section === "services" && (
        <DirectoryListingPage
          title="Послуги"
          kind="service"
          selectedId={selectedListingId}
          onSelect={openDetail(setSelectedListingId)}
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
          onSelect={openDetail(setSelectedListingId)}
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
          onSelect={openDetail(setSelectedListingId)}
          saved={saved}
          onToggleSaved={toggleSaved}
          onDirections={onDirections}
          listings={sampleRealEstateListings}
          sample
          filters={REAL_ESTATE_FILTERS}
          onShowOnMap={onShowOnMap}
        />
      )}
      {section === "events" && (
        <EventsSection
          {...actions}
          cityEvents={cityEvents}
          selectedId={selectedEventId}
          onOpen={openDetail(setSelectedEventId)}
        />
      )}
      {(section === "market" || section === "parking" || section === "fuel" || section === "charging") && (
        <SimplePlaceSection config={SIMPLE_PLACE_SECTIONS[section]} places={visiblePlaces} onShowOnMap={onShowOnMap} />
      )}
    </div>
  );
}
