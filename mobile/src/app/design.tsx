import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { tokens } from "../lib/tokens.generated";
import { colors, themed } from "../lib/theme";
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  IconButton,
  IconOrb,
  ListRow,
  Page,
  PlatformOverride,
  RouteBadge,
  Row,
  Section,
  Segmented,
  space,
  Surface,
  SwitchRow,
  Txt,
  useUiPlatform,
  type TypeRole,
  type UiPlatform,
} from "../ui";

const PLATFORMS = [
  { id: "ios", label: "iOS" },
  { id: "android", label: "Android" },
] as const;
const ROLES = Object.keys(tokens.type.ios) as TypeRole[];
const SWATCHES = ["background", "card", "surfaceMuted", "border", "foreground", "mutedForeground", "primary", "accent", "accentForeground", "destructive"] as const;

/**
 * The mobile design library: every element of src/ui in its states, for iOS and Android.
 * The web /design page embeds this screen (Expo web) for its iOS and Android tabs. Documented in design/.
 */
export default function DesignScreen() {
  const { os: param, embed } = useLocalSearchParams<{ os?: string; embed?: string }>();
  const device = useUiPlatform();
  const [platform, setPlatform] = useState<UiPlatform>(param === "android" || param === "ios" ? param : device);
  return (
    <>
      <Stack.Screen options={{ title: "Дизайн-система", headerShown: embed !== "1" }} />
      <PlatformOverride platform={platform}>
        <Gallery platform={platform} onPlatform={setPlatform} embedded={embed === "1"} />
      </PlatformOverride>
    </>
  );
}

function Gallery({ platform, onPlatform, embedded }: { platform: UiPlatform; onPlatform: (next: UiPlatform) => void; embedded: boolean }) {
  const [chip, setChip] = useState("bus");
  const [segment, setSegment] = useState<"list" | "grid">("list");
  const [toggle, setToggle] = useState(true);
  return (
    <Page>
      {!embedded ? <Segmented options={PLATFORMS} value={platform} onChange={onPlatform} /> : null}

      <Section title="Типографіка" footer={`Ролі з design/tokens.json. ${platform === "ios" ? "Розміри Apple HIG." : "Розміри Material 3."}`}>
        <Surface padded>
          {ROLES.map((role) => (
            <Row key={role} style={{ justifyContent: "space-between" }}>
              <Txt variant={role} numberOfLines={1} style={{ flex: 1 }}>
                {role === "largeTitle" ? "Транспорт" : role === "title" ? "Площа Ринок" : "Трамвай 2 · 4 хв"}
              </Txt>
              <Txt variant="caption" tone="muted">
                {role} {tokens.type[platform][role].size}
              </Txt>
            </Row>
          ))}
        </Surface>
      </Section>

      <Section title="Кольори" footer="Ядро палітри спільне з вебом. Перевірка: npm run design:tokens.">
        <View style={styles.swatches}>
          {SWATCHES.map((name) => (
            <View key={name} style={styles.swatch}>
              <View style={[styles.swatchColor, { backgroundColor: colors[name] }]} />
              <Txt variant="caption" tone="muted" numberOfLines={1}>
                {name}
              </Txt>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Кнопки" footer="Одна filled-дія на екран. iOS: заокруглений прямокутник і тактильний відгук. Android: «пігулка» і ripple.">
        <Surface padded>
          <Button label="Маршрут" icon="directions" onPress={() => {}} />
          <Button label="На мапі" icon="map" variant="tonal" onPress={() => {}} />
          <Button label="Скасувати" variant="outline" onPress={() => {}} />
          <Button label="Забули пароль?" variant="plain" onPress={() => {}} />
          <Button label="Видалити обліковий запис" variant="danger" onPress={() => {}} />
          <Button label="Зберегти" size="lg" stretch onPress={() => {}} />
          <Button label="Недоступно" disabled onPress={() => {}} />
          <Row>
            <IconButton icon="share" label="Поділитися" onPress={() => {}} />
            <IconButton icon="bookmark-border" label="Зберегти" onPress={() => {}} />
            <IconButton icon="close" label="Закрити" onPress={() => {}} filled={false} />
          </Row>
        </Surface>
      </Section>

      <Section title="Фільтри" footer="iOS: капсула. Android: filter chip з галочкою.">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {[
            { id: "bus", label: "Автобуси · 335" },
            { id: "tram", label: "Трамваї · 57" },
            { id: "trolleybus", label: "Тролейбуси · 44" },
          ].map((item) => (
            <Chip key={item.id} label={item.label} selected={chip === item.id} onPress={() => setChip(item.id)} />
          ))}
          <Chip label="Недоступно" selected={false} onPress={() => {}} disabled />
        </ScrollView>
        <Segmented
          options={[
            { id: "list", label: "Список" },
            { id: "grid", label: "Сітка" },
          ]}
          value={segment}
          onChange={setSegment}
        />
      </Section>

      <Section title="Списки" grouped footer="iOS: плитка-іконка, шеврон, відступ розділювача. Android: іконка без плитки, без шеврона.">
        <ListRow icon="signpost" title="Площа Ринок" subtitle="2 · 6 · 9 · 46" value="250 м" onPress={() => {}} />
        <ListRow icon="restaurant" iconColor="#16804f" title="Кав’ярня на Вірменській" subtitle="Кафе · Вірменська, 13" value="1,2 км" onPress={() => {}} />
        <SwitchRow icon="campaign" iconColor="#dc2626" title="Початок тривоги" value={toggle} onValueChange={setToggle} />
        <ListRow icon="radar" title="Загрози для Львова" trailing={<Badge label="Незабаром" />} />
        <ListRow icon="delete-outline" iconColor="#b42318" title="Очистити дані" destructive onPress={() => {}} navigates={false} last />
      </Section>

      <Section title="Мітки й маршрути">
        <Row style={{ flexWrap: "wrap" }}>
          <Badge label="Демо" tone="warning" />
          <Badge label="Оцінка" />
          <Badge label="Наживо · GPS" tone="live" />
          <Badge label="Beta" tone="accent" />
        </Row>
        <Row>
          <RouteBadge route="2" color="#f97316" />
          <RouteBadge route="31" color="#3b82f6" />
          <RouteBadge route="46" color="#22c55e" />
          <RouteBadge route="9" color="#f97316" size="lg" />
          <IconOrb icon="school" color="#6473bf" />
          <IconOrb icon="restaurant" color="#16804f" size={56} />
        </Row>
      </Section>

      <Section title="Порожній стан">
        <Surface>
          <EmptyState icon="zoom-in" title="Наблизьте мапу" text="Місця завантажуються для області, яку видно на мапі." action={{ label: "Відкрити мапу", onPress: () => {} }} />
        </Surface>
      </Section>
    </Page>
  );
}

const styles = themed(() => ({
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  swatch: { width: 72, gap: space.xs },
  swatchColor: { height: 48, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
}));
