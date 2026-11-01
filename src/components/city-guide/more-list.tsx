import { MaterialIcon } from "../ui/material-icon";
import { CITY_SECTIONS, MORE_SECTION_IDS, type CitySection } from "./constants";

/** Більше: the city sections that have no rail tab, as one list. Same list and order as the mobile app. */
export function MoreList({ onOpen }: { onOpen: (id: CitySection) => void }) {
  const items = MORE_SECTION_IDS.flatMap((id) => {
    const item = CITY_SECTIONS.find((section) => section.id === id);
    return item ? [item] : [];
  });
  return (
    <section className="city-section city-more-list" aria-label="Більше">
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <button type="button" className="city-more-row" onClick={() => onOpen(item.id)}>
              <span className="city-more-icon" aria-hidden="true">
                <MaterialIcon name={item.icon} size={24} />
              </span>
              <span className="city-more-label">{item.label}</span>
              <MaterialIcon name="chevron_right" size={20} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
