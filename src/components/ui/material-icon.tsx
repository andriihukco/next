type MaterialIconProps = {
  name: string;
  size?: number;
  className?: string;
  /** Filled glyph. Use only for the selected/active state (DESIGN.md §6). */
  filled?: boolean;
};

type SemanticIconProps = {
  size?: number;
  className?: string;
  fill?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean | "true" | "false";
};

export function MaterialIcon({
  name,
  size = 20,
  className,
  filled = false,
}: MaterialIconProps) {
  return (
    <span
      aria-hidden="true"
      className={["material-symbols-rounded", filled && "is-filled", className].filter(Boolean).join(" ")}
      style={{ fontSize: size }}
    >
      {name}
    </span>
  );
}

const icon = (name: string) =>
  function SemanticMaterialIcon({ size, className }: SemanticIconProps) {
    return <MaterialIcon name={name} size={size} className={className} />;
  };

export const Accessibility = icon("accessible");
export const ArrowDown = icon("keyboard_arrow_down");
export const ArrowLeft = icon("keyboard_arrow_left");
export const ArrowRight = icon("keyboard_arrow_right");
export const ArrowUp = icon("keyboard_arrow_up");
export const ArrowUpRight = icon("north_east");
export const Bus = icon("directions_bus");
export const Build = icon("build");
export const CalendarDays = icon("calendar_month");
export const ChevronRight = icon("chevron_right");
export const CircleGauge = icon("speed");
export const Clock3 = icon("schedule");
export const Compass = icon("explore");
export const ContentCopy = icon("content_copy");
export const Crosshair = icon("my_location");
export const Heart = icon("favorite");
export const LocateFixed = icon("my_location");
export const MapPin = icon("location_on");
export const MessageCircle = icon("chat_bubble");
export const Navigation = icon("navigation");
export const Plus = icon("add");
export const RotateCcw = icon("rotate_left");
export const RotateCw = icon("rotate_right");
export const Search = icon("search");
export const Send = icon("send");
export const Star = icon("star");
export const Sun = icon("sunny");
export const TriangleAlert = icon("warning");
export const UserRound = icon("person");
export const Users = icon("groups");
export const Wifi = icon("wifi");
export const Wind = icon("air");
export const X = icon("close");
export const ZoomIn = icon("zoom_in");
export const ZoomOut = icon("zoom_out");
