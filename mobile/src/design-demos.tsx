import { useState, type ReactNode } from "react";
import { View } from "react-native";
import { Badge, Button, Chip, Divider, Glass, GlassBar, IconButton, Page, Row, Section, Segmented, Surface, SwitchRow, Txt, space } from "./ui";

/**
 * One mobile demo per web component that has a mobile counterpart in src/ui. The web component page
 * (src/design-system/component-docs.tsx) opens /design?component=<slug> to render the demo in the
 * device frame. Keys are the web slugs. A web component without a key has no mobile element yet.
 */
function ButtonDemo() {
  return (
    <Surface padded>
      <Button label="Маршрут" icon="directions" onPress={() => {}} />
      <Button label="На мапі" icon="map" variant="tonal" onPress={() => {}} />
      <Button label="Скасувати" variant="outline" onPress={() => {}} />
      <Button label="Забули пароль?" variant="plain" onPress={() => {}} />
      <Button label="Видалити обліковий запис" variant="danger" onPress={() => {}} />
      <Button label="Недоступно" disabled onPress={() => {}} />
    </Surface>
  );
}

function IconButtonDemo() {
  return (
    <Surface padded>
      <Row>
        <IconButton icon="share" label="Поділитися" onPress={() => {}} />
        <IconButton icon="bookmark-border" label="Зберегти" onPress={() => {}} />
        <IconButton icon="close" label="Закрити" onPress={() => {}} filled={false} />
      </Row>
    </Surface>
  );
}

function ToggleDemo() {
  const [selected, setSelected] = useState(true);
  return (
    <Row style={{ flexWrap: "wrap" }}>
      <Chip label="Карта" icon="map" selected={selected} onPress={() => setSelected(!selected)} />
      <Chip label="Недоступно" selected={false} onPress={() => {}} disabled />
    </Row>
  );
}

function ToggleGroupDemo() {
  const [value, setValue] = useState<"list" | "grid">("list");
  return (
    <Segmented
      options={[
        { id: "list", label: "Список" },
        { id: "grid", label: "Сітка" },
      ]}
      value={value}
      onChange={setValue}
    />
  );
}

function SwitchDemo() {
  const [value, setValue] = useState(true);
  return (
    <Surface>
      <SwitchRow icon="campaign" iconColor="#dc2626" title="Початок тривоги" value={value} onValueChange={setValue} last />
    </Surface>
  );
}

function BadgeDemo() {
  return (
    <Row style={{ flexWrap: "wrap" }}>
      <Badge label="Демо" tone="warning" />
      <Badge label="Оцінка" />
      <Badge label="Наживо · GPS" tone="live" />
      <Badge label="Beta" tone="accent" />
    </Row>
  );
}

function CardDemo() {
  return (
    <Surface padded>
      <Txt variant="headline">Площа Ринок</Txt>
      <Txt variant="footnote" tone="muted">
        2 · 6 · 9 · 46 · 250 м
      </Txt>
    </Surface>
  );
}

function TabsDemo() {
  const [value, setValue] = useState<"places" | "transport">("places");
  return (
    <Segmented
      options={[
        { id: "places", label: "Місця" },
        { id: "transport", label: "Транспорт" },
      ]}
      value={value}
      onChange={setValue}
    />
  );
}

function SeparatorDemo() {
  return (
    <Surface padded>
      <Txt>Above</Txt>
      <Divider />
      <Txt>Below</Txt>
    </Surface>
  );
}

function GlassDemo() {
  return (
    <View style={{ gap: space.md }}>
      <Glass style={{ padding: space.lg }}>
        <Txt variant="headline">Regular</Txt>
        <Txt variant="footnote" tone="muted">Над мапою, для плаваючих елементів</Txt>
      </Glass>
      <Glass variant="clear" style={{ padding: space.lg }}>
        <Txt variant="headline">Clear</Txt>
        <Txt variant="footnote" tone="muted">Для фото й мапи під ним</Txt>
      </Glass>
      <Glass variant="tinted" style={{ padding: space.lg }}>
        <Txt variant="headline" tone="accent">Tinted</Txt>
        <Txt variant="footnote" tone="muted">Вибраний стан</Txt>
      </Glass>
    </View>
  );
}

function GlassBarDemo() {
  return (
    <GlassBar
      title="Транспорт"
      leading={<IconButton icon="arrow-back" label="Назад" onPress={() => {}} />}
      trailing={<IconButton icon="more-horiz" label="Ще" onPress={() => {}} />}
    />
  );
}

export const MOBILE_DEMOS: Record<string, () => ReactNode> = {
  glass: GlassDemo,
  "top-bar": GlassBarDemo,
  button: ButtonDemo,
  "icon-button": IconButtonDemo,
  toggle: ToggleDemo,
  "toggle-group": ToggleGroupDemo,
  switch: SwitchDemo,
  badge: BadgeDemo,
  card: CardDemo,
  tabs: TabsDemo,
  separator: SeparatorDemo,
};

/** Renders one demo alone, for the web component page's device frame. */
export function MobileDemoPage({ slug }: { slug: string }) {
  const Demo = MOBILE_DEMOS[slug];
  return (
    <Page>
      <Section>
        {Demo ? (
          <View style={{ gap: space.md }}>
            <Demo />
          </View>
        ) : (
          <Surface padded>
            <Txt tone="muted">Немає мобільного аналога для цього компонента.</Txt>
          </Surface>
        )}
      </Section>
    </Page>
  );
}
