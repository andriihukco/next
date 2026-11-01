import { Redirect } from "expo-router";

/** The map is not a page; the sheet opens on Транспорт. */
export default function Index() {
  return <Redirect href="/transport" />;
}
