import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { cn } from "../../lib/utils";
import { Chip } from "./chip";

export type CategoryChipItem = {
  id: string;
  label: string;
  icon: string;
  /** Category accent for the icon only; the chip itself stays neutral (DESIGN.md §7). */
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
 * One horizontally scrolling row of category filters, used by every section
 * (transport, places, education, services, jobs, real estate, events).
 * The selected chip is always scrolled into view.
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
      {items.map((item) => (
        <Chip
          key={item.id}
          icon={item.icon}
          selected={value === item.id}
          data-filter={item.id}
          className="category-chip"
          style={item.color ? ({ "--chip-color": item.color } as CSSProperties) : undefined}
          onClick={() => onChange(item.id)}
        >
          {item.label}
          {item.count !== undefined && item.count > 0 && (
            <span className="category-chip-count">{item.count}</span>
          )}
        </Chip>
      ))}
    </div>
  );
}
