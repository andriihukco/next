import { useState } from "react";
import { DAY_LABELS, ReviewItem } from "./place-details-section";
import { MaterialIcon } from "./ui/material-icon";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { QuickFacts, type QuickFact } from "./ui/detail-layout";
import { SAMPLE_CONTENT_ENABLED } from "../lib/features";
import { formatRating } from "../lib/rating";
import type { PlaceDetails } from "../lib/place-images";
import type { CityPlace } from "../lib/city-places";
import type { OpenStatus } from "../lib/opening-hours";
import type { MenuItem } from "./entity-flow-spec";
import { cityPlaceIcons } from "../lib/city-places";

/**
 * Tabs for a place, like the Google Maps place panel: Огляд, a tab for what the
 * place sells (menu, tickets, rooms, goods, services), Відгуки and Про місце.
 * Every block shows only data that has a source (DESIGN.md §13).
 */

type KindTab = { value: string; label: string; icon: string; empty: string };

/** The tab that depends on the kind of place. Kinds without one get no extra tab. */
export function kindTabFor(kind: string): KindTab | null {
  switch (kind) {
    case "food":
      return { value: "menu", label: "Меню", icon: "restaurant_menu", empty: "Меню для цього закладу ще не додано." };
    case "groceries":
    case "flowers":
    case "pharmacy":
    case "shop":
      return { value: "goods", label: "Товари", icon: "storefront", empty: "Перелік товарів ще не додано." };
    case "stay":
      return { value: "rooms", label: "Номери", icon: "hotel", empty: "Номери та ціни ще не додано." };
    case "culture":
    case "tourism":
    case "sports":
    case "event":
      return { value: "tickets", label: "Квитки", icon: "confirmation_number", empty: "Квитки та афішу ще не підключено." };
    case "health":
    case "beauty":
    case "veterinary":
    case "car-repair":
    case "car-wash":
    case "tire-service":
    case "service":
      return { value: "services", label: "Послуги", icon: "design_services", empty: "Перелік послуг і цін ще не додано." };
    default:
      return null;
  }
}

export type SocialLink = { label: string; icon: string; href: string };

const SOCIAL_HOSTS: Record<string, { icon: string; host: string }> = {
  Instagram: { icon: "photo_camera", host: "https://instagram.com/" },
  Facebook: { icon: "groups", host: "https://facebook.com/" },
  Telegram: { icon: "send", host: "https://t.me/" },
  TikTok: { icon: "music_note", host: "https://tiktok.com/@" },
  YouTube: { icon: "play_circle", host: "https://youtube.com/" },
};

/** Social links from the source tags. A handle is expanded to a profile URL; anything unsafe is dropped. */
export function socialLinksFor(details: Record<string, string>): SocialLink[] {
  const links: SocialLink[] = [];
  for (const [label, spec] of Object.entries(SOCIAL_HOSTS)) {
    const value = details[label]?.trim();
    if (!value) continue;
    const href = /^https:\/\//i.test(value)
      ? value
      : /^http:\/\//i.test(value) || value.includes(" ")
        ? ""
        : /^[\w./-]+\.[a-z]{2,}/i.test(value)
          ? `https://${value}`
          : `${spec.host}${value.replace(/^@/, "")}`;
    if (href) links.push({ label, icon: spec.icon, href });
  }
  return links;
}

type PlaceDetailTabsProps = {
  kind: string;
  place: CityPlace;
  details?: PlaceDetails;
  images: string[];
  description?: string;
  hours: OpenStatus | null;
  /** OSM opening hours, shown when the scraper has no weekly table. */
  rawHours?: string;
  address?: string;
  facts: QuickFact[];
  aboutFacts: QuickFact[];
  menu: MenuItem[];
  demoMenu: boolean;
  similar: CityPlace[];
  /** The primary action is already directions, so the address row does not repeat it. */
  directionsInBar: boolean;
  onDirections: () => void;
  onShowOnMap: () => void;
  onSelectPlace?: (place: CityPlace) => void;
};

function SectionBlock({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="place-block">
      {title && <h3>{title}</h3>}
      {children}
    </section>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="place-stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((step) => (
        <MaterialIcon key={step} name="star" size={14} filled={value >= step - 0.25} />
      ))}
    </span>
  );
}

export function PlaceDetailTabs({
  kind,
  place,
  details,
  images,
  description,
  hours,
  rawHours,
  address,
  facts,
  aboutFacts,
  menu,
  demoMenu,
  similar,
  directionsInBar,
  onDirections,
  onShowOnMap,
  onSelectPlace,
}: PlaceDetailTabsProps) {
  const [hoursOpen, setHoursOpen] = useState(false);
  const kindTab = kindTabFor(kind);
  const socials = socialLinksFor(place.details);
  const reviews = details?.reviews ?? [];
  const week = details?.openHours ?? [];
  const phone = facts.find((fact) => fact.label === "Телефон");
  const site = facts.find((fact) => fact.label === "Сайт");
  const email = place.details["Email"];

  return (
    <Tabs defaultValue="overview" className="entity-tabs">
      <TabsList variant="line" className="entity-tabs-list" aria-label="Розділи місця">
        <TabsTrigger value="overview">Огляд</TabsTrigger>
        {kindTab && <TabsTrigger value={kindTab.value}>{kindTab.label}</TabsTrigger>}
        <TabsTrigger value="reviews">Відгуки</TabsTrigger>
        <TabsTrigger value="about">Про місце</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="entity-tab-panel">
        {images.length > 0 && (
          <div className="place-photos" role="list" aria-label="Фото">
            {images.map((src, index) => (
              <img key={src} role="listitem" src={src} alt={`Фото ${index + 1}`} loading="lazy" />
            ))}
          </div>
        )}
        {description && (
          <SectionBlock>
            <p className="entity-description">{description}</p>
          </SectionBlock>
        )}
        {address && (
          <SectionBlock>
            <div className="place-address">
              <MaterialIcon name="location_on" size={20} />
              <span>{address}</span>
            </div>
            <div className="place-address-actions">
              <Button type="button" variant="outline" size="sm" onClick={onShowOnMap}>
                <MaterialIcon name="map" size={18} />
                На мапі
              </Button>
              {!directionsInBar && (
                <Button type="button" variant="outline" size="sm" onClick={onDirections}>
                  <MaterialIcon name="directions" size={18} />
                  Маршрут
                </Button>
              )}
            </div>
          </SectionBlock>
        )}
        {(hours || week.length > 0 || rawHours) && (
          <SectionBlock title="Години роботи">
            {week.length > 0 ? (
              <>
                <button
                  type="button"
                  className="place-hours-toggle"
                  aria-expanded={hoursOpen}
                  onClick={() => setHoursOpen((open) => !open)}
                >
                  <MaterialIcon name="schedule" size={20} />
                  <span className={`place-hours-label${hours ? (hours.open ? " is-open" : " is-closed") : ""}`}>
                    {hours?.text ?? "Розклад на тиждень"}
                  </span>
                  <MaterialIcon name={hoursOpen ? "expand_less" : "expand_more"} size={20} />
                </button>
                {hoursOpen && (
                  <ul className="place-details-hours">
                    {week.map((entry) => (
                      <li key={entry.day}>
                        <span>{DAY_LABELS[entry.day] ?? entry.day}</span>
                        <span>{entry.hours}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                {hours && (
                  <p className={`entity-open-status${hours.open ? " is-open" : " is-closed"}`}>
                    <MaterialIcon name="schedule" size={20} />
                    {hours.text}
                  </p>
                )}
                {rawHours && <p className="place-hours-raw">{rawHours}</p>}
              </>
            )}
          </SectionBlock>
        )}
        {(phone || site || email || socials.length > 0) && (
          <SectionBlock title="Контакти">
            <ul className="place-contacts">
              {phone?.href && (
                <li>
                  <a href={phone.href}>
                    <MaterialIcon name="call" size={20} />
                    {phone.value}
                  </a>
                </li>
              )}
              {site?.href && (
                <li>
                  <a href={site.href} target="_blank" rel="noreferrer">
                    <MaterialIcon name="language" size={20} />
                    {site.value}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`}>
                    <MaterialIcon name="mail" size={20} />
                    {email}
                  </a>
                </li>
              )}
              {socials.map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noreferrer">
                    <MaterialIcon name={link.icon} size={20} />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </SectionBlock>
        )}
        {similar.length > 0 && (
          <SectionBlock title="Схожі місця">
            <ul className="place-similar">
              {similar.map((other) => (
                <li key={other.id}>
                  <button type="button" onClick={() => onSelectPlace?.(other)} disabled={!onSelectPlace}>
                    <span className="place-similar-icon" aria-hidden="true">
                      <MaterialIcon name={cityPlaceIcons[other.category]} size={20} />
                    </span>
                    <span className="place-similar-copy">
                      <strong>{other.name}</strong>
                      <span>{other.address || other.categoryLabel}</span>
                    </span>
                    <MaterialIcon name="chevron_right" size={20} />
                  </button>
                </li>
              ))}
            </ul>
          </SectionBlock>
        )}
      </TabsContent>

      {kindTab && (
        <TabsContent value={kindTab.value} className="entity-tab-panel">
          <SectionBlock title={kindTab.label}>
            {details?.menuLink && (
              <a className="place-menu-link" href={details.menuLink} target="_blank" rel="noreferrer">
                <MaterialIcon name={kindTab.icon} size={20} />
                <span>Відкрити {kindTab.label.toLocaleLowerCase("uk-UA")} на сайті закладу</span>
                <MaterialIcon name="open_in_new" size={18} />
              </a>
            )}
            {menu.length > 0 && SAMPLE_CONTENT_ENABLED ? (
              <ul className="place-menu">
                {menu.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      {item.description && <span>{item.description}</span>}
                    </div>
                    <span className="place-menu-price">{item.price} ₴</span>
                  </li>
                ))}
              </ul>
            ) : (
              !details?.menuLink && <p className="place-empty">{kindTab.empty}</p>
            )}
            {menu.length > 0 && SAMPLE_CONTENT_ENABLED && demoMenu && (
              <p className="place-empty">Демо: приклад позицій, не реальні ціни.</p>
            )}
          </SectionBlock>
        </TabsContent>
      )}

      <TabsContent value="reviews" className="entity-tab-panel">
        {details?.rating !== undefined ? (
          <SectionBlock title="Підсумок відгуків">
            <div className="place-rating-summary">
              <strong>{formatRating(details.rating)}</strong>
              <div>
                <Stars value={details.rating} />
                {details.reviewCount !== undefined && <span>{details.reviewCount} відгуків</span>}
              </div>
            </div>
            <p className="place-empty">Дані з Google Maps.</p>
          </SectionBlock>
        ) : null}
        {reviews.length > 0 ? (
          <SectionBlock title="Відгуки">
            <ul className="place-reviews">
              {reviews.map((review, index) => (
                <ReviewItem key={`${review.author}-${index}`} review={review} />
              ))}
            </ul>
          </SectionBlock>
        ) : (
          <SectionBlock>
            <p className="place-empty">Відгуків ще немає.</p>
          </SectionBlock>
        )}
      </TabsContent>

      <TabsContent value="about" className="entity-tab-panel">
        <SectionBlock>
          {aboutFacts.length > 0 ? (
            <QuickFacts facts={aboutFacts} />
          ) : (
            <p className="place-empty">Для цього місця ще немає додаткових відомостей.</p>
          )}
        </SectionBlock>
      </TabsContent>
    </Tabs>
  );
}
