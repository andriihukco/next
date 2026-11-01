import type { IconName } from "../ui";

/**
 * The tabs the user can reorder, hide or pin as favourites. The map tab is fixed first and
 * always visible. Labels and icons match the web sections (src/components/city-guide/constants.ts).
 */
export const CONFIGURABLE_TABS = ["transport", "places", "education", "services"] as const;
export type ConfigurableTab = (typeof CONFIGURABLE_TABS)[number];

export const TAB_META: Record<ConfigurableTab, { label: string; icon: IconName }> = {
  transport: { label: "Транспорт", icon: "directions-transit" },
  places: { label: "Місця", icon: "explore" },
  education: { label: "Освіта", icon: "school" },
  services: { label: "Послуги", icon: "storefront" },
};
