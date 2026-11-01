import { useImperativeHandle, useMemo, useRef, useState, type Ref, type RefObject } from "react";
import {
  Image,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MapCamera, MapCommands } from "../city-map";
import { LVIV_REGION } from "../city-map";
import { SATELLITE_ATTRIBUTION, satellitePreviewUrl, type MapStyleMode } from "../../lib/map-style";
import { colors, fonts, MIN_TOUCH, radius } from "../../lib/theme";

/** Button steps: one press turns the view 15° and tilts it 10° (same as the web pad). */
const STEP_BEARING = 15;
const STEP_PITCH = 10;
/** Drag sensitivity: degrees per point of finger movement. */
const DRAG_BEARING = 0.4;
const DRAG_PITCH = 0.25;
/** Below the floating header (logo, city, profile). */
const HEADER_CLEARANCE = 68;
const PANEL_GAP = 12;

const SATELLITE_PREVIEW = satellitePreviewUrl(LVIV_REGION.latitude, LVIV_REGION.longitude, 15);

const MAP_STYLE_OPTIONS: { mode: MapStyleMode; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { mode: "standard", label: "Стандартна", icon: "map" },
  { mode: "hybrid", label: "Гібридна", icon: "layers" },
  { mode: "satellite", label: "Супутник", icon: "satellite-alt" },
];

export type MapControlsHandle = { setCamera: (camera: MapCamera) => void };

type Props = {
  ref?: Ref<MapControlsHandle>;
  map: RefObject<MapCommands | null>;
  mapStyle: MapStyleMode;
  onChangeMapStyle: (mode: MapStyleMode) => void;
  onLocate: () => void;
};

type Panel = "style" | "camera" | null;

/**
 * Floating map controls, the same set and order as the web (DESIGN.md §7): map type and my
 * location, compass, camera (360). Camera state arrives through `setCamera`, so only this
 * component re-renders while the map turns.
 */
export function MapControls({ ref, map, mapStyle, onChangeMapStyle, onLocate }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [camera, setCamera] = useState<MapCamera>({ bearing: 0, pitch: 50 });
  const [panel, setPanel] = useState<Panel>(null);
  useImperativeHandle(ref, () => ({ setCamera }), []);

  const top = Math.max(HEADER_CLEARANCE, insets.top + 8);
  const is3D = camera.pitch >= 0.5;
  const imagery = mapStyle !== "standard";
  const panelStyle = { top, right: 12 + MIN_TOUCH + PANEL_GAP, width: Math.min(300, width - (12 + MIN_TOUCH + PANEL_GAP) - 12) };

  // The center dot of the pad: horizontal drag turns, vertical drag tilts, both in one gesture.
  const last = useRef({ dx: 0, dy: 0 });
  const drag = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          last.current = { dx: 0, dy: 0 };
        },
        onPanResponderMove: (_event, gesture) => {
          const dx = gesture.dx - last.current.dx;
          const dy = gesture.dy - last.current.dy;
          last.current = { dx: gesture.dx, dy: gesture.dy };
          // Dragging up tilts toward the horizon, the same way the up arrow does.
          map.current?.orbit(dx * DRAG_BEARING, -dy * DRAG_PITCH, 0);
        },
      }),
    [map],
  );

  return (
    <>
      <View style={[styles.column, { top }]} pointerEvents="box-none">
        <View style={styles.group}>
          <ControlButton
            icon={MAP_STYLE_OPTIONS.find((option) => option.mode === mapStyle)?.icon ?? "map"}
            label="Тип мапи"
            active={panel === "style"}
            onPress={() => setPanel("style")}
          />
          <View style={styles.divider} />
          <ControlButton icon="my-location" label="Моє місцезнаходження" onPress={onLocate} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Компас: повернути карту на північ"
          onPress={() => map.current?.resetNorth()}
          style={({ pressed }) => [styles.compass, pressed && styles.pressed]}
        >
          <View style={[styles.needle, { transform: [{ rotate: `${-camera.bearing}deg` }] }]}>
            <View style={styles.needleNorth} />
            <View style={styles.needleSouth} />
          </View>
        </Pressable>

        <View style={styles.group}>
          <ControlButton
            icon="360"
            label="Камера: нахил і поворот"
            active={panel === "camera"}
            onPress={() => setPanel("camera")}
          />
        </View>

        <Text style={styles.attribution}>
          {imagery ? `${SATELLITE_ATTRIBUTION} · ` : ""}© OpenFreeMap, OpenStreetMap
        </Text>
      </View>

      <Modal visible={panel !== null} transparent animationType="fade" onRequestClose={() => setPanel(null)}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Закрити" onPress={() => setPanel(null)} />

        {panel === "style" && (
          <View style={[styles.panel, panelStyle]} accessibilityViewIsModal>
            <Text style={styles.panelTitle}>Тип мапи</Text>
            <View style={styles.styleRow}>
              {MAP_STYLE_OPTIONS.map((option) => {
                const selected = option.mode === mapStyle;
                return (
                  <Pressable
                    key={option.mode}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.label}
                    onPress={() => onChangeMapStyle(option.mode)}
                    style={styles.styleTile}
                  >
                    <View style={[styles.stylePreview, selected && styles.stylePreviewSelected]}>
                      {option.mode === "standard" ? (
                        <MaterialIcons name={option.icon} size={24} color={colors.foreground} />
                      ) : (
                        <Image source={{ uri: SATELLITE_PREVIEW }} style={styles.previewImage} />
                      )}
                    </View>
                    <Text style={[styles.styleLabel, selected && styles.styleLabelSelected]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {panel === "camera" && (
          <View style={[styles.panel, panelStyle]} accessibilityViewIsModal>
            <View style={styles.cameraHeader}>
              <Text style={styles.panelTitle}>Камера</Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>3D</Text>
                <Switch
                  accessibilityLabel="3D-вигляд"
                  value={is3D}
                  onValueChange={(on) => map.current?.set3D(on)}
                  trackColor={{ true: colors.primary, false: colors.border }}
                />
              </View>
            </View>

            <Text style={styles.padLabel}>Нахил до горизонту</Text>
            <View style={styles.padRow}>
              <Text style={[styles.padLabel, styles.padSide, styles.padLeft]}>Повернути ліворуч</Text>
              <View style={styles.pad}>
                <PadButton icon="keyboard-arrow-up" label="Нахил до горизонту" onPress={() => map.current?.orbit(0, STEP_PITCH, 250)} style={styles.padUp} />
                <PadButton icon="keyboard-arrow-left" label="Повернути ліворуч" onPress={() => map.current?.orbit(-STEP_BEARING, 0, 250)} style={styles.padLeftBtn} />
                <View
                  {...drag.panHandlers}
                  accessible
                  accessibilityLabel="Перетягніть, щоб повернути й нахилити карту"
                  style={styles.padCenter}
                >
                  <View style={styles.padDot} />
                </View>
                <PadButton icon="keyboard-arrow-right" label="Повернути праворуч" onPress={() => map.current?.orbit(STEP_BEARING, 0, 250)} style={styles.padRightBtn} />
                <PadButton icon="keyboard-arrow-down" label="Вид зверху" onPress={() => map.current?.orbit(0, -STEP_PITCH, 250)} style={styles.padDown} />
              </View>
              <Text style={[styles.padLabel, styles.padSide]}>Повернути праворуч</Text>
            </View>
            <Text style={styles.padLabel}>Вид зверху</Text>
            <Text style={styles.hint}>Перетягніть точку в центрі, щоб повертати й нахиляти разом.</Text>
          </View>
        )}
      </Modal>
    </>
  );
}

function ControlButton({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.button, active && styles.buttonActive, pressed && styles.pressed]}
    >
      <MaterialIcons name={icon} size={22} color={active ? colors.accentForeground : colors.foreground} />
    </Pressable>
  );
}

function PadButton({
  icon,
  label,
  onPress,
  style,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  style: object;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.padButton, style, pressed && styles.pressed]}
    >
      <MaterialIcons name={icon} size={24} color={colors.foreground} />
    </Pressable>
  );
}

const PAD = 132;
const CELL = 44;

const styles = StyleSheet.create({
  column: { position: "absolute", right: 12, alignItems: "flex-end", gap: 8 },
  group: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  button: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: "center", justifyContent: "center" },
  buttonActive: { backgroundColor: colors.accent },
  pressed: { opacity: 0.6 },
  compass: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  needle: { width: 12, height: 24, alignItems: "center" },
  needleNorth: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: colors.destructive,
  },
  needleSouth: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.mutedForeground,
  },
  attribution: {
    maxWidth: 160,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: "rgba(255,255,255,0.86)",
    color: colors.mutedForeground,
    fontFamily: fonts.regular,
    fontSize: 10,
    textAlign: "right",
  },
  panel: {
    position: "absolute",
    gap: 12,
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: "#0f172a",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  panelTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.foreground },
  styleRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  styleTile: { flex: 1, alignItems: "center", gap: 6 },
  stylePreview: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  stylePreviewSelected: { borderColor: colors.primary },
  previewImage: { width: "100%", height: "100%" },
  styleLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.foreground },
  styleLabelSelected: { fontFamily: fonts.extrabold },
  cameraHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  switchLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground },
  padRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  padSide: { flex: 1 },
  padLeft: { textAlign: "right" },
  padLabel: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.mutedForeground, textAlign: "center" },
  pad: { width: PAD, height: PAD },
  padButton: {
    position: "absolute",
    width: CELL,
    height: CELL,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  padUp: { top: 0, left: CELL },
  padDown: { bottom: 0, left: CELL },
  padLeftBtn: { left: 0, top: CELL },
  padRightBtn: { right: 0, top: CELL },
  padCenter: {
    position: "absolute",
    top: CELL,
    left: CELL,
    width: CELL,
    height: CELL,
    alignItems: "center",
    justifyContent: "center",
  },
  padDot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.mutedForeground },
  hint: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.mutedForeground },
});
