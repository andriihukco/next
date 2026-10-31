import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { GlassSurface } from "../components/glass-surface";
import { PrimaryButton } from "../components/primary-button";
import { WalkMap } from "../components/walk-map";
import { WalkScrubber } from "../components/walk-scrubber";
import { WALK_TRACK } from "../data/walk-track";
import { useDemoWalk } from "../lib/use-demo-walk";
import { colors, type } from "../lib/theme";

const DEMO_WALK_MS = 16000; // Demo pace, not real walking speed (about 9 km/h).

/** Onboarding 2 of 3: watch the walk, drag to scrub. The only action moves on. */
export default function WalkScreen() {
  const { progress, seek, pause } = useDemoWalk(DEMO_WALK_MS);

  return (
    <View style={styles.screen}>
      <WalkMap progress={progress} follow bottomInset={300} />
      <Animated.View entering={FadeInDown.duration(450)} style={styles.sheetWrap}>
        <GlassSurface>
          <Text style={styles.caption}>Демо-маршрут</Text>
          <WalkScrubber
            progress={progress}
            lengthKm={WALK_TRACK.lengthKm}
            onScrubStart={pause}
            onChange={seek}
          />
          <View style={styles.action}>
            <PrimaryButton label="Далі" onPress={() => router.push("/location")} />
          </View>
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
  caption: {
    ...type.footnote,
    color: colors.mutedForeground,
    marginBottom: 8,
  },
  action: {
    marginTop: 16,
  },
});
