import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiUrl } from "../lib/api";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { MaterialIcon } from "../components/ui/material-icon";
import { Switch } from "../components/ui/switch";
import { Toggle } from "../components/ui/toggle";

/*
 * «Парсинг» (admin toolkit). Queues Google Maps searches for the background worker
 * (server/parse-worker.mjs) and reviews the drafts it saves. Nothing is published from here
 * until an admin approves a result, and approval writes a draft place, not a published one.
 */

type JobStatus = "queued" | "running" | "done" | "failed" | "cancelled";

type Job = {
  id: string;
  name: string;
  categories: string[];
  center_lat: number;
  center_lng: number;
  radius_m: number;
  include_photos: boolean;
  status: JobStatus;
  cancel_requested: boolean;
  progress_done: number;
  progress_total: number;
  found_count: number;
  error: string | null;
  created_at: string;
};

type ParseResult = {
  id: string;
  category: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  photo_urls: string[];
};

const PRESET_CATEGORIES = [
  { slug: "cafe", label: "Кафе" },
  { slug: "restaurant", label: "Ресторани" },
  { slug: "bakery", label: "Пекарні" },
  { slug: "pharmacy", label: "Аптеки" },
  { slug: "supermarket", label: "Супермаркети" },
  { slug: "hotel", label: "Готелі" },
  { slug: "bank", label: "Банки" },
  { slug: "hairdresser", label: "Перукарні" },
  { slug: "dentist", label: "Стоматології" },
  { slug: "gym", label: "Спортзали" },
] as const;

const STATUS_LABEL: Record<JobStatus, string> = {
  queued: "У черзі",
  running: "Виконується",
  done: "Готово",
  failed: "Помилка",
  cancelled: "Скасовано",
};

// Lviv city centre. The admin can change it for any other area.
const DEFAULT_CENTER = { lat: "49.8397", lng: "24.0297", radiusKm: "5" };

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
  const token = data.session?.access_token;
  if (!token) throw new Error("Немає входу.");
  return fetch(apiUrl(path), {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
}

async function errorFrom(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? "Не вдалося виконати дію. Спробуйте ще раз.";
}

function NewJobForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [presets, setPresets] = useState<string[]>(["cafe"]);
  const [extra, setExtra] = useState("");
  const [lat, setLat] = useState(DEFAULT_CENTER.lat);
  const [lng, setLng] = useState(DEFAULT_CENTER.lng);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_CENTER.radiusKm);
  const [includePhotos, setIncludePhotos] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const extraCategories = extra
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const categories = [...new Set([...presets, ...extraCategories])];
    setBusy(true);
    setError("");
    try {
      const response = await authedFetch("/api/admin/parse/jobs", {
        method: "POST",
        body: JSON.stringify({
          name,
          categories,
          centerLat: Number(lat),
          centerLng: Number(lng),
          radiusM: Math.round(Number(radiusKm) * 1000),
          includePhotos,
        }),
      });
      if (!response.ok) {
        setError(await errorFrom(response));
        return;
      }
      setName("");
      setExtra("");
      onCreated();
    } catch (caught: unknown) {
      console.error("Could not create the parse job.", caught);
      setError("Немає зв’язку з сервером.");
    } finally {
      setBusy(false);
    }
  };

  const togglePreset = (slug: string, pressed: boolean): void => {
    setPresets((current) => (pressed ? [...current, slug] : current.filter((item) => item !== slug)));
  };

  return (
    <form className="admin-parse-form" onSubmit={(event) => void submit(event)} aria-labelledby="admin-parse-new-title">
      <h2 id="admin-parse-new-title">Нове завдання</h2>
      <label className="admin-field">
        <span>Назва</span>
        <Input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
      </label>

      <fieldset className="admin-parse-fieldset">
        <legend>Категорії</legend>
        <div className="admin-parse-presets">
          {PRESET_CATEGORIES.map((item) => (
            <Toggle
              key={item.slug}
              variant="pill"
              size="sm"
              pressed={presets.includes(item.slug)}
              onPressedChange={(pressed) => togglePreset(item.slug, pressed)}
            >
              {item.label}
            </Toggle>
          ))}
        </div>
        <label className="admin-field">
          <span>Інші категорії (латиницею, через кому)</span>
          <Input placeholder="coworking, bookstore" value={extra} onChange={(event) => setExtra(event.target.value)} />
        </label>
      </fieldset>

      <fieldset className="admin-parse-fieldset">
        <legend>Локація</legend>
        <div className="admin-parse-grid">
          <label className="admin-field">
            <span>Широта</span>
            <Input inputMode="decimal" required value={lat} onChange={(event) => setLat(event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Довгота</span>
            <Input inputMode="decimal" required value={lng} onChange={(event) => setLng(event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Радіус, км (до 30)</span>
            <Input inputMode="decimal" required value={radiusKm} onChange={(event) => setRadiusKm(event.target.value)} />
          </label>
        </div>
      </fieldset>

      <label className="admin-parse-switch">
        <Switch checked={includePhotos} onCheckedChange={setIncludePhotos} />
        <span>Зберігати посилання на фото з Google Maps</span>
      </label>

      {error && (
        <p className="admin-error" role="alert">
          <MaterialIcon name="error" size={16} /> {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={busy || !name.trim() || (presets.length === 0 && !extra.trim())}>
        {busy ? "Створюємо…" : "Створити завдання"}
      </Button>
    </form>
  );
}

function ResultsPanel({ jobId, onReviewed }: { jobId: string; onReviewed: () => void }) {
  const [results, setResults] = useState<ParseResult[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (): Promise<void> => {
    try {
      const response = await authedFetch(`/api/admin/parse/jobs/${jobId}/results?status=draft`);
      if (!response.ok) throw new Error(await errorFrom(response));
      const body = (await response.json()) as { data: ParseResult[] };
      setResults(body.data);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Не вдалося завантажити результати.");
    }
  }, [jobId]);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, action: "approve" | "reject"): Promise<void> => {
    setError("");
    const response = await authedFetch(`/api/admin/parse/results/${id}`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
    if (!response.ok) {
      setError(await errorFrom(response));
      return;
    }
    setResults((current) => current?.filter((item) => item.id !== id) ?? null);
    onReviewed();
  };

  if (error) {
    return (
      <p className="admin-error" role="alert">
        {error}
      </p>
    );
  }
  if (!results) {
    return (
      <p className="admin-state" role="status">
        <MaterialIcon name="progress_activity" size={18} />
        Завантажуємо результати…
      </p>
    );
  }
  if (!results.length) {
    return (
      <p className="admin-state" role="status">
        Немає нових чернеток. Усе, що знайдено, уже перевірено або ще не збережено.
      </p>
    );
  }

  return (
    <ul className="admin-parse-results" aria-label="Чернетки місць">
      {results.map((item) => (
        <li key={item.id} className="admin-parse-result">
          <div className="admin-parse-result-body">
            <strong>{item.name}</strong>
            <span className="admin-parse-meta">
              {item.category}
              {item.address ? ` · ${item.address}` : ""}
            </span>
            <span className="admin-parse-meta">
              {item.rating ? `★ ${item.rating.toFixed(1)}` : "Без рейтингу"}
              {item.review_count ? ` · ${item.review_count} відгуків` : ""}
              {item.photo_urls.length ? ` · фото: ${item.photo_urls.length} (посилання)` : ""}
            </span>
          </div>
          <div className="admin-parse-result-actions">
            <Button size="sm" onClick={() => void review(item.id, "approve")}>
              Додати як чернетку місця
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void review(item.id, "reject")}>
              Відхилити
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function JobRow({ job, onChanged }: { job: Job; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const active = job.status === "queued" || job.status === "running";

  const cancel = async (): Promise<void> => {
    setError("");
    const response = await authedFetch(`/api/admin/parse/jobs/${job.id}/cancel`, { method: "POST" });
    if (!response.ok) {
      setError(await errorFrom(response));
      return;
    }
    onChanged();
  };

  return (
    <li className="admin-parse-job">
      <div className="admin-parse-job-head">
        <div>
          <strong>{job.name}</strong>
          <span className="admin-parse-meta">
            {job.categories.join(", ")} · радіус {(job.radius_m / 1000).toFixed(1)} км
            {job.include_photos ? " · з фото" : ""}
          </span>
        </div>
        <span className="admin-parse-status" role="status" data-status={job.status}>
          {STATUS_LABEL[job.status]}
        </span>
      </div>
      <p className="admin-parse-meta" role="status">
        Запити: {job.progress_done} з {job.progress_total || "?"} · знайдено: {job.found_count}
        {job.cancel_requested ? " · скасовується…" : ""}
      </p>
      {job.error && (
        <p className="admin-error" role="alert">
          {job.error}
        </p>
      )}
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-parse-job-actions">
        <Button variant="ghost" size="sm" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? "Сховати результати" : "Результати"}
        </Button>
        {active && (
          <Button variant="outline" size="sm" onClick={() => void cancel()} disabled={job.cancel_requested}>
            Скасувати
          </Button>
        )}
      </div>
      {open && <ResultsPanel jobId={job.id} onReviewed={onChanged} />}
    </li>
  );
}

export function ParseSection() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (): Promise<void> => {
    try {
      const response = await authedFetch("/api/admin/parse/jobs");
      if (!response.ok) throw new Error(await errorFrom(response));
      const body = (await response.json()) as { data: Job[] };
      setJobs(body.data);
      setError("");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Не вдалося завантажити завдання.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Refresh while a job is queued or running, so progress moves without a reload.
  const hasActive = jobs?.some((job) => job.status === "queued" || job.status === "running") ?? false;
  useEffect(() => {
    if (!hasActive) return;
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [hasActive, load]);

  return (
    <div className="admin-parse">
      <p className="admin-parse-note">
        Завдання виконує фоновий воркер (<code>npm run worker</code>) на машині з Docker-рушієм. Результати з’являються як чернетки.
        Фото лишаються посиланнями на Google, їх ніхто не копіює. Публікують лише перевірені місця.
      </p>
      <NewJobForm onCreated={() => void load()} />

      <section aria-labelledby="admin-parse-jobs-title" className="admin-parse-jobs">
        <h2 id="admin-parse-jobs-title">Завдання</h2>
        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
        {!jobs && !error && (
          <p className="admin-state" role="status">
            <MaterialIcon name="progress_activity" size={18} />
            Завантажуємо завдання…
          </p>
        )}
        {jobs && !jobs.length && <p className="admin-state">Ще немає завдань.</p>}
        {jobs && jobs.length > 0 && (
          <ul className="admin-parse-list">
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} onChanged={() => void load()} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
