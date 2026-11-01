import { NativeTabs } from "expo-router/native-tabs";
import { colors, fonts } from "../../lib/theme";

/**
 * The system tab bar: UITabBar with SF Symbols on iOS, Material navigation bar with Material
 * Symbols on Android. Five tabs, the HIG limit. Order matches the web sections (design/navigation.md).
 */
export default function TabsLayout() {
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
      <NativeTabs.Trigger name="transport">
        <NativeTabs.Trigger.Icon sf={{ default: "tram", selected: "tram.fill" }} md="directions_transit" />
        <NativeTabs.Trigger.Label>Транспорт</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="places">
        <NativeTabs.Trigger.Icon sf={{ default: "mappin.and.ellipse", selected: "mappin.and.ellipse" }} md="explore" />
        <NativeTabs.Trigger.Label>Місця</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="education">
        <NativeTabs.Trigger.Icon sf={{ default: "graduationcap", selected: "graduationcap.fill" }} md="school" />
        <NativeTabs.Trigger.Label>Освіта</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="services">
        <NativeTabs.Trigger.Icon sf={{ default: "storefront", selected: "storefront.fill" }} md="storefront" />
        <NativeTabs.Trigger.Label>Послуги</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
