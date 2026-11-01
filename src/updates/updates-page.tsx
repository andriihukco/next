import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "../components/ui/brand-logo";
import { Button } from "../components/ui/button";
import { MaterialIcon } from "../components/ui/material-icon";
import { Toggle } from "../components/ui/toggle";
import { LegalFooter } from "../legal/legal-footer";
import { apiUrl } from "../lib/api";
import "../legal/legal.css";
import "./updates.css";

type ReleaseCategory = "new" | "improved" | "fixed";

type Release = {
  id: string;
  pr_number: number | null;
  category: ReleaseCategory;
  title_uk: string;
  body_uk: string | null;
  published_at: string;
};

const CATEGORY_LABEL: Record<ReleaseCategory, string> = {
  new: "Нове",
  improved: "Покращено",
  fixed: "Виправлено",
};

const CATEGORY_ICON: Record<ReleaseCategory, string> = {
  new: "auto_awesome",
  improved: "trending_up",
  fixed: "build",
};

const dateFormat = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long", year: "numeric" });

type LoadState = { status: "loading" } | { status: "error" } | { status: "ready"; releases: Release[] };

/** «Що нового»: release notes from merged PRs, newest first (platform-plan S7). */
export function UpdatesPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [filter, setFilter] = useState<ReleaseCategory | "all">("all");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    fetch(apiUrl("/api/releases"))
      .then(async (response) => {
        if (!response.ok) throw new Error(`Releases request failed with ${response.status}.`);
        const payload = (await response.json()) as { data?: Release[] };
        if (active) setState({ status: "ready", releases: payload.data ?? [] });
      })
      .catch((error: unknown) => {
        console.error("Could not load release notes.", error);
        if (active) setState({ status: "error" });
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const visible = useMemo(
    () =>
      state.status === "ready"
        ? state.releases.filter((release) => filter === "all" || release.category === filter)
        : [],
    [filter, state],
  );

  return (
    <div className="legal-page">
      <header className="legal-header">
        <a href="/" className="legal-home" aria-label="На головну">
          <BrandLogo />
        </a>
        <a href="/app" className="legal-app-link">
          <MaterialIcon name="map" size={18} />
          Відкрити мапу
        </a>
      </header>
      <main className="legal-main" aria-labelledby="updates-title">
        <h1 id="updates-title">Що нового</h1>
        <p className="legal-summary">Зміни в next, від найновіших. Кожен запис з’являється після того, як зміна вийшла.</p>
        <div className="updates-filters" role="group" aria-label="Тип змін">
          {(["all", "new", "improved", "fixed"] as const).map((id) => (
            <Toggle key={id} variant="pill" pressed={filter === id} onClick={() => setFilter(id)}>
              {id === "all" ? "Усі" : CATEGORY_LABEL[id]}
            </Toggle>
          ))}
        </div>
        {state.status === "loading" && (
          <p className="updates-state" role="status">
            <MaterialIcon name="progress_activity" size={20} />
            Завантажуємо зміни…
          </p>
        )}
        {state.status === "error" && (
          <div className="updates-state" role="alert">
            <MaterialIcon name="cloud_off" size={20} />
            <span>Не вдалося завантажити зміни. Перевірте з’єднання.</span>
            <Button type="button" variant="outline" size="sm" onClick={() => setAttempt((value) => value + 1)}>
              Спробувати ще
            </Button>
          </div>
        )}
        {state.status === "ready" && visible.length === 0 && (
          <p className="updates-state" role="status">
            <MaterialIcon name="history" size={20} />
            {state.releases.length === 0 ? "Записів ще немає." : "Змін цього типу ще немає."}
          </p>
        )}
        {visible.length > 0 && (
          <ol className="updates-list">
            {visible.map((release) => (
              <li key={release.id} className="updates-item">
                <span className={`updates-badge is-${release.category}`}>
                  <MaterialIcon name={CATEGORY_ICON[release.category]} size={16} />
                  {CATEGORY_LABEL[release.category]}
                </span>
                <h2>{release.title_uk}</h2>
                {release.body_uk && <p>{release.body_uk}</p>}
                <time dateTime={release.published_at}>{dateFormat.format(new Date(release.published_at))}</time>
              </li>
            ))}
          </ol>
        )}
      </main>
      <LegalFooter />
    </div>
  );
}
