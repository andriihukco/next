import { createClient, type Session, type User } from "@supabase/supabase-js";
import { useEffect, useState, useSyncExternalStore } from "react";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/** Null until the Supabase keys are set, so the app keeps working without an account backend. */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

/** Google sign-in shows only when the provider is enabled in Supabase and here. */
export const googleSignInEnabled = import.meta.env.VITE_AUTH_GOOGLE === "true";

// A password-reset link signs the user in and fires PASSWORD_RECOVERY once, while the
// client starts. Listen from module load so the event is not missed before React mounts.
let passwordRecovery = false;
const recoveryListeners = new Set<() => void>();
supabase?.auth.onAuthStateChange((event) => {
  if (event !== "PASSWORD_RECOVERY") return;
  passwordRecovery = true;
  recoveryListeners.forEach((listener) => listener());
});

/** True after the user arrived from a password-reset link and has not set a new password yet. */
export function usePasswordRecovery(): boolean {
  return useSyncExternalStore(
    (listener) => {
      recoveryListeners.add(listener);
      return () => recoveryListeners.delete(listener);
    },
    () => passwordRecovery,
  );
}

export function finishPasswordRecovery(): void {
  passwordRecovery = false;
  recoveryListeners.forEach((listener) => listener());
}

export type AuthProvider = "email" | "google" | "telegram";

export function authProvider(user: User): AuthProvider {
  const provider = user.app_metadata?.provider;
  return provider === "telegram" || provider === "google" ? provider : "email";
}

/** Name to show for the signed-in user. Telegram accounts have only a placeholder email. */
export function accountLabel(user: User): string {
  const meta = user.user_metadata ?? {};
  const name = [meta.full_name, meta.name, meta.username && `@${meta.username}`].find(
    (value): value is string => typeof value === "string" && value.trim() !== "",
  );
  return name ?? (authProvider(user) === "telegram" ? "Telegram" : (user.email ?? "Обліковий запис"));
}

/** Where magic links and OAuth return to. Add it to the Supabase redirect allow list. */
export const authRedirectUrl = (): string => `${window.location.origin}/app`;

export function useSession(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data.session);
      })
      .catch((error: unknown) => console.error("Could not read the session.", error))
      .finally(() => {
        if (active) setLoading(false);
      });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return { session, loading };
}
