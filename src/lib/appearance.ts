import { useSyncExternalStore } from "react";

// Appearance presets (DESIGN.md §3, §4): text size, density and UI font. The choice is
// stored on the device and written to <html> as data attributes; index.css maps each value
// to tokens. Imported once at startup so the saved look applies before the first paint.

export type FontSize = "s" | "m" | "l";
export type Density = "compact" | "comfortable";
export type UiFontId = "manrope" | "inter" | "golos" | "onest" | "pt-sans";

export type Appearance = {
  fontSize: FontSize;
  density: Density;
  font: UiFontId;
};

/** Five sans-serif UI fonts with Cyrillic support. Serif faces are excluded on purpose. */
export const UI_FONTS: { id: UiFontId; label: string }[] = [
  { id: "manrope", label: "Manrope" },
  { id: "inter", label: "Inter" },
  { id: "golos", label: "Golos Text" },
  { id: "onest", label: "Onest" },
  { id: "pt-sans", label: "PT Sans" },
];

export const DEFAULT_APPEARANCE: Appearance = { fontSize: "m", density: "comfortable", font: "manrope" };

const STORAGE_KEY = "eway-appearance";
const listeners = new Set<() => void>();

function readAppearance(): Appearance {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<Appearance> | null;
    if (!stored) return DEFAULT_APPEARANCE;
    return {
      fontSize: stored.fontSize === "s" || stored.fontSize === "l" ? stored.fontSize : "m",
      density: stored.density === "compact" ? "compact" : "comfortable",
      font: UI_FONTS.some((item) => item.id === stored.font) ? (stored.font as UiFontId) : "manrope",
    };
  } catch (error) {
    console.error("Could not read the appearance preferences.", error);
    return DEFAULT_APPEARANCE;
  }
}

let current: Appearance = readAppearance();

function applyToDocument(): void {
  const root = document.documentElement;
  root.dataset.fontSize = current.fontSize;
  root.dataset.density = current.density;
  root.dataset.font = current.font;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

applyToDocument();

export function setAppearance(next: Partial<Appearance>): void {
  current = { ...current, ...next };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (error) {
    console.error("Could not save the appearance preferences.", error);
  }
  applyToDocument();
  listeners.forEach((listener) => listener());
}

export function useAppearance(): Appearance {
  return useSyncExternalStore(subscribe, () => current, () => DEFAULT_APPEARANCE);
}
