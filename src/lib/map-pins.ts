/** Map pin images for city places, drawn once on a canvas and reused by the symbol layer. */
import { resolveColor } from "./design-colors";
import { FILLED_ICON_FAMILY, loadFilledIconFont } from "./material-symbols-filled";
import { CITY_PLACE_CATEGORY_COLORS, cityPlaceIcons, type CityPlaceCategory } from "./city-places";

export const pinImageId = (category: string, active = false): string =>
  active ? `wayme-place-${category}-active` : `wayme-place-${category}`;

// Active pins draw the filled glyph; the rest draw the outlined one.
export const cityPlacePinImage = async (
  category: CityPlaceCategory,
  active = false,
): Promise<ImageData> => {
  const iconName = cityPlaceIcons[category];
  const filled = active && (await loadFilledIconFont());
  const family = filled ? FILLED_ICON_FAMILY : "Material Symbols Rounded";
  const font = `500 18px "${family}"`;
  await document.fonts.load(font, iconName);
  if (!document.fonts.check(font, iconName)) {
    throw new Error("The Material Symbols font is not available.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 80;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the map pin canvas.");
  context.scale(2, 2);
  const pin = new Path2D(
    "M16 1C7.7 1 1 7.6 1 15.8 1 26.4 16 39 16 39s15-12.6 15-23.2C31 7.6 24.3 1 16 1Z",
  );
  context.fillStyle = resolveColor(CITY_PLACE_CATEGORY_COLORS[category]);
  context.strokeStyle = resolveColor("var(--card)");
  context.lineWidth = 1.5;
  context.fill(pin);
  context.stroke(pin);
  context.font = font;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = resolveColor("var(--card)");
  context.fillText(iconName, 16, 16);
  return context.getImageData(0, 0, canvas.width, canvas.height);
};

/** A DOM pin for a place opened from a list. Only one is shown at a time. */
export function createPlaceMarker(placeName: string, color: string): HTMLElement {
  const markerElement = document.createElement("span");
  markerElement.className = "city-map-pin";
  markerElement.style.setProperty("--pin-color", color);
  markerElement.setAttribute("role", "img");
  markerElement.setAttribute("aria-label", placeName);
  const markerIcon = document.createElement("span");
  markerIcon.className = "material-symbols-rounded";
  markerIcon.textContent = "place";
  markerElement.append(markerIcon);
  return markerElement;
}
