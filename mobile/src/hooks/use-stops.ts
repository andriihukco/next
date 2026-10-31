import { useEffect, useState } from "react";
import { fetchStops } from "../lib/transit-api";
import type { Stop } from "../lib/transit-types";

/** Stops change rarely, so they are loaded once per session. */
export function useStops() {
  const [stops, setStops] = useState<Stop[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetchStops(controller.signal)
      .then(setStops)
      .catch(() => setStops([]));
    return () => controller.abort();
  }, []);

  return stops;
}
