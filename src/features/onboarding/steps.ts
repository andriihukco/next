export type OnboardingView = "city" | "map";

export type OnboardingStep = {
  /** Value of the `data-tour` attribute the spotlight anchors to. */
  target: string;
  /** View the app switches to so the target is mounted. */
  view: OnboardingView;
  icon: string;
  title: string;
  body: string;
};

// Every target must exist in the rendered UI (DESIGN.md §10). If one is
// missing at runtime the card still shows, centered, without a spotlight.
export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    target: "city-sections",
    view: "city",
    icon: "explore",
    title: "Місто в одному місці",
    body: "Перемикайтеся між транспортом, місцями, освітою та міськими послугами.",
  },
  {
    target: "place-search",
    view: "city",
    icon: "search",
    title: "Знаходьте потрібне поруч",
    body: "Шукайте маршрут, адресу чи заклад у відкритому розділі.",
  },
  {
    target: "city-events",
    view: "city",
    icon: "event",
    title: "Плануйте наперед",
    body: "В афіші зібрані події Львова — відкрийте деталі та місце проведення.",
  },
  {
    target: "map-controls",
    view: "map",
    icon: "3d_rotation",
    title: "Керуйте мапою",
    body: "Змінюйте масштаб і обертайте карту. Перемикач 2D повертає вигляд строго зверху.",
  },
  {
    target: "map-location",
    view: "map",
    icon: "my_location",
    title: "Ваше місце — за бажанням",
    body: "Знайдіть себе на мапі, щоб швидше зорієнтуватися. Доступ до геолокації можна не надавати.",
  },
];

export const WELCOME_FEATURES = [
  {
    id: "transport",
    icon: "directions_transit",
    label: "Транспорт",
    detail:
      "Трамваї, тролейбуси й автобуси на мапі за живими GPS-даними. Час прибуття — оцінка за відстанню.",
  },
  {
    id: "places",
    icon: "explore",
    label: "Місця",
    detail: "Кав’ярні, парки, музеї та інші місця поруч — з відкритих даних OpenStreetMap.",
  },
  {
    id: "events",
    icon: "event",
    label: "Події",
    detail: "Афіша з датою, місцем і дорогою туди. Поки що це демо-події.",
  },
] as const;

export const PROFILE_QUESTIONS = [
  {
    id: "heardAboutUs",
    legend: "Як ви дізналися про нас?",
    options: ["Соцмережі", "Порада друзів", "Пошук в інтернеті", "Інше"],
  },
  {
    id: "visitorType",
    legend: "Що найкраще описує вас?",
    options: ["Місцевий житель", "Студент", "Турист", "Працюю у Львові", "Інше"],
  },
] as const;

export type OnboardingProfile = Record<(typeof PROFILE_QUESTIONS)[number]["id"], string>;
