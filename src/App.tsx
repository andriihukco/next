import { Suspense, useDeferredValue, useEffect, useRef, useState } from "react";
import { AdminPanel, CityLaunchDialog, DevToolsLayer, NavigationPanel } from "./app-lazy";
import "maplibre-gl/dist/maplibre-gl.css";
import { MotionConfig, motion, type MotionStyle } from "motion/react";
import { AppDialogs } from "./components/app-dialogs";
import { AirAlertBanner } from "./components/air-alert-banner";
import { BrandHeaderControls } from "./components/brand-header-controls";
import { CityGuide } from "./components/city-guide";
import { MapControls } from "./components/map-controls";
import type { NavDestination } from "./components/navigation-panel";
import { SheetHandle } from "./components/sheet-handle";
import { Button } from "./components/ui/button";
import { MaterialIcon, X } from "./components/ui/material-icon";
import { TooltipProvider } from "./components/ui/tooltip";
import { PlaceInspector } from "./features/places/place-inspector";
import { MapTransportPanel } from "./features/transport/map-transport-panel";
import { StopInspector } from "./features/transport/stop-inspector";
import { TransitFlowPanel } from "./features/transport/transit-flow-panel";
import { VehicleInspector } from "./features/transport/vehicle-inspector";
import { MY_LOCATION, useAppNavigation } from "./hooks/use-app-navigation";
import { useAdminDatasets } from "./hooks/use-admin-datasets";
import { useBuildingModels } from "./hooks/use-building-models";
import { useCityLaunch } from "./hooks/use-city-launch";
import { useCityMap } from "./hooks/use-city-map";
import { useCityPlaces } from "./hooks/use-city-places";
import { useDevFixtures } from "./hooks/use-dev-fixtures";
import { useGeolocation } from "./hooks/use-geolocation";
import { useMapInteractions } from "./hooks/use-map-interactions";
import { useMapSync } from "./hooks/use-map-sync";
import { useOnboardingGate } from "./hooks/use-onboarding-gate";
import { useOnlineStatus } from "./hooks/use-online-status";
import { useRailSheet } from "./hooks/use-rail-sheet";
import { useSelection } from "./hooks/use-selection";
import { useStopDetails } from "./hooks/use-stop-details";
import { useTransitFeed } from "./hooks/use-transit-feed";
import { useVehicleFollow } from "./hooks/use-vehicle-follow";
import { useDevRoute } from "./lib/dev-tools/route";
import { loadSupabaseForAuthRedirect, usePasswordRecovery } from "./lib/password-recovery";
import { useMediaQuery } from "./lib/use-media-query";
import { useSavedItems } from "./lib/use-saved-items";
import { useMapLayerPrefs } from "./lib/map-layers";

export default function App() {
  const devToolsActive = useDevRoute();
  const mapNode = useRef<HTMLDivElement>(null);
  const selection = useSelection(devToolsActive);
  const { activeView, setActiveView, selectedVehicle, selectedStop, selectedPlace, transitFlow } = selection;
  const dev = useDevFixtures();
  const simulated = devToolsActive && dev.fixtureSettings.enabled;
  const feed = useTransitFeed({
    devToolsActive,
    fixtureSettings: dev.fixtureSettings,
    resetToken: dev.resetToken,
  });
  const map = useCityMap(mapNode, {
    onViewportChange: () => places.refreshCityPlaces(),
    onSelectVehicle: (id) => {
      const vehicle = feed.vehicles.find((candidate) => candidate.id === id);
      if (vehicle) nav.focusVehicle(vehicle);
    },
  });
  const { mapRef, mapReady } = map;
  const places = useCityPlaces(mapRef, activeView, selection.activeViewRef);
  const mapLayerPrefs = useMapLayerPrefs();
  const geo = useGeolocation(mapRef, feed.shelters);
  const stopDetails = useStopDetails(mapRef, mapReady, selectedStop, map.terrainEnabled, feed.vehicles, geo.userLocation);
  const buildingModels = useBuildingModels(selectedPlace?.id);
  const follow = useVehicleFollow(mapRef, mapReady, feed.vehicles, selectedVehicle, selection.setSelectedVehicle);
  const onboarding = useOnboardingGate(setActiveView);
  const cityLaunch = useCityLaunch();
  const online = useOnlineStatus();
  const admin = useAdminDatasets(feed, places, dev);
  const [savedPlaceIds, toggleSavedPlace] = useSavedItems();
  const [cityPageOpen, setCityPageOpen] = useState(false);
  const cityPageBackRef = useRef<() => void>(() => setCityPageOpen(false));
  const [mapSettingsOpen, setMapSettingsOpen] = useState(false);
  const [airAlertExpanded, setAirAlertExpanded] = useState(false);
  const [search, setSearch] = useState("");
  // Inputs stay instant; list filtering runs at lower priority so typing never stalls.
  const deferredSearch = useDeferredValue(search);
  const [waypoints, setWaypoints] = useState([MY_LOCATION, ""]);
  const [navDestination, setNavDestination] = useState<NavDestination | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const passwordRecovery = usePasswordRecovery();
  // Supabase loads only for an auth redirect (or when settings open), not on every visit.
  useEffect(loadSupabaseForAuthRedirect, []);
  // A password-reset link lands here signed in; open the account view to set the new password.
  useEffect(() => {
    if (passwordRecovery) setSettingsOpen(true);
  }, [passwordRecovery]);

  const isMobileLayout = useMediaQuery("(max-width: 800px)");
  const sheetEnabled = isMobileLayout && !selection.inspectorOpen && activeView !== "admin";
  const { railRef, sheet, hiddenPx } = useRailSheet(sheetEnabled);
  const nav = useAppNavigation({
    mapRef,
    selection,
    places: places.cityPlaces,
    vehicles: feed.vehicles,
    followVehicle: follow.follow,
    requestLocation: geo.requestLocation,
    clearBuildingPreview: () => buildingModels.setPreview(null),
    setCityPageOpen,
    setWaypoints,
    setNavDestination,
    lowerSheet: () => {
      if (isMobileLayout) sheet.setDetent("half");
    },
  });
  const { flyTo } = nav;

  useMapInteractions(mapRef, mapReady, {
    places: places.cityPlaces,
    vehicles: feed.vehicles,
    stops: feed.stops,
    onSelectBuilding: (place) => nav.openPlace(place, false),
    onSelectPlace: (place) => nav.openPlace(place, true),
    onSelectVehicle: nav.focusVehicle,
    onSelectStop: (stop) => {
      selection.showDetail({ stop }, selection.currentReturnView());
      setActiveView("map");
    },
  });
  useMapSync({
    mapRef,
    mapReady,
    vehicle3DLayerRef: map.vehicle3DLayerRef,
    building3DLayerRef: map.building3DLayerRef,
    vehicles: feed.vehicles,
    selectedVehicle,
    stops: feed.stops,
    mapPlaces: places.cityPlaces,
    layerPrefs: mapLayerPrefs,
    selectedPlaceId: selectedPlace?.id,
    userLocation: geo.userLocation,
    shelters: feed.shelters,
    nearestShelterId: geo.nearestShelter?.id,
    airAlertStatus: feed.airAlert.status,
    buildingModels: buildingModels.models,
    buildingModelPreview: buildingModels.preview,
  });

  const headerControls = (
    <BrandHeaderControls
      cityPickerOpen={cityLaunch.open}
      onOpenCityPicker={cityLaunch.openPicker}
      settingsOpen={settingsOpen}
      onOpenSettings={() => setSettingsOpen(true)}
    />
  );
  const railClassName = [
    "brand-rail",
    activeView === "city" || selection.inspectorOpen ? "city-mode" : "",
    selection.inspectorOpen ? "inspector-open" : "",
    sheetEnabled ? "is-sheet" : "",
    sheetEnabled && sheet.detent === "full" ? "is-full" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <MotionConfig reducedMotion="user">
    <TooltipProvider delayDuration={300}>
    <main className="un-shell">
      <div ref={mapNode} className="map-canvas" />
      {sheetEnabled && !(activeView === "city" && cityPageOpen) && (
        <header className="brand-header brand-header-floating">{headerControls}</header>
      )}
      <motion.aside
        ref={railRef}
        className={railClassName}
        style={sheetEnabled ? ({ y: sheet.y, "--sheet-hidden": hiddenPx } as unknown as MotionStyle) : undefined}
      >
        {sheetEnabled && <SheetHandle sheet={sheet} />}
        {activeView === "city" && cityPageOpen && !selection.inspectorOpen ? (
          <header className="brand-header page-back-header">
            <Button
              type="button"
              variant="ghost"
              className="page-back-button"
              aria-label="Назад до списку"
              onClick={() => cityPageBackRef.current()}
            >
              <MaterialIcon name="arrow_back" size={20} />
              Назад
            </Button>
          </header>
        ) : !selection.inspectorOpen && !sheetEnabled ? (
          <header className="brand-header">{headerControls}</header>
        ) : null}
        <div className="city-guide-frame" hidden={activeView !== "city" || selection.inspectorOpen}>
          <CityGuide
            userLocation={geo.userLocation}
            locationError={geo.locationError}
            onShowOnMap={nav.showCityPlace}
            onDirections={nav.openDirections}
            onSelectTransportVehicle={nav.showTransitVehicle}
            onPageNavigationChange={(isSubpage, onBack) => {
              setCityPageOpen(isSubpage);
              cityPageBackRef.current = onBack;
            }}
            places={places.cityPlaces}
            placesStatus={places.cityPlacesStatus}
            placesError={places.cityPlacesError}
            onRetryPlaces={places.refreshCityPlaces}
            cityEvents={places.eventData}
            transportVehicles={feed.vehicles}
            transitDataStatus={feed.transitDataStatus}
            transportIsSimulated={simulated}
            onUseLiveTransit={() => dev.updateFixtureSettings({ ...dev.fixtureSettings, enabled: false })}
            searchQuery={deferredSearch}
          />
        </div>
        {activeView === "admin" && devToolsActive && (
          <Suspense fallback={null}>
            <AdminPanel datasets={admin.datasets} onSave={admin.save} onClose={() => setActiveView("city")} />
          </Suspense>
        )}
        {activeView === "map" && !selection.inspectorOpen && (
          <MapTransportPanel
            waypoints={waypoints}
            onWaypointsChange={setWaypoints}
            onBuildRoute={() => selection.setTransitFlow("menu")}
            search={search}
            deferredSearch={deferredSearch}
            onSearchChange={setSearch}
            vehicles={feed.vehicles}
            transitDataStatus={feed.transitDataStatus}
            onSelectVehicle={(vehicle) => {
              selection.showDetail({ vehicle }, "map");
              selection.setTransitFlow(null);
              flyTo([vehicle.lng, vehicle.lat], 15);
            }}
            onBack={() => {
              setCityPageOpen(false);
              setActiveView("city");
            }}
          />
        )}
        {transitFlow && (
          <TransitFlowPanel
            flow={transitFlow}
            vehicles={feed.vehicles}
            stops={feed.stops}
            selectedVehicle={selectedVehicle}
            userLocation={geo.userLocation}
            simulated={simulated}
            onFlowChange={selection.setTransitFlow}
            onOpenStop={(stop) => {
              selection.showDetail({ stop }, "map");
              selection.setTransitFlow(null);
              flyTo([stop.lng, stop.lat], 16);
            }}
          />
        )}
        {selectedVehicle && (
          <VehicleInspector
            vehicle={selectedVehicle}
            following={follow.isFollowing}
            onToggleFollow={follow.toggleFollow}
            onZoomIn={() => follow.zoomTo(selectedVehicle, 18)}
            onBack={nav.returnFromInspector}
          />
        )}
        {selectedStop && (
          <StopInspector
            key={selectedStop.id}
            stop={selectedStop}
            distance={stopDetails.distance}
            arrivals={stopDetails.arrivals}
            terrainEnabled={map.terrainEnabled}
            onEnableTerrain={() => map.setTerrainEnabled(true)}
            elevation={stopDetails.elevation}
            elevationStatus={stopDetails.status}
            onSelectVehicle={(vehicle) => selection.showDetail({ vehicle }, "map")}
            onBack={nav.returnFromInspector}
          />
        )}
        {navDestination && (
          <Suspense fallback={null}>
            <NavigationPanel map={mapRef.current} destination={navDestination} onClose={() => setNavDestination(null)} />
          </Suspense>
        )}
        {selectedPlace && (
          <PlaceInspector
            place={selectedPlace}
            saved={savedPlaceIds.has(selectedPlace.id)}
            onToggleSaved={() => toggleSavedPlace(selectedPlace.id)}
            onShowOnMap={() => flyTo([selectedPlace.lng, selectedPlace.lat], 17, 500)}
            onDirections={() => nav.openDirections([selectedPlace.lng, selectedPlace.lat], selectedPlace.name)}
            onBack={nav.returnFromInspector}
            similar={places.cityPlaces
              .filter((other) => other.id !== selectedPlace.id && other.category === selectedPlace.category)
              .map((other) => ({ other, distance: Math.hypot(other.lat - selectedPlace.lat, other.lng - selectedPlace.lng) }))
              .sort((a, b) => a.distance - b.distance)
              .slice(0, 5)
              .map(({ other }) => other)}
            onSelectPlace={(other) => nav.openPlace(other, true)}
            buildingModels={buildingModels}
          />
        )}
      </motion.aside>
      <AirAlertBanner
        airAlert={feed.airAlert}
        expanded={airAlertExpanded}
        onToggleExpanded={() => setAirAlertExpanded((value) => !value)}
        shelterLoadState={feed.shelterLoadState}
        userLocation={geo.userLocation}
        locationError={geo.locationError}
        onRequestLocation={geo.requestLocation}
        nearestShelter={geo.nearestShelter}
        onShowShelterOnMap={(shelter) => flyTo([shelter.lng, shelter.lat], 16, 650)}
      />
      {geo.locationError && activeView !== "admin" && (
        <div className="map-location-error" role="alert">
          {geo.locationError}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Закрити повідомлення"
            onClick={geo.clearLocationError}
          >
            <X size={18} />
          </Button>
        </div>
      )}
      <MapControls
        hidden={activeView === "admin"}
        pitch={map.mapPitch}
        bearing={map.mapBearing}
        mapStyleMode={map.mapStyleMode}
        onChangeMapStyle={map.setMapStyleMode}
        onResetOrientation={map.resetOrientation}
        onToggleMapMode={map.toggleMapMode}
        onOrbit={map.orbit}
        onCameraOpen={() => {
          if (isMobileLayout) sheet.setDetent("peek");
        }}
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
        onLocate={geo.requestLocation}
        settingsOpen={mapSettingsOpen}
        onToggleSettings={() => setMapSettingsOpen((open) => !open)}
      />
      {devToolsActive && activeView !== "admin" && (
        <Suspense fallback={null}>
          <DevToolsLayer
            key="dev-tools-dock"
            dev={dev}
            feed={feed}
            places={places}
            admin={admin}
            mapReady={mapReady}
            activeView={activeView}
            online={online}
            onOpenAdmin={() => setActiveView("admin")}
            onShowOnboarding={onboarding.restart}
          />
        </Suspense>
      )}
      <AppDialogs
        onboarding={onboarding}
        activeView={activeView}
        settingsOpen={settingsOpen}
        passwordRecovery={passwordRecovery}
        onCloseSettings={() => setSettingsOpen(false)}
        onRequestLocation={geo.requestLocation}
      />
    </main>
    <Suspense fallback={null}>
      <CityLaunchDialog
        open={cityLaunch.open}
        onOpenChange={cityLaunch.setOpen}
        citySearch={cityLaunch.citySearch}
        onCitySearchChange={cityLaunch.setCitySearch}
        cityIndexGroups={cityLaunch.cityIndexGroups}
        noMatches={cityLaunch.noMatches}
        interestedCities={cityLaunch.interestedCities}
        onToggleCity={cityLaunch.toggleCity}
        cityUpdateEmail={cityLaunch.email}
        onCityUpdateEmailChange={cityLaunch.changeEmail}
        cityUpdateSubmitting={cityLaunch.submitting}
        cityUpdateStatus={cityLaunch.status}
        onSubmit={cityLaunch.submit}
      />
    </Suspense>
    </TooltipProvider>
    </MotionConfig>
  );
}
