import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import { MAP_HTML } from "./map-html";
import type { LatLng } from "../../../../src/lib/navigation";

type Props = {
  route: LatLng[] | null;
  routeColor: string;
  origin: LatLng | null;
};

/** Directions map: draws the route, the user's position, and fits the whole route on screen. */
export function RouteMap({ route, routeColor, origin }: Props) {
  const webRef = useRef<{ postMessage: (message: string) => void } | null>(null);
  const [ready, setReady] = useState(false);

  const post = (message: object) => webRef.current?.postMessage(JSON.stringify(message));

  useEffect(() => {
    if (!ready) return;
    post({ user: origin });
  }, [ready, origin]);

  useEffect(() => {
    if (!ready) return;
    post({
      route: route ? route.map((p) => [p.latitude, p.longitude]) : null,
      routeColor,
    });
    if (route && route.length > 1) post({ fit: route.map((p) => [p.latitude, p.longitude]) });
  }, [ready, route, routeColor]);

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
  map: { flex: 1, backgroundColor: "#f8faf9" },
});
