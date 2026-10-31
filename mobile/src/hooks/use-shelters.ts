import { useEffect, useState } from "react";
import { fetchShelters, type Shelter } from "../lib/alerts-api";

/** Shelters change rarely, so they are loaded once per session. */
export function useShelters() {
  const [shelters, setShelters] = useState<Shelter[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetchShelters(controller.signal)
      .then(setShelters)
      .catch(() => setShelters([]));
    return () => controller.abort();
  }, []);

  return shelters;
}
