import { CATEGORY_COLORS } from "./category-colors";

// Same registry as src/features/super-app/services.ts (web). Keep labels and copy in sync.
export type ServiceId = "groceries" | "delivery" | "restaurants" | "doctors" | "cinema" | "gyms" | "taxi";

export type ServiceDefinition = {
  id: ServiceId;
  label: string;
  description: string;
  icon: string;
  color: string;
};

export const SERVICES: readonly ServiceDefinition[] = [
  { id: "groceries", label: "Продукти", description: "Товари в кошик: самовивіз або доставка", icon: "shopping-basket", color: CATEGORY_COLORS.groceries },
  { id: "delivery", label: "Доставка", description: "Меню закладів з доставкою або самовивозом", icon: "delivery-dining", color: CATEGORY_COLORS.market },
  { id: "restaurants", label: "Ресторани", description: "Столик на дату й час, передзамовлення", icon: "restaurant", color: CATEGORY_COLORS.food },
  { id: "doctors", label: "Лікарі", description: "Запис до лікаря на вільний час", icon: "medical-services", color: CATEGORY_COLORS.health },
  { id: "cinema", label: "Кіно", description: "Сеанс, місця в залі, квитки", icon: "movie", color: CATEGORY_COLORS.culture },
  { id: "gyms", label: "Спортзали", description: "Абонемент у зал на місяць або рік", icon: "fitness-center", color: CATEGORY_COLORS.sports },
  { id: "taxi", label: "Таксі", description: "Маршрут, клас авто, оцінка вартості", icon: "local-taxi", color: CATEGORY_COLORS.transport },
];
