import { useEffect, useState } from "react";
import { fetchAirAlert, type AirAlert } from "../lib/alerts-api";

const POLL_MS = 30_000; // Same cadence as the web app.

export function useAirAlert() {
  const [alert, setAlert] = useState<AirAlert | null>(null);

  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      controller = new AbortController();
      try {
        const next = await fetchAirAlert(controller.signal);
        if (active && next) setAlert(next);
      } catch {
        // Keep the last known state. The pill shows nothing when there is no alert.
      } finally {
        if (active) timer = setTimeout(poll, POLL_MS);
      }
    };
    void poll();

    return () => {
      active = false;
      controller?.abort();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return alert;
}
