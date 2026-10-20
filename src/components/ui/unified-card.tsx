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
  className?: string;
}

export interface UnifiedCardImageProps {
  src?: string;
  alt?: string;
  category?: string;
  fallbackIcon?: string;
  className?: string;
}

export interface UnifiedCardRatingProps {
  rating: number;
  reviewCount?: number;
  className?: string;
}

export interface UnifiedCardPriceProps {
  priceRange?: string;
  className?: string;
}

export interface UnifiedCardStatusProps {
  status: "open" | "closed" | "opens-soon";
  opensAt?: string;
  className?: string;
}

export interface UnifiedCardReviewProps {
  review: string;
  author?: string;
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
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
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
  className,
}: UnifiedCardHeaderProps) => (
  <div className={cn("unified-card__header", className)}>
    {icon && (
      <div
        className="unified-card__icon"
        style={iconColor ? { backgroundColor: iconColor } : undefined}
      >
        <MaterialIcon name={icon} size={20} />
      </div>
    )}
    <div className="unified-card__header-content">
      {category && <span className="unified-card__category">{category}</span>}
      <h3 className="unified-card__title">{title}</h3>
      {subtitle && subtitle.trim() && <p className="unified-card__subtitle">{subtitle}</p>}
    </div>
  </div>
);

const UnifiedCardImage = ({
  src,
  alt = "",
  category: _category,
  fallbackIcon,
  className,
}: UnifiedCardImageProps) => {
  const [imageError, setImageError] = React.useState(false);

  if (!src || imageError) {
    return (
      <div className={cn("unified-card__image unified-card__image--fallback", className)}>
        {fallbackIcon && <MaterialIcon name={fallbackIcon} size={32} />}
      </div>
    );
  }

  return (
    <div className={cn("unified-card__image-wrapper", className)}>
      <img
        src={src}
        alt={alt}
        className="unified-card__image"
        loading="lazy"
        onError={() => setImageError(true)}
      />
    </div>
  );
};

const UnifiedCardRating = ({ rating, reviewCount, className }: UnifiedCardRatingProps) => (
  <div className={cn("unified-card__rating", className)}>
    <MaterialIcon name="star" size={16} />
    <span className="unified-card__rating-value">{rating.toFixed(1)}</span>
    {reviewCount && (
      <span className="unified-card__review-count">({reviewCount})</span>
    )}
  </div>
);

const UnifiedCardPrice = ({ priceRange, className }: UnifiedCardPriceProps) => (
  <div className={cn("unified-card__price", className)}>
    <span>{priceRange}</span>
  </div>
);

const UnifiedCardStatus = ({ status, opensAt, className }: UnifiedCardStatusProps) => {
  const statusLabels = {
    open: "Відкрито",
    closed: "Закрито",
    "opens-soon": "Відкривається скоро",
  };

  return (
    <div className={cn("unified-card__status", `unified-card__status--${status}`, className)}>
      <span>{statusLabels[status]}</span>
      {status === "closed" && opensAt && <span>· {opensAt}</span>}
    </div>
  );
};

const UnifiedCardReview = ({ review, author, className }: UnifiedCardReviewProps) => (
  <div className={cn("unified-card__review", className)}>
    {author && <div className="unified-card__review-author">{author}</div>}
    <p className="unified-card__review-text">"{review}"</p>
  </div>
);

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
    {icon && <MaterialIcon name={icon} size={18} />}
    <span>{label}</span>
  </button>
);

const UnifiedCardMeta = ({ label, value, icon, className, clickable, onClick }: UnifiedCardMetaProps) => (
  <div
    className={cn("unified-card__meta", clickable && "unified-card__meta--clickable", className)}
    onClick={onClick}
    role={clickable ? "button" : undefined}
    tabIndex={clickable ? 0 : undefined}
    onKeyDown={clickable ? (e) => e.key === "Enter" && onClick?.() : undefined}
  >
    {icon && <MaterialIcon name={icon} size={16} />}
    <span className="unified-card__meta-label">{label}:</span>
    <span className="unified-card__meta-value">{value}</span>
    {clickable && <MaterialIcon name="open_in_new" size={14} />}
  </div>
);

// ─── Compound Component ─────────────────────────────────────────────────────────

export const UnifiedCard = Object.assign(UnifiedCardComponent, {
  Header: UnifiedCardHeader,
  Image: UnifiedCardImage,
  Rating: UnifiedCardRating,
  Price: UnifiedCardPrice,
  Status: UnifiedCardStatus,
  Review: UnifiedCardReview,
  Action: UnifiedCardAction,
  Meta: UnifiedCardMeta,
});
