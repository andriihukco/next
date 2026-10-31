import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { GlassSurface } from "./glass-surface";
import type { AirAlert } from "../lib/alerts-api";
import { colors, MIN_TOUCH, type } from "../lib/theme";

const ALERT_RED = "#dc2626"; // --map-marker-alert (DESIGN.md §2a)
const ALERT_YELLOW = "#d89418"; // --transport-bus, the web's yellow alert tone

/** Shown only while an alert is active. Tap expands the details. */
export function AirAlertPill({ alert }: { alert: AirAlert }) {
  const [expanded, setExpanded] = useState(false);
  const isYellow = alert.level === "yellow";
  const simulated = alert.source === "симуляція";
  const base = isYellow ? "БпЛА · Львівщина" : "Тривога · Львівщина";
  const title = simulated ? `${base} · симуляція` : base;
  const advice = isYellow
    ? "Жовтий рівень: загроза ударних БпЛА. Будьте уважні, за потреби спускайтеся в укриття."
    : "Червоний рівень: ракетна небезпека. Негайно пройдіть до найближчого укриття.";

  return (
    <GlassSurface style={styles.surface}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={title}
        onPress={() => setExpanded((value) => !value)}
        style={styles.header}
      >
        <View style={[styles.dot, { backgroundColor: isYellow ? ALERT_YELLOW : ALERT_RED }]} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.toggle}>{expanded ? "Згорнути" : "Деталі"}</Text>
      </Pressable>

      {expanded && (
        <ScrollView style={styles.details} showsVerticalScrollIndicator={false}>
          <Text style={styles.body}>{advice}</Text>
          {alert.sinceText ? <Text style={styles.caption}>{alert.sinceText}</Text> : null}
          {alert.areasAffected && alert.areasAffected.length > 0 ? (
            <Text style={styles.caption}>Райони: {alert.areasAffected.join(", ")}</Text>
          ) : null}
          {alert.threats && alert.threats.length > 0 ? (
            <View style={styles.threats}>
              <Text style={styles.sectionTitle}>БпЛА та КАБ</Text>
              {alert.threats.map((threat, index) => (
                <Text key={`${threat.time}-${index}`} style={styles.caption}>
                  {threat.time} · {threat.kindLabel} · {threat.placeUk || threat.place}
                  {threat.note ? ` · ${threat.note}` : ""}
                </Text>
              ))}
            </View>
          ) : null}
          <Text style={styles.caption}>За даними Повітряних сил · alerts.in.ua</Text>
        </ScrollView>
      )}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  surface: { padding: 0, borderRadius: 22, paddingHorizontal: 14 },
  header: {
    minHeight: MIN_TOUCH,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  title: { ...type.footnote, color: colors.foreground, fontWeight: "600", flex: 1 },
  toggle: { ...type.footnote, color: colors.primary, fontWeight: "600" },
  details: { maxHeight: 260, paddingBottom: 12, gap: 6 },
  body: { ...type.body, color: colors.foreground },
  caption: { ...type.footnote, color: colors.mutedForeground },
  threats: { gap: 4, marginTop: 4 },
  sectionTitle: { ...type.bodyStrong, color: colors.foreground },
});
