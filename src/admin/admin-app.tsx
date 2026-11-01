import { useCallback, useEffect, useState } from "react";
import { BrandLogo } from "../components/ui/brand-logo";
import { MaterialIcon } from "../components/ui/material-icon";
import { apiUrl } from "../lib/api";
import { supabase, useSession } from "../lib/supabase";
import { AdminMfa } from "./admin-mfa";
import "./admin.css";

/*
 * `/admin` (platform-plan S2). Its own lazy chunk, so public visitors never download it.
 * Anyone without the editor or admin role sees a plain 404; the server checks the role
 * again on every /api/admin/* call, and RLS checks it a third time in the database.
 */

type Access =
  | { status: "checking" }
  | { status: "denied" }
  | { status: "mfa" }
  | { status: "ok"; role: "editor" | "admin" };

const SECTIONS = [
  { id: "places", icon: "place", label: "Місця", slice: "S3", text: "Пошук, редагування, переміщення й приховування місць на мапі." },
  { id: "models", icon: "deployed_code", label: "3D-моделі", slice: "S4", text: "Завантаження моделей будівель, перевірка бюджету й публікація." },
  { id: "releases", icon: "new_releases", label: "Що нового", slice: "S7", text: "Записи з PR з’являються автоматично; тут їх можна буде виправити." },
  { id: "audit", icon: "history", label: "Журнал", slice: "S1", text: "Хто, що і коли змінив." },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function NotFound() {
  return (
    <main className="admin-not-found" aria-labelledby="admin-404-title">
      <h1 id="admin-404-title">Сторінку не знайдено</h1>
      <a href="/app">Повернутися на мапу</a>
    </main>
  );
}

export function AdminApp() {
  const { session, loading } = useSession();
  const [access, setAccess] = useState<Access>({ status: "checking" });
  const [section, setSection] = useState<SectionId>("places");

  const check = useCallback(async (): Promise<void> => {
    if (!supabase) {
      setAccess({ status: "denied" });
      return;
    }
    // Read the session again: after the second factor it carries the AAL2 token.
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setAccess({ status: "denied" });
      return;
    }
    try {
      const response = await fetch(apiUrl("/api/admin/me"), { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        setAccess({ status: "denied" });
        return;
      }
      const me = (await response.json()) as { role: "editor" | "admin"; mfaRequired: boolean };
      setAccess(me.mfaRequired ? { status: "mfa" } : { status: "ok", role: me.role });
    } catch (error) {
      console.error("Could not check admin access.", error);
      setAccess({ status: "denied" });
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    void check();
  }, [check, loading, session?.access_token]);

  if (loading || access.status === "checking") {
    return (
      <p className="admin-state admin-state-page" role="status">
        <MaterialIcon name="progress_activity" size={20} />
        Перевіряємо доступ…
      </p>
    );
  }
  if (access.status === "denied") return <NotFound />;
  if (access.status === "mfa") {
    return (
      <main className="admin-gate">
        <AdminMfa onVerified={() => void check()} />
      </main>
    );
  }

  const current = SECTIONS.find((item) => item.id === section) ?? SECTIONS[0];
  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <BrandLogo />
        <span className="admin-role">{access.role === "admin" ? "Адміністратор" : "Редактор"}</span>
        <span className="admin-topbar-spacer" aria-hidden="true" />
        <a className="admin-topbar-link" href="/app">
          <MaterialIcon name="map" size={18} />
          До мапи
        </a>
      </header>
      <nav className="admin-nav" aria-label="Розділи адмінки">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={item.id === section ? "page" : undefined}
            onClick={() => setSection(item.id)}
          >
            <MaterialIcon name={item.icon} size={20} />
            {item.label}
          </button>
        ))}
      </nav>
      <main className="admin-content" aria-labelledby="admin-section-title">
        <h1 id="admin-section-title">{current.label}</h1>
        <div className="admin-state" role="status">
          <MaterialIcon name="schedule" size={20} />
          <span>
            Незабаром ({current.slice}). {current.text}
          </span>
        </div>
      </main>
    </div>
  );
}
