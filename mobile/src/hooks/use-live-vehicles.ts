import { useEffect, useState } from "react";
import { fetchVehicles } from "../lib/transit-api";
import type { Vehicle } from "../lib/transit-types";

const POLL_MS = 2500; // Same cadence as the web app's feed refresh.

/** Polls live vehicle positions. Keeps the last good list when a request fails. */
export function useLiveVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      controller = new AbortController();
      try {
        const next = await fetchVehicles(controller.signal);
        if (!active) return;
        setVehicles(next);
        setUpdatedAt(Date.now());
        setFailed(false);
      } catch {
        if (active) setFailed(true);
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

  return { vehicles, updatedAt, failed };
}
