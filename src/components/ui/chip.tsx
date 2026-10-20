import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { MaterialIcon } from "./material-icon";

// Filter and category pills (DESIGN.md §7). Selection is exposed with
// `aria-pressed` and a filled icon, never by color alone.
const chipVariants = cva(
  "chip inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-full border font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-[120ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] active:scale-[0.96] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-3.5 text-sm",
      },
      tone: {
        default:
          "border-border bg-card text-foreground hover:border-[var(--primary-border)] hover:bg-accent/60 aria-pressed:border-primary aria-pressed:bg-accent aria-pressed:text-accent-foreground aria-selected:border-primary aria-selected:bg-accent aria-selected:text-accent-foreground",
        solid:
          "border-transparent bg-[var(--surface-muted)] text-foreground hover:bg-accent aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-selected:bg-primary aria-selected:text-primary-foreground",
      },
    },
    defaultVariants: { size: "md", tone: "default" },
  },
);

export interface ChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof chipVariants> {
  /** Selected state. Sets `aria-pressed` unless the chip is used as a tab. */
  selected?: boolean;
  icon?: string;
  children: React.ReactNode;
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, size, tone, selected, icon, role, children, type = "button", ...props }, ref) => {
    const isTab = role === "tab";
    return (
      <button
        ref={ref}
        type={type}
        role={role}
        aria-pressed={isTab || selected === undefined ? undefined : selected}
        aria-selected={isTab ? Boolean(selected) : undefined}
        data-selected={selected ? "" : undefined}
        className={cn(chipVariants({ size, tone }), className)}
        {...props}
      >
        {icon && <MaterialIcon name={icon} size={size === "sm" ? 16 : 18} filled={selected} />}
        {children}
      </button>
    );
  },
);
Chip.displayName = "Chip";

export { Chip, chipVariants };
