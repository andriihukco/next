import { useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import { colors, MIN_TOUCH, type } from "../lib/theme";

type Props = {
  progress: number;
  lengthKm: number;
  onScrubStart: () => void;
  onChange: (progress: number) => void;
};

const KNOB = 28;

/** Drag the knob along the track to walk forward or back. 44 pt tall touch zone. */
export function WalkScrubber({ progress, lengthKm, onScrubStart, onChange }: Props) {
  const [width, setWidth] = useState(0);
  const startRef = useRef(0);
  const widthRef = useRef(0);
  // Latest progress, read inside the responder without re-creating it.
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startRef.current = progressRef.current;
        onScrubStart();
      },
      onPanResponderMove: (_, gesture) => {
        if (widthRef.current === 0) return;
        onChange(startRef.current + gesture.dx / widthRef.current);
      },
    }),
  ).current;

  const knobLeft = Math.min(Math.max(progress, 0), 1) * width;
  const walkedKm = (progress * lengthKm).toFixed(1).replace(".", ",");

  return (
    <View style={styles.wrap}>
      <View style={styles.labels}>
        <Text style={styles.value}>{walkedKm} км</Text>
        <Text style={styles.caption}>з {lengthKm.toFixed(1).replace(".", ",")} км</Text>
      </View>
      <View
        style={styles.zone}
        onLayout={(event) => {
          const w = event.nativeEvent.layout.width;
          widthRef.current = w;
          setWidth(w);
        }}
        accessibilityRole="adjustable"
        accessibilityLabel="Прогрес прогулянки"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
        {...responder.panHandlers}
      >
        <View style={styles.rail} />
        <View style={[styles.fill, { width: knobLeft }]} />
        <View style={[styles.knob, { left: knobLeft - KNOB / 2 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  labels: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  value: { ...type.title, color: colors.foreground },
  caption: { ...type.footnote, color: colors.mutedForeground },
  zone: {
    height: MIN_TOUCH,
    justifyContent: "center",
  },
  rail: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  fill: {
    position: "absolute",
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  knob: {
    position: "absolute",
    top: (MIN_TOUCH - KNOB) / 2,
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: colors.card,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});
