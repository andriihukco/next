import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fonts } from "../../lib/theme";
import { TABS, type TabId } from "../../lib/section-tabs";
import { requestSheet, setActiveTab, useSheetState } from "../../lib/sheet-store";
import { Txt } from "../../ui";

/**
 * The tab bar under the sheet: Транспорт, Місця, Послуги, Більше. Tapping the active tab returns
 * to its root, or opens the sheet when it is minimised (design/navigation.md).
 */
export const TAB_BAR_HEIGHT = 64;

export function TabBar({ height, paddingBottom }: { height: number; paddingBottom: number }) {
  const { tab, snap } = useSheetState();

  const press = (id: TabId, href: (typeof TABS)[number]["href"]) => {
    if (id === tab) {
      if (snap === "minimised") requestSheet("half");
      else router.dismissAll();
      return;
    }
    setActiveTab(id);
    router.dismissAll();
    router.replace(href);
    if (snap === "minimised") requestSheet("half");
  };

  return (
    <View style={[styles.bar, { height, paddingBottom }]}>
      {TABS.map((item) => {
        const selected = item.id === tab;
        const tint = selected ? colors.primary : colors.mutedForeground;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected }}
            onPress={() => press(item.id, item.href)}
            style={styles.item}
          >
            <View style={[styles.pill, selected && styles.pillSelected]}>
              <MaterialIcons name={item.icon} size={24} color={tint} />
            </View>
            <Txt variant="caption" style={[styles.label, { color: tint }, selected && styles.labelSelected]} numberOfLines={1}>
              {item.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 6,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  item: { flex: 1, alignItems: "center", gap: 2 },
  pill: { width: 56, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  pillSelected: { backgroundColor: colors.accent },
  label: { fontFamily: fonts.regular },
  labelSelected: { fontFamily: fonts.semibold },
});
