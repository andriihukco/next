import { useState, type FormEvent } from "react";
import { Button } from "../../components/ui/button";
import { Toggle } from "../../components/ui/toggle";
import { Input } from "../../components/ui/input";
import { MaterialIcon } from "../../components/ui/material-icon";
import { VISITOR_TYPES, type LocalProfile } from "./profile";

export function ProfileForm({ initial, onSave }: { initial: LocalProfile; onSave: (profile: LocalProfile) => void }) {
  const [draft, setDraft] = useState<LocalProfile>(initial);
  const field = (key: keyof LocalProfile) => ({
    value: draft[key],
    onChange: (event: { target: { value: string } }) =>
      setDraft((current) => ({ ...current, [key]: event.target.value })),
  });
  const submit = (event: FormEvent): void => {
    event.preventDefault();
    onSave({
      name: draft.name.trim(),
      visitorType: draft.visitorType,
      home: draft.home.trim(),
      work: draft.work.trim(),
    });
  };

  return (
    <form className="settings-form" onSubmit={submit}>
      <label className="settings-field">
        <span>Ім’я</span>
        <Input autoComplete="given-name" placeholder="Як до вас звертатися" maxLength={40} data-autofocus {...field("name")} />
      </label>
      <fieldset className="settings-field">
        <legend>Хто ви у Львові</legend>
        <div className="settings-chips">
          {VISITOR_TYPES.map((type) => (
            <Toggle variant="pill"
              key={type}
              size="sm"
             
              onClick={() =>
                setDraft((current) => ({ ...current, visitorType: current.visitorType === type ? "" : type }))
              } pressed={draft.visitorType === type}>
              {type}
            </Toggle>
          ))}
        </div>
      </fieldset>
      <label className="settings-field">
        <span>Дім</span>
        <Input autoComplete="street-address" placeholder="Вулиця й номер будинку" maxLength={120} {...field("home")} />
      </label>
      <label className="settings-field">
        <span>Робота або навчання</span>
        <Input placeholder="Вулиця й номер будинку" maxLength={120} {...field("work")} />
      </label>
      <p className="settings-hint">
        <MaterialIcon name="lock" size={16} />
        Зберігається лише на цьому пристрої. Адреси допоможуть швидше будувати маршрути.
      </p>
      <Button type="submit" size="lg">
        Зберегти
      </Button>
    </form>
  );
}
