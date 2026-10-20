import * as React from "react";
import { cn } from "../../lib/utils";
import { MaterialIcon } from "./material-icon";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UnifiedCardVariant =
  | "place"
  | "restaurant"
  | "hotel"
  | "education"
  | "transport"
  | "directory"
  | "event";

export interface UnifiedCardProps {
  variant?: UnifiedCardVariant;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  onFocus?: () => void;
  "aria-label"?: string;
}

export interface UnifiedCardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  category?: string;
  /** Shows a date badge instead of the icon (events). */
  date?: { day: string; month: string };
  className?: string;
}

export interface UnifiedCardActionProps {
  label: string;
  icon?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
}

export interface UnifiedCardMetaProps {
  label: string;
  value: string;
  icon?: string;
  className?: string;
  clickable?: boolean;
  onClick?: () => void;
}

// ─── Components ────────────────────────────────────────────────────────────────

// A clickable card opens through its title button, which stretches over the whole
// card. That keeps it keyboard-reachable without nesting buttons (DESIGN.md §11).
const CardOpenContext = React.createContext<(() => void) | undefined>(undefined);

const UnifiedCardComponent = React.forwardRef<HTMLDivElement, UnifiedCardProps>(
  ({ variant = "place", children, className, onClick, "aria-label": ariaLabel }, ref) => (
    <article
      ref={ref}
      className={cn(
        "unified-card",
        `unified-card--${variant}`,
        onClick && "unified-card--clickable",
        className
      )}
      aria-label={ariaLabel}
    >
      <CardOpenContext.Provider value={onClick}>{children}</CardOpenContext.Provider>
    </article>
  ),
);
UnifiedCardComponent.displayName = "UnifiedCard";

const UnifiedCardHeader = ({
  title,
  subtitle,
  icon,
  iconColor,
  category,
  date,
  className,
}: UnifiedCardHeaderProps) => {
  const onOpen = React.useContext(CardOpenContext);
  return (
    <div className={cn("unified-card__header", className)}>
      {date && (
        <div className="unified-card__date" aria-hidden="true">
          <strong>{date.day}</strong>
          <span>{date.month}</span>
        </div>
      )}
      {icon && !date && (
        <div
          className="unified-card__icon"
          style={iconColor ? ({ "--card-icon-color": iconColor } as React.CSSProperties) : undefined}
          aria-hidden="true"
        >
          <MaterialIcon name={icon} size={20} />
        </div>
      )}
      <div className="unified-card__header-content">
        {category && <span className="unified-card__category">{category}</span>}
        <h3 className="unified-card__title">
          {onOpen ? (
            <button type="button" className="unified-card__open" onClick={onOpen}>
              {title}
            </button>
          ) : (
            title
          )}
        </h3>
        {subtitle && subtitle.trim() && <p className="unified-card__subtitle">{subtitle}</p>}
      </div>
      {onOpen && <MaterialIcon name="chevron_right" size={20} className="unified-card__chevron" />}
    </div>
  );
};

const UnifiedCardAction = ({
  label,
  icon,
  onClick,
  variant = "primary",
  className,
}: UnifiedCardActionProps) => (
  <button
    type="button"
    className={cn("unified-card__action", `unified-card__action--${variant}`, className)}
    onClick={onClick}
  >
    {icon && <MaterialIcon name={icon} size={16} />}
    <span>{label}</span>
  </button>
);

const UnifiedCardMeta = ({ label, value, icon, className, clickable, onClick }: UnifiedCardMetaProps) => {
  const content = (
    <>
      {icon && <MaterialIcon name={icon} size={16} />}
      <span className="unified-card__meta-label">{label}:</span>
      <span className="unified-card__meta-value">{value}</span>
    </>
  );
  return clickable ? (
    <button
      type="button"
      className={cn("unified-card__meta", "unified-card__meta--clickable", className)}
      onClick={onClick}
    >
      {content}
    </button>
  ) : (
    <div className={cn("unified-card__meta", className)}>{content}</div>
  );
};

// ─── Compound Component ─────────────────────────────────────────────────────────

export const UnifiedCard = Object.assign(UnifiedCardComponent, {
  Header: UnifiedCardHeader,
  Action: UnifiedCardAction,
  Meta: UnifiedCardMeta,
});
