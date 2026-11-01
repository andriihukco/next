import { Stack } from "expo-router";
import { pageHeaderOptions } from "../../../components/navigation/header";

/** The tab's own stack, so its root page gets a native header with a large title on iOS. */
export default function TabStackLayout() {
  return <Stack screenOptions={pageHeaderOptions()} />;
}
