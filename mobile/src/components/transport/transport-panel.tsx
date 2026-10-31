import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, PanResponder, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { GlassSurface } from "../glass-surface";
import { SectionTabs, type CitySection } from "./section-tabs";
import { TransitSourceBanner } from "./transit-source-banner";
import { CategoryOrbs, type TransportTab } from "./category-orbs";
import { TransitRouteList } from "./transit-route-list";
import { PlacesPanel } from "../places/places-panel";
import { ServicesPanel } from "../services/services-panel";
import { colors, radius } from "../../lib/theme";
import type { Vehicle } from "../../lib/transit-types";
import type { CityPlace } from "../../lib/places-api";

const SHEET_RATIO = 0.94; // Sheet height; the snap points move it up and down inside this.
const HALF_VISIBLE_RATIO = 0.56;
const COLLAPSED_VISIBLE = 210; // Grabber, header and section tabs stay visible.
const FLICK_MS = 180; // A release velocity projects the sheet this far ahead.

type Snap = "full" | "half" | "collapsed";

type Props = {
  section: CitySection;
  vehicles: Vehicle[];
  simulated: boolean;
  onUseLive: () => void;
  onSelectVehicle: (id: string) => void;
  places: CityPlace[];
  origin: { latitude: number; longitude: number };
  hasUserLocation: boolean;
  onOpenPlace: (place: CityPlace) => void;
  onShowPlaceOnMap: (place: CityPlace) => void;
  onDirectionsToPlace: (place: CityPlace) => void;
};

/** The city sheet: sections and content in a glass sheet that snaps between three heights. */
export function TransportPanel({
  section,
  vehicles,
  simulated,
  onUseLive,
  onSelectVehicle,
  places,
  origin,
  hasUserLocation,
  onOpenPlace,
  onShowPlaceOnMap,
  onDirectionsToPlace,
}: Props) {
  const { height } = useWindowDimensions();
  const sheetHeight = height * SHEET_RATIO;
  const snapOffset = useMemo(
    () => ({
      full: 0,
      half: sheetHeight - height * HALF_VISIBLE_RATIO,
      collapsed: sheetHeight - COLLAPSED_VISIBLE,
    }),
    [height, sheetHeight],
  );

  const [tab, setTab] = useState<TransportTab>("nearby");
  const [flowOpen, setFlowOpen] = useState(false);

  // Vertical offset of the sheet: 0 is fully open, larger values slide it down.
  const offset = useRef(new Animated.Value(snapOffset.half)).current;
  const current = useRef(snapOffset.half);
  const snapTo = (snap: Snap) => {
    current.current = snapOffset[snap];
    Animated.spring(offset, { toValue: snapOffset[snap], damping: 24, stiffness: 260, mass: 1, useNativeDriver: true }).start();
  };

  useEffect(() => {
    offset.setValue(snapOffset.half);
    current.current = snapOffset.half;
  }, [offset, snapOffset]);

  // Service flows (order, booking, checkout) need the whole screen.
  useEffect(() => {
    snapTo(flowOpen ? "full" : "half");
    // snapTo is stable enough; the flow state is the only trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowOpen]);

  const grabber = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderGrant: () => {
          offset.stopAnimation((value) => {
            current.current = value;
          });
        },
        onPanResponderMove: (_, gesture) => {
          const next = Math.min(Math.max(current.current + gesture.dy, snapOffset.full), snapOffset.collapsed);
          offset.setValue(next);
        },
        onPanResponderRelease: (_, gesture) => {
          const projected = Math.min(
            Math.max(current.current + gesture.dy + gesture.vy * FLICK_MS, snapOffset.full),
            snapOffset.collapsed,
          );
          const nearest = (Object.keys(snapOffset) as Snap[]).reduce((best, snap) =>
            Math.abs(snapOffset[snap] - projected) < Math.abs(snapOffset[best] - projected) ? snap : best,
          );
          snapTo(nearest);
        },
      }),
    // Reading the snap points through refs keeps the responder stable while the sheet moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [offset, snapOffset],
  );

  const counts = useMemo<Record<TransportTab, number>>(
    () => ({
      nearby: vehicles.length,
      bus: vehicles.filter((v) => v.type === "bus").length,
      tram: vehicles.filter((v) => v.type === "tram").length,
      trolleybus: vehicles.filter((v) => v.type === "trolleybus").length,
      taxi: vehicles.filter((v) => v.type === "taxi").length,
    }),
    [vehicles],
  );

  const shown = useMemo(
    () => (tab === "nearby" ? vehicles : vehicles.filter((v) => v.type === tab)),
    [vehicles, tab],
  );

  return (
    <Animated.View style={[styles.sheet, { height: sheetHeight, transform: [{ translateY: offset }] }]}>
      <GlassSurface style={styles.surface}>
        <View {...grabber.panHandlers}>
          <View style={styles.grabber} />
        </View>

        {section === "transport" ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <TransitSourceBanner simulated={simulated} onUseLive={onUseLive} />
            <CategoryOrbs value={tab} counts={counts} onChange={setTab} />
            <TransitRouteList vehicles={shown} onSelectVehicle={onSelectVehicle} />
          </ScrollView>
        ) : section === "places" ? (
          <PlacesPanel
            places={places}
            origin={origin}
            hasUserLocation={hasUserLocation}
            onOpen={onOpenPlace}
            onShowOnMap={onShowPlaceOnMap}
            onDirections={onDirectionsToPlace}
          />
        ) : (
          <View style={styles.flexFill}>
            <ServicesPanel onFlowChange={setFlowOpen} />
          </View>
        )}
      </GlassSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0 },
  surface: {
    flex: 1,
    padding: 0,
    borderTopLeftRadius: radius.xl * 1.5,
    borderTopRightRadius: radius.xl * 1.5,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: 8,
  },
  body: { paddingHorizontal: 16, paddingBottom: 24, gap: 4 },
  flexFill: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
});
