import {
  CITY_PLACE_CATEGORY_COLORS,
  cityPlaceCategories,
  cityPlaceCategoryLabels as categoryLabels,
  cityPlaceIcons,
  type CityPlaceCategory,
} from "./city-place-categories";
import { asText, classify } from "./city-place-classify";

// Category data lives in city-place-categories.ts; these names stay importable from here.
export { CITY_PLACE_CATEGORY_COLORS, cityPlaceCategories, cityPlaceIcons, type CityPlaceCategory };

export type CityPlace = {
  id: string;
  name: string;
  category: CityPlaceCategory;
  categoryLabel: string;
  lat: number;
  lng: number;
  address: string;
  details: Record<string, string>;
  imageUrl?: string;
  /** OSM height (or levels × 3.1 m) for building footprints. */
  heightMeters?: number;
  /** Outer ring of the building footprint as [lng, lat] pairs. */
  footprint?: [number, number][];
};

export type CityEducationKind =
  | "school"
  | "kindergarten"
  | "university"
  | "adult-course"
  | "library";

export function cityPlaceOsmUrl(place: Pick<CityPlace, "lat" | "lng">): string {
  return `https://www.openstreetmap.org/?mlat=${place.lat.toFixed(6)}&mlon=${place.lng.toFixed(6)}#map=18/${place.lat.toFixed(6)}/${place.lng.toFixed(6)}`;
}

export function cityEducationKind(
  place: Pick<CityPlace, "category" | "details">,
): CityEducationKind | null {
  if (place.category !== "education") return null;
  const type = (place.details["Тип"] ?? "")
    .toLocaleLowerCase("en")
    .replace(/[\s-]+/g, "_");

  if (/library/.test(type)) return "library";
  if (/kindergarten|preschool/.test(type)) return "kindergarten";
  if (/university|college/.test(type)) return "university";
  if (
    /language_school|driving_school|music_school|dance_school|arts_school|vocational_school|adult_education|training/.test(
      type,
    )
  ) {
    return "adult-course";
  }
  if (/(?:^|_)school(?:_|$)/.test(type)) return "school";
  return null;
}

type VectorPlaceFeature = {
  id?: number | string;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
};

function imageUrlFromProperties(
  properties: Record<string, unknown>,
): string | undefined {
  const image = asText(properties.image) || asText(properties["image:url"]);
  if (/^https:\/\//i.test(image)) return image;

  const commons = asText(properties.wikimedia_commons);
  if (/^https:\/\/commons\.wikimedia\.org\//i.test(commons)) return commons;
  if (/^(file|image):/i.test(commons)) {
    const filename = commons.replace(/^(file|image):/i, "").trim();
    if (filename) {
      return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=900`;
    }
  }
}

function coordinatesOf(feature: VectorPlaceFeature): [number, number] | null {
  if (feature.geometry?.type !== "Point") return null;
  const coordinates = feature.geometry.coordinates;
  if (
    !Array.isArray(coordinates) ||
    typeof coordinates[0] !== "number" ||
    typeof coordinates[1] !== "number"
  ) {
    return null;
  }
  return [coordinates[0], coordinates[1]];
}

export function cityPlacesFromMapFeatures(
  features: VectorPlaceFeature[],
): CityPlace[] {
  const places = new Map<string, CityPlace>();
  for (const feature of features) {
    const point = coordinatesOf(feature);
    const properties = feature.properties;
    if (!point || !properties) continue;
    const [lng, lat] = point;
    const category = classify(properties);
    const categoryLabel = categoryLabels[category];
    const name =
      asText(properties.name) ||
      asText(properties["name:nonlatin"]) ||
      asText(properties["name:latin"]) ||
      asText(properties.brand) ||
      asText(properties.operator);
    if (!name) continue;
    const id =
      feature.id === undefined
        ? `${category}-${name}-${lat.toFixed(5)}-${lng.toFixed(5)}`
        : `osm-${feature.id}`;
    const street =
      asText(properties["addr:street"]) ||
      asText(properties.street) ||
      asText(properties.address);
    const houseNumber =
      asText(properties["addr:housenumber"]) ||
      asText(properties.housenumber);
    const address = [street, houseNumber].filter(Boolean).join(", ");
    const details = Object.fromEntries(
      [
        ["Графік", properties.opening_hours],
        ["Телефон", properties.phone ?? properties["contact:phone"]],
        ["Сайт", properties.website ?? properties["contact:website"]],
        ["Email", properties.email ?? properties["contact:email"]],
        ["Кухня", properties.cuisine],
        ["Бренд", properties.brand],
        ["Оператор", properties.operator],
        ["Класи", properties.grades ?? properties["school:grades"]],
        ["Рівень освіти", properties["isced:level"]],
        ["Мова навчання", properties["school:language"]],
        ["Тип", properties.subclass ?? properties.class],
        ["Мобільний", properties.mobile ?? properties["contact:mobile"]],
        ["Wi-Fi", properties.internet_access ?? properties["internet_access:fee"]],
        ["Доступність", properties.wheelchair],
        ["Тераса", properties.outdoor_seating],
        ["З собою", properties.takeaway],
        ["Доставка", properties.delivery],
        ["Вегетаріанське", properties["diet:vegetarian"]],
        ["Оплата карткою", properties["payment:cards"] ?? properties["payment:visa"] ?? properties["payment:mastercard"]],
        ["Зірки", properties.stars],
        ["Опис", properties.description],
      ].map(([label, value]) => [label, asText(value)]).filter(([, value]) => value),
    );
    places.set(id, {
      id,
      name,
      category,
      categoryLabel,
      lat,
      lng,
      address: address || "",
      details,
      imageUrl: imageUrlFromProperties(properties),
    });
  }

  return [...places.values()].sort((left, right) =>
    left.name.localeCompare(right.name, "uk"),
  );
}

export function cityBuildingFromMapFeature(
  feature: VectorPlaceFeature,
): CityPlace | null {
  const geometry = feature.geometry;
  const properties = feature.properties;
  if (
    !geometry ||
    !properties ||
    (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") ||
    !Array.isArray(geometry.coordinates)
  ) {
    return null;
  }

  const polygon =
    geometry.type === "Polygon"
      ? geometry.coordinates
      : geometry.coordinates[0];
  const ring =
    Array.isArray(polygon) && Array.isArray(polygon[0])
      ? polygon[0]
      : polygon;
  if (!Array.isArray(ring)) return null;
  const points = ring.filter(
    (point): point is [number, number] =>
      Array.isArray(point) &&
      typeof point[0] === "number" &&
      typeof point[1] === "number",
  );
  if (!points.length) return null;
  const [lng, lat] = points.reduce(
    ([sumLng, sumLat], point) => [sumLng + point[0], sumLat + point[1]],
    [0, 0],
  ).map((value) => value / points.length) as [number, number];
  const name =
    asText(properties.name) ||
    asText(properties["name:nonlatin"]) ||
    asText(properties["name:latin"]) ||
    "Будівля без назви";
  const address = [
    asText(properties["addr:street"]) || asText(properties.street),
    asText(properties["addr:housenumber"]) || asText(properties.housenumber),
  ]
    .filter(Boolean)
    .join(", ");
  const details = Object.fromEntries(
    [
      ["Призначення", properties.building],
      ["Поверхи", properties["building:levels"]],
      ["Висота", properties.height ?? properties.render_height],
      ["Матеріал", properties["building:material"]],
    ]
      .map(([label, value]) => [label, asText(value)])
      .filter(([, value]) => value),
  );

  const rawHeight = Number.parseFloat(
    String(properties.height ?? properties.render_height ?? ""),
  );
  const levels = Number.parseFloat(String(properties["building:levels"] ?? ""));
  const heightMeters =
    Number.isFinite(rawHeight) && rawHeight > 0
      ? rawHeight
      : Number.isFinite(levels) && levels > 0
        ? levels * 3.1
        : undefined;

  return {
    id: `building-${feature.id ?? `${lat.toFixed(5)}-${lng.toFixed(5)}`}`,
    name,
    category: "buildings",
    categoryLabel: categoryLabels.buildings,
    lat,
    lng,
    address: address || "",
    details,
    heightMeters,
    footprint: points.length > 2 ? points : undefined,
  };
}

/**
 * Format opening hours from OSM format to readable Ukrainian
 * Handles formats like: "Mo-Fr 09:00-18:00", "24/7", "Mo-Su 00:00-24:00"
 */
export function formatOpeningHours(hours: string): string {
  if (!hours) return "";

  // Handle 24/7
  if (hours === "24/7" || hours === "Mo-Su 00:00-24:00") {
    return "Цілодобово";
  }

  // Day mapping
  const dayMap: Record<string, string> = {
    Mo: "Пн",
    Tu: "Вт",
    We: "Ср",
    Th: "Чт",
    Fr: "Пт",
    Sa: "Сб",
    Su: "Нд",
  };

  // Parse the opening hours
  const parts = hours.split(";").map((p) => p.trim());
  const formatted: string[] = [];

  for (const part of parts) {
    // Match pattern like "Mo-Fr 09:00-18:00" or "Mo 09:00-18:00"
    const match = part.match(/^([A-Za-z]{2}(?:-[A-Za-z]{2})?)\s+(\d{2}:\d{2})-(\d{2}:\d{2})(?:;\s*(\d{2}:\d{2})-(\d{2}:\d{2}))?$/);

    if (match) {
      const [, days, startTime, endTime, breakStart, breakEnd] = match;

      // Format days
      let formattedDays = "";
      if (days.includes("-")) {
        const [start, end] = days.split("-");
        formattedDays = `${dayMap[start]}-${dayMap[end]}`;
      } else {
        formattedDays = dayMap[days] || days;
      }

      // Format time
      const formatTime = (time: string) => {
        const [h, m] = time.split(":");
        return `${h}:${m}`;
      };

      let timeStr = `${formatTime(startTime)}-${formatTime(endTime)}`;

      // Add break time if exists
      if (breakStart && breakEnd) {
        timeStr += `, перерва ${formatTime(breakStart)}-${formatTime(breakEnd)}`;
      }

      formatted.push(`${formattedDays}: ${timeStr}`);
    } else {
      // If we can't parse it, return as-is
      formatted.push(part);
    }
  }

  return formatted.join("; ");
}
