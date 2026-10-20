import { useCallback, useState } from "react";

// The `un-` prefix stays until the brand decision (DESIGN.md D2) renames all keys at once.
const SAVED_ITEMS_KEY = "un-saved-items";

function readSaved(): Set<string> {
  try {
    const raw = localStorage.getItem(SAVED_ITEMS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
  } catch (error) {
    console.error("Could not read saved items.", error);
    return new Set();
  }
}

/** Places, events and listings the user saved. Kept on this device only. */
export function useSavedItems(): [ReadonlySet<string>, (id: string) => void] {
  const [saved, setSaved] = useState<Set<string>>(readSaved);
  const toggle = useCallback((id: string) => {
    setSaved((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify([...next]));
      } catch (error) {
        console.error("Could not save the item.", error);
      }
      return next;
    });
  }, []);
  return [saved, toggle];
}
