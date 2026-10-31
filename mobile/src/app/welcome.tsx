import { router } from "expo-router";
import { Text, View, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PrimaryButton } from "../components/primary-button";
import { GlassSurface } from "../components/glass-surface";
import { WalkMap } from "../components/walk-map";
import { WALK_TRACK } from "../data/walk-track";
import { colors, type } from "../lib/theme";

/** Onboarding 1 of 3: the route, one action. */
export default function WelcomeScreen() {
  const km = WALK_TRACK.lengthKm.toFixed(1).replace(".", ",");

  return (
    <View style={styles.screen}>
      <WalkMap progress={0} bottomInset={260} />
      <Animated.View entering={FadeInDown.duration(450)} style={styles.sheetWrap}>
        <GlassSurface>
          <View style={styles.copy}>
            <Text style={styles.title}>Прогулянка центром</Text>
            <Text style={styles.subtitle}>{km} км по дорогах Львова</Text>
          </View>
          <PrimaryButton
            label="Почати"
            accessibilityHint="Відкриває маршрут з прогресом ходьби"
            onPress={() => router.push("/walk")}
          />
        </GlassSurface>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sheetWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 40,
  },
  copy: {
    gap: 4,
    marginBottom: 20,
  },
  title: {
    ...type.largeTitle,
    color: colors.foreground,
  },
  subtitle: {
    ...type.body,
    color: colors.mutedForeground,
  },
});
