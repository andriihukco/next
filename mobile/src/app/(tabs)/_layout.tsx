import { useCallback, useState, type ReactElement } from "react";
import { useFocusEffect } from "expo-router";
import { NativeTabs } from "expo-router/native-tabs";
import { colors, fonts } from "../../lib/theme";
import { CONFIGURABLE_TABS, type ConfigurableTab } from "../../lib/section-tabs";
import { defaultSectionPrefs, readSectionPrefs, sortSectionIds, type SectionPrefs } from "../../lib/section-prefs";

// One trigger per tab, with literal symbol names, so each icon keeps its SF Symbols type.
const TRIGGERS: Record<ConfigurableTab, (hidden: boolean) => ReactElement> = {
  transport: (hidden) => (
    <NativeTabs.Trigger key="transport" name="transport" hidden={hidden}>
      <NativeTabs.Trigger.Icon sf={{ default: "tram", selected: "tram.fill" }} md="directions_transit" />
      <NativeTabs.Trigger.Label>Транспорт</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
  ),
  places: (hidden) => (
    <NativeTabs.Trigger key="places" name="places" hidden={hidden}>
      <NativeTabs.Trigger.Icon sf={{ default: "mappin.and.ellipse", selected: "mappin.and.ellipse" }} md="explore" />
      <NativeTabs.Trigger.Label>Місця</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
  ),
  education: (hidden) => (
    <NativeTabs.Trigger key="education" name="education" hidden={hidden}>
      <NativeTabs.Trigger.Icon sf={{ default: "graduationcap", selected: "graduationcap.fill" }} md="school" />
      <NativeTabs.Trigger.Label>Освіта</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
  ),
  services: (hidden) => (
    <NativeTabs.Trigger key="services" name="services" hidden={hidden}>
      <NativeTabs.Trigger.Icon sf={{ default: "storefront", selected: "storefront.fill" }} md="storefront" />
      <NativeTabs.Trigger.Label>Послуги</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
  ),
};

/**
 * The system tab bar: UITabBar with SF Symbols on iOS, Material navigation bar with Material
 * Symbols on Android. The map stays first. The category tabs follow the user's list: favourites
 * first, hidden ones removed (set in Профіль → Вкладки).
 */
export default function TabsLayout() {
  const [prefs, setPrefs] = useState<SectionPrefs>(() => defaultSectionPrefs(CONFIGURABLE_TABS));

  useFocusEffect(
    useCallback(() => {
      void readSectionPrefs(CONFIGURABLE_TABS).then(setPrefs);
    }, []),
  );

  const ordered = sortSectionIds(CONFIGURABLE_TABS, prefs);
  const tabs = [...ordered.filter((id) => prefs.favorites.includes(id)), ...ordered.filter((id) => !prefs.favorites.includes(id))];

  return (
    <NativeTabs
      tintColor={colors.primary}
      indicatorColor={colors.accent}
      labelStyle={{ fontFamily: fonts.semibold }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: "map", selected: "map.fill" }} md="map" />
        <NativeTabs.Trigger.Label>Мапа</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      {tabs.map((id) => TRIGGERS[id](prefs.hidden.includes(id)))}
    </NativeTabs>
  );
}
