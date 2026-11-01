import * as React from "react";
import { cn } from "../../lib/utils";
import "./glass.css";

export type GlassVariant = "regular" | "clear" | "tinted";

export interface GlassProps extends React.ComponentProps<"div"> {
  /** regular: the default fill. clear: lighter, for media-heavy backgrounds. tinted: primary-colored glass for a selected state. */
  variant?: GlassVariant;
  /** Renders the glass as a button or link. Set `asChild` to pass the glass to another element. */
  as?: "div" | "header" | "nav";
}

// Liquid glass for floating chrome (DESIGN.md §2e). Opaque when backdrop-filter is not supported
// or the user asks for reduced transparency; see glass.css.
const Glass = React.forwardRef<HTMLDivElement, GlassProps>(
  ({ className, variant = "regular", as: Tag = "div", ...props }, ref) => (
    <Tag ref={ref} data-glass={variant} className={cn("glass", className)} {...props} />
  ),
);
Glass.displayName = "Glass";

export { Glass };
