import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, MaterialIcon } from "./ui/material-icon";
import { Button } from "./ui/button";

export type AdminDataset = {
  id: string;
  label: string;
  description: string;
  data: unknown;
};

type AdminPanelProps = {
  datasets: AdminDataset[];
  onSave: (id: string, value: unknown) => string | null;
  onClose: () => void;
};

export function AdminPanel({ datasets, onSave, onClose }: AdminPanelProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(datasets[0]?.id ?? "");
  const [password, setPassword] = useState("");
  const [draft, setDraft] = useState("");
  const [draftDirty, setDraftDirty] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const dataset = datasets.find((item) => item.id === selectedDataset);

  useEffect(() => {
    if (!draftDirty) {
      setDraft(dataset ? JSON.stringify(dataset.data, null, 2) : "");
    }
  }, [dataset?.data, draftDirty, selectedDataset]);

  const unlock = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/__admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Не вдалося перевірити пароль.");
        return;
      }
      setAuthenticated(true);
      setPassword("");
    } catch (requestError) {
      console.error("Could not verify the development admin password.", requestError);
      setError("Сервер розробки недоступний. Перевірте, що Vite запущений.");
    } finally {
      setBusy(false);
    }
  };

  const save = (): void => {
    if (!dataset) return;
    let value: unknown;
    try {
      value = JSON.parse(draft);
    } catch {
      setStatus("JSON має помилку. Перевірте дужки та коми.");
      return;
    }
    const validationError = onSave(dataset.id, value);
    if (validationError) {
      setStatus(validationError);
      return;
    }
    setDraft(JSON.stringify(value, null, 2));
    setDraftDirty(false);
    setStatus("Збережено в цьому браузері.");
  };

  return (
    <section className="admin-page" aria-labelledby="admin-title">
      <Button
        type="button"
        variant="ghost"
        className="admin-back"
        onClick={onClose}
      >
        <ArrowLeft size={18} />
        До міста
      </Button>
      {!authenticated ? (
        <form className="admin-login" onSubmit={unlock}>
          <span className="admin-icon">
            <MaterialIcon name="admin_panel_settings" size={28} />
          </span>
          <span className="admin-eyebrow">ЛОКАЛЬНА РОЗРОБКА</span>
          <h1 id="admin-title">Адмінпанель</h1>
          <p>Введіть пароль розробника, щоб переглядати та редагувати дані.</p>
          <label htmlFor="admin-password">Пароль</label>
          <input
            autoComplete="current-password"
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && <p className="admin-message error" role="alert">{error}</p>}
          <Button type="submit" className="admin-submit" disabled={busy}>
            {busy ? "Перевіряємо…" : "Увійти"}
          </Button>
        </form>
      ) : (
        <>
          <header className="admin-heading">
            <span className="admin-eyebrow">ЛОКАЛЬНА РОЗРОБКА</span>
            <h1 id="admin-title">Дані застосунку</h1>
            <p>Зміни зберігаються лише в локальному сховищі цього браузера.</p>
          </header>
          <nav className="admin-datasets" aria-label="Набори даних">
            {datasets.map((item) => (
              <button
                aria-current={selectedDataset === item.id ? "page" : undefined}
                className={selectedDataset === item.id ? "active" : ""}
                key={item.id}
                onClick={() => {
                  setSelectedDataset(item.id);
                  setDraftDirty(false);
                  setStatus("");
                }}
                type="button"
              >
                {item.label}
                <span>{Array.isArray(item.data) ? item.data.length : 1}</span>
              </button>
            ))}
          </nav>
          {dataset && (
            <div className="admin-editor">
              <div className="admin-editor-heading">
                <div>
                  <h2>{dataset.label}</h2>
                  <p>{dataset.description}</p>
                </div>
                <Button type="button" onClick={save}>Зберегти</Button>
              </div>
              <label className="admin-json-label" htmlFor="admin-json">
                JSON даних
              </label>
              <textarea
                id="admin-json"
                spellCheck={false}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setDraftDirty(true);
                }}
              />
              <p className="admin-message" role="status" aria-live="polite">
                {status || "Редагуйте записи у JSON і збережіть зміни."}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
