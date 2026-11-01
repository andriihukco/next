import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Glass } from "../glass";
import { Txt } from "../text";
import { space, useUiPlatform } from "../platform";

/**
 * A top bar that floats over content: liquid glass on iOS 26+, the opaque fallback elsewhere.
 * Leading and trailing slots hold IconButtons (atoms). The title is one line and centered on Android.
 */
export function GlassBar({ title, leading, trailing }: { title: string; leading?: ReactNode; trailing?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const platform = useUiPlatform();
  return (
    <View style={{ paddingTop: insets.top + space.sm, paddingHorizontal: space.lg }}>
      <Glass style={styles.bar}>
        <View style={styles.row}>
          <View style={styles.slot}>{leading}</View>
          <Txt variant="headline" numberOfLines={1} style={[styles.title, platform === "android" && styles.center]}>
            {title}
          </Txt>
          <View style={[styles.slot, styles.end]}>{trailing}</View>
        </View>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: space.sm, paddingVertical: space.xs },
  row: { flexDirection: "row", alignItems: "center", minHeight: 44 },
  slot: { minWidth: 44, flexDirection: "row", alignItems: "center" },
  end: { justifyContent: "flex-end" },
  title: { flex: 1, textAlign: "center" },
  center: { textAlign: "center" },
});
