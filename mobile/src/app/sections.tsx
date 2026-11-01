import { Fragment, useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { CONFIGURABLE_TABS, TAB_META, type ConfigurableTab } from "../lib/section-tabs";
import {
  defaultSectionPrefs,
  moveSectionTo,
  readSectionPrefs,
  sortSectionIds,
  toggleSectionFavorite,
  toggleSectionHidden,
  writeSectionPrefs,
  type SectionPrefs,
} from "../lib/section-prefs";
import { Divider, IconButton, ListRow, Page, Section, SwitchRow, Txt } from "../ui";

/** Вкладки: show or hide each tab, pin favourites above the divider, and move tabs up or down. */
export default function SectionsScreen() {
  const [prefs, setPrefs] = useState<SectionPrefs>(() => defaultSectionPrefs(CONFIGURABLE_TABS));

  useFocusEffect(
    useCallback(() => {
      void readSectionPrefs(CONFIGURABLE_TABS).then(setPrefs);
    }, []),
  );

  const update = (change: (current: SectionPrefs) => SectionPrefs) => {
    const next = change(prefs);
    setPrefs(next);
    void writeSectionPrefs(next);
  };

  const ids = sortSectionIds(CONFIGURABLE_TABS, prefs);
  const favorites = ids.filter((id) => prefs.favorites.includes(id));
  const others = ids.filter((id) => !prefs.favorites.includes(id));
  const shown = ids.filter((id) => !prefs.hidden.includes(id));

  const move = (id: ConfigurableTab, step: -1 | 1) => {
    const index = ids.indexOf(id);
    const target = index + step;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[index], next[target]] = [next[target], next[index]];
    update((current) => moveSectionTo(current, next));
  };

  return (
    <Page>
      <Section
        title="Показувати"
        grouped
        footer="Мапа завжди перша й не ховається. Вимкнену вкладку можна ввімкнути назад тут."
      >
        {ids.map((id, index) => (
          <SwitchRow
            key={id}
            icon={TAB_META[id].icon}
            title={TAB_META[id].label}
            value={!prefs.hidden.includes(id)}
            disabled={!prefs.hidden.includes(id) && shown.length === 1}
            onValueChange={() => update((current) => toggleSectionHidden(current, id))}
            last={index === ids.length - 1}
          />
        ))}
      </Section>

      <Section
        title="Порядок"
        grouped
        footer="Улюблені стоять першими. Кнопками вгору й вниз міняється порядок вкладок у нижній панелі."
      >
        {[...favorites, ...others].map((id, index, all) => (
          <Fragment key={id}>
          {index === favorites.length && favorites.length > 0 && others.length > 0 ? <Divider /> : null}
          <ListRow
            icon={TAB_META[id].icon}
            title={TAB_META[id].label}
            subtitle={prefs.favorites.includes(id) ? "Улюблене" : undefined}
            navigates={false}
            last={index === all.length - 1}
            trailing={
              <>
                <IconButton
                  icon="star"
                  label={prefs.favorites.includes(id) ? `Прибрати ${TAB_META[id].label} з улюблених` : `Додати ${TAB_META[id].label} в улюблені`}
                  filled={prefs.favorites.includes(id)}
                  tone={prefs.favorites.includes(id) ? "primary" : "default"}
                  onPress={() => update((current) => toggleSectionFavorite(current, id))}
                />
                <IconButton icon="arrow-upward" label={`Вище: ${TAB_META[id].label}`} onPress={() => move(id, -1)} />
                <IconButton icon="arrow-downward" label={`Нижче: ${TAB_META[id].label}`} onPress={() => move(id, 1)} />
              </>
            }
          />
          </Fragment>
        ))}
      </Section>
      <Divider />
      <Txt variant="caption" tone="muted">
        Налаштування зберігаються лише на цьому пристрої.
      </Txt>
    </Page>
  );
}
