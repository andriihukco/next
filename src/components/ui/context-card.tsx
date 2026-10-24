import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatRating } from "../../lib/demo-rating";
import type { CityPlace } from "../../lib/city-places";
import { usePlacePhoto } from "../../lib/place-images";
import { useInView } from "../../lib/use-in-view";
import { MaterialIcon } from "./material-icon";
import "./context-card.css";

// A search result in the map-app style (Apple Maps and Google Maps lists): a
// thumbnail, the category, the name, one line of context, and the rating only when
// a real one exists. The title button stretches over the row, so the card opens
// with the keyboard and never nests buttons (DESIGN.md §7). The action row sits
// below the row and is not covered by that stretch.

export interface ContextCardAction {
  label: string;
  icon: string;
  onClick: () => void;
  /** The filled action. Give one per card at most. */
  primary?: boolean;
}

export interface ContextCardProps {
  title: string;
  /** Category eyebrow, sentence case. */
  category?: string;
  /** Icon for the fallback tile when there is no photo. */
  icon: string;
  /** Category color, from CITY_PLACE_CATEGORY_COLORS. Tints the icon tile only. */
  iconColor?: string;
  /** One line of context, such as distance · address. */
  subtitle?: string;
  /** Real photo. Wins over the place lookup. */
  imageUrl?: string;
  /** Place to look up a photo for when there is no `imageUrl`. */
  place?: CityPlace;
  /** Scraper rating only. Omit it when no rating exists; never pass a sample. */
  rating?: { value: number; count?: number };
  onOpen: () => void;
  actions?: ContextCardAction[];
  className?: string;
}

export function ContextCard({
  title,
  category,
  icon,
  iconColor,
  subtitle,
  imageUrl,
  place,
  rating,
  onOpen,
  actions,
  className,
}: ContextCardProps) {
  const [thumbRef, inView] = useInView<HTMLDivElement>();
  const lookup = usePlacePhoto(place, inView);
  const [photoFailed, setPhotoFailed] = React.useState(false);

  const photoUrl = imageUrl || (lookup.status === "ok" ? lookup.imageUrl : undefined);
  const showPhoto = Boolean(photoUrl) && !photoFailed;
  const loading = !showPhoto && Boolean(place) && lookup.status === "loading";
  const showIcon = !showPhoto && !place;
  const showEmpty = !showPhoto && !loading && Boolean(place);
  // A place shows the scraper's rating only. With no lookup rating, no line shows.
  const scraped = place && lookup.details?.rating !== undefined
    ? { value: lookup.details.rating, count: lookup.details.reviewCount }
    : undefined;
  const shownRating = rating ?? scraped;

  return (
    <Card
      className={cn("context-card", actions?.length ? "context-card--with-actions" : undefined, className)}
    >
      <div className="context-card__row">
        <div
          ref={thumbRef}
          className={cn(
            "context-card__thumb",
            loading && "context-card__thumb--loading",
            showEmpty && "context-card__thumb--empty",
          )}
          style={iconColor ? ({ "--context-card-color": iconColor } as React.CSSProperties) : undefined}
          aria-hidden="true"
        >
          {showPhoto && (
            <img src={photoUrl} alt="" loading="lazy" onError={() => setPhotoFailed(true)} />
          )}
          {showIcon && <MaterialIcon name={icon} size={20} />}
          {showEmpty && <MaterialIcon name="image" size={20} />}
        </div>
        <div className="context-card__body">
          {category && <span className="context-card__category">{category}</span>}
          <h3 className="context-card__title">
            <button type="button" className="context-card__open" onClick={onOpen}>
              {title}
            </button>
          </h3>
          {subtitle && subtitle.trim() && <p className="context-card__subtitle">{subtitle}</p>}
          {shownRating && (
            <p className="context-card__rating" aria-label={`Оцінка ${formatRating(shownRating.value)} з 5`}>
              <MaterialIcon name="star" size={14} filled />
              <strong>{formatRating(shownRating.value)}</strong>
              {shownRating.count !== undefined && <span>({shownRating.count})</span>}
            </p>
          )}
        </div>
      </div>
      {actions && actions.length > 0 && (
        <div className="context-card__actions" role="group" aria-label={`Дії: ${title}`}>
          {actions.map((action) => (
            <Button
              key={action.label}
              type="button"
              size="sm"
              variant={action.primary ? "default" : "outline"}
              className="context-card__action"
              onClick={action.onClick}
            >
              <MaterialIcon name={action.icon} size={16} />
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
}
