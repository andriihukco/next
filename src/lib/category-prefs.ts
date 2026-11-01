import { useCallback, useState } from "react";

/**
 * @file category-prefs.ts
 * @description Which place categories the Categories tab shows. Stored only on this device.
 *   Hidden categories stay in the data; they only leave the Categories grid and the category lists.
 */

export const CATEGORY_PREFS_KEY = "eway-category-prefs";

function readHidden(): Set<string> {
  try {
    const raw = localStorage.getItem(CATEGORY_PREFS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
  } catch (error) {
    console.error("Could not read category settings.", error);
    return new Set();
  }
}

/** Hidden category ids, plus a toggle that saves the change. */
export function useHiddenCategories(): [ReadonlySet<string>, (id: string, shown: boolean) => void, () => void] {
  const [hidden, setHidden] = useState<Set<string>>(readHidden);

  const save = useCallback((next: Set<string>) => {
    try {
      localStorage.setItem(CATEGORY_PREFS_KEY, JSON.stringify([...next]));
    } catch (error) {
      console.error("Could not save category settings.", error);
    }
    return next;
  }, []);

  const setShown = useCallback(
    (id: string, shown: boolean) => {
      setHidden((current) => {
        const next = new Set(current);
        if (shown) next.delete(id);
        else next.add(id);
        return save(next);
      });
    },
    [save],
  );

  const reset = useCallback(() => setHidden(save(new Set())), [save]);

  return [hidden, setShown, reset];
}
