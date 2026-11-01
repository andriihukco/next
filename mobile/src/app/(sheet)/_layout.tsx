import { Stack } from "expo-router";
import { CityBackdrop } from "../../components/map/city-backdrop";
import { SheetShell } from "../../components/sheet/sheet-shell";
import { pageHeaderOptions } from "../../components/navigation/header";

const page = pageHeaderOptions();

/** The sheet opens on Транспорт; pushes from it stack above it. */
export const unstable_settings = { initialRouteName: "transport" };

/**
 * Every page of the app lives in this bottom sheet over the live map: the tab roots and the pages
 * pushed from them. The tab bar stays at the bottom (design/navigation.md).
 */
export default function SheetLayout() {
  return (
    <SheetShell backdrop={<CityBackdrop />}>
      <Stack screenOptions={page}>
        <Stack.Screen name="vehicle/[id]" options={{ ...page, title: "Транспорт" }} />
        <Stack.Screen name="stop/[id]" options={{ ...page, title: "Зупинка" }} />
        <Stack.Screen name="shelter/[id]" options={{ ...page, title: "Укриття" }} />
        <Stack.Screen name="place" options={{ ...page, title: "" }} />
        <Stack.Screen name="service/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ ...page, title: "Профіль" }} />
        <Stack.Screen name="profile-edit" options={{ ...page, title: "Мій профіль" }} />
        <Stack.Screen name="route/[key]" options={{ ...page, title: "Маршрут" }} />
        <Stack.Screen name="account" options={{ ...page, title: "Обліковий запис" }} />
      </Stack>
    </SheetShell>
  );
}
