import { Stack } from "expo-router";
import { useFonts, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { ThemeProvider } from "../lib/theme-provider";
import { DevSimProvider } from "../lib/dev-sim";
import { CityDataProvider } from "../lib/city-data";
import { DevTools } from "../components/dev/dev-tools";
import { pageHeaderOptions } from "../components/navigation/header";

/**
 * Root: the five tabs, and the pages that push over them with a native header and back button
 * (design/navigation.md). Nothing floats over another page except short system sheets.
 */
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
        <CityDataProvider>
          <RootStack />
          <DevTools />
        </CityDataProvider>
      </DevSimProvider>
    </ThemeProvider>
  );
}

/** Rendered under ThemeProvider, so headers and backgrounds follow the active palette. */
function RootStack() {
  const page = pageHeaderOptions();
  return (
    <Stack screenOptions={{ ...page, headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="vehicle/[id]" options={{ ...page, title: "Транспорт" }} />
      <Stack.Screen name="stop/[id]" options={{ ...page, title: "Зупинка" }} />
      <Stack.Screen name="shelter/[id]" options={{ ...page, title: "Укриття" }} />
      <Stack.Screen name="place" options={{ ...page, title: "" }} />
      <Stack.Screen name="service/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ ...page, title: "Профіль" }} />
      <Stack.Screen name="profile-edit" options={{ ...page, title: "Мій профіль" }} />
      <Stack.Screen name="route/[key]" options={{ ...page, title: "Маршрут" }} />
      <Stack.Screen name="account" options={{ ...page, title: "Обліковий запис" }} />
      <Stack.Screen name="directions" options={{ headerShown: false }} />
      <Stack.Screen name="design" options={{ ...page, title: "Дизайн-система" }} />
    </Stack>
  );
}
