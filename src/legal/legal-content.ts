/**
 * Legal and trust pages (platform-plan §A6, slice S8). Drafts until counsel reviews them.
 * Operator details are not invented: every «[потрібно: …]» marker waits for decision D-D.
 */

export type LegalSlug = "terms" | "privacy" | "cookies" | "contacts" | "sources" | "accessibility";

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  items?: string[];
  links?: { label: string; href: string }[];
};

export type LegalPageContent = {
  title: string;
  summary: string;
  sections: LegalSection[];
};

/** Filled in from D-D. Until then the pages show these markers instead of guessing. */
export const OPERATOR = {
  name: "[потрібно: юридична назва оператора]",
  registration: "[потрібно: код ЄДРПОУ або РНОКПП]",
  address: "[потрібно: юридична адреса]",
  email: "[потрібно: email підтримки]",
  country: "[потрібно: країна реєстрації]",
};

export const LEGAL_UPDATED = "1 листопада 2026";

export const LEGAL_ORDER: LegalSlug[] = ["terms", "privacy", "cookies", "contacts", "sources", "accessibility"];

export const LEGAL_PAGES: Record<LegalSlug, LegalPageContent> = {
  terms: {
    title: "Умови користування",
    summary: "Що таке next, що він показує і за що ми не можемо відповідати.",
    sections: [
      {
        heading: "Сервіс",
        paragraphs: [
          `next — мапа Львова з транспортом, місцями й укриттями. Оператор: ${OPERATOR.name}, ${OPERATOR.registration}, ${OPERATOR.address}.`,
          "Користуватися мапою можна без облікового запису. Обліковий запис потрібен лише для сповіщень.",
        ],
      },
      {
        heading: "Дані на мапі",
        items: [
          "Позиції транспорту надходять із GPS-потоку перевізника й можуть запізнюватися або бути неточними.",
          "Час прибуття — оцінка за відстанню, а не офіційний розклад.",
          "Місця беруться з OpenStreetMap і можуть бути застарілими. Про помилку можна написати нам.",
          "Повітряна тривога показується за даними alerts.in.ua. Це не офіційна система оповіщення: завжди слухайте сирени й офіційні канали.",
        ],
      },
      {
        heading: "Обліковий запис",
        paragraphs: [
          "Ви відповідаєте за доступ до свого облікового запису. Видалити його можна будь-коли в Профілі → Обліковий запис.",
        ],
      },
      {
        heading: "Відповідальність",
        paragraphs: [
          "Сервіс надається «як є». Ми не відповідаємо за рішення, ухвалені лише на основі даних мапи, зокрема щодо безпеки під час тривоги.",
        ],
      },
      {
        heading: "Зміни",
        paragraphs: ["Про суттєві зміни умов ми повідомимо на сторінці «Що нового» до того, як вони почнуть діяти."],
      },
    ],
  },
  privacy: {
    title: "Політика конфіденційності",
    summary: "Які дані ми обробляємо, навіщо, як довго і хто ще їх бачить.",
    sections: [
      {
        heading: "Оператор даних",
        paragraphs: [`${OPERATOR.name}, ${OPERATOR.address}, ${OPERATOR.country}. Звернення щодо даних: ${OPERATOR.email}.`],
      },
      {
        heading: "Що ми обробляємо",
        items: [
          "Без облікового запису — нічого на нашому сервері. Профіль, збережені місця й тема лишаються на вашому пристрої.",
          "Геолокація використовується лише на пристрої, щоб показати транспорт і укриття поруч. Ми її не зберігаємо.",
          "Обліковий запис: email або ідентифікатор Telegram чи Google, дата створення.",
          "Сповіщення: адреса push-підписки браузера й вибрані теми.",
        ],
      },
      {
        heading: "Навіщо",
        items: [
          "Обліковий запис і push-підписка — щоб надсилати сповіщення, які ви ввімкнули (ваша згода).",
          "Технічні журнали сервера — щоб сервіс працював і був захищеним (законний інтерес).",
        ],
      },
      {
        heading: "Скільки зберігаємо",
        items: [
          "Обліковий запис і підписки — доки ви їх не видалите. Видалення облікового запису стирає і підписки.",
          "Технічні журнали — не довше, ніж зберігає їх хостинг-провайдер.",
        ],
      },
      {
        heading: "Хто обробляє дані разом із нами",
        items: [
          "Supabase — автентифікація й база даних.",
          "Vercel — хостинг сайту й сервера.",
          "Telegram і Google — лише якщо ви входите через них.",
          "Постачальники push-сповіщень вашого браузера (Apple, Google, Mozilla) — доставка сповіщень.",
          "OpenFreeMap — тайли мапи; ваш браузер звертається до них напряму.",
        ],
      },
      {
        heading: "Ваші права",
        paragraphs: [
          "Ви можете отримати копію своїх даних, виправити їх, видалити обліковий запис у застосунку або відкликати згоду, вимкнувши сповіщення. Скаргу можна подати Уповноваженому Верховної Ради України з прав людини.",
        ],
      },
    ],
  },
  cookies: {
    title: "Cookie та сховище браузера",
    summary: "Ми не використовуємо рекламних чи аналітичних cookie. Лише те, без чого сервіс не працює.",
    sections: [
      {
        heading: "Що зберігається на пристрої",
        items: [
          "Сесія входу (Supabase) — щоб ви лишалися в обліковому записі.",
          "Push-підписка — щоб браузер міг показувати сповіщення.",
          "Тема, профіль, збережені місця, вибраний розділ і проходження знайомства — щоб застосунок пам’ятав ваші налаштування.",
        ],
      },
      {
        heading: "Згода",
        paragraphs: [
          "Усе це необхідне для роботи функцій, які ви самі вмикаєте, тому окрема згода не потрібна. Стерти ці дані можна в Профілі → Дані на пристрої або в налаштуваннях браузера.",
        ],
      },
    ],
  },
  contacts: {
    title: "Контакти",
    summary: "Як зв’язатися з командою next.",
    sections: [
      {
        heading: "Оператор",
        items: [OPERATOR.name, OPERATOR.registration, OPERATOR.address, OPERATOR.country],
      },
      {
        heading: "Підтримка й помилки в даних",
        paragraphs: [`Пишіть на ${OPERATOR.email}. Якщо місце на мапі неправильне, додайте його назву й адресу.`],
      },
    ],
  },
  sources: {
    title: "Джерела даних",
    summary: "Звідки береться все, що ви бачите на мапі.",
    sections: [
      {
        heading: "Мапа й місця",
        items: [
          "© Учасники OpenStreetMap. Дані доступні за ліцензією Open Database License (ODbL).",
          "Тайли мапи: OpenFreeMap на основі OpenMapTiles.",
          "Рельєф: AWS Terrain Tiles і Mapzen.",
        ],
        links: [
          { label: "Авторські права OpenStreetMap", href: "https://www.openstreetmap.org/copyright" },
          { label: "OpenFreeMap", href: "https://openfreemap.org" },
        ],
      },
      {
        heading: "Транспорт",
        items: ["Позиції й розклад: GTFS і GTFS-Realtime Львова (track.ua-gis.com)."],
      },
      {
        heading: "Безпека",
        items: [
          "Повітряна тривога: alerts.in.ua. Це не офіційна система оповіщення.",
          "Укриття: відкриті дані Львівської міської ради.",
        ],
      },
      {
        heading: "Програмні бібліотеки",
        items: ["MapLibre GL JS (BSD-3-Clause)", "three.js (MIT)", "React (MIT)"],
      },
    ],
  },
  accessibility: {
    title: "Доступність",
    summary: "Ми прагнемо відповідати WCAG 2.2 рівня AA.",
    sections: [
      {
        heading: "Що вже зроблено",
        items: [
          "Усі елементи керування доступні з клавіатури й мають видимий фокус.",
          "Іконки без тексту мають підписи для екранних читачів.",
          "Анімації вимикаються, якщо в системі ввімкнено зменшення руху.",
          "Є світла й темна теми.",
        ],
      },
      {
        heading: "Відомі обмеження",
        items: [
          "Вибір об’єктів просто на мапі потребує миші або дотику; ті самі об’єкти доступні у списках.",
          "3D-моделі транспорту декоративні; дані про транспорт є в текстовому вигляді.",
        ],
      },
      {
        heading: "Повідомити про проблему",
        paragraphs: [`Напишіть на ${OPERATOR.email}. Ми відповімо протягом 10 робочих днів.`],
      },
    ],
  },
};

/** A page goes live once no «[потрібно: …]» marker is left in it (D-D). Development shows all of them. */
export const PUBLISHED_LEGAL: LegalSlug[] = LEGAL_ORDER.filter(
  (slug) => import.meta.env.DEV || !JSON.stringify(LEGAL_PAGES[slug]).includes("[потрібно:"),
);

export const isLegalSlug = (value: string): value is LegalSlug => (PUBLISHED_LEGAL as string[]).includes(value);
