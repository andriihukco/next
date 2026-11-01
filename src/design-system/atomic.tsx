import { type ReactNode } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Glass, type GlassVariant } from "../components/ui/glass";
import { IconButton } from "../components/ui/icon-button";
import { MaterialIcon } from "../components/ui/material-icon";

/**
 * Atomic design for the web: atoms → molecules → organisms → templates. Every block is a small
 * React component plus the props the builder can change. The builder (design-builder.tsx) composes
 * them into a screen; `code` writes the same composition as JSX to copy into the app.
 */

export type Level = "atom" | "molecule" | "organism" | "template";

export const LEVELS: { id: Level; label: string; rule: string }[] = [
  { id: "atom", label: "Atoms", rule: "One element. No state of its own." },
  { id: "molecule", label: "Molecules", rule: "A few atoms that do one job together." },
  { id: "organism", label: "Organisms", rule: "A whole part of a screen: a bar, a card, a tab bar." },
  { id: "template", label: "Templates", rule: "The frame a screen is placed in. Blocks go inside it." },
];

export type PropSpec =
  | { key: string; label: string; kind: "text"; default: string }
  | { key: string; label: string; kind: "select"; options: string[]; default: string }
  | { key: string; label: string; kind: "toggle"; default: boolean };

export type Values = Record<string, string | boolean>;

export type Block = {
  id: string;
  level: Level;
  name: string;
  description: string;
  props: PropSpec[];
  render: (values: Values) => ReactNode;
  code: (values: Values) => string;
};

const GLASS_VARIANTS: GlassVariant[] = ["regular", "clear", "tinted"];
const FLEET = ["var(--fleet-bus)", "var(--fleet-tram)", "var(--fleet-trolleybus)", "var(--fleet-taxi)"];

function str(values: Values, key: string) {
  return String(values[key] ?? "");
}

function bool(values: Values, key: string) {
  return values[key] === true;
}

export const BLOCKS: Block[] = [
  // Atoms
  {
    id: "icon",
    level: "atom",
    name: "Icon",
    description: "One Material Symbols glyph.",
    props: [
      { key: "icon", label: "Name", kind: "text", default: "directions_bus" },
      { key: "filled", label: "Filled (selected only)", kind: "toggle", default: false },
    ],
    render: (v) => <MaterialIcon name={str(v, "icon")} size={24} filled={bool(v, "filled")} />,
    code: (v) => `<MaterialIcon name="${str(v, "icon")}" size={24}${bool(v, "filled") ? " filled" : ""} />`,
  },
  {
    id: "badge",
    level: "atom",
    name: "Badge",
    description: "A short status label.",
    props: [
      { key: "text", label: "Text", kind: "text", default: "Наживо" },
      { key: "variant", label: "Variant", kind: "select", options: ["default", "secondary", "outline"], default: "secondary" },
    ],
    render: (v) => <Badge variant={str(v, "variant") as "default"}>{str(v, "text")}</Badge>,
    code: (v) => `<Badge variant="${str(v, "variant")}">${str(v, "text")}</Badge>`,
  },

  // Molecules
  {
    id: "glass-control",
    level: "molecule",
    name: "Glass control",
    description: "An icon button on glass, for map corners and bars. Labeled for screen readers.",
    props: [
      { key: "icon", label: "Icon", kind: "text", default: "my_location" },
      { key: "label", label: "Accessible name", kind: "text", default: "Моя локація" },
    ],
    render: (v) => (
      <IconButton label={str(v, "label")} variant="glass">
        <MaterialIcon name={str(v, "icon")} size={20} />
      </IconButton>
    ),
    code: (v) =>
      `<IconButton label="${str(v, "label")}" variant="glass">\n  <MaterialIcon name="${str(v, "icon")}" size={20} />\n</IconButton>`,
  },
  {
    id: "route-marker",
    level: "molecule",
    name: "Route marker",
    description: "Vehicle on the map: route number on a glass tile, plate on a glass label.",
    props: [
      { key: "route", label: "Route", kind: "text", default: "2" },
      { key: "plate", label: "Plate", kind: "text", default: "AA 1234" },
      { key: "color", label: "Fleet", kind: "select", options: FLEET, default: FLEET[1] },
    ],
    render: (v) => (
      <div className="vehicle-marker" style={{ ["--route-color" as string]: str(v, "color") }}>
        <span className="marker-route">{str(v, "route")}</span>
        <span className="marker-plate">{str(v, "plate")}</span>
      </div>
    ),
    code: (v) => `<RouteMarker route="${str(v, "route")}" plate="${str(v, "plate")}" color="${str(v, "color")}" />`,
  },
  {
    id: "glass-surface",
    level: "molecule",
    name: "Glass surface",
    description: "A floating panel of text on liquid glass.",
    props: [
      { key: "text", label: "Text", kind: "text", default: "Площа Ринок · 250 м" },
      { key: "variant", label: "Variant", kind: "select", options: GLASS_VARIANTS, default: "regular" },
    ],
    render: (v) => (
      <Glass variant={str(v, "variant") as GlassVariant} className="ds-builder-glass-surface">
        {str(v, "text")}
      </Glass>
    ),
    code: (v) => `<Glass variant="${str(v, "variant")}">${str(v, "text")}</Glass>`,
  },

  // Organisms
  {
    id: "top-bar",
    level: "organism",
    name: "Top bar",
    description: "Title with a leading and trailing action. Glass when it floats over the map, opaque on lists.",
    props: [
      { key: "title", label: "Title", kind: "text", default: "Транспорт" },
      { key: "glass", label: "Glass", kind: "toggle", default: true },
      { key: "leading", label: "Back button", kind: "toggle", default: true },
      { key: "trailing", label: "Action button", kind: "toggle", default: true },
    ],
    render: (v) => (
      <div className={bool(v, "glass") ? "ds-builder-bar ds-builder-bar-glass" : "ds-builder-bar"}>
        <div className="ds-builder-bar-slot">
          {bool(v, "leading") ? (
            <IconButton label="Назад" variant="ghost">
              <MaterialIcon name="arrow_back" size={20} />
            </IconButton>
          ) : null}
        </div>
        <span className="ds-builder-bar-title">{str(v, "title")}</span>
        <div className="ds-builder-bar-slot ds-builder-bar-end">
          {bool(v, "trailing") ? (
            <IconButton label="Ще" variant="ghost">
              <MaterialIcon name="more_horiz" size={20} />
            </IconButton>
          ) : null}
        </div>
      </div>
    ),
    code: (v) =>
      `<TopBar title="${str(v, "title")}" glass={${bool(v, "glass")}} leading={${bool(v, "leading")}} trailing={${bool(v, "trailing")}} />`,
  },
  {
    id: "tab-bar",
    level: "organism",
    name: "Tab bar",
    description: "Five-tab bar at the bottom. Shows the selected tab with the filled icon and aria-current.",
    props: [{ key: "active", label: "Selected tab", kind: "select", options: ["Мапа", "Транспорт", "Місця"], default: "Мапа" }],
    render: (v) => (
      <nav className="ds-builder-tabs" aria-label="Вкладки">
        {[
          { label: "Мапа", icon: "map" },
          { label: "Транспорт", icon: "directions_transit" },
          { label: "Місця", icon: "explore" },
        ].map((tab) => {
          const selected = tab.label === str(v, "active");
          return (
            <span key={tab.label} className="ds-builder-tab" aria-current={selected ? "page" : undefined}>
              <MaterialIcon name={tab.icon} size={22} filled={selected} />
              {tab.label}
            </span>
          );
        })}
      </nav>
    ),
    code: (v) => `<TabBar active="${str(v, "active")}" />`,
  },
  {
    id: "place-card",
    level: "organism",
    name: "Place card",
    description: "A result card: title, one line of context, and one primary action.",
    props: [
      { key: "title", label: "Title", kind: "text", default: "Кав’ярня на Вірменській" },
      { key: "subtitle", label: "Context", kind: "text", default: "Кафе · 1,2 км" },
      { key: "glass", label: "Glass", kind: "toggle", default: false },
    ],
    render: (v) => {
      const body = (
        <>
          <span className="ds-builder-card-title">{str(v, "title")}</span>
          <span className="ds-builder-card-sub">{str(v, "subtitle")}</span>
          <Button size="sm">Маршрут</Button>
        </>
      );
      return bool(v, "glass") ? (
        <Glass className="ds-builder-card">{body}</Glass>
      ) : (
        <div className="ds-builder-card ds-builder-card-opaque">{body}</div>
      );
    },
    code: (v) =>
      `<PlaceCard title="${str(v, "title")}" subtitle="${str(v, "subtitle")}" glass={${bool(v, "glass")}} />`,
  },
];

export const TEMPLATES: { id: "map" | "list"; name: string; description: string }[] = [
  { id: "map", name: "Map screen", description: "Map behind everything. Glass chrome floats over it." },
  { id: "list", name: "List screen", description: "Opaque background. Cards and bars sit on solid surfaces." },
];

export function blockById(id: string) {
  return BLOCKS.find((block) => block.id === id);
}

export function defaultValues(block: Block): Values {
  return Object.fromEntries(block.props.map((prop) => [prop.key, prop.default]));
}
