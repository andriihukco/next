import { SERVICES_ENABLED } from "../lib/features";

/** Primary actions per entity kind (DESIGN.md §7). Labels and icons only; the flows live in entity-flows.tsx. */

export type EntityFlow =
  | "order"
  | "table"
  | "room"
  | "appointment"
  | "tickets"
  | "apply"
  | "viewing"
  | "catalog";

export type MenuItem = { id: string; name: string; description: string; price: number };

type FlowSpec = { flow: EntityFlow; label: string; icon: string; title: string };

export const FLOWS: Record<EntityFlow, FlowSpec> = {
  order: { flow: "order", label: "Замовити", icon: "shopping_bag", title: "Замовлення" },
  table: { flow: "table", label: "Столик", icon: "table_restaurant", title: "Бронювання столика" },
  room: { flow: "room", label: "Номер", icon: "hotel", title: "Бронювання номера" },
  appointment: { flow: "appointment", label: "Записатися", icon: "event_available", title: "Запис" },
  tickets: { flow: "tickets", label: "Квитки", icon: "confirmation_number", title: "Квитки" },
  apply: { flow: "apply", label: "Відгукнутися", icon: "send", title: "Відгук на вакансію" },
  viewing: { flow: "viewing", label: "Перегляд", icon: "calendar_month", title: "Запис на перегляд" },
  catalog: { flow: "catalog", label: "Каталог", icon: "menu_book", title: "Каталог" },
};

/** Which flows an entity offers, primary first. Unknown kinds, or no services, get directions only. */
export function flowsForKind(kind: string): EntityFlow[] {
  if (!SERVICES_ENABLED) return [];
  switch (kind) {
    case "food":
      return ["order", "table"];
    case "groceries":
    case "flowers":
    case "pharmacy":
      return ["order"];
    case "stay":
      return ["room"];
    case "health":
    case "beauty":
    case "veterinary":
    case "car-repair":
    case "car-wash":
    case "tire-service":
    case "service":
      return ["appointment"];
    case "culture":
    case "tourism":
    case "sports":
    case "event":
      return ["tickets"];
    case "job":
      return ["apply"];
    case "home":
      return ["viewing"];
    case "library":
    case "education":
      return ["catalog"];
    default:
      return [];
  }
}
