import { Stack, useLocalSearchParams } from "expo-router";
import { pageHeaderOptions } from "../../../components/navigation/header";
import { CategoryList, EducationList } from "../../../components/more/section-lists";
import { MORE_SECTIONS } from "../../../lib/section-tabs";
import { EmptyState, Page } from "../../../ui";

/** One section under Більше. Education has its own kinds; the rest list the map places of their categories. */
export default function MoreSectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const section = MORE_SECTIONS.find((item) => item.id === id);

  if (!section) {
    return (
      <>
        <Stack.Screen options={{ ...pageHeaderOptions(), title: "Розділ" }} />
        <Page>
          <EmptyState icon="search-off" title="Розділу немає" text="Оберіть розділ у списку «Більше»." />
        </Page>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ ...pageHeaderOptions(), title: section.label }} />
      <Page>{section.id === "education" ? <EducationList /> : <CategoryList id={section.id} icon={section.icon} />}</Page>
    </>
  );
}
