import { CITY_PLACE_CATEGORY_COLORS } from "../../lib/city-places";

/**
 * The services hub registry. Each entry opens its own flow (see
 * docs/super-app-ia.md §4). Colors come from the category palette so the
 * services match the place categories on the map (DESIGN.md §7).
 */
export type ServiceId =
  "groceries" | "delivery" | "restaurants" | "doctors" | "cinema" | "gyms" | "taxi";

export type ServiceDefinition = {
  id: ServiceId;
  label: string;
  description: string;
  icon: string;
  color: string;
};

export const SERVICES: readonly ServiceDefinition[] = [
  {
    id: "groceries",
    label: "Продукти",
    description: "Товари в кошик: самовивіз або доставка",
    icon: "shopping_basket",
    color: CITY_PLACE_CATEGORY_COLORS.groceries,
  },
  {
    id: "delivery",
    label: "Доставка",
    description: "Меню закладів з доставкою або самовивозом",
    icon: "delivery_dining",
    color: CITY_PLACE_CATEGORY_COLORS.market,
  },
  {
    id: "restaurants",
    label: "Ресторани",
    description: "Столик на дату й час, передзамовлення",
    icon: "restaurant",
    color: CITY_PLACE_CATEGORY_COLORS.food,
  },
  {
    id: "doctors",
    label: "Лікарі",
    description: "Запис до лікаря на вільний час",
    icon: "stethoscope",
    color: CITY_PLACE_CATEGORY_COLORS.health,
  },
  {
    id: "cinema",
    label: "Кіно",
    description: "Сеанс, місця в залі, квитки",
    icon: "movie",
    color: CITY_PLACE_CATEGORY_COLORS.culture,
  },
  {
    id: "gyms",
    label: "Спортзали",
    description: "Абонемент у зал на місяць або рік",
    icon: "fitness_center",
    color: CITY_PLACE_CATEGORY_COLORS.sports,
  },
  {
    id: "taxi",
    label: "Таксі",
    description: "Маршрут, клас авто, оцінка вартості",
    icon: "local_taxi",
    color: CITY_PLACE_CATEGORY_COLORS.transport,
  },
];
