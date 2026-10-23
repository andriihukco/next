import { formatRating } from "../lib/demo-rating";
import type { PlaceDetails } from "../lib/place-images";
import { MaterialIcon } from "./ui/material-icon";

const DAY_LABELS: Record<string, string> = {
  Monday: "Понеділок",
  Tuesday: "Вівторок",
  Wednesday: "Середа",
  Thursday: "Четвер",
  Friday: "П’ятниця",
  Saturday: "Субота",
  Sunday: "Неділя",
};

/** Website shown without its scheme, e.g. `kopalnia.coffee`. */
const shortUrl = (url: string): string => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

/**
 * Contacts, hours and reviews for a place, from the scraper's listing data.
 * Only shown when the lookup matched a listing; the source is named so the
 * data is not mistaken for OSM or sample data (DESIGN.md §1).
 */
export function PlaceDetailsSection({ details }: { details: PlaceDetails }) {
  const phoneHref = details.phone ? `tel:${details.phone.replace(/\s+/g, "")}` : undefined;
  return (
    <section className="place-details" aria-label="Контакти та відгуки">
      <p className="place-details-source">Дані з Google Maps</p>

      {(details.phone || details.website) && (
        <div className="place-details-contacts">
          {details.phone && phoneHref && (
            <a href={phoneHref}>
              <MaterialIcon name="call" size={16} />
              <span>{details.phone}</span>
            </a>
          )}
          {details.website && (
            <a href={details.website} target="_blank" rel="noreferrer">
              <MaterialIcon name="language" size={16} />
              <span>{shortUrl(details.website)}</span>
            </a>
          )}
        </div>
      )}

      {details.rating !== undefined && (
        <p className="place-details-rating">
          <MaterialIcon name="star" size={16} filled />
          <strong>{formatRating(details.rating)}</strong>
          {details.reviewCount !== undefined && <span>({details.reviewCount})</span>}
        </p>
      )}

      {details.openHours.length > 0 && (
        <div className="place-details-block">
          <h4>Години роботи</h4>
          <ul className="place-details-hours">
            {details.openHours.map((entry) => (
              <li key={entry.day}>
                <span>{DAY_LABELS[entry.day] ?? entry.day}</span>
                <span>{entry.hours}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {details.reviews.length > 0 && (
        <div className="place-details-block">
          <h4>Відгуки</h4>
          <ul className="place-details-reviews">
            {details.reviews.map((review, index) => (
              <li key={`${review.author}-${index}`}>
                <p className="place-details-review-meta">
                  <strong>{review.author || "Гість"}</strong>
                  {review.rating !== undefined && <span>{review.rating} з 5</span>}
                  {review.when && <span>{review.when}</span>}
                </p>
                {review.text && <p className="place-details-review-text">{review.text}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {details.menuLink && (
        <a className="place-osm-link" href={details.menuLink} target="_blank" rel="noreferrer">
          Меню
          <MaterialIcon name="open_in_new" size={16} />
        </a>
      )}
    </section>
  );
}
