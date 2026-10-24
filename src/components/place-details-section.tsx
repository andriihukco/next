import { useState } from "react";
import { formatRating } from "../lib/demo-rating";
import type { PlaceDetails, PlaceReview } from "../lib/place-images";
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

const REVIEW_PREVIEW_CHARS = 180;

function ReviewItem({ review }: { review: PlaceReview }) {
  const [expanded, setExpanded] = useState(false);
  const long = review.text.length > REVIEW_PREVIEW_CHARS;
  const text =
    long && !expanded ? `${review.text.slice(0, REVIEW_PREVIEW_CHARS).trimEnd()}…` : review.text;
  const initial = (review.author.trim().charAt(0) || "?").toLocaleUpperCase("uk-UA");
  return (
    <li className="place-review">
      <div className="place-review-head">
        <span className="place-review-avatar" aria-hidden="true">
          {initial}
        </span>
        <div className="place-review-who">
          <strong>{review.author || "Гість"}</strong>
          {review.when && <span>{review.when}</span>}
        </div>
        {review.rating !== undefined && (
          <span className="place-review-rating" aria-label={`Оцінка ${review.rating} з 5`}>
            <MaterialIcon name="star" size={14} filled />
            {review.rating}
          </span>
        )}
      </div>
      {review.text && <p className="place-review-text">{text}</p>}
      {long && (
        <button
          type="button"
          className="place-review-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Згорнути" : "Читати повністю"}
        </button>
      )}
    </li>
  );
}

/** Contacts, hours, reviews and menu link for a place. Shown only when the lookup found them. */
export function PlaceDetailsSection({ details }: { details: PlaceDetails }) {
  const phoneHref = details.phone ? `tel:${details.phone.replace(/\s+/g, "")}` : undefined;
  return (
    <section className="place-details" aria-label="Контакти та відгуки">
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
          <ul className="place-reviews">
            {details.reviews.map((review, index) => (
              <ReviewItem key={`${review.author}-${index}`} review={review} />
            ))}
          </ul>
        </div>
      )}

      {details.menuLink && (
        <a className="place-details-menu" href={details.menuLink} target="_blank" rel="noreferrer">
          Меню
          <MaterialIcon name="open_in_new" size={16} />
        </a>
      )}
    </section>
  );
}
