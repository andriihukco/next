import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { cn } from "../lib/utils";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { MaterialIcon } from "./ui/material-icon";

export type CategoryChipItem = {
  id: string;
  label: string;
  icon: string;
  /** Category accent, used as the orb fill. Falls back to `--primary`. */
  color?: string;
  count?: number;
};

type CategoryTilesProps = {
  label: string;
  items: readonly CategoryChipItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
};

/**
 * One horizontally scrolling row of colored category orbs, used by every
 * section (transport, places, education, services, jobs, real estate, events).
 * Built on shadcn ToggleGroup. The selected orb is always scrolled into view.
 */
export function CategoryTiles({ label, items, value, onChange, className }: CategoryTilesProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const selected = row?.querySelector<HTMLElement>('[data-state="on"]');
    if (!row || !selected) return;
    const start = selected.offsetLeft - 16;
    const end = selected.offsetLeft + selected.offsetWidth + 16 - row.clientWidth;
    if (row.scrollLeft > start) row.scrollLeft = start;
    else if (row.scrollLeft < end) row.scrollLeft = end;
  }, [value]);

  return (
    <ToggleGroup
      ref={rowRef}
      type="single"
      variant="outline"
      value={value}
      onValueChange={(next) => {
        // Radix reports "" when the selected item is pressed again. Keep one selection.
        if (next) onChange(next);
      }}
      className={cn("category-chips", className)}
      aria-label={label}
      spacing={0}
    >
      {items.map((item) => {
        const selected = value === item.id;
        return (
          <ToggleGroupItem
            key={item.id}
            value={item.id}
            data-filter={item.id}
            className="category-tile"
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
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
