import { router, Stack } from "expo-router";
import { tabRootHeaderOptions } from "../../../components/navigation/header";
import { MORE_SECTIONS } from "../../../lib/section-tabs";
import { ListRow, Page, Section } from "../../../ui";

const openSection = (id: string): void => router.push({ pathname: "/more/[id]", params: { id } });

/** Більше: the city sections that do not have their own tab, the same list as the web. */
export default function MoreScreen() {
  return (
    <>
      <Stack.Screen options={tabRootHeaderOptions("Більше")} />
      <Page>
        <Section grouped footer="Розділи міста, як на вебі. Заклади беруться з мапи.">
          {MORE_SECTIONS.map((section, index) => (
            <ListRow
              key={section.id}
              icon={section.icon}
              title={section.label}
              onPress={() => openSection(section.id)}
              last={index === MORE_SECTIONS.length - 1}
            />
          ))}
        </Section>
      </Page>
    </>
  );
}
