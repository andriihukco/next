// Demo data from src/features/super-app/demo-data.ts (web). Prices and times are demo values.
export type DemoStore = { id: string; name: string; kind: string; address: string; hours: string; eta: string };
export type DemoItem = { id: string; name: string; unit: string; price: number };

export const GROCERY_STORES: DemoStore[] = [
  { id: "g-central", name: "Магазин «Центральний»", kind: "Продукти", address: "вул. Городоцька, 40", hours: "08:00–23:00", eta: "20–30 хв" },
  { id: "g-market", name: "Крамниця «Ринок»", kind: "Продукти", address: "пл. Ринок, 1", hours: "09:00–22:00", eta: "30–40 хв" },
];

export const GROCERY_CATALOG: DemoItem[] = [
  { id: "milk", name: "Молоко 2,5%", unit: "1 л", price: 42 },
  { id: "bread", name: "Хліб житній", unit: "400 г", price: 36 },
  { id: "eggs", name: "Яйця курячі", unit: "10 шт", price: 98 },
  { id: "apples", name: "Яблука", unit: "1 кг", price: 64 },
  { id: "tomatoes", name: "Томати", unit: "500 г", price: 58 },
  { id: "cheese", name: "Сир твердий", unit: "200 г", price: 129 },
  { id: "water", name: "Вода мінеральна", unit: "1,5 л", price: 24 },
  { id: "coffee", name: "Кава мелена", unit: "250 г", price: 189 },
];

export const RESTAURANTS: DemoStore[] = [
  { id: "r-sonce", name: "Бістро «Сонце»", kind: "Українська кухня", address: "вул. Руська, 12", hours: "10:00–23:00", eta: "30–40 хв" },
  { id: "r-pasta", name: "Тратторія «Демо»", kind: "Італійська кухня", address: "пл. Митна, 3", hours: "11:00–24:00", eta: "35–45 хв" },
  { id: "r-sushi", name: "Суші-бар «Хвиля»", kind: "Японська кухня", address: "просп. Свободи, 28", hours: "12:00–23:00", eta: "40–50 хв" },
];

export const MENUS: Record<string, DemoItem[]> = {
  "r-sonce": [
    { id: "borsch", name: "Борщ з пампушками", unit: "400 г", price: 165 },
    { id: "varenyky", name: "Вареники з картоплею", unit: "300 г", price: 139 },
    { id: "salo-plate", name: "Тарілка сала", unit: "250 г", price: 210 },
    { id: "kompot", name: "Узвар", unit: "400 мл", price: 60 },
  ],
  "r-pasta": [
    { id: "carbonara", name: "Карбонара", unit: "320 г", price: 189 },
    { id: "margherita", name: "Піца Маргарита", unit: "30 см", price: 175 },
    { id: "tiramisu", name: "Тірамісу", unit: "150 г", price: 119 },
    { id: "lemonade", name: "Лимонад домашній", unit: "400 мл", price: 85 },
  ],
  "r-sushi": [
    { id: "philadelphia", name: "Філадельфія", unit: "8 шт", price: 240 },
    { id: "tempura", name: "Темпура з креветкою", unit: "6 шт", price: 185 },
    { id: "miso", name: "Місо-суп", unit: "300 мл", price: 95 },
    { id: "matcha", name: "Матча латте", unit: "350 мл", price: 110 },
  ],
};
