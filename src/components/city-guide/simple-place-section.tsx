import { MaterialIcon } from "../ui/material-icon";
import { UnifiedCard } from "../ui/unified-card";
import type { CityPlace, CityPlaceCategory } from "../../lib/city-places";

export type SimplePlaceSectionConfig = {
  label: string;
  heading: string;
  category: CityPlaceCategory;
  icon: string;
  empty: string;
};

/** Market, parking, fuel and charging: a plain list of one category with «На мапі». */
export const SIMPLE_PLACE_SECTIONS = {
  market: { label: "Ринок", heading: "Ринки та барахолки", category: "market", icon: "store", empty: "Ринків поки немає." },
  parking: { label: "Парковка", heading: "Парковки", category: "parking", icon: "local_parking", empty: "Парковок поки немає." },
  fuel: { label: "АЗС", heading: "АЗС (Заправки)", category: "fuel", icon: "local_gas_station", empty: "АЗС поки немає." },
  charging: {
    label: "Електрозарядка",
    heading: "Електрозарядні станції",
    category: "charging-station",
    icon: "ev_station",
    empty: "Електрозарядних станцій поки немає.",
  },
} satisfies Record<string, SimplePlaceSectionConfig>;

export function SimplePlaceSection({
  config,
  places,
  onShowOnMap,
}: {
  config: SimplePlaceSectionConfig;
  places: CityPlace[];
  onShowOnMap: (coordinates: [number, number], placeName: string) => void;
}) {
  const items = places.filter((place) => place.category === config.category);
  return (
    <section className="city-section" aria-label={config.label}>
      <div className="city-category-heading">
        <h2>{config.heading}</h2>
      </div>
      <div className="city-place-list">
        {items.map((place) => (
          <UnifiedCard key={place.id} variant="directory">
            <UnifiedCard.Header title={place.name} subtitle={place.address} icon={config.icon} />
            <UnifiedCard.Action
              label="На мапі"
              icon="location_on"
              variant="outline"
              onClick={() => onShowOnMap([place.lng, place.lat], place.name)}
            />
          </UnifiedCard>
        ))}
        {items.length === 0 && (
          <div className="city-places-state">
            <MaterialIcon name={config.icon} size={20} />
            <span>{config.empty}</span>
          </div>
        )}
      </div>
    </section>
  );
}
