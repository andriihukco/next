export type CityPlaceCategory =
  | "groceries"
  | "food"
  | "health"
  | "pets"
  | "education"
  | "parks"
  | "sports"
  | "culture"
  | "tourism"
  | "transport"
  | "finance"
  | "public"
  | "religion"
  | "shopping"
  | "nightlife"
  | "services"
  | "jobs"
  | "beauty"
  | "real-estate"
  | "stay"
  | "buildings"
  | "other"
  // New categories
  | "market"
  | "parking"
  | "fuel"
  | "charging-station"
  | "recycling"
  | "pharmacy"
  | "atm"
  | "post-office"
  | "library"
  | "car-wash"
  | "car-repair"
  | "tire-service"
  | "construction"
  | "hardware"
  | "flowers"
  | "veterinary"
  | "pet-shop"
  | "laundry"
  | "dry-cleaning"
  | "optician"
  | "dentist"
  | "fitness"
  | "yoga"
  | "dance"
  | "music-school"
  | "art-studio"
  | "playground"
  | "bicycle-rental"
  | "scooter-rental"
  | "car-rental"
  | "internet-cafe"
  | "copy-center"
  | "print-shop"
  | "photo-studio"
  | "shoe-repair"
  | "key-cutting"
  | "locksmith"
  | "waste-disposal"
  | "water-fountain"
  | "public-toilet"
  | "bicycle-parking"
  | "motorcycle-parking"
  | "bus-stop"
  | "tram-stop"
  | "taxi-stand"
  | "car-sharing";

export const CITY_PLACE_CATEGORY_COLORS: Record<CityPlaceCategory, string> = {
  groceries: "#d89418",
  food: "#d76543",
  health: "#c64757",
  pets: "#a855f7",
  education: "#6473bf",
  parks: "#208756",
  sports: "#2563eb",
  culture: "#9257a5",
  tourism: "#0891b2",
  transport: "#247bad",
  finance: "#15803d",
  public: "#475569",
  religion: "#7c3aed",
  shopping: "#db2777",
  nightlife: "#be185d",
  services: "#60776b",
  jobs: "#176f68",
  beauty: "#bd5681",
  "real-estate": "#7257a5",
  stay: "#5476a5",
  buildings: "#675984",
  other: "#64746b",
  // New categories
  market: "#e8794c",
  parking: "#6b7280",
  fuel: "#dc2626",
  "charging-station": "#059669",
  recycling: "#16a34a",
  pharmacy: "#0891b2",
  atm: "#7c3aed",
  "post-office": "#c2410c",
  library: "#4f46e5",
  "car-wash": "#0891b2",
  "car-repair": "#ea580c",
  "tire-service": "#ca8a04",
  construction: "#78716c",
  hardware: "#b45309",
  flowers: "#ec4899",
  veterinary: "#059669",
  "pet-shop": "#7c3aed",
  laundry: "#0ea5e9",
  "dry-cleaning": "#6366f1",
  optician: "#64748b",
  dentist: "#0891b2",
  fitness: "#7c3aed",
  yoga: "#d946ef",
  dance: "#f43f5e",
  "music-school": "#a855f7",
  "art-studio": "#ec4899",
  playground: "#16a34a",
  "bicycle-rental": "#0891b2",
  "scooter-rental": "#6366f1",
  "car-rental": "#dc2626",
  "internet-cafe": "#4f46e5",
  "copy-center": "#6b7280",
  "print-shop": "#78716c",
  "photo-studio": "#0891b2",
  "shoe-repair": "#b45309",
  "key-cutting": "#78716c",
  locksmith: "#ca8a04",
  "waste-disposal": "#6b7280",
  "water-fountain": "#0ea5e9",
  "public-toilet": "#6b7280",
  "bicycle-parking": "#16a34a",
  "motorcycle-parking": "#ca8a04",
  "bus-stop": "#247bad",
  "tram-stop": "#7c3aed",
  "taxi-stand": "#fbbf24",
  "car-sharing": "#6366f1",
};

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

const categoryLabels: Record<CityPlaceCategory, string> = {
  groceries: "Продукти",
  food: "Кафе та їжа",
  health: "Здоров’я",
  pets: "Для тварин",
  education: "Освіта",
  parks: "Парки",
  sports: "Спорт",
  culture: "Культура",
  tourism: "Туризм",
  transport: "Транспорт",
  finance: "Фінанси",
  public: "Міські служби",
  religion: "Релігія",
  shopping: "Покупки",
  nightlife: "Нічне життя",
  services: "Покупки й послуги",
  jobs: "Робота",
  beauty: "Краса",
  "real-estate": "Нерухомість",
  stay: "Готелі й житло",
  buildings: "Будівлі",
  other: "Інше",
  // New categories
  market: "Ринок-барахолка",
  parking: "Парковка",
  fuel: "АЗС",
  "charging-station": "Електрозарядка",
  recycling: "Збір вторсировини",
  pharmacy: "Аптека",
  atm: "Банкомат",
  "post-office": "Пошта",
  library: "Бібліотека",
  "car-wash": "Автомийка",
  "car-repair": "Автосервіс",
  "tire-service": "Шиномонтаж",
  construction: "Будівництво",
  hardware: "Будматеріали",
  flowers: "Квіти",
  veterinary: "Ветеринарія",
  "pet-shop": "Зоомагазин",
  laundry: "Пральня",
  "dry-cleaning": "Хімчистка",
  optician: "Оптика",
  dentist: "Стоматологія",
  fitness: "Фітнес",
  yoga: "Йога",
  dance: "Танці",
  "music-school": "Музична школа",
  "art-studio": "Художня студія",
  playground: "Дитячий майданчик",
  "bicycle-rental": "Прокат велосипедів",
  "scooter-rental": "Прокат самокатів",
  "car-rental": "Прокат авто",
  "internet-cafe": "Інтернет-кафе",
  "copy-center": "Копіювальний центр",
  "print-shop": "Друкарня",
  "photo-studio": "Фотостудія",
  "shoe-repair": "Ремонт взуття",
  "key-cutting": "Різка ключів",
  locksmith: "Слесар",
  "waste-disposal": "Сміттєзбір",
  "water-fountain": "Питний фонтан",
  "public-toilet": "Громадський туалет",
  "bicycle-parking": "Велопарковка",
  "motorcycle-parking": "Мотопарковка",
  "bus-stop": "Зупинка автобуса",
  "tram-stop": "Зупинка трамвая",
  "taxi-stand": "Таксі",
  "car-sharing": "Каршеринг",
};

const asText = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

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

function classify(properties: Record<string, unknown>): CityPlaceCategory {
  const category = asText(properties.class).toLocaleLowerCase("en");
  const subtype = asText(properties.subclass).toLocaleLowerCase("en");
  const value = `${category} ${subtype}`;

  // New specific categories - check these first for better classification
  if (/marketplace|flea_market|market.*stall|baraholka/.test(value)) {
    return "market";
  }
  if (/parking|parking_space|parking_entrance/.test(value)) {
    return "parking";
  }
  if (/fuel|gas_station|petrol_station|filling_station/.test(value)) {
    return "fuel";
  }
  if (/charging_station|ev_charging|electric_vehicle_charging/.test(value)) {
    return "charging-station";
  }
  if (/recycling|recycling_container|waste_disposal/.test(value)) {
    return "recycling";
  }
  if (/pharmacy|chemist|drugstore/.test(value)) {
    return "pharmacy";
  }
  if (/atm|cash_dispenser|cash_machine/.test(value)) {
    return "atm";
  }
  if (/post_office|post_office_branch/.test(value)) {
    return "post-office";
  }
  if (/library/.test(value)) {
    return "library";
  }
  if (/car_wash|automatic_car_wash|pressure_wash/.test(value)) {
    return "car-wash";
  }
  if (/car_repair|vehicle_repair|mechanic|garage/.test(value)) {
    return "car-repair";
  }
  if (/tire_repair|tyre_repair|tire_shop|tyre_shop/.test(value)) {
    return "tire-service";
  }
  if (/construction|construction_site|builder/.test(value)) {
    return "construction";
  }
  if (/doityourself|hardware|diy|hardware_store|building_materials/.test(value)) {
    return "hardware";
  }
  if (/florist|flower|flower_shop/.test(value)) {
    return "flowers";
  }
  if (/veterinary|veterinarian|vet/.test(value)) {
    return "veterinary";
  }
  if (/pet_shop|pet_store|animal_feed/.test(value)) {
    return "pet-shop";
  }
  if (/laundry|laundrette|self_service_laundry/.test(value)) {
    return "laundry";
  }
  if (/dry_cleaning|dry_cleaners/.test(value)) {
    return "dry-cleaning";
  }
  if (/optician|opticians|glasses/.test(value)) {
    return "optician";
  }
  if (/dentist|dental|dental_clinic|dental_hygienist/.test(value)) {
    return "dentist";
  }
  if (/fitness|fitness_centre|gym|personal_training/.test(value)) {
    return "fitness";
  }
  if (/yoga|yoga_studio|pilates/.test(value)) {
    return "yoga";
  }
  if (/dance|dance_school|dancing/.test(value)) {
    return "dance";
  }
  if (/music_school|music_teacher|music_lesson/.test(value)) {
    return "music-school";
  }
  if (/art_studio|art_school|painting/.test(value)) {
    return "art-studio";
  }
  if (/playground|play_area/.test(value)) {
    return "playground";
  }
  if (/bicycle_rental|bike_rental|rental.*bicycle/.test(value)) {
    return "bicycle-rental";
  }
  if (/scooter_rental|kick_scooter_rental|rental.*scooter/.test(value)) {
    return "scooter-rental";
  }
  if (/car_rental|rental.*car|vehicle_rental/.test(value)) {
    return "car-rental";
  }
  if (/internet_cafe|cyber_cafe|internet_cafe/.test(value)) {
    return "internet-cafe";
  }
  if (/copy_center|copy_shop|photocopy/.test(value)) {
    return "copy-center";
  }
  if (/print_shop|printing|printers/.test(value)) {
    return "print-shop";
  }
  if (/photo_studio|photography|photographer/.test(value)) {
    return "photo-studio";
  }
  if (/shoe_repair|cobbler|shoe_maker/.test(value)) {
    return "shoe-repair";
  }
  if (/key_cutting|key_cutter|locksmith|key_shop/.test(value)) {
    return "key-cutting";
  }
  if (/locksmith|locksmithing/.test(value)) {
    return "locksmith";
  }
  if (/waste_basket|waste_disposal|trash_can/.test(value)) {
    return "waste-disposal";
  }
  if (/drinking_water|water_fountain|fountain/.test(value)) {
    return "water-fountain";
  }
  if (/toilets|public_toilet|restroom/.test(value)) {
    return "public-toilet";
  }
  if (/bicycle_parking|bike_parking|bicycle_parking/.test(value)) {
    return "bicycle-parking";
  }
  if (/motorcycle_parking|motorbike_parking/.test(value)) {
    return "motorcycle-parking";
  }
  if (/bus_stop|bus_station|bus_platform/.test(value)) {
    return "bus-stop";
  }
  if (/tram_stop|tram_station|tram_platform/.test(value)) {
    return "tram-stop";
  }
  if (/taxi|taxi_stand|taxi_rank/.test(value)) {
    return "taxi-stand";
  }
  if (/car_sharing|carshare|car2go|zipcar/.test(value)) {
    return "car-sharing";
  }

  // Original classification logic
  if (
    /grocery|supermarket|convenience|greengrocer|bakery|butcher|deli|market/.test(
      value,
    )
  ) {
    return "groceries";
  }
  if (/(?:^|\s)pet(?:$|[_\s-])|animal_shelter|animal_boarding/.test(value)) {
    return "pets";
  }
  if (/(?:^|\s)(?:cafe|restaurant|fast_food|food|bar|pub|biergarten)(?:$|[_\s-])/.test(value)) {
    return "food";
  }
  if (/hospital|clinic|doctor|health/.test(value)) {
    return "health";
  }
  if (
    /school|kindergarten|college|university|adult_education|training/.test(
      value,
    )
  ) {
    return "education";
  }
  if (/(?:^|\s)parks?(?:$|[_\s-])|garden|recreation_ground/.test(value)) {
    return "parks";
  }
  if (/sports|sport|pitch|stadium|swimming_pool/.test(value)) {
    return "sports";
  }
  if (/nightclub|casino|gambling|adult|stripclub/.test(value)) {
    return "nightlife";
  }
  if (/tourism|viewpoint|tourist|attraction|zoo|theme_park|aquarium/.test(value)) {
    return "tourism";
  }
  if (/place_of_worship|church|mosque|synagogue|temple|religious/.test(value)) {
    return "religion";
  }
  if (/(?:^|\s)(?:bank|bureau_de_change|money_transfer|insurance|financial|credit_union|payment_terminal)(?:$|[_\s-])/.test(value)) {
    return "finance";
  }
  if (/government|townhall|courthouse|police|fire_station|embassy/.test(value)) {
    return "public";
  }
  if (/clothes|shoes|electronics|department_store|mall|jewelry|gift|books/.test(value)) {
    return "shopping";
  }
  if (/museum|gallery|theatre|cinema|arts|culture|historic/.test(value)) {
    return "culture";
  }
  if (/(?:^|\s)(?:bus|rail|station|transport)(?:$|[_\s-])/.test(value)) {
    return "transport";
  }
  if (/estate_agent|real_estate|real estate|property/.test(value)) {
    return "real-estate";
  }
  if (/employment|recruitment|career|job|coworking|staffing/.test(value)) {
    return "jobs";
  }
  if (/beauty|hairdresser|nail|massage|spa|cosmetic/.test(value)) {
    return "beauty";
  }
  if (/hotel|hostel|guest_house|accommodation|lodging/.test(value)) {
    return "stay";
  }
  if (/shop|office|service|post/.test(value)) return "services";
  return "other";
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
        [" wheelchair", properties.wheelchair],
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

export const cityPlaceCategories: {
  id: CityPlaceCategory;
  label: string;
}[] = [
  { id: "groceries", label: "Продукти" },
  { id: "food", label: "Кафе й їжа" },
  { id: "health", label: "Здоров’я" },
  { id: "pets", label: "Для тварин" },
  { id: "education", label: "Освіта" },
  { id: "parks", label: "Парки" },
  { id: "sports", label: "Спорт" },
  { id: "culture", label: "Культура" },
  { id: "tourism", label: "Туризм" },
  { id: "transport", label: "Транспорт" },
  { id: "finance", label: "Фінанси" },
  { id: "public", label: "Міські служби" },
  { id: "religion", label: "Релігія" },
  { id: "shopping", label: "Покупки" },
  { id: "nightlife", label: "Нічне життя" },
  { id: "services", label: "Послуги" },
  { id: "jobs", label: "Робота" },
  { id: "beauty", label: "Краса" },
  { id: "real-estate", label: "Нерухомість" },
  { id: "stay", label: "Житло" },
  { id: "other", label: "Інше" },
  // New categories
  { id: "market", label: "Ринок-барахолка" },
  { id: "parking", label: "Парковка" },
  { id: "fuel", label: "АЗС" },
  { id: "charging-station", label: "Електрозарядка" },
  { id: "recycling", label: "Збір вторсировини" },
  { id: "pharmacy", label: "Аптека" },
  { id: "atm", label: "Банкомат" },
  { id: "post-office", label: "Пошта" },
  { id: "library", label: "Бібліотека" },
  { id: "car-wash", label: "Автомийка" },
  { id: "car-repair", label: "Автосервіс" },
  { id: "tire-service", label: "Шиномонтаж" },
  { id: "construction", label: "Будівництво" },
  { id: "hardware", label: "Будматеріали" },
  { id: "flowers", label: "Квіти" },
  { id: "veterinary", label: "Ветеринарія" },
  { id: "pet-shop", label: "Зоомагазин" },
  { id: "laundry", label: "Пральня" },
  { id: "dry-cleaning", label: "Хімчистка" },
  { id: "optician", label: "Оптика" },
  { id: "dentist", label: "Стоматологія" },
  { id: "fitness", label: "Фітнес" },
  { id: "yoga", label: "Йога" },
  { id: "dance", label: "Танці" },
  { id: "music-school", label: "Музична школа" },
  { id: "art-studio", label: "Художня студія" },
  { id: "playground", label: "Дитячий майданчик" },
  { id: "bicycle-rental", label: "Прокат велосипедів" },
  { id: "scooter-rental", label: "Прокат самокатів" },
  { id: "car-rental", label: "Прокат авто" },
  { id: "internet-cafe", label: "Інтернет-кафе" },
  { id: "copy-center", label: "Копіювальний центр" },
  { id: "print-shop", label: "Друкарня" },
  { id: "photo-studio", label: "Фотостудія" },
  { id: "shoe-repair", label: "Ремонт взуття" },
  { id: "key-cutting", label: "Різка ключів" },
  { id: "locksmith", label: "Слесар" },
  { id: "waste-disposal", label: "Сміттєзбір" },
  { id: "water-fountain", label: "Питний фонтан" },
  { id: "public-toilet", label: "Громадський туалет" },
  { id: "bicycle-parking", label: "Велопарковка" },
  { id: "motorcycle-parking", label: "Мотопарковка" },
  { id: "bus-stop", label: "Зупинка автобуса" },
  { id: "tram-stop", label: "Зупинка трамвая" },
  { id: "taxi-stand", label: "Таксі" },
  { id: "car-sharing", label: "Каршеринг" },
];

export const cityPlaceIcons: Record<CityPlaceCategory, string> = {
  groceries: "grocery",
  food: "restaurant",
  health: "medical_services",
  pets: "pets",
  education: "school",
  parks: "park",
  sports: "sports_soccer",
  culture: "museum",
  tourism: "tour",
  transport: "directions_transit",
  finance: "account_balance",
  public: "account_balance",
  religion: "church",
  shopping: "shopping_bag",
  nightlife: "nightlife",
  services: "storefront",
  jobs: "work",
  beauty: "face_retouching_natural",
  "real-estate": "real_estate_agent",
  stay: "hotel",
  buildings: "apartment",
  other: "place",
  // New categories
  market: "store",
  parking: "local_parking",
  fuel: "local_gas_station",
  "charging-station": "ev_station",
  recycling: "recycling",
  pharmacy: "local_pharmacy",
  atm: "atm",
  "post-office": "local_post_office",
  library: "local_library",
  "car-wash": "local_car_wash",
  "car-repair": "build",
  "tire-service": "settings",
  construction: "construction",
  hardware: "handyman",
  flowers: "local_florist",
  veterinary: "veterinary",
  "pet-shop": "pets",
  laundry: "local_laundry_service",
  "dry-cleaning": "dry_cleaning",
  optician: "visibility",
  dentist: "clean_hands",
  fitness: "fitness_center",
  yoga: "self_improvement",
  dance: "music_note",
  "music-school": "music_note",
  "art-studio": "palette",
  playground: "child_care",
  "bicycle-rental": "pedal_bike",
  "scooter-rental": "electric_scooter",
  "car-rental": "directions_car",
  "internet-cafe": "wifi",
  "copy-center": "content_copy",
  "print-shop": "print",
  "photo-studio": "photo_camera",
  "shoe-repair": "engineering",
  "key-cutting": "vpn_key",
  locksmith: "lock",
  "waste-disposal": "delete",
  "water-fountain": "water_drop",
  "public-toilet": "wc",
  "bicycle-parking": "pedal_bike",
  "motorcycle-parking": "two_wheeler",
  "bus-stop": "directions_bus",
  "tram-stop": "tram",
  "taxi-stand": "local_taxi",
  "car-sharing": "directions_car",
};

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
