import type { IconName } from "../ui";

/**
 * The bottom tab bar: four fixed tabs, the same on iOS and Android. The map is not a tab; it sits
 * behind the sheet on every page (design/navigation.md).
 */
export type TabId = "transport" | "places" | "services" | "more";

export const TABS: readonly { id: TabId; label: string; icon: IconName; href: "/transport" | "/places" | "/services" | "/more" }[] = [
  { id: "transport", label: "Транспорт", icon: "directions-transit", href: "/transport" },
  { id: "places", label: "Місця", icon: "explore", href: "/places" },
  { id: "services", label: "Послуги", icon: "storefront", href: "/services" },
  { id: "more", label: "Більше", icon: "apps", href: "/more" },
];

/**
 * Everything under «Більше»: the web sections (src/components/city-guide/constants.ts CITY_SECTIONS)
 * minus the three that have their own tab. Labels and order match the web.
 */
export const MORE_SECTIONS: readonly { id: string; label: string; icon: IconName }[] = [
  { id: "education", label: "Освіта", icon: "school" },
  { id: "events", label: "Афіша", icon: "event" },
  { id: "jobs", label: "Робота", icon: "work" },
  { id: "real-estate", label: "Нерухомість", icon: "real-estate-agent" },
  { id: "market", label: "Ринок", icon: "store" },
  { id: "parking", label: "Парковка", icon: "local-parking" },
  { id: "fuel", label: "АЗС", icon: "local-gas-station" },
  { id: "charging", label: "Електрозарядка", icon: "ev-station" },
];
