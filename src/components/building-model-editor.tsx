import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Button } from "./ui/button";
import { MaterialIcon } from "./ui/material-icon";
import type { CityPlace } from "../lib/city-places";
import {
  inspectObjModel,
  suggestedRotationForInspection,
  type BuildingModelData,
  type BuildingModelInspection,
  type BuildingModelUpAxis,
} from "../lib/building-3d-layer";

const MAX_OBJ_BYTES = 25 * 1024 * 1024;

type BuildingModelEditorProps = {
  place: CityPlace;
  knownHeight: number | null;
  model: BuildingModelData | undefined;
  onPreview: (model: BuildingModelData | null) => void;
  onSave: (model: BuildingModelData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function defaultHeight(
  knownHeight: number | null,
  inspection: BuildingModelInspection | null,
): number {
  if (knownHeight && knownHeight > 0) return knownHeight;
  if (
    inspection &&
    inspection.height >= 3 &&
    inspection.height <= 350
  ) {
    return inspection.height;
  }
  return 12;
}

function formatMeters(value: number): string {
  return value.toLocaleString("uk-UA", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value < 10 ? 1 : 0,
  });
}

export function BuildingModelEditor({
  place,
  knownHeight,
  model,
  onPreview,
  onSave,
  onDelete,
}: BuildingModelEditorProps) {
  const [draft, setDraft] = useState<BuildingModelData | null>(
    () => model ?? null,
  );
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!model) return;
    setDraft((current) => current ?? model);
  }, [model]);

  const inspection = useMemo<BuildingModelInspection | null>(() => {
    if (!draft) return null;
    try {
      return inspectObjModel(draft.objText, draft.upAxis);
    } catch (inspectionError) {
      console.error("Could not inspect the uploaded OBJ model.", inspectionError);
      return null;
    }
  }, [draft?.objText, draft?.upAxis]);

  const updateDraft = (patch: Partial<BuildingModelData>): void => {
    if (!draft) return;
    const next = { ...draft, ...patch, updatedAt: Date.now() };
    setDraft(next);
    onPreview(next);
  };

  const handleFile = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setStatus("");
    if (!file.name.toLocaleLowerCase("en").endsWith(".obj")) {
      setError("Підтримуються лише текстові OBJ-файли (.obj).");
      return;
    }
    if (file.size > MAX_OBJ_BYTES) {
      setError("Файл завеликий. Максимальний розмір — 25 МБ.");
      return;
    }
    setBusy(true);
    try {
      const objText = await file.text();
      if (!objText.trim()) {
        setError("Файл порожній або не містить геометрії.");
        return;
      }
      const nextUpAxis = draft?.upAxis ?? "auto";
      const nextInspection = inspectObjModel(objText, nextUpAxis);
      const height = Math.max(
        1,
        draft?.heightMeters ?? defaultHeight(knownHeight, nextInspection),
      );
      const next: BuildingModelData = {
        id: place.id,
        name: place.name,
        lng: place.lng,
        lat: place.lat,
        fileName: file.name,
        objText,
        heightMeters: Math.round(height * 10) / 10,
        scale: draft?.scale ?? 1,
        rotation:
          draft?.rotation ??
          suggestedRotationForInspection(nextInspection, place.footprint),
        elevationOffset: draft?.elevationOffset ?? 0,
        color: draft?.color ?? "#d6d2c8",
        upAxis: nextUpAxis,
        updatedAt: Date.now(),
      };
      setDraft(next);
      onPreview(next);
      setStatus("Модель завантажено. Перевірте розмір і поворот.");
    } catch (fileError) {
      console.error("Could not read the OBJ file.", fileError);
      setError("Не вдалося прочитати OBJ-файл. Перевірте, що це текстовий OBJ.");
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!draft) return;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const saved = { ...draft, updatedAt: Date.now() };
      await onSave(saved);
      setDraft(saved);
      setStatus("Модель збережено в цьому браузері.");
    } catch (saveError) {
      console.error("Could not save the building model.", saveError);
      setError("Не вдалося зберегти модель. Перевірте доступ до сховища.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await onDelete(place.id);
      setDraft(null);
      onPreview(null);
      setStatus("Модель видалено.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (deleteError) {
      console.error("Could not delete the building model.", deleteError);
      setError("Не вдалося видалити модель.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="building-model-editor" aria-label="3D-модель будівлі">
      <header className="building-model-header">
        <span className="building-model-icon">
          <MaterialIcon name="deployed_code" size={20} />
        </span>
        <div>
          <strong>
            {draft ? "3D-модель будівлі" : "Додати 3D-модель будівлі"}
          </strong>
          <p>
            {knownHeight
              ? `Висота з OpenStreetMap: ${formatMeters(knownHeight)} м — модель підганяється під неї.`
              : "Висоту будівлі не знайдено в OpenStreetMap — задайте її вручну."}
          </p>
        </div>
      </header>

      <input
        ref={fileInputRef}
        accept=".obj,text/plain"
        className="building-model-file-input"
        id={`building-model-file-${place.id}`}
        type="file"
        onChange={(event) => void handleFile(event)}
      />
      <label
        className="building-model-upload"
        htmlFor={`building-model-file-${place.id}`}
      >
        <MaterialIcon name="upload_file" size={18} />
        {draft ? "Замінити OBJ-файл" : "Вибрати .obj файл"}
      </label>
      <p className="building-model-limit">Текстовий OBJ · до 25 МБ</p>

      {error && (
        <p className="building-model-message error" role="alert">
          {error}
        </p>
      )}

      {draft && (
        <div className="building-model-controls">
          <div className="building-model-file">
            <MaterialIcon name="deployed_code" size={16} />
            <span title={draft.fileName}>{draft.fileName}</span>
          </div>

          <label className="building-model-field">
            <span>
              Висота будівлі
              <b>{formatMeters(draft.heightMeters)} м</b>
            </span>
            <input
              max={500}
              min={1}
              step={0.5}
              type="number"
              value={draft.heightMeters}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (!Number.isFinite(value)) return;
                updateDraft({ heightMeters: Math.min(500, Math.max(1, value)) });
              }}
            />
          </label>

          <label className="building-model-field">
            <span>
              Масштаб
              <b>{draft.scale.toFixed(2)}×</b>
            </span>
            <input
              max={3}
              min={0.2}
              step={0.01}
              type="range"
              value={draft.scale}
              onChange={(event) =>
                updateDraft({ scale: Number(event.target.value) })
              }
            />
          </label>

          <label className="building-model-field">
            <span>
              Поворот
              <b>{Math.round(draft.rotation)}°</b>
            </span>
            <input
              max={180}
              min={-180}
              step={1}
              type="range"
              value={draft.rotation}
              onChange={(event) =>
                updateDraft({ rotation: Number(event.target.value) })
              }
            />
          </label>

          <label className="building-model-field">
            <span>
              Підняти над землею
              <b>{draft.elevationOffset.toFixed(1)} м</b>
            </span>
            <input
              max={20}
              min={-5}
              step={0.1}
              type="range"
              value={draft.elevationOffset}
              onChange={(event) =>
                updateDraft({ elevationOffset: Number(event.target.value) })
              }
            />
          </label>

          <div className="building-model-row">
            <label className="building-model-color">
              <span>Колір</span>
              <input
                aria-label="Колір моделі"
                type="color"
                value={draft.color}
                onChange={(event) => updateDraft({ color: event.target.value })}
              />
            </label>
            <label className="building-model-select">
              <span>Орієнтація</span>
              <select
                value={draft.upAxis}
                onChange={(event) =>
                  updateDraft({
                    upAxis: event.target.value as BuildingModelUpAxis,
                  })
                }
              >
                <option value="auto">Авто (Y-up)</option>
                <option value="y">Y-up</option>
                <option value="z">Z-up</option>
              </select>
            </label>
          </div>

          {inspection && (
            <p className="building-model-meta">
              У файлі: {formatMeters(inspection.width)} ×{" "}
              {formatMeters(inspection.depth)} ×{" "}
              {formatMeters(inspection.height)} ·{" "}
              {inspection.triangles.toLocaleString("uk-UA")} трикутників
            </p>
          )}

          <div className="building-model-actions">
            <Button
              disabled={busy}
              size="sm"
              type="button"
              onClick={() => void handleSave()}
            >
              <MaterialIcon name="save" size={16} />
              Зберегти
            </Button>
            <Button
              disabled={!model || busy}
              size="sm"
              type="button"
              variant="outline"
              onClick={() => void handleDelete()}
            >
              <MaterialIcon name="delete" size={16} />
              Видалити
            </Button>
          </div>
        </div>
      )}

      {status && <p className="building-model-message">{status}</p>}
    </section>
  );
}
