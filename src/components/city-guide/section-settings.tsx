import { Reorder } from "motion/react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { IconButton } from "../ui/icon-button";
import { MaterialIcon } from "../ui/material-icon";
import { Switch } from "../ui/switch";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import {
  SECTION_SORTS,
  defaultSectionPrefs,
  moveSectionTo,
  sortSectionIds,
  toggleSectionFavorite,
  toggleSectionHidden,
  type SectionPrefs,
  type SectionSort,
} from "../../lib/section-prefs";
import { CITY_SECTIONS, type CitySection } from "./constants";

type SectionSettingsProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefs: SectionPrefs;
  onChange: (change: (prefs: SectionPrefs) => SectionPrefs) => void;
};

const LABELS = new Map<string, { label: string; icon: string }>(CITY_SECTIONS.map((item) => [item.id, item]));

/** Settings for the section rail: on or off, favourites, order by hand, or by recent or most used. */
export function SectionSettings({ open, onOpenChange, prefs, onChange }: SectionSettingsProps) {
  const ids = sortSectionIds(
    CITY_SECTIONS.map((item) => item.id),
    prefs,
  );

  const move = (id: CitySection, step: -1 | 1) => {
    const index = ids.indexOf(id);
    const target = index + step;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[index], next[target]] = [next[target], next[index]];
    onChange((current) => moveSectionTo(current, next));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="section-settings">
        <DialogHeader>
          <DialogTitle>Розділи</DialogTitle>
          <DialogDescription>
            Увімкніть потрібні, перетягніть, щоб змінити порядок. Улюблені стоять першими, над рискою.
          </DialogDescription>
        </DialogHeader>

        <ToggleGroup
          type="single"
          variant="outline"
          value={prefs.sort}
          aria-label="Сортування"
          className="section-settings-sort"
          onValueChange={(value) => {
            if (value) onChange((current) => ({ ...current, sort: value as SectionSort }));
          }}
        >
          {SECTION_SORTS.map((sort) => (
            <ToggleGroupItem key={sort.id} value={sort.id}>
              {sort.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Reorder.Group
          as="ul"
          axis="y"
          values={ids}
          onReorder={(next) => onChange((current) => moveSectionTo(current, next))}
          className="section-settings-list"
        >
          {ids.map((id) => {
            const item = LABELS.get(id);
            if (!item) return null;
            const favorite = prefs.favorites.includes(id);
            const on = !prefs.hidden.includes(id);
            const index = ids.indexOf(id);
            return (
              <Reorder.Item as="li" key={id} value={id} className="section-settings-row">
                <span className="section-settings-grip" aria-hidden="true">
                  <MaterialIcon name="drag_indicator" size={20} />
                </span>
                <span className="section-settings-name">
                  <MaterialIcon name={item.icon} size={20} />
                  <span>{item.label}</span>
                </span>
                <IconButton
                  label={favorite ? `Прибрати «${item.label}» з улюблених` : `Додати «${item.label}» в улюблені`}
                  aria-pressed={favorite}
                  className="section-settings-action"
                  onClick={() => onChange((current) => toggleSectionFavorite(current, id))}
                >
                  <MaterialIcon name="star" size={20} filled={favorite} />
                </IconButton>
                <IconButton
                  label={`Вище: ${item.label}`}
                  disabled={index === 0}
                  className="section-settings-action"
                  onClick={() => move(id, -1)}
                >
                  <MaterialIcon name="arrow_upward" size={20} />
                </IconButton>
                <IconButton
                  label={`Нижче: ${item.label}`}
                  disabled={index === ids.length - 1}
                  className="section-settings-action"
                  onClick={() => move(id, 1)}
                >
                  <MaterialIcon name="arrow_downward" size={20} />
                </IconButton>
                <Switch
                  checked={on}
                  aria-label={`Показувати «${item.label}»`}
                  onCheckedChange={() => onChange((current) => toggleSectionHidden(current, id))}
                />
              </Reorder.Item>
            );
          })}
        </Reorder.Group>

        <DialogFooter>
          <Button variant="outline" onClick={() => onChange(() => defaultSectionPrefs(CITY_SECTIONS.map((item) => item.id)))}>
            Скинути
          </Button>
          <Button onClick={() => onOpenChange(false)}>Готово</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
