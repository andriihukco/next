import { Pressable, StyleSheet, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { colors, HIT_SLOP, MIN_TOUCH, type } from "../lib/theme";

type Props = {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
};

/** The one primary action on a screen. Feedback fires on press-down, not on release. */
export function PrimaryButton({ label, onPress, accessibilityHint }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      hitSlop={HIT_SLOP}
      onPressIn={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH + 8,
    borderRadius: 16,
    borderCurve: "continuous",
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  pressed: {
    backgroundColor: colors.primaryHover,
    transform: [{ scale: 0.98 }],
  },
  label: {
    ...type.bodyStrong,
    color: colors.onPrimary,
  },
});
