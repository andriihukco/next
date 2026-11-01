import { useEffect, useState } from "react";
import { ArrowLeft } from "./ui/material-icon";
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
  const [selectedDataset, setSelectedDataset] = useState(datasets[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [draftDirty, setDraftDirty] = useState(false);
  const [status, setStatus] = useState("");
  const dataset = datasets.find((item) => item.id === selectedDataset);
  const datasetData = dataset?.data;

  useEffect(() => {
    if (!draftDirty) {
      setDraft(datasetData === undefined ? "" : JSON.stringify(datasetData, null, 2));
    }
  }, [datasetData, draftDirty, selectedDataset]);

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
    </section>
  );
}
