import { useState, type ReactNode } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Glass } from "../components/ui/glass";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { IconButton } from "../components/ui/icon-button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { MaterialIcon } from "../components/ui/material-icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet";
import { Skeleton } from "../components/ui/skeleton";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Toggle } from "../components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/ui/tooltip";

/**
 * One page per UI primitive in src/components/ui. Each page shows a live preview, the code to use it,
 * and the props. Previews render the real components, so a change to a component shows here.
 * Props are written by hand: keep them in step with the component's source (listed on each page).
 */

export type PropRow = { name: string; type: string; default?: string; description: string };

export type ComponentDoc = {
  slug: string;
  title: string;
  category: "Actions" | "Forms" | "Feedback" | "Navigation" | "Overlays" | "Icons" | "Surfaces";
  description: string;
  file: string;
  Preview: () => ReactNode;
  code: string;
  props: PropRow[];
  rules?: string[];
};

/**
 * The mobile element (mobile/src/ui) that stands in for each web component. Slugs without an entry
 * have no iOS or Android element yet, and their page says so. Demos for these live in mobile/src/design-demos.tsx.
 */
export const MOBILE_COUNTERPARTS: Record<string, string> = {
  button: "Button",
  "icon-button": "IconButton",
  toggle: "Chip",
  "toggle-group": "Segmented",
  switch: "SwitchRow",
  badge: "Badge",
  card: "Surface",
  tabs: "Segmented",
  separator: "Divider",
  glass: "Glass",
};

export const COMPONENT_CATEGORIES: ComponentDoc["category"][] = [
  "Actions",
  "Forms",
  "Feedback",
  "Navigation",
  "Overlays",
  "Icons",
  "Surfaces",
];

function ButtonPreview() {
  return (
    <div className="ds-demo-row">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button disabled>Disabled</Button>
    </div>
  );
}

function IconButtonPreview() {
  return (
    <div className="ds-demo-row">
      <IconButton label="Search" variant="outline">
        <MaterialIcon name="search" size={20} />
      </IconButton>
      <IconButton label="Swap places" variant="ghost">
        <MaterialIcon name="swap_vert" size={20} />
      </IconButton>
    </div>
  );
}

function TogglePreview() {
  const [pressed, setPressed] = useState(true);
  return (
    <div className="ds-demo-row">
      <Toggle variant="pill" pressed={pressed} onPressedChange={setPressed}>
        <MaterialIcon name="map" size={18} filled={pressed} />
        Map
      </Toggle>
      <Toggle variant="pill" size="sm" pressed={!pressed} onPressedChange={(next) => setPressed(!next)}>
        Small
      </Toggle>
      <Toggle variant="outline" defaultPressed>
        Outline
      </Toggle>
      <Toggle disabled>Disabled</Toggle>
    </div>
  );
}

function ToggleGroupPreview() {
  const [value, setValue] = useState("list");
  return (
    <ToggleGroup type="single" variant="outline" value={value} onValueChange={(next) => next && setValue(next)}>
      <ToggleGroupItem value="map">Map</ToggleGroupItem>
      <ToggleGroupItem value="list">List</ToggleGroupItem>
      <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
    </ToggleGroup>
  );
}

function InputPreview() {
  return (
    <div className="ds-demo-stack">
      <div className="ds-field">
        <Label htmlFor="demo-name">Name</Label>
        <Input id="demo-name" placeholder="Your name" />
      </div>
      <div className="ds-field">
        <Label htmlFor="demo-disabled">Disabled</Label>
        <Input id="demo-disabled" placeholder="Not editable" disabled />
      </div>
    </div>
  );
}

function LabelPreview() {
  return (
    <div className="ds-demo-row">
      <Label htmlFor="demo-label-switch">Show nearby places</Label>
      <Switch id="demo-label-switch" defaultChecked />
    </div>
  );
}

function SelectPreview() {
  return (
    <Select defaultValue="bus">
      <SelectTrigger aria-label="Transport type">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="bus">Bus</SelectItem>
        <SelectItem value="tram">Tram</SelectItem>
        <SelectItem value="trolley">Trolleybus</SelectItem>
      </SelectContent>
    </Select>
  );
}

function SwitchPreview() {
  const [checked, setChecked] = useState(true);
  return (
    <div className="ds-demo-row">
      <Switch id="demo-switch" checked={checked} onCheckedChange={setChecked} />
      <Label htmlFor="demo-switch">Show nearby</Label>
      <Switch size="sm" aria-label="Small switch" defaultChecked />
    </div>
  );
}

function SliderPreview() {
  const [value, setValue] = useState([40]);
  return (
    <div className="ds-slider">
      <Slider value={value} onValueChange={setValue} max={100} step={1} aria-label="Radius" />
      <span>{value[0]} m</span>
    </div>
  );
}

function BadgePreview() {
  return (
    <div className="ds-demo-row">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="ghost">Ghost</Badge>
    </div>
  );
}

function CardPreview() {
  return (
    <Card className="ds-card">
      <CardHeader>
        <CardTitle>Card title</CardTitle>
        <CardDescription>Card description</CardDescription>
      </CardHeader>
      <CardContent>Card content</CardContent>
    </Card>
  );
}

function SeparatorPreview() {
  return (
    <div className="ds-stack">
      <span>Above</span>
      <Separator />
      <span>Below</span>
    </div>
  );
}

function SkeletonPreview() {
  return (
    <div className="ds-stack">
      <Skeleton className="ds-skeleton" />
      <Skeleton className="ds-skeleton" />
      <Skeleton className="ds-skeleton ds-skeleton-short" />
    </div>
  );
}

function TooltipPreview() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover or focus me</Button>
      </TooltipTrigger>
      <TooltipContent>Shown on hover and keyboard focus</TooltipContent>
    </Tooltip>
  );
}

function TabsPreview() {
  const [tab, setTab] = useState("places");
  return (
    <Tabs value={tab} onValueChange={setTab} className="ds-tabs">
      <TabsList>
        <TabsTrigger value="places">Places</TabsTrigger>
        <TabsTrigger value="transport">Transport</TabsTrigger>
      </TabsList>
      <TabsContent value="places">Places content</TabsContent>
      <TabsContent value="transport">Transport content</TabsContent>
    </Tabs>
  );
}

function DialogPreview() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog title</DialogTitle>
          <DialogDescription>Short description of what this dialog does.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

function SheetPreview() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sheet title</SheetTitle>
          <SheetDescription>Side panel for details and settings.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}

function GlassPreview() {
  return (
    <div className="ds-demo-stack">
      <Glass variant="regular" className="ds-builder-glass-surface">Regular, for floating chrome</Glass>
      <Glass variant="clear" className="ds-builder-glass-surface">Clear, over photos and the map</Glass>
      <Glass variant="tinted" className="ds-builder-glass-surface">Tinted, for a selected state</Glass>
    </div>
  );
}

function MaterialIconPreview() {
  return (
    <div className="ds-demo-row">
      <MaterialIcon name="map" size={24} />
      <MaterialIcon name="map" size={24} filled />
      <MaterialIcon name="directions_bus" size={24} />
      <MaterialIcon name="schedule" size={24} />
      <MaterialIcon name="star" size={24} filled />
    </div>
  );
}

export const COMPONENT_DOCS: ComponentDoc[] = [
  {
    slug: "button",
    title: "Button",
    category: "Actions",
    description: "Displays a button or a component that looks like a button. The one primary action on a screen uses the default variant.",
    file: "src/components/ui/button.tsx",
    Preview: ButtonPreview,
    code: `import { Button } from "@/components/ui/button"

export function Example() {
  return (
    <>
      <Button>Save</Button>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive" size="sm">Delete</Button>
    </>
  )
}`,
    props: [
      { name: "variant", type: '"default" | "secondary" | "outline" | "ghost" | "destructive" | "link"', default: '"default"', description: "Visual style. One primary (default) per screen." },
      { name: "size", type: '"default" | "sm" | "lg" | "icon"', default: '"default"', description: "Height and padding. icon is a square for a single icon." },
      { name: "asChild", type: "boolean", default: "false", description: "Renders the child element (for example a link) with the button styles." },
      { name: "disabled", type: "boolean", description: "Native button prop. Disabled buttons keep their label but ignore input." },
    ],
    rules: ["Icon-only buttons use IconButton, which requires an accessible label.", "Text is a verb: Save, Open, Delete."],
  },
  {
    slug: "icon-button",
    title: "IconButton",
    category: "Actions",
    description: "An icon-only action. It requires a label, which is used as the accessible name and as the tooltip text.",
    file: "src/components/ui/icon-button.tsx",
    Preview: IconButtonPreview,
    code: `import { IconButton } from "@/components/ui/icon-button"
import { MaterialIcon } from "@/components/ui/material-icon"

<IconButton label="Search" variant="outline">
  <MaterialIcon name="search" size={20} />
</IconButton>`,
    props: [
      { name: "label", type: "string", description: "Required. Accessible name and tooltip text." },
      { name: "tooltipSide", type: '"top" | "right" | "bottom" | "left"', default: '"top"', description: "Where the tooltip opens." },
      { name: "showTooltip", type: "boolean", default: "true", description: "Turn off when a visible text label sits next to the button." },
      { name: "variant", type: "ButtonProps['variant']", default: '"ghost"', description: "Same variants as Button." },
    ],
  },
  {
    slug: "toggle",
    title: "Toggle",
    category: "Actions",
    description: "A two-state button. Use the pill variant for filters and choices; selection is shown with aria-pressed.",
    file: "src/components/ui/toggle.tsx",
    Preview: TogglePreview,
    code: `import { Toggle } from "@/components/ui/toggle"

const [pressed, setPressed] = useState(true)

<Toggle variant="pill" pressed={pressed} onPressedChange={setPressed}>
  Map
</Toggle>`,
    props: [
      { name: "variant", type: '"default" | "outline" | "pill"', default: '"default"', description: "pill is the filter chip style (DESIGN.md §7)." },
      { name: "size", type: '"default" | "sm" | "lg"', default: '"default"', description: "Control height." },
      { name: "pressed", type: "boolean", description: "Controlled pressed state." },
      { name: "defaultPressed", type: "boolean", default: "false", description: "Initial pressed state when uncontrolled." },
      { name: "onPressedChange", type: "(pressed: boolean) => void", description: "Called when the user toggles it." },
    ],
  },
  {
    slug: "toggle-group",
    title: "ToggleGroup",
    category: "Actions",
    description: "A row of toggles where one value is chosen at a time (type single) or several (type multiple).",
    file: "src/components/ui/toggle-group.tsx",
    Preview: ToggleGroupPreview,
    code: `import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const [view, setView] = useState("list")

<ToggleGroup type="single" variant="outline" value={view} onValueChange={(v) => v && setView(v)}>
  <ToggleGroupItem value="map">Map</ToggleGroupItem>
  <ToggleGroupItem value="list">List</ToggleGroupItem>
</ToggleGroup>`,
    props: [
      { name: "type", type: '"single" | "multiple"', description: "Required. single keeps one value selected." },
      { name: "value", type: "string | string[]", description: "Controlled selection." },
      { name: "onValueChange", type: "(value) => void", description: "Called with the new selection. A single group can return an empty string." },
      { name: "variant", type: '"default" | "outline"', default: '"default"', description: "Outline adds the raised border." },
      { name: "size", type: '"default" | "sm" | "lg"', default: '"default"', description: "Applied to every item." },
    ],
  },
  {
    slug: "input",
    title: "Input",
    category: "Forms",
    description: "A single-line text field. The font size is 16px, so iOS Safari does not zoom when it gets focus.",
    file: "src/components/ui/input.tsx",
    Preview: InputPreview,
    code: `import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="grid gap-1">
  <Label htmlFor="name">Name</Label>
  <Input id="name" placeholder="Your name" />
</div>`,
    props: [
      { name: "type", type: "string", default: '"text"', description: "Native input type: text, email, search and so on." },
      { name: "placeholder", type: "string", description: "Hint text. It does not replace a label." },
      { name: "disabled", type: "boolean", default: "false", description: "Blocks input and dims the field." },
      { name: "aria-invalid", type: "boolean", description: "Shows the destructive border for an invalid value." },
    ],
  },
  {
    slug: "label",
    title: "Label",
    category: "Forms",
    description: "The accessible name for a form control. Always pair a Label with its control through htmlFor and id.",
    file: "src/components/ui/label.tsx",
    Preview: LabelPreview,
    code: `import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

<Label htmlFor="nearby">Show nearby places</Label>
<Switch id="nearby" />`,
    props: [{ name: "htmlFor", type: "string", description: "The id of the control this label names." }],
  },
  {
    slug: "select",
    title: "Select",
    category: "Forms",
    description: "Chooses one value from a list. Built on Radix Select, so it is keyboard operable out of the box.",
    file: "src/components/ui/select.tsx",
    Preview: SelectPreview,
    code: `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

<Select defaultValue="bus">
  <SelectTrigger aria-label="Transport type">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="bus">Bus</SelectItem>
    <SelectItem value="tram">Tram</SelectItem>
  </SelectContent>
</Select>`,
    props: [
      { name: "value", type: "string", description: "Controlled value." },
      { name: "defaultValue", type: "string", description: "Initial value when uncontrolled." },
      { name: "onValueChange", type: "(value: string) => void", description: "Called when the user picks an item." },
      { name: "size (SelectTrigger)", type: '"default" | "sm"', default: '"default"', description: "Trigger height." },
    ],
  },
  {
    slug: "switch",
    title: "Switch",
    category: "Forms",
    description: "A binary on or off setting that takes effect at once. Use a Checkbox-style choice for forms that need a submit.",
    file: "src/components/ui/switch.tsx",
    Preview: SwitchPreview,
    code: `import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const [on, setOn] = useState(true)

<Switch id="nearby" checked={on} onCheckedChange={setOn} />
<Label htmlFor="nearby">Show nearby</Label>`,
    props: [
      { name: "checked", type: "boolean", description: "Controlled state." },
      { name: "defaultChecked", type: "boolean", default: "false", description: "Initial state when uncontrolled." },
      { name: "onCheckedChange", type: "(checked: boolean) => void", description: "Called when the user flips it." },
      { name: "size", type: '"default" | "sm"', default: '"default"', description: "Track size." },
    ],
  },
  {
    slug: "slider",
    title: "Slider",
    category: "Forms",
    description: "Picks a number in a range by dragging or with the arrow keys. Always give it an aria-label.",
    file: "src/components/ui/slider.tsx",
    Preview: SliderPreview,
    code: `import { Slider } from "@/components/ui/slider"

const [radius, setRadius] = useState([40])

<Slider value={radius} onValueChange={setRadius} max={100} step={1} aria-label="Radius" />`,
    props: [
      { name: "value", type: "number[]", description: "Controlled values. One item for a single thumb." },
      { name: "min", type: "number", default: "0", description: "Lowest value." },
      { name: "max", type: "number", default: "100", description: "Highest value." },
      { name: "step", type: "number", default: "1", description: "Increment for drag and arrow keys." },
      { name: "onValueChange", type: "(value: number[]) => void", description: "Called while the user drags." },
    ],
  },
  {
    slug: "badge",
    title: "Badge",
    category: "Feedback",
    description: "A small status or count label. It is text-only and carries no interaction.",
    file: "src/components/ui/badge.tsx",
    Preview: BadgePreview,
    code: `import { Badge } from "@/components/ui/badge"

<Badge>New</Badge>
<Badge variant="secondary">Beta</Badge>`,
    props: [
      { name: "variant", type: '"default" | "secondary" | "destructive" | "outline" | "ghost" | "link"', default: '"default"', description: "Color role of the badge." },
      { name: "asChild", type: "boolean", default: "false", description: "Renders the child element with the badge styles." },
    ],
  },
  {
    slug: "card",
    title: "Card",
    category: "Feedback",
    description: "A surface that groups related content. Compose it from Header, Title, Description, Content and Footer.",
    file: "src/components/ui/card.tsx",
    Preview: CardPreview,
    code: `import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Card title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>Card content</CardContent>
</Card>`,
    props: [
      { name: "className", type: "string", description: "Extra classes. Width is set by the parent or the className." },
      { name: "CardHeader / CardContent / CardFooter", type: "div props", description: "Layout sections inside a Card." },
    ],
  },
  {
    slug: "separator",
    title: "Separator",
    category: "Feedback",
    description: "A thin divider between groups of content. Decorative by default.",
    file: "src/components/ui/separator.tsx",
    Preview: SeparatorPreview,
    code: `import { Separator } from "@/components/ui/separator"

<span>Above</span>
<Separator />
<span>Below</span>`,
    props: [
      { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Direction of the line." },
      { name: "decorative", type: "boolean", default: "true", description: "Hides the divider from assistive technology when true." },
    ],
  },
  {
    slug: "skeleton",
    title: "Skeleton",
    category: "Feedback",
    description: "A placeholder shape while content loads. Match its size to the content it replaces.",
    file: "src/components/ui/skeleton.tsx",
    Preview: SkeletonPreview,
    code: `import { Skeleton } from "@/components/ui/skeleton"

<Skeleton className="h-4 w-full" />
<Skeleton className="h-4 w-2/3" />`,
    props: [{ name: "className", type: "string", description: "Sets the size and shape of the placeholder." }],
  },
  {
    slug: "tooltip",
    title: "Tooltip",
    category: "Feedback",
    description: "Short text that explains a control on hover or keyboard focus. Do not put essential content in a tooltip.",
    file: "src/components/ui/tooltip.tsx",
    Preview: TooltipPreview,
    code: `import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="outline">Hover or focus me</Button>
  </TooltipTrigger>
  <TooltipContent>Shown on hover and keyboard focus</TooltipContent>
</Tooltip>`,
    props: [
      { name: "delayDuration", type: "number", default: "700", description: "Milliseconds before it opens (TooltipProvider)." },
      { name: "side", type: '"top" | "right" | "bottom" | "left"', default: '"top"', description: "Where the content opens (TooltipContent)." },
      { name: "sideOffset", type: "number", default: "0", description: "Gap between the trigger and the content." },
    ],
    rules: ["Wrap the app or the page in TooltipProvider once."],
  },
  {
    slug: "tabs",
    title: "Tabs",
    category: "Navigation",
    description: "Switches between views that belong to the same place. Each TabsContent shows when its value is selected.",
    file: "src/components/ui/tabs.tsx",
    Preview: TabsPreview,
    code: `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="places">
  <TabsList>
    <TabsTrigger value="places">Places</TabsTrigger>
    <TabsTrigger value="transport">Transport</TabsTrigger>
  </TabsList>
  <TabsContent value="places">…</TabsContent>
  <TabsContent value="transport">…</TabsContent>
</Tabs>`,
    props: [
      { name: "value", type: "string", description: "Controlled selected tab." },
      { name: "defaultValue", type: "string", description: "Initially selected tab." },
      { name: "onValueChange", type: "(value: string) => void", description: "Called when a tab is chosen." },
      { name: "variant (TabsList)", type: '"default" | "line"', default: '"default"', description: "default is a filled track; line is an underline style." },
    ],
  },
  {
    slug: "dialog",
    title: "Dialog",
    category: "Overlays",
    description: "A modal window that needs an answer before the page continues. Its title is required for screen readers.",
    file: "src/components/ui/dialog.tsx",
    Preview: DialogPreview,
    code: `import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog title</DialogTitle>
      <DialogDescription>Short description.</DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>`,
    props: [
      { name: "open", type: "boolean", description: "Controlled open state (Dialog)." },
      { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when the dialog opens or closes." },
      { name: "showCloseButton", type: "boolean", default: "true", description: "Shows the × button in the corner (DialogContent)." },
    ],
    rules: ["Esc and the scrim close it. Focus returns to the trigger."],
  },
  {
    slug: "sheet",
    title: "Sheet",
    category: "Overlays",
    description: "A panel that slides in from an edge, for details and settings. Use it for short tasks, not for long content on the map.",
    file: "src/components/ui/sheet.tsx",
    Preview: SheetPreview,
    code: `import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open sheet</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Sheet title</SheetTitle>
      <SheetDescription>Side panel for details and settings.</SheetDescription>
    </SheetHeader>
  </SheetContent>
</Sheet>`,
    props: [
      { name: "side", type: '"top" | "right" | "bottom" | "left"', default: '"right"', description: "Edge the panel slides from (SheetContent)." },
      { name: "showCloseButton", type: "boolean", default: "true", description: "Shows the close button (SheetContent)." },
      { name: "open", type: "boolean", description: "Controlled open state (Sheet)." },
    ],
  },
  {
    slug: "glass",
    title: "Glass",
    category: "Surfaces",
    description: "Liquid glass for floating chrome: top bars, tab bars, map markers and controls. Opaque when the browser or the user asks for less transparency.",
    file: "src/components/ui/glass.tsx",
    Preview: GlassPreview,
    code: `import { Glass } from "@/components/ui/glass"

<Glass variant="regular">Floating label</Glass>
<Glass variant="clear">Over a photo</Glass>
<Glass variant="tinted">Selected</Glass>`,
    props: [
      { name: "variant", type: '"regular" | "clear" | "tinted"', default: '"regular"', description: "regular is the default fill. clear is lighter for media. tinted shows a selected state." },
      { name: "as", type: '"div" | "header" | "nav"', default: '"div"', description: "The element it renders." },
      { name: "className", type: "string", description: "Extra classes. Set the size and position in the parent." },
    ],
    rules: [
      "Never put glass on glass. A control inside a glass bar sits on an opaque tile (DESIGN.md §2e).",
      "Text on glass keeps 4.5:1 against the fill over the lightest and darkest map tile.",
    ],
  },
  {
    slug: "material-icon",
    title: "MaterialIcon",
    category: "Icons",
    description: "The one icon component. It renders Material Symbols Rounded by ligature name. Filled is for the selected state only.",
    file: "src/components/ui/material-icon.tsx",
    Preview: MaterialIconPreview,
    code: `import { MaterialIcon } from "@/components/ui/material-icon"

<MaterialIcon name="directions_bus" size={24} />
<MaterialIcon name="star" size={24} filled />`,
    props: [
      { name: "name", type: "string", description: "Material Symbols ligature name, for example directions_bus." },
      { name: "size", type: "number", default: "20", description: "Font size in px." },
      { name: "filled", type: "boolean", default: "false", description: "Fills the glyph. Use only for an active or selected state." },
      { name: "className", type: "string", description: "Extra classes." },
    ],
    rules: ["Icons are decorative (aria-hidden). Name the control, not the icon."],
  },
];
