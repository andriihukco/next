import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useDevSim } from "../../lib/dev-sim";
import { colors, fonts, MIN_TOUCH, radius } from "../../lib/theme";

/** Dev tools sheet: spawn fake transport and a fake air alert. Opened by holding the logo for 5 seconds. */
export function DevTools() {
  const sim = useDevSim();
  if (!__DEV__) return null;

  const counts = (type: string) => sim.vehicles.filter((v) => v.type === type).length;

  return (
    <Modal visible={sim.devToolsOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={sim.closeDevTools}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headCopy}>
            <Text style={styles.title} accessibilityRole="header">Dev tools</Text>
            <Text style={styles.caption}>Симуляція для тестів. Це не дані з GPS.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Закрити" onPress={sim.closeDevTools} style={styles.close}>
            <MaterialIcons name="close" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={styles.section}>Транспорт</Text>
          <View style={styles.group}>
            <Row label="Симуляція транспорту" caption={`Фейкових одиниць: ${sim.vehicles.length}`}>
              <Switch value={sim.simulate} onValueChange={sim.setSimulate} />
            </Row>
            <Action label="Додати автобус" icon="directions-bus" count={counts("bus")} onPress={() => sim.spawn("bus", 1)} />
            <Action label="Додати трамвай" icon="tram" count={counts("tram")} onPress={() => sim.spawn("tram", 1)} />
            <Action label="Додати тролейбус" icon="bolt" count={counts("trolleybus")} onPress={() => sim.spawn("trolleybus", 1)} />
            <Action label="Додати таксі" icon="local-taxi" count={counts("taxi")} onPress={() => sim.spawn("taxi", 1)} />
            <Action label="Додати 10 випадкових" icon="shuffle" onPress={() => sim.spawn("random", 10)} />
            <Action label="Очистити симульований транспорт" icon="delete-outline" destructive onPress={sim.clearVehicles} />
          </View>

          <Text style={styles.section}>Тривога</Text>
          <View style={styles.group}>
            <Row label="Тривога (симуляція)" caption="Показує плашку і укриття на мапі">
              <Switch value={sim.alertOn} onValueChange={sim.setAlertOn} />
            </Row>
          </View>

          <Text style={styles.footnote}>
            Щоб повернутися до GPS, вимкніть симуляцію транспорту або натисніть «GPS-наживо» у плашці над списком.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

function Row({ label, caption, children }: { label: string; caption?: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowCopy}>
        <Text style={styles.rowLabel}>{label}</Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Action({
  label,
  icon,
  count,
  destructive = false,
  onPress,
}: {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  count?: number;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <MaterialIcons name={icon} size={22} color={destructive ? colors.destructive : colors.primary} />
      <Text style={[styles.rowLabel, styles.rowFlex, destructive && { color: colors.destructive }]}>{label}</Text>
      {count !== undefined ? <Text style={styles.count}>{count}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingTop: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  headCopy: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.extrabold, fontSize: 28, letterSpacing: -0.6, color: colors.foreground },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.mutedForeground },
  close: { width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: MIN_TOUCH / 2, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" },
  body: { gap: 10, paddingHorizontal: 16, paddingBottom: 32 },
  section: { fontFamily: fonts.semibold, fontSize: 13, color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.4, marginTop: 10 },
  group: { borderRadius: radius.xl, borderCurve: "continuous", backgroundColor: colors.card, overflow: "hidden" },
  row: { minHeight: MIN_TOUCH + 10, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  pressed: { backgroundColor: colors.surfaceMuted },
  rowCopy: { flex: 1, gap: 2 },
  rowFlex: { flex: 1 },
  rowLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.foreground },
  count: { fontFamily: fonts.bold, fontSize: 15, color: colors.mutedForeground },
  footnote: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.mutedForeground, marginTop: 8 },
});
