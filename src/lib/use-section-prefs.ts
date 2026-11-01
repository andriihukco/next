import { useCallback, useState } from "react";
import { type SectionPrefs, readSectionPrefs, writeSectionPrefs } from "./section-prefs";

/** The section list kept on this device. Each change is written to storage at once. */
export function useSectionPrefs(ids: readonly string[]): [SectionPrefs, (change: (prefs: SectionPrefs) => SectionPrefs) => void] {
  const [prefs, setPrefs] = useState<SectionPrefs>(() => readSectionPrefs(ids));
  const update = useCallback((change: (prefs: SectionPrefs) => SectionPrefs) => {
    setPrefs((current) => {
      const next = change(current);
      writeSectionPrefs(next);
      return next;
    });
  }, []);
  return [prefs, update];
}
