import { useState } from "react";
import { Button } from "../ui/button";
import { CategoryTiles } from "../category-tiles";
import { TRANSPORT_TABS, type CityTransitType, type CityTransitVehicle, type TransportTab } from "./constants";
import { NearbyTransportTab, RouteListTab } from "./transport-tabs";

const TRANSPORT_TAB_KEY = "eway-last-transport-tab";

type TransportSectionProps = {
  vehicles: CityTransitVehicle[];
  transitDataStatus: "loading" | "ready" | "error";
  simulated: boolean;
  onUseLiveTransit: () => void;
  userLocation: [number, number] | null;
  searchQuery: string;
  /** A vehicle id, or "__locate__" to ask the parent for the user's location. */
  onSelectVehicle: (vehicleId: string) => void;
};

/** «Транспорт»: nearby vehicles, or the routes of one transport type. */
export function TransportSection({
  vehicles,
  transitDataStatus,
  simulated,
  onUseLiveTransit,
  userLocation,
  searchQuery,
  onSelectVehicle,
}: TransportSectionProps) {
  const [tab, setTab] = useState<TransportTab>(
    () => (localStorage.getItem(TRANSPORT_TAB_KEY) as TransportTab) || "nearby",
  );
  return (
    <section className="city-section city-transport-page" aria-label="Транспорт">
      {simulated ? (
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
        items={TRANSPORT_TABS.map((item) => ({
          ...item,
          count: item.id === "nearby" ? 0 : vehicles.filter((v) => v.type === item.id).length,
        }))}
        value={tab}
        onChange={(id) => {
          setTab(id as TransportTab);
          localStorage.setItem(TRANSPORT_TAB_KEY, id);
        }}
      />

      {tab === "nearby" ? (
        <NearbyTransportTab
          vehicles={vehicles}
          userLocation={userLocation}
          onRequestLocation={() => onSelectVehicle("__locate__")}
          onSelectVehicle={onSelectVehicle}
          transitDataStatus={transitDataStatus}
        />
      ) : (
        <RouteListTab
          type={tab as CityTransitType}
          vehicles={vehicles}
          searchQuery={searchQuery}
          onSelectVehicle={onSelectVehicle}
          transitDataStatus={transitDataStatus}
        />
      )}
    </section>
  );
}
