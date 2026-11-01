import { formatOpeningHours, type CityEducationKind, type CityPlace } from "../../lib/city-places";
import { UnifiedCard } from "../ui/unified-card";
import { EDUCATION_KIND_LABELS } from "./constants";

// ─── Sub-components ───────────────────────────────────────────────────────────

export function EducationCard({
  place,
  kind,
  onShowOnMap,
  onOpen,
  detailPage,
}: {
  place: CityPlace;
  kind: CityEducationKind;
  onShowOnMap: (coordinates: [number, number], name: string) => void;
  onOpen?: () => void;
  detailPage: boolean;
}) {
  return (
    <UnifiedCard variant="education" onClick={onOpen}>
      <UnifiedCard.Header
        title={place.name}
        subtitle={place.address}
        icon="school"
        category={EDUCATION_KIND_LABELS[kind]}
        imageUrl={place.imageUrl}
        place={place}
      />
      {detailPage && (
        <>
          {Object.entries(place.details)
            .filter(([label]) => label !== "Тип")
            .map(([label, value]) => {
              const isPhone = label === "Телефон" || label === "Мобільний";
              const isWebsite = label === "Сайт" || label === "Email";
              const isHours = label === "Графік";
              const icon =
                label === "Графік" ? "schedule" :
                label === "Телефон" || label === "Мобільний" ? "call" :
                label === "Сайт" ? "language" :
                label === "Email" ? "email" :
                label === "Wi-Fi" ? "wifi" :
                label === " wheelchair" ? "accessible" : "info";

              return (
                <UnifiedCard.Meta
                  key={label}
                  label={label}
                  value={isHours ? formatOpeningHours(value) : value}
                  icon={icon}
                  clickable={isPhone || isWebsite}
                  onClick={() => {
                    if (isPhone) {
                      const phone = value.replace(/\D/g, "");
                      window.open(`tel:${phone}`, "_self");
                    } else if (label === "Сайт") {
                      window.open(value.startsWith("http") ? value : `https://${value}`, "_blank");
                    } else if (label === "Email") {
                      window.open(`mailto:${value}`, "_self");
                    }
                  }}
                />
              );
            })}
        </>
      )}
      <UnifiedCard.Action
        label="На мапі"
        icon="location_on"
        variant="outline"
        onClick={() => onShowOnMap([place.lng, place.lat], place.name)}
      />
    </UnifiedCard>
  );
}
