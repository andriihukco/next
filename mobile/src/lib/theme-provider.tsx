import { createContext, Fragment, useContext, useEffect, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { setActiveScheme, type ColorScheme } from "./theme";

/** Системна, Світла or Темна, as in the web's Налаштування → Вигляд (DESIGN.md §2b). */
export type ThemePreference = "system" | "light" | "dark";

/** Same storage key as the web app. */
const STORAGE_KEY = "eway-theme";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ColorScheme;
  setPreference: (next: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  preference: "system",
  resolved: "light",
  setPreference: () => {},
});

export function useThemePreference(): ThemeContextValue {
  return useContext(ThemeContext);
}

/**
 * Picks the palette before anything below reads `colors`. On a change the tree under it
 * re-mounts, so every themed style sheet and the map page are rebuilt for the new palette.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === "light" || saved === "dark") setPreferenceState(saved);
      })
      .finally(() => setLoaded(true));
  }, []);

  const resolved: ColorScheme = preference === "system" ? (system === "dark" ? "dark" : "light") : preference;
  setActiveScheme(resolved);

  const setPreference = (next: ThemePreference): void => {
    setPreferenceState(next);
    // Without a saved choice the system preference applies, as on the web.
    void (next === "system" ? AsyncStorage.removeItem(STORAGE_KEY) : AsyncStorage.setItem(STORAGE_KEY, next));
  };

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference }}>
      <StatusBar style={resolved === "dark" ? "light" : "dark"} />
      <Fragment key={resolved}>{children}</Fragment>
    </ThemeContext.Provider>
  );
}
