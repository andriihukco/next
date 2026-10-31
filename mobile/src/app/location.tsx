import { router } from "expo-router";
import * as Location from "expo-location";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { GlassSurface } from "../components/glass-surface";
import { PrimaryButton } from "../components/primary-button";
import { WalkMap } from "../components/walk-map";
import { colors, type } from "../lib/theme";

/** Onboarding 3 of 3: one permission, one action. Either answer opens the app. */
export default function LocationScreen() {
  const finish = async () => {
    await Location.requestForegroundPermissionsAsync();
    router.replace("/");
  };

  return (
    <View style={styles.screen}>
      <WalkMap progress={1} bottomInset={260} />
      <Animated.View entering={FadeInDown.duration(450)} style={styles.sheetWrap}>
        <GlassSurface>
          <View style={styles.copy}>
            <Text style={styles.title}>Ваш шлях на карті</Text>
            <Text style={styles.body}>
              Геолокація показує вас на маршруті під час прогулянки.
            </Text>
          </View>
          <PrimaryButton label="Дозволити геолокацію" onPress={finish} />
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
    gap: 8,
    marginBottom: 20,
  },
  title: {
    ...type.title,
    color: colors.foreground,
  },
  body: {
    ...type.body,
    color: colors.mutedForeground,
  },
});
