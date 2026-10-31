import { Stack } from "expo-router";
import { useFonts, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { colors } from "../lib/theme";
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
    <DevSimProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <DevTools />
    </DevSimProvider>
  );
}
