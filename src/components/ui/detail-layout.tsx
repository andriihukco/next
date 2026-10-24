import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "./material-icon";
import "./detail-layout.css";

/**
 * Shared building blocks for detail sheets (vehicle, stop, place).
 * Built on shadcn Button and Badge. The class names stay as hooks
 * for detail-layout.css. Follows iOS and Material conventions: a top
 * navigation bar with a back action, a hero block, a row of equal-width
 * actions, grouped sections, and list rows with 44px+ touch targets.
 */

type SheetNavBarProps = {
  title: string;
  onBack: () => void;
  backLabel?: string;
  trailing?: ReactNode;
};

export function SheetNavBar({
  title,
  onBack,
  backLabel = "Назад",
  trailing,
}: SheetNavBarProps) {
  return (
    <div className="sheet-nav">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="sheet-nav-back"
        onClick={onBack}
        aria-label={backLabel}
      >
        <MaterialIcon name="chevron_left" size={24} />
        <span>{backLabel}</span>
      </Button>
      <span className="sheet-nav-title">{title}</span>
      <span className="sheet-nav-trailing">{trailing}</span>
    </div>
  );
}

type DetailHeroProps = {
  badge?: ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  chips?: ReactNode;
};

export function DetailHero({ badge, eyebrow, title, subtitle, chips }: DetailHeroProps) {
  return (
    <header className="detail-hero">
      {badge && <div className="detail-hero-badge">{badge}</div>}
      <div className="detail-hero-copy">
        {eyebrow && <span className="detail-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
        {chips && <div className="detail-chips">{chips}</div>}
      </div>
    </header>
  );
}

type DetailChipProps = {
  icon?: string;
  tone?: "neutral" | "live";
  children: ReactNode;
};

export function DetailChip({ icon, tone = "neutral", children }: DetailChipProps) {
  return (
    <Badge variant="secondary" className={cn("detail-chip", tone === "live" && "is-live")}>
      {icon && <MaterialIcon name={icon} size={14} />}
      {children}
    </Badge>
  );
}

export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="detail-actions" role="toolbar">
      {children}
    </div>
  );
}

type ActionBarButtonProps = {
  icon: string;
  label: string;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
  /** The entity's main action (directions, order, book). One per bar. */
  primary?: boolean;
};

export function ActionBarButton({ icon, label, onClick, pressed, disabled, primary }: ActionBarButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("detail-action", pressed && "is-pressed", primary && "is-primary")}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="detail-action-icon">
        <MaterialIcon name={icon} size={20} />
      </span>
      <span>{label}</span>
    </Button>
  );
}

type DetailSectionProps = {
  title?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function DetailSection({ title, action, className, children }: DetailSectionProps) {
  return (
    <section className={cn("detail-section", className)}>
      {title && (
        <header className="detail-section-head">
          <h3>{title}</h3>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatGrid({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="detail-stats">
      {items.map((item) => (
        <div className="detail-stat" key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

type ListRowProps = {
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onClick?: () => void;
};

export function ListRow({ leading, title, subtitle, trailing, onClick }: ListRowProps) {
  const content = (
    <>
      {leading && <span className="list-row-leading">{leading}</span>}
      <span className="list-row-copy">
        <span className="list-row-title">{title}</span>
        {subtitle && <span className="list-row-subtitle">{subtitle}</span>}
      </span>
      {trailing ?? (onClick && <MaterialIcon name="chevron_right" size={20} className="list-row-chevron" />)}
    </>
  );
  return onClick ? (
    <Button type="button" variant="ghost" className="list-row" onClick={onClick}>
      {content}
    </Button>
  ) : (
    <div className="list-row">{content}</div>
  );
}


export type QuickFact = {
  icon: string;
  label: string;
  value: string;
  /** Makes the value a link. Only for facts with a real target (phone, site, email). */
  href?: string;
};

/**
 * Label and value rows, like the Quick facts block in Google Maps and the
 * Hours, Ratings, Accepts and Distance row in Apple Maps. Each row is a plain
 * definition pair, so screen readers read "label: value" in order.
 */
export function QuickFacts({ facts }: { facts: QuickFact[] }) {
  return (
    <dl className="quick-facts">
      {facts.map((fact) => (
        <div className="quick-fact" key={fact.label}>
          <dt>
            <MaterialIcon name={fact.icon} size={20} />
            <span>{fact.label}</span>
          </dt>
          <dd>
            {fact.href ? (
              <a href={fact.href} target={fact.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                {fact.value}
              </a>
            ) : (
              fact.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
