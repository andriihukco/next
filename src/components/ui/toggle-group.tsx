import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const toggleGroupVariants = cva("inline-flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground");

const toggleGroupItemVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-sm px-3 text-sm font-medium transition-colors hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm [&_svg]:size-4",
  {
    variants: {
      size: {
        default: "h-8",
        sm: "h-7 px-2 text-xs",
        lg: "h-9 px-4",
      },
    },
    defaultVariants: { size: "default" },
  },
);

const ToggleGroup = ({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) => (
  <ToggleGroupPrimitive.Root className={cn(toggleGroupVariants(), className)} {...props} />
);

const ToggleGroupItem = ({ className, size, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleGroupItemVariants>) => (
  <ToggleGroupPrimitive.Item className={cn(toggleGroupItemVariants({ size }), className)} {...props} />
);

export { ToggleGroup, ToggleGroupItem };