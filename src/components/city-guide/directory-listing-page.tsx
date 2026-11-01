import { useMemo, useState } from "react";
import { MaterialIcon } from "../ui/material-icon";
import type { CityDirectoryListing } from "../../lib/listing-types";
import { CategoryTiles } from "../category-tiles";
import { EntityDetail } from "../entity-detail";
import { flowsForKind } from "../entity-flow-spec";
import { UnifiedCard } from "../ui/unified-card";

/** Shown where a section has no data source yet, instead of sample content (platform-plan S6). */
export function ComingSoonState() {
  return (
    <div className="city-places-state" role="status">
      <MaterialIcon name="schedule" size={20} />
      <span>Незабаром. Розділ з’явиться, коли підключимо перевірене джерело даних.</span>
    </div>
  );
}

export function DirectoryListingPage({
  title,
  kind,
  listings,
  filters,
  selectedId,
  onSelect,
  saved,
  onToggleSaved,
  onShowOnMap,
  onDirections,
  sample = false,
}: {
  title: string;
  kind: "service" | "job" | "home";
  listings: CityDirectoryListing[];
  /** Sample listings (jobs, homes) carry the «Демо» label; services are real OSM places. */
  sample?: boolean;
  filters: ReadonlyArray<{ id: string; label: string; icon: string; color: string }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  saved: ReadonlySet<string>;
  onToggleSaved: (id: string) => void;
  onShowOnMap: (coordinates: [number, number], name: string) => void;
  onDirections: (coordinates: [number, number], name: string) => void;
}) {
  const [activeFilter, setActiveFilter] = useState(filters[0]?.id ?? "");

  const visible = useMemo(() => {
    return listings.filter((item) => item.category === activeFilter);
  }, [listings, activeFilter]);


  const selected = listings.find((item) => item.id === selectedId);
  if (selected) {
    const filter = filters.find((item) => item.id === selected.category);
    return (
      <section className="city-section" aria-label={title}>
        <EntityDetail
          kind={kind === "service" && flowsForKind(selected.category).length > 0 ? selected.category : kind}
          title={selected.name}
          eyebrow={filter?.label ?? title}
          subtitle={selected.summary}
          icon={filter?.icon ?? "business"}
          demo={sample}
          description={selected.details}
          info={[
            { icon: "location_on", label: "Адреса", value: selected.location },
            ...(selected.organization
              ? [{ icon: "domain", label: kind === "job" ? "Роботодавець" : "Організація", value: selected.organization }]
              : []),
          ]}
          coordinates={selected.coordinates}
          saved={saved.has(selected.id)}
          onToggleSaved={() => onToggleSaved(selected.id)}
          onShowOnMap={() => onShowOnMap(selected.coordinates, selected.name)}
          onDirections={() => onDirections(selected.coordinates, selected.name)}
        />
      </section>
    );
  }

  return (
    <section className="city-section" aria-label={title}>
      <CategoryTiles label={`Фільтр: ${title}`} items={filters} value={activeFilter} onChange={setActiveFilter} />
      <div className="city-place-list">
        {visible.map((item) => (
          <UnifiedCard key={item.id} variant="directory" onClick={() => onSelect(item.id)}>
            <UnifiedCard.Header
              title={item.name}
              subtitle={item.summary}
              category={sample ? `${item.location} · демо` : item.location}
              icon={filters.find((filter) => filter.id === item.category)?.icon ?? "business"}
            />
            <UnifiedCard.Action
              label="На мапі"
              icon="location_on"
              variant="outline"
              onClick={() => onShowOnMap(item.coordinates, item.name)}
            />
          </UnifiedCard>
        ))}
        {listings.length === 0 ? (
          <ComingSoonState />
        ) : (
          visible.length === 0 && (
            <div className="city-places-state">
              <MaterialIcon name="search_off" size={20} />
              <span>Нічого не знайдено за цим фільтром.</span>
            </div>
          )
        )}
      </div>
    </section>
  );
}
