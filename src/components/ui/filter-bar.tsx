import * as React from "react";
import { cn } from "../../lib/utils";
import { MaterialIcon } from "./material-icon";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export interface FilterChipProps {
  label: string;
  icon?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export interface DateFilterProps {
  label?: string;
  startDate?: Date;
  endDate?: Date;
  onStartDateChange?: (date: Date) => void;
  onEndDateChange?: (date: Date) => void;
  className?: string;
}

export interface GuestFilterProps {
  label?: string;
  guests: number;
  onGuestsChange?: (guests: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export interface PriceFilterProps {
  label?: string;
  minPrice?: number;
  maxPrice?: number;
  onMinPriceChange?: (price: number) => void;
  onMaxPriceChange?: (price: number) => void;
  currency?: string;
  className?: string;
}

// ─── Components ────────────────────────────────────────────────────────────────

const FilterBar = ({ children, className }: FilterBarProps) => (
  <div className={cn("filter-bar", className)}>{children}</div>
);

const FilterChip = ({ label, icon, active = false, onClick, className }: FilterChipProps) => (
  <button
    type="button"
    className={cn("filter-chip", active && "filter-chip--active", className)}
    onClick={onClick}
    aria-pressed={active}
  >
    {icon && <MaterialIcon name={icon} size={18} />}
    <span>{label}</span>
  </button>
);

const DateFilter = ({
  label = "Дати",
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
}: DateFilterProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const formatDate = (date?: Date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("uk-UA", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className={cn("date-filter", className)}>
      <button
        type="button"
        className="date-filter__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <MaterialIcon name="calendar_today" size={18} />
        <span className="date-filter__label">{label}</span>
        <span className="date-filter__value">
          {startDate && endDate
            ? `${formatDate(startDate)} - ${formatDate(endDate)}`
            : startDate
            ? formatDate(startDate)
            : "Оберіть дати"}
        </span>
        <MaterialIcon name={isOpen ? "keyboard_arrow_up" : "keyboard_arrow_down"} size={18} />
      </button>

      {isOpen && (
        <div className="date-filter__dropdown">
          <div className="date-filter__dropdown-header">
            <strong>{label}</strong>
            <button
              type="button"
              className="date-filter__close"
              onClick={() => setIsOpen(false)}
              aria-label="Закрити"
            >
              <MaterialIcon name="close" size={20} />
            </button>
          </div>
          <div className="date-filter__inputs">
            <div className="date-filter__input-group">
              <label htmlFor="start-date">Від</label>
              <input
                id="start-date"
                type="date"
                value={startDate ? startDate.toISOString().split("T")[0] : ""}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  if (date && onStartDateChange) onStartDateChange(date);
                }}
              />
            </div>
            <div className="date-filter__input-group">
              <label htmlFor="end-date">До</label>
              <input
                id="end-date"
                type="date"
                value={endDate ? endDate.toISOString().split("T")[0] : ""}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  if (date && onEndDateChange) onEndDateChange(date);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GuestFilter = ({
  label = "Гості",
  guests,
  onGuestsChange,
  min = 1,
  max = 10,
  className,
}: GuestFilterProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={cn("guest-filter", className)}>
      <button
        type="button"
        className="guest-filter__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <MaterialIcon name="person" size={18} />
        <span className="guest-filter__label">{label}</span>
        <span className="guest-filter__value">{guests}</span>
        <MaterialIcon name={isOpen ? "keyboard_arrow_up" : "keyboard_arrow_down"} size={18} />
      </button>

      {isOpen && (
        <div className="guest-filter__dropdown">
          <div className="guest-filter__dropdown-header">
            <strong>{label}</strong>
            <button
              type="button"
              className="guest-filter__close"
              onClick={() => setIsOpen(false)}
              aria-label="Закрити"
            >
              <MaterialIcon name="close" size={20} />
            </button>
          </div>
          <div className="guest-filter__counter">
            <button
              type="button"
              className="guest-filter__decrement"
              onClick={() => onGuestsChange && onGuestsChange(Math.max(min, guests - 1))}
              disabled={guests <= min}
              aria-label="Зменшити"
            >
              <MaterialIcon name="remove" size={20} />
            </button>
            <span className="guest-filter__count">{guests}</span>
            <button
              type="button"
              className="guest-filter__increment"
              onClick={() => onGuestsChange && onGuestsChange(Math.min(max, guests + 1))}
              disabled={guests >= max}
              aria-label="Збільшити"
            >
              <MaterialIcon name="add" size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const PriceFilter = ({
  label = "Ціна",
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  currency = "₴",
  className,
}: PriceFilterProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={cn("price-filter", className)}>
      <button
        type="button"
        className="price-filter__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <MaterialIcon name="payments" size={18} />
        <span className="price-filter__label">{label}</span>
        <span className="price-filter__value">
          {minPrice !== undefined && maxPrice !== undefined
            ? `${minPrice}${currency} - ${maxPrice}${currency}`
            : minPrice !== undefined
            ? `від ${minPrice}${currency}`
            : maxPrice !== undefined
            ? `до ${maxPrice}${currency}`
            : "Оберіть діапазон"}
        </span>
        <MaterialIcon name={isOpen ? "keyboard_arrow_up" : "keyboard_arrow_down"} size={18} />
      </button>

      {isOpen && (
        <div className="price-filter__dropdown">
          <div className="price-filter__dropdown-header">
            <strong>{label}</strong>
            <button
              type="button"
              className="price-filter__close"
              onClick={() => setIsOpen(false)}
              aria-label="Закрити"
            >
              <MaterialIcon name="close" size={20} />
            </button>
          </div>
          <div className="price-filter__inputs">
            <div className="price-filter__input-group">
              <label htmlFor="min-price">Від</label>
              <input
                id="min-price"
                type="number"
                value={minPrice ?? ""}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined;
                  if (onMinPriceChange) onMinPriceChange(value ?? 0);
                }}
                placeholder="0"
              />
            </div>
            <div className="price-filter__input-group">
              <label htmlFor="max-price">До</label>
              <input
                id="max-price"
                type="number"
                value={maxPrice ?? ""}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined;
                  if (onMaxPriceChange) onMaxPriceChange(value ?? 0);
                }}
                placeholder="10000"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Compound Component ─────────────────────────────────────────────────────────

FilterBar.Chip = FilterChip;
FilterBar.Date = DateFilter;
FilterBar.Guest = GuestFilter;
FilterBar.Price = PriceFilter;

export { FilterBar };
