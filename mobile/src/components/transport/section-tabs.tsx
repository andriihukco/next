import { Pressable, StyleSheet, Text, View, Animated } from "react-native";
import { useRef } from "react";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { colors, fonts, MIN_TOUCH, radius } from "../../lib/theme";

export type CitySection = "transport" | "places" | "services";

/** Filled glyph for the active tab, outline glyph for the others, as in iOS tab bars. */
const SECTIONS: {
  id: CitySection;
  label: string;
  filled: keyof typeof MaterialIcons.glyphMap;
  outline: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { id: "transport", label: "Транспорт", filled: "directions-transit", outline: "train-variant" },
  { id: "places", label: "Місця", filled: "explore", outline: "compass-outline" },
  { id: "services", label: "Послуги", filled: "storefront", outline: "storefront-outline" },
];

/** Segmented tab bar with liquid glass. The active tab sits on a tinted pill with a bold label. */
export function SectionTabs({ value, onChange }: { value: CitySection; onChange: (next: CitySection) => void }) {
  const pressRefs = useRef<Record<CitySection, Animated.Value>>({
    transport: new Animated.Value(1),
    places: new Animated.Value(1),
    services: new Animated.Value(1),
  }).current;

  const onPressIn = (id: CitySection) => {
    Animated.spring(pressRefs[id], { toValue: 0.92, useNativeDriver: true }).start();
  };

  const onPressOut = (id: CitySection) => {
    Animated.spring(pressRefs[id], {
      toValue: 1,
      damping: 24,
      stiffness: 260,
      useNativeDriver: true,
    }).start();
  };

  const content = (
    <View style={styles.inner}>
      {SECTIONS.map((section) => {
        const active = section.id === value;
        return (
          <Animated.View
            key={section.id}
            style={[styles.item, { transform: [{ scale: pressRefs[section.id] }] }]}
          >
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={section.label}
              onPress={() => onChange(section.id)}
              onPressIn={() => onPressIn(section.id)}
              onPressOut={() => onPressOut(section.id)}
              style={styles.pressable}
            >
              <View style={[styles.pill, active && styles.pillActive]}>
                {active ? (
                  <MaterialIcons name={section.filled} size={24} color={colors.primary} />
                ) : (
                  <MaterialCommunityIcons name={section.outline} size={24} color={colors.mutedForeground} />
                )}
              </View>
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
                {section.label}
              </Text>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );

  if (isLiquidGlassAvailable()) {
    return (
      <GlassView glassEffectStyle="regular" style={styles.glass}>
        {content}
      </GlassView>
    );
  }

  return <View style={[styles.fallback]}>{content}</View>;
}

const styles = StyleSheet.create({
  glass: {
    position: "absolute",
    bottom: 0,
    left: 12,
    right: 12,
    borderRadius: 20,
    overflow: "hidden",
    padding: 0,
  },
  fallback: {
    position: "absolute",
    bottom: 0,
    left: 12,
    right: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  inner: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  item: { flex: 1, alignItems: "center", gap: 6 },
  pressable: { alignItems: "center", gap: 6, width: "100%" },
  pill: {
    width: 56,
    height: 28,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  pillActive: {
    backgroundColor: colors.accent,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: -0.2,
    color: colors.mutedForeground,
  },
  labelActive: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
});
