import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, MIN_TOUCH, radius } from "../../lib/theme";

/** Shown only while the map runs on simulated data. Live data has no banner. */
export function TransitSourceBanner({ simulated, onUseLive }: { simulated: boolean; onUseLive?: () => void }) {
  if (!simulated) return null;
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Text style={styles.text}>Симуляція — не GPS-наживо.</Text>
      {onUseLive ? (
        <Pressable accessibilityRole="button" onPress={onUseLive} style={styles.button}>
          <Text style={styles.buttonText}>GPS-наживо</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.amberSurface,
    borderWidth: 1,
    borderColor: "#f1dfa6",
    marginBottom: 4,
  },
  text: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.amberText },
  button: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
  },
  buttonText: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground },
});
