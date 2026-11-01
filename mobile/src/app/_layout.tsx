import { Stack } from "expo-router";
import { useFonts, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { colors } from "../lib/theme";
import { ThemeProvider } from "../lib/theme-provider";
import { DevSimProvider } from "../lib/dev-sim";
import { DevTools } from "../components/dev/dev-tools";

export default function RootLayout() {
  const [loaded] = useFonts({
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  if (!loaded) return null;

  return (
    <ThemeProvider>
      <DevSimProvider>
        <ThemedStack />
        <DevTools />
      </DevSimProvider>
    </ThemeProvider>
  );
}

/** Rendered under ThemeProvider, so the screen background follows the active palette. */
function ThemedStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
