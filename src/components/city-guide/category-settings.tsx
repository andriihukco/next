import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { MaterialIcon } from "../ui/material-icon";
import { Switch } from "../ui/switch";
import { cityPlaceGroupOf, cityPlaceGroups } from "../../lib/city-place-categories";
import { cityPlaceIcons, type CityPlaceCategory } from "../../lib/city-places";

type CategorySettingsProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: { id: CityPlaceCategory; label: string }[];
  hidden: ReadonlySet<string>;
  onShownChange: (id: string, shown: boolean) => void;
  onReset: () => void;
};

/** Categories settings: which categories the Categories tab shows, grouped as on the tab. */
export function CategorySettings({ open, onOpenChange, categories, hidden, onShownChange, onReset }: CategorySettingsProps) {
  const groups = [...cityPlaceGroups.map((group) => ({ id: group.id, label: group.label, icon: group.icon }))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="section-settings category-settings">
        <DialogHeader>
          <DialogTitle>Налаштування категорій</DialogTitle>
          <DialogDescription>Увімкніть категорії, які мають бути на вкладці «Категорії».</DialogDescription>
        </DialogHeader>

        <div className="category-settings-groups">
          {groups.map((group) => {
            const items = categories.filter((category) => cityPlaceGroupOf(category.id) === group.id);
            if (items.length === 0) return null;
            return (
              <section key={group.id} className="category-settings-group">
                <h3>
                  <MaterialIcon name={group.icon} size={18} />
                  {group.label}
                </h3>
                <ul className="section-settings-list">
                  {items.map((category) => {
                    const shown = !hidden.has(category.id);
                    return (
                      <li key={category.id} className="section-settings-row">
                        <span className="section-settings-name">
                          <MaterialIcon name={cityPlaceIcons[category.id]} size={20} />
                          <span>{category.label}</span>
                        </span>
                        <Switch
                          checked={shown}
                          aria-label={`Показувати «${category.label}»`}
                          onCheckedChange={(checked) => onShownChange(category.id, checked)}
                        />
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onReset}>
            Показати всі
          </Button>
          <Button onClick={() => onOpenChange(false)}>Готово</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
