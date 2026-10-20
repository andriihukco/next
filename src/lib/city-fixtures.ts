export type CityEvent = {
  id: string;
  day: string;
  month: string;
  time: string;
  name: string;
  venue: string;
  summary: string;
  category: string;
  coordinates: [number, number];
};

export type CityDirectoryListing = {
  id: string;
  name: string;
  category: string;
  summary: string;
  details: string;
  location: string;
  organization?: string;
  coordinates: [number, number];
};

export const cityServiceListings: CityDirectoryListing[] = [
  {
    id: "service-beauty-demo",
    name: "Студія краси · демо",
    category: "beauty",
    summary: "Приклад послуг догляду та краси",
    details: "Манікюр · зачіски · попередній запис",
    location: "Центр Львова · демолокація",
    coordinates: [24.0297, 49.8397],
  },
  {
    id: "service-dry-cleaning-demo",
    name: "Хімчистка · демо",
    category: "dry-cleaning",
    summary: "Приклад чистки одягу та домашнього текстилю",
    details: "Приймання речей · терміни й ціни потребують перевірки",
    location: "Галицький район · демолокація",
    coordinates: [24.0351, 49.8408],
  },
  {
    id: "service-plumbing-demo",
    name: "Майстер-сантехнік · демо",
    category: "plumbing",
    summary: "Приклад побутового ремонту сантехніки",
    details: "Виїзд майстра · умови потребують перевірки",
    location: "Франківський район · демолокація",
    coordinates: [24.0125, 49.8238],
  },
  {
    id: "service-repair-demo",
    name: "Майстерня ремонту · демо",
    category: "repair",
    summary: "Приклад ремонту дрібної побутової техніки",
    details: "Діагностика · ремонт за погодженням",
    location: "Залізничний район · демолокація",
    coordinates: [23.9942, 49.8384],
  },
  {
    id: "service-cleaning-demo",
    name: "Прибирання оселі · демо",
    category: "cleaning",
    summary: "Приклад послуг прибирання",
    details: "Разове або регулярне · умови потребують перевірки",
    location: "Личаківський район · демолокація",
    coordinates: [24.0552, 49.8395],
  },
];

export const cityJobListings: CityDirectoryListing[] = [
  {
    id: "job-developer-demo",
    name: "Розробник / розробниця · демо",
    category: "technology",
    summary: "Приклад вакансії від місцевої IT-команди",
    details: "Повна зайнятість · формат роботи уточнюється",
    location: "Львів · приклад оголошення",
    organization: "Львівська IT-студія · демо",
    coordinates: [24.026, 49.834],
  },
  {
    id: "job-barista-demo",
    name: "Бариста · демо",
    category: "hospitality",
    summary: "Приклад вакансії у сфері гостинності",
    details: "Змінний графік · досвід буде перевагою",
    location: "Центр Львова · приклад оголошення",
    organization: "Міська кав’ярня · демо",
    coordinates: [24.031, 49.842],
  },
  {
    id: "job-sales-demo",
    name: "Консультант магазину · демо",
    category: "retail",
    summary: "Приклад вакансії в роздрібній торгівлі",
    details: "Повна або часткова зайнятість · умови уточнюються",
    location: "Львів · приклад оголошення",
    organization: "Локальна крамниця · демо",
    coordinates: [24.045, 49.831],
  },
  {
    id: "job-teacher-demo",
    name: "Викладач курсів · демо",
    category: "education",
    summary: "Приклад вакансії для освітнього проєкту",
    details: "Гнучкий графік · напрям викладання уточнюється",
    location: "Львів · приклад оголошення",
    organization: "Навчальний центр · демо",
    coordinates: [24.019, 49.846],
  },
];

export const cityRealEstateListings: CityDirectoryListing[] = [
  {
    id: "property-rent-demo",
    name: "Квартира в оренду · демо",
    category: "rent",
    summary: "Приклад оголошення про довгострокову оренду",
    details: "2 кімнати · 54 м² · ціна не вказана",
    location: "Франківський район · демолокація",
    coordinates: [24.012, 49.823],
  },
  {
    id: "property-sale-demo",
    name: "Квартира на продаж · демо",
    category: "sale",
    summary: "Приклад оголошення про продаж житла",
    details: "1 кімната · 42 м² · ціна не вказана",
    location: "Личаківський район · демолокація",
    coordinates: [24.051, 49.84],
  },
  {
    id: "property-commercial-demo",
    name: "Комерційне приміщення · демо",
    category: "commercial",
    summary: "Приклад оголошення для бізнесу",
    details: "Перший поверх · площа й умови не вказані",
    location: "Галицький район · демолокація",
    coordinates: [24.033, 49.839],
  },
  {
    id: "property-house-demo",
    name: "Приватний будинок · демо",
    category: "private",
    summary: "Приклад оголошення про приватне житло",
    details: "Будинок із подвір’ям · ціна не вказана",
    location: "Околиці Львова · демолокація",
    coordinates: [24.081, 49.846],
  },
];

export const cityEvents: CityEvent[] = [
  {
    id: "event-market",
    day: "18",
    month: "ЖОВ",
    time: "10:00–14:00",
    name: "Сусідський ярмарок вихідного дня",
    venue: "Площа Ринок",
    summary: "Локальні майстри, сезонні смаколики та обмін книжками.",
    category: "Для родини",
    coordinates: [24.0314, 49.8419],
  },
  {
    id: "event-reading",
    day: "19",
    month: "ЖОВ",
    time: "12:00",
    name: "Читаємо разом у парку",
    venue: "Парк «Зелений гай»",
    summary: "Неформальне читання для дітей 4–10 років. Участь вільна.",
    category: "Діти",
    coordinates: [24.0217, 49.8432],
  },
  {
    id: "event-repair",
    day: "22",
    month: "ЖОВ",
    time: "18:30",
    name: "Відкрита зустріч мешканців",
    venue: "Бібліотека на Князя Романа",
    summary: "Обговоримо дворове освітлення та безпечні маршрути до школи.",
    category: "Зустріч",
    coordinates: [24.0275, 49.8375],
  },
];
