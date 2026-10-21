import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { cn } from "../../lib/utils";
import { MaterialIcon } from "./material-icon";

export type CategoryChipItem = {
  id: string;
  label: string;
  icon: string;
  /** Category accent, used as the orb fill. Falls back to `--primary`. */
  color?: string;
  count?: number;
};

type CategoryChipsProps = {
  label: string;
  items: readonly CategoryChipItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
};

/**
 * One horizontally scrolling row of colored category orbs, used by every
 * section (transport, places, education, services, jobs, real estate, events).
 * The selected orb is always scrolled into view.
 */
export function CategoryChips({ label, items, value, onChange, className }: CategoryChipsProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const selected = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!row || !selected) return;
    const start = selected.offsetLeft - 16;
    const end = selected.offsetLeft + selected.offsetWidth + 16 - row.clientWidth;
    if (row.scrollLeft > start) row.scrollLeft = start;
    else if (row.scrollLeft < end) row.scrollLeft = end;
  }, [value]);

  return (
    <div ref={rowRef} className={cn("category-chips", className)} role="group" aria-label={label}>
      {items.map((item) => {
        const selected = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected}
            data-filter={item.id}
            className="category-tile"
            onClick={() => onChange(item.id)}
          >
            <span
              className="category-tile-orb"
              style={{ "--category-color": item.color ?? "var(--primary)" } as CSSProperties}
            >
              <MaterialIcon name={item.icon} size={34} filled={selected} />
              {item.count !== undefined && item.count > 0 && (
                <span className="category-tile-count">{item.count}</span>
              )}
            </span>
            <span className="category-tile-label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
