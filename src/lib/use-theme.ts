import { useSyncExternalStore } from "react";

// Light, dark, or follow the system (D4, DESIGN.md §2b). The choice is stored on
// the device. `data-theme` on <html> is what the CSS reads; no attribute means
// "follow the system".

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "eway-theme";
const systemQuery = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch (error) {
    console.error("Could not read the theme preference.", error);
  }
  return "system";
}

let preference: ThemePreference = readPreference();

function applyToDocument(): void {
  const root = document.documentElement;
  if (preference === "system") delete root.dataset.theme;
  else root.dataset.theme = preference;
}

function resolve(value: ThemePreference): ResolvedTheme {
  if (value !== "system") return value;
  return systemQuery?.matches ? "dark" : "light";
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

applyToDocument();
systemQuery?.addEventListener("change", () => {
  if (preference === "system") emit();
});

export function setThemePreference(value: ThemePreference): void {
  preference = value;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch (error) {
    console.error("Could not save the theme preference.", error);
  }
  applyToDocument();
  emit();
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, () => preference, () => "system");
}

export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(
    subscribe,
    () => resolve(preference),
    () => "light",
  );
}
