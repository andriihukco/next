import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import { MAP_HTML } from "./map/map-html";
import { WALK_TRACK } from "../data/walk-track";
import { buildTrack, pointAt, walkedPath } from "../lib/geo";

const TRACK = buildTrack(WALK_TRACK.coordinates);
const TRACK_LATLNG = WALK_TRACK.coordinates.map(([lat, lng]) => [lat, lng]);

type Props = {
  /** 0 → 1 along the track. */
  progress: number;
  /** Keep the walker centred while progress changes. */
  follow?: boolean;
  /** Space at the bottom of the map that the floating card covers, in points. */
  bottomInset?: number;
};

/** Onboarding map: the walk track on the same MapLibre page as the home map. */
export function WalkMap({ progress, follow = false, bottomInset = 0 }: Props) {
  const webRef = useRef<{ postMessage: (message: string) => void } | null>(null);
  const [ready, setReady] = useState(false);
  const fitSent = useRef(false);

  useEffect(() => {
    if (!ready) return;
    const km = progress * TRACK.lengthKm;
    const walker = pointAt(TRACK, km).coordinate;
    const walked = walkedPath(TRACK, km).map((p) => [p.latitude, p.longitude]);
    const message = {
      walk: {
        track: TRACK_LATLNG,
        walked,
        walker: { lat: walker.latitude, lng: walker.longitude },
        follow,
        // Fit the whole track once; later updates only move the walker.
        bottomInset: fitSent.current ? undefined : bottomInset,
      },
    };
    fitSent.current = true;
    webRef.current?.postMessage(JSON.stringify(message));
  }, [ready, progress, follow, bottomInset]);

  const onMessage = (event: WebViewMessageEvent) => {
    const message = JSON.parse(event.nativeEvent.data) as { type: string };
    if (message.type === "ready") setReady(true);
  };

  return (
    <WebView
      ref={(instance: unknown) => {
        webRef.current = instance as { postMessage: (message: string) => void } | null;
      }}
      style={styles.map}
      source={{ html: MAP_HTML }}
      originWhitelist={["*"]}
      onMessage={onMessage}
      scrollEnabled={false}
      bounces={false}
    />
  );
}

const styles = StyleSheet.create({
  map: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#f8faf9" },
});
