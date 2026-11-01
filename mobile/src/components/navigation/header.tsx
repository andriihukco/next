import { Platform } from "react-native";
import type { NativeStackNavigationOptions } from "expo-router";
import { colors, fonts } from "../../lib/theme";
import { AvatarButton } from "../../ui";
import { openProfile } from "../../lib/navigation";

/** Header for pushed pages: back button with the previous title on iOS, Material top app bar on Android. */
export function pageHeaderOptions(): NativeStackNavigationOptions {
  return {
    headerShown: true,
    headerBackTitle: "Назад",
    headerTintColor: colors.primary,
    headerTitleStyle: { fontFamily: fonts.bold, color: colors.foreground },
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.background },
  };
}

/** Root page of a tab: iOS large title that collapses on scroll, profile avatar on the right. */
export function tabRootHeaderOptions(title: string): NativeStackNavigationOptions {
  return {
    ...pageHeaderOptions(),
    title,
    headerLargeTitle: Platform.OS === "ios",
    headerLargeTitleShadowVisible: false,
    headerLargeTitleStyle: { fontFamily: fonts.extrabold, color: colors.foreground },
    headerRight: () => <AvatarButton onPress={openProfile} />,
  };
}
