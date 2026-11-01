import { lazy, Suspense, useState, type CSSProperties, type ReactNode } from "react";
import { ActionBar, ActionBarButton, DetailChip, DetailSection, QuickFacts, type QuickFact } from "./ui/detail-layout";
import { IconButton } from "./ui/icon-button";
import { MaterialIcon } from "./ui/material-icon";
import { SAMPLE_CONTENT_ENABLED, SERVICES_ENABLED } from "../lib/features";
import { FLOWS, flowsForKind, type EntityFlow, type MenuItem } from "./entity-flow-spec";
import { usePlacePhoto } from "../lib/place-images";
import type { CityPlace } from "../lib/city-places";
import { PlaceDetailsSection } from "./place-details-section";
import { PlaceDetailTabs } from "./place-detail-tabs";
import { formatRating } from "../lib/rating";
import { openStatus } from "../lib/opening-hours";
import "./entity-detail.css";

export type { EntityFlow, MenuItem };

// Demo flows load on demand, and only when the flag is on, so production builds drop them.
const EntityFlowPanel = SERVICES_ENABLED
  ? lazy(() => import("./entity-flows").then((module) => ({ default: module.EntityFlowPanel })))
  : null;

/**
 * One detail layout for every entity: places, schools, services, jobs, homes
 * and events (DESIGN.md §7). They differ only in their primary action, which
 * is chosen from the entity kind: order, book a table or room, sign up, buy a
 * ticket, apply, book a viewing. Directions, call, share and save are shared.
 *
 * None of these flows is connected to a provider yet. They exist only when
 * SERVICES_ENABLED is on, every result says it is a demo, and nothing leaves
 * the device (DESIGN.md §1, §9; platform-plan D-E).
 */

export type InfoRow = { icon: string; label: string; value: string; href?: string };

type EntityDetailProps = {
  kind: string;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  /** Replaces the icon for dated entities (events). */
  date?: { day: string; month: string };
  /** Real photo for the cover. Falls back to a tinted icon panel. */
  imageUrl?: string;
  /** Real place: its photo, rating and contacts come from the place lookup (development only). */
  place?: CityPlace;
  demo?: boolean;
  live?: string;
  description?: string;
  info?: InfoRow[];
  menu?: MenuItem[];
  catalog?: MenuItem[];
  coordinates: [number, number];
  /** Other places of the same kind, nearest first. */
  similar?: CityPlace[];
  onSelectPlace?: (place: CityPlace) => void;
  phone?: string;
  website?: string;
  saved: boolean;
  onToggleSaved: () => void;
  onShowOnMap: () => void;
  onDirections: () => void;
  children?: ReactNode;
};

export function EntityDetail({
  kind,
  title,
  eyebrow,
  subtitle,
  icon = "place",
  iconColor,
  date,
  imageUrl,
  place,
  demo,
  live,
  description,
  info = [],
  menu = [],
  catalog = [],
  similar = [],
  onSelectPlace,
  phone,
  website,
  saved,
  onToggleSaved,
  onShowOnMap,
  onDirections,
  children,
}: EntityDetailProps) {
  const flows = flowsForKind(kind);
  const [openFlow, setOpenFlow] = useState<EntityFlow | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [photoFailed, setPhotoFailed] = useState(false);
  const lookup = usePlacePhoto(place, !date);
  const photoUrl = imageUrl || (lookup.status === "ok" ? lookup.imageUrl : undefined);
  // Only a sourced rating is shown; with no source there is no rating (DESIGN.md §13).
  const shownRating =
    !date && place && lookup.details?.rating !== undefined
      ? { value: lookup.details.rating, count: lookup.details.reviewCount }
      : undefined;
  const callPhone = phone || lookup.details?.phone;
  const showPhoto = Boolean(photoUrl) && !photoFailed && !date;
  // Quick facts: the source info rows, then the website. Only facts that exist are shown.
  const quickFacts: QuickFact[] = [
    ...info,
    ...(website
      ? [{ icon: "language", label: "Сайт", value: website.replace(/^https?:\/\//, ""), href: website.startsWith("http") ? website : `https://${website}` }]
      : []),
  ];
  // Places get Google-Maps-style tabs. Reviews show only when a real source has them.
  const tabbed = Boolean(place) && !date;
  const hours = place ? openStatus(place.details["Графік"]) : null;
  const address = place?.address || lookup.details?.address;
  const site = website || lookup.details?.website;
  const keyFacts: QuickFact[] = [
    ...(callPhone ? [{ icon: "call", label: "Телефон", value: callPhone, href: `tel:${callPhone.replace(/[^\d+]/g, "")}` }] : []),
    ...(site
      ? [{ icon: "language", label: "Сайт", value: site.replace(/^https?:\/\//, "").replace(/\/$/, ""), href: site.startsWith("http") ? site : `https://${site}` }]
      : []),
  ];
  const photos = [...new Set([...(photoUrl ? [photoUrl] : []), ...(lookup.images ?? [])])].slice(0, 12);
  const aboutFacts: QuickFact[] = [
    ...(address ? [{ icon: "location_on", label: "Адреса", value: address }] : []),
    ...quickFacts.filter((fact) => fact.label !== "Адреса"),
  ];
  const coverColor = iconColor ? ({ "--entity-color": iconColor } as CSSProperties) : undefined;

  const share = (): void => {
    const text = [title, subtitle].filter(Boolean).join(" · ");
    if (navigator.share) {
      navigator.share({ title, text, url: window.location.href }).catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Could not share.", error);
      });
      return;
    }
    navigator.clipboard
      ?.writeText(`${text} — ${window.location.href}`)
      .then(() => setStatus("Посилання скопійовано."))
      .catch((error: unknown) => console.error("Could not copy the link.", error));
  };

  const toggleFlow = (flow: EntityFlow): void => {
    setStatus("");
    if (flow === "order") {
      setOrderOpen(true);
      return;
    }
    setOpenFlow((current) => (current === flow ? null : flow));
  };

  return (
    <article className="entity-detail" aria-labelledby="entity-detail-title">
      <header className="entity-hero">
        {!date && (
          <div className={`entity-cover${showPhoto ? " has-photo" : ""}`} style={coverColor}>
            {showPhoto ? (
              <img src={photoUrl} alt="" loading="lazy" onError={() => setPhotoFailed(true)} />
            ) : (
              <MaterialIcon name={icon} size={56} />
            )}
            <div className="entity-cover-tools">
              <IconButton label="Поділитися" onClick={share}>
                <MaterialIcon name="ios_share" size={20} />
              </IconButton>
              <IconButton label={saved ? "Прибрати зі збережених" : "Зберегти"} aria-pressed={saved} onClick={onToggleSaved}>
                <MaterialIcon name={saved ? "bookmark_added" : "bookmark_add"} size={20} filled={saved} />
              </IconButton>
            </div>
          </div>
        )}
        <div className="entity-hero-row">
          {date && (
            <span className="entity-date" aria-hidden="true">
              <strong>{date.day}</strong>
              <span>{date.month}</span>
            </span>
          )}
          <div className="entity-hero-copy">
            {eyebrow && <span className="detail-eyebrow">{eyebrow}</span>}
            <h2 id="entity-detail-title">{title}</h2>
            {shownRating && (
              <p
                className="entity-rating"
                aria-label={`Оцінка ${formatRating(shownRating.value)} з 5`}
              >
                <MaterialIcon name="star" size={16} filled />
                <strong>{formatRating(shownRating.value)}</strong>
                {shownRating.count !== undefined && <span>· {shownRating.count} оцінок</span>}
              </p>
            )}
            {subtitle && <p>{subtitle}</p>}
            {((SAMPLE_CONTENT_ENABLED && demo) || live) && (
              <div className="detail-chips">
                {live && (
                  <DetailChip icon="sensors" tone="live">
                    {live}
                  </DetailChip>
                )}
                {SAMPLE_CONTENT_ENABLED && demo && <DetailChip icon="science">Демо</DetailChip>}
              </div>
            )}
          </div>
          {date && (
            <div className="entity-hero-tools">
              <IconButton label="Поділитися" onClick={share}>
                <MaterialIcon name="ios_share" size={20} />
              </IconButton>
              <IconButton label={saved ? "Прибрати зі збережених" : "Зберегти"} aria-pressed={saved} onClick={onToggleSaved}>
                <MaterialIcon name={saved ? "bookmark_added" : "bookmark_add"} size={20} filled={saved} />
              </IconButton>
            </div>
          )}
        </div>
      </header>

      <ActionBar stacked={tabbed}>
        {flows.map((flow, index) => (
          <ActionBarButton
            key={flow}
            icon={FLOWS[flow].icon}
            label={FLOWS[flow].label}
            primary={index === 0 && openFlow !== flow}
            pressed={openFlow === flow}
            onClick={() => toggleFlow(flow)}
          />
        ))}
        {(!tabbed || flows.length === 0) && (
          <ActionBarButton icon="directions" label="Маршрут" primary={flows.length === 0} onClick={onDirections} />
        )}
        {!tabbed &&
          (callPhone ? (
            <ActionBarButton icon="call" label="Дзвінок" onClick={() => window.open(`tel:${callPhone.replace(/[^\d+]/g, "")}`, "_self")} />
          ) : flows.length < 2 ? (
            <ActionBarButton icon="map" label="На мапі" onClick={onShowOnMap} />
          ) : null)}
      </ActionBar>

      {EntityFlowPanel && (openFlow || orderOpen) && (
        <Suspense fallback={null}>
          <EntityFlowPanel
            openFlow={openFlow}
            orderOpen={orderOpen}
            kind={kind}
            placeName={title}
            menu={menu}
            catalog={catalog}
            onCloseFlow={() => setOpenFlow(null)}
            onCloseOrder={() => setOrderOpen(false)}
            onDone={setStatus}
          />
        </Suspense>
      )}

      {status && (
        <p className="entity-status" role="status">
          <MaterialIcon name="check_circle" size={18} />
          {status}
        </p>
      )}

      {tabbed && place ? (
        <PlaceDetailTabs
          kind={kind}
          place={place}
          details={lookup.details}
          images={photos}
          description={description}
          hours={hours}
          rawHours={place.details["Графік"]}
          address={address}
          facts={keyFacts}
          aboutFacts={aboutFacts}
          menu={menu.length > 0 ? menu : catalog}
          demoMenu
          similar={similar}
          directionsInBar={flows.length === 0}
          onDirections={onDirections}
          onShowOnMap={onShowOnMap}
          onSelectPlace={onSelectPlace}
        />
      ) : (
        <>
        {(info.length > 0 || website) && (
          <DetailSection title="Інформація">
            <QuickFacts facts={quickFacts} />
          </DetailSection>
        )}

        {description && (
          <DetailSection title="Опис">
            <p className="entity-description">{description}</p>
          </DetailSection>
        )}

        {lookup.details && (
          <section className="entity-scraped-details">
            <PlaceDetailsSection details={lookup.details} />
          </section>
        )}
        </>
      )}

      {children}
    </article>
  );
}
