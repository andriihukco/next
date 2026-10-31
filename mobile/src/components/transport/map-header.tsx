import { Pressable, StyleSheet, Text, View, Animated } from "react-native";
import { useRef } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, fonts, HIT_SLOP } from "../../lib/theme";
import { useDevSim } from "../../lib/dev-sim";

/** Clean header floating over map: logo on left, city centered, profile on right. */
export function MapHeader() {
  const sim = useDevSim();
  const logoPress = useRef(new Animated.Value(1)).current;
  const cityPress = useRef(new Animated.Value(1)).current;
  const profilePress = useRef(new Animated.Value(1)).current;

  const onPressIn = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 0.92, useNativeDriver: true }).start();
  };

  const onPressOut = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 1, damping: 24, stiffness: 260, useNativeDriver: true }).start();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: logoPress }] }}>
        <Pressable
          accessibilityRole="header"
          accessibilityLabel="next"
          accessibilityHint="Утримуйте 5 секунд, щоб відкрити dev tools"
          delayLongPress={5000}
          onLongPress={sim.openDevTools}
          onPressIn={() => onPressIn(logoPress)}
          onPressOut={() => onPressOut(logoPress)}
          hitSlop={HIT_SLOP}
        >
          <Text style={styles.logoText}>next</Text>
        </Pressable>
      </Animated.View>

      <Animated.View style={[styles.cityWrap, { transform: [{ scale: cityPress }] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Львів, обрати місто"
          hitSlop={HIT_SLOP}
          onPressIn={() => onPressIn(cityPress)}
          onPressOut={() => onPressOut(cityPress)}
        >
          <Text style={styles.cityName}>Львів</Text>
          <Text style={styles.betaText}>Beta</Text>
        </Pressable>
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: profilePress }] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Профіль"
          hitSlop={HIT_SLOP}
          onPress={() => router.push("/profile")}
          onPressIn={() => onPressIn(profilePress)}
          onPressOut={() => onPressOut(profilePress)}
        >
          <MaterialIcons name="account-circle" size={32} color={colors.foreground} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 100,
  },
  logoText: {
    fontFamily: fonts.extrabold,
    fontSize: 32,
    letterSpacing: -1,
    color: colors.foreground,
  },
  cityWrap: {
    flex: 1,
    alignItems: "center",
  },
  cityName: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.foreground,
  },
  betaText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
  },
});
