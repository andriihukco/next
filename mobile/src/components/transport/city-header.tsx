import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, fonts, HIT_SLOP, MIN_TOUCH, radius } from "../../lib/theme";
import { useDevSim } from "../../lib/dev-sim";

/** Logo, city switcher and account button, as in the web header. */
export function CityHeader() {
  const sim = useDevSim();
  return (
    <View style={styles.row}>
      {/* Holding the logo for 5 seconds opens dev tools (development builds only). */}
      <Pressable
        style={styles.logo}
        accessibilityRole="header"
        accessibilityLabel="next"
        accessibilityHint="Утримуйте 5 секунд, щоб відкрити dev tools"
        delayLongPress={5000}
        onLongPress={sim.openDevTools}
      >
        <Text style={styles.logoText}>next</Text>
        <MaterialIcons name="chevron-right" size={22} color={colors.primary} />
      </Pressable>

      <Pressable accessibilityRole="button" accessibilityLabel="Львів, обрати місто" style={styles.city} hitSlop={HIT_SLOP}>
        <Text style={styles.cityName}>Львів</Text>
        <View style={styles.beta}>
          <Text style={styles.betaText}>Beta</Text>
        </View>
        <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.mutedForeground} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Профіль"
        hitSlop={HIT_SLOP}
        onPress={() => router.push("/profile")}
        style={styles.account}
      >
        <MaterialIcons name="account-circle" size={30} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 8 },
  logo: { flexDirection: "row", alignItems: "center" },
  logoText: { fontFamily: fonts.extrabold, fontSize: 26, letterSpacing: -0.8, color: colors.foreground },
  city: {
    minHeight: MIN_TOUCH,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignSelf: "flex-start",
  },
  cityName: { fontFamily: fonts.bold, fontSize: 17, color: colors.foreground },
  beta: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  betaText: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  account: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
});
