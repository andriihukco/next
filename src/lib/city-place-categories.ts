/** Place categories: the id union, labels, colors (design tokens), icons, and the picker order. */

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
  groceries: "var(--category-groceries)",
  food: "var(--category-food)",
  health: "var(--category-health)",
  pets: "var(--category-pets)",
  education: "var(--category-education)",
  parks: "var(--category-parks)",
  sports: "var(--category-sports)",
  culture: "var(--category-culture)",
  tourism: "var(--category-tourism)",
  transport: "var(--category-transport)",
  finance: "var(--category-finance)",
  public: "var(--category-public)",
  religion: "var(--category-religion)",
  shopping: "var(--category-shopping)",
  nightlife: "var(--category-nightlife)",
  services: "var(--category-services)",
  jobs: "var(--category-jobs)",
  beauty: "var(--category-beauty)",
  "real-estate": "var(--category-real-estate)",
  stay: "var(--category-stay)",
  buildings: "var(--category-buildings)",
  other: "var(--category-other)",
  // New categories
  market: "var(--category-market)",
  parking: "var(--category-parking)",
  fuel: "var(--category-fuel)",
  "charging-station": "var(--category-charging-station)",
  recycling: "var(--category-recycling)",
  pharmacy: "var(--category-pharmacy)",
  atm: "var(--category-atm)",
  "post-office": "var(--category-post-office)",
  library: "var(--category-library)",
  "car-wash": "var(--category-car-wash)",
  "car-repair": "var(--category-car-repair)",
  "tire-service": "var(--category-tire-service)",
  construction: "var(--category-construction)",
  hardware: "var(--category-hardware)",
  flowers: "var(--category-flowers)",
  veterinary: "var(--category-veterinary)",
  "pet-shop": "var(--category-pet-shop)",
  laundry: "var(--category-laundry)",
  "dry-cleaning": "var(--category-dry-cleaning)",
  optician: "var(--category-optician)",
  dentist: "var(--category-dentist)",
  fitness: "var(--category-fitness)",
  yoga: "var(--category-yoga)",
  dance: "var(--category-dance)",
  "music-school": "var(--category-music-school)",
  "art-studio": "var(--category-art-studio)",
  playground: "var(--category-playground)",
  "bicycle-rental": "var(--category-bicycle-rental)",
  "scooter-rental": "var(--category-scooter-rental)",
  "car-rental": "var(--category-car-rental)",
  "internet-cafe": "var(--category-internet-cafe)",
  "copy-center": "var(--category-copy-center)",
  "print-shop": "var(--category-print-shop)",
  "photo-studio": "var(--category-photo-studio)",
  "shoe-repair": "var(--category-shoe-repair)",
  "key-cutting": "var(--category-key-cutting)",
  locksmith: "var(--category-locksmith)",
  "waste-disposal": "var(--category-waste-disposal)",
  "water-fountain": "var(--category-water-fountain)",
  "public-toilet": "var(--category-public-toilet)",
  "bicycle-parking": "var(--category-bicycle-parking)",
  "motorcycle-parking": "var(--category-motorcycle-parking)",
  "bus-stop": "var(--category-bus-stop)",
  "tram-stop": "var(--category-tram-stop)",
  "taxi-stand": "var(--category-taxi-stand)",
  "car-sharing": "var(--category-car-sharing)",
};

export const cityPlaceCategoryLabels: Record<CityPlaceCategory, string> = {
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

/** Groups are the unit of map clustering and bulk show/hide (DESIGN.md §5, map layers). */
export const CITY_PLACE_GROUP_OTHER = "other";

/**
 * Groups for the places picker (Google Maps "Directory" style): pick a group, then a
 * category inside it. Every category belongs to one group; anything not listed is «Інше».
 */
export const cityPlaceGroups: { id: string; label: string; icon: string; categories: CityPlaceCategory[] }[] = [
  { id: "eat", label: "Їжа", icon: "restaurant", categories: ["food", "groceries", "nightlife", "market"] },
  {
    id: "shop",
    label: "Покупки",
    icon: "shopping_bag",
    categories: ["shopping", "flowers", "hardware", "pet-shop", "optician", "construction"],
  },
  {
    id: "health",
    label: "Здоров’я й краса",
    icon: "favorite",
    categories: ["health", "pharmacy", "dentist", "beauty", "veterinary", "fitness", "yoga"],
  },
  {
    id: "leisure",
    label: "Дозвілля",
    icon: "local_activity",
    categories: ["culture", "tourism", "parks", "sports", "dance", "playground", "stay", "religion"],
  },
  {
    id: "auto",
    label: "Авто й рух",
    icon: "directions_car",
    categories: [
      "transport", "parking", "fuel", "charging-station", "car-wash", "car-repair", "tire-service",
      "car-rental", "car-sharing", "bicycle-rental", "scooter-rental", "bicycle-parking",
      "motorcycle-parking", "taxi-stand", "bus-stop", "tram-stop",
    ],
  },
  {
    id: "services",
    label: "Послуги",
    icon: "storefront",
    categories: [
      "services", "finance", "atm", "post-office", "laundry", "dry-cleaning", "copy-center",
      "print-shop", "photo-studio", "shoe-repair", "key-cutting", "locksmith", "internet-cafe",
      "real-estate", "jobs",
    ],
  },
  {
    id: "learn",
    label: "Навчання",
    icon: "school",
    categories: ["education", "library", "music-school", "art-studio"],
  },
  { id: CITY_PLACE_GROUP_OTHER, label: "Інше", icon: "more_horiz", categories: [] },
];

export function cityPlaceGroupOf(category: CityPlaceCategory): string {
  return cityPlaceGroups.find((group) => group.categories.includes(category))?.id ?? CITY_PLACE_GROUP_OTHER;
}

/** Every category in a group, in list order. Categories no group names fall into «Інше». */
export function cityPlaceGroupCategories(groupId: string): { id: CityPlaceCategory; label: string }[] {
  return cityPlaceCategories.filter((category) => cityPlaceGroupOf(category.id) === groupId);
}
