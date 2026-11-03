import { useEffect, useMemo, type ReactNode } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "../../lib/theme";
import { getSheetSnap, recordSheetSnap, subscribeSheetRequests, type SheetSnap } from "../../lib/sheet-store";
import { TabBar, TAB_BAR_HEIGHT } from "./tab-bar";

// Snap heights as a share of the screen (design/navigation.md, «Sheet»). Full stops short of the top
// so the status bar and the city pill stay visible.
const HALF_SHARE = 0.46;
const FULL_SHARE = 0.92;
const SPRING = { damping: 26, stiffness: 260, mass: 0.9 };
const SNAPS: SheetSnap[] = ["minimised", "half", "full"];

/**
 * The app shell. The map is behind everything; pages render in one bottom sheet above the tab bar.
 * The sheet can be dragged to `half`, to `full`, or down to `minimised`, where only the tab bar shows.
 * `children` is the page stack, so pushed pages stay in the sheet and the tab bar stays visible.
 */
export function SheetShell({ backdrop, children }: { backdrop: ReactNode; children: ReactNode }) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const barHeight = TAB_BAR_HEIGHT + insets.bottom;
  const heights = useMemo<Record<SheetSnap, number>>(
    () => ({ minimised: 0, half: Math.round(height * HALF_SHARE), full: Math.round(height * FULL_SHARE) }),
    [height],
  );
  const full = heights.full;

  // The sheet's visible height. The frame is always `full` tall and moves down by the rest.
  const sheetHeight = useSharedValue(heights[getSheetSnap()]);
  const startHeight = useSharedValue(0);

  // Pages ask for a snap (a push reveals the sheet, «Показати на мапі» minimises it).
  useEffect(
    () =>
      subscribeSheetRequests((snap) => {
        sheetHeight.value = withSpring(heights[snap], SPRING);
      }),
    [heights, sheetHeight],
  );

  const drag = useSheetDrag(sheetHeight, startHeight, heights);
  const barDrag = useSheetDrag(sheetHeight, startHeight, heights, 10);

  const frame = useAnimatedStyle(() => ({ transform: [{ translateY: full - sheetHeight.value }] }));

  return (
    <View style={styles.root}>
      {backdrop}

      <Animated.View style={[styles.sheet, { bottom: barHeight, height: full }, frame]}>
        <GestureDetector gesture={drag}>
          <View style={styles.grabberArea} accessibilityLabel="Потягніть, щоб змінити висоту сторінки">
            <View style={styles.grabber} />
          </View>
        </GestureDetector>
        <View style={styles.pages}>{children}</View>
      </Animated.View>

      {/* Pinned to the bottom edge: the root is a column, so an in-flow bar would sit at the top. */}
      <GestureDetector gesture={barDrag}>
        <View style={[styles.tabBarFrame, { height: barHeight }]}>
          <TabBar height={barHeight} paddingBottom={insets.bottom} />
        </View>
      </GestureDetector>
    </View>
  );
}

/** Drag the sheet up or down and let it settle on the nearest snap, with a little fling. */
function useSheetDrag(
  sheetHeight: SharedValue<number>,
  startHeight: SharedValue<number>,
  heights: Record<SheetSnap, number>,
  activeOffset = 0,
) {
  return useMemo(() => {
    const pan = Gesture.Pan();
    if (activeOffset > 0) pan.activeOffsetY([-activeOffset, activeOffset]);
    return pan
        .onStart(() => {
          'worklet';
          startHeight.value = sheetHeight.value;
        })
        .onUpdate((event) => {
          'worklet';
          sheetHeight.value = Math.min(heights.full, Math.max(0, startHeight.value - event.translationY));
        })
        .onEnd((event) => {
          'worklet';
          const projected = sheetHeight.value - event.velocityY * 0.2;
          let target: SheetSnap = "minimised";
          let best = Infinity;
          for (const snap of SNAPS) {
            const distance = Math.abs(heights[snap] - projected);
            if (distance < best) {
              best = distance;
              target = snap;
            }
          }
          sheetHeight.value = withSpring(heights[target], SPRING);
          runOnJS(recordSheetSnap)(target);
        });
  }, [activeOffset, heights, sheetHeight, startHeight]);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.background,
    overflow: "hidden",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  grabberArea: { height: 24, alignItems: "center", justifyContent: "center" },
  grabber: { width: 40, height: 5, borderRadius: radius.pill, backgroundColor: colors.border },
  pages: { flex: 1 },
  tabBarFrame: { position: "absolute", left: 0, right: 0, bottom: 0 },
});
