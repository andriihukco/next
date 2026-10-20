import * as React from "react";
import { cn } from "../../lib/utils";
import { Button, type ButtonProps } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export interface IconButtonProps extends Omit<ButtonProps, "size" | "aria-label"> {
  /** Accessible name and tooltip text. Required: icon-only controls have no visible label. */
  label: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  /** Turn the tooltip off when a visible label sits next to the button. */
  showTooltip?: boolean;
}

// Icon-only action (DESIGN.md §6, §7). The ::after extends the hit area to 44px
// on touch screens without changing the 36px visual size.
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, tooltipSide = "top", showTooltip = true, variant = "ghost", className, type = "button", ...props }, ref) => {
    const button = (
      <Button
        ref={ref}
        type={type}
        variant={variant}
        size="icon"
        aria-label={label}
        className={cn("icon-button", className)}
        {...props}
      />
    );
    if (!showTooltip) return button;
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side={tooltipSide}>{label}</TooltipContent>
      </Tooltip>
    );
  },
);
IconButton.displayName = "IconButton";

export { IconButton };
