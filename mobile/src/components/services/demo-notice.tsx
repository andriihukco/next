import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fonts, radius } from "../../lib/theme";

/** Every service is a demo. Shown on the hub and in each flow, as on the web. */
export function DemoNotice({ text }: { text: string }) {
  return (
    <View style={styles.box}>
      <MaterialIcons name="info-outline" size={18} color={colors.amberText} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.amberSurface,
  },
  text: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.amberText, lineHeight: 20 },
});
