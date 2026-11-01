import { useState } from "react";
import { CategoryTiles } from "../category-tiles";
import { EntityDetail } from "../entity-detail";
import { MaterialIcon } from "../ui/material-icon";
import { UnifiedCard } from "../ui/unified-card";
import { SAMPLE_CONTENT_ENABLED } from "../../lib/features";
import type { CityEvent } from "../../lib/listing-types";
import { EVENT_FILTERS, type CityItemActions } from "./constants";
import { ComingSoonState } from "./directory-listing-page";

type EventsSectionProps = CityItemActions & {
  cityEvents: CityEvent[];
  selectedId: string | null;
  onOpen: (id: string) => void;
};

/** «Афіша»: events by category. Development builds only have samples (platform-plan S6). */
export function EventsSection({
  cityEvents,
  selectedId,
  onOpen,
  saved,
  onToggleSaved,
  onShowOnMap,
  onDirections,
}: EventsSectionProps) {
  const [eventCategory, setEventCategory] = useState("all");
  const selectedEvent = cityEvents.find((event) => event.id === selectedId);

  return (
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
            event.id === selectedId ? (
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
                onToggleSaved={() => onToggleSaved(event.id)}
                onShowOnMap={() => onShowOnMap(event.coordinates, event.venue)}
                onDirections={() => onDirections(event.coordinates, event.venue)}
              />
            ) : (
              <UnifiedCard
                key={event.id}
                variant="event"
                onClick={() => onOpen(event.id)}
              >
                <UnifiedCard.Header
                  title={event.name}
                  subtitle={`${event.time} · ${event.venue}`}
                  category={SAMPLE_CONTENT_ENABLED ? `${event.category} · демо` : event.category}
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
  );
}
