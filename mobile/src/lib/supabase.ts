import "expo-sqlite/localStorage/install";
import { useEffect, useState } from "react";
import { createClient, type Session, type User } from "@supabase/supabase-js";
import { API_BASE_URL } from "./config";

// Same Supabase project as the web app. Keys come from mobile/.env.local (gitignored).
const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

/** Null until the keys are set, so the app keeps working without an account backend (as on the web). */
export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { storage: localStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
      })
    : null;

/** Account deletion shows in development, or when the build turns it on (web: ACCOUNT_DELETION_ENABLED). */
export const ACCOUNT_DELETION_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_FEATURE_ACCOUNT_DELETION === "1";

/** Password-reset links open the web app, which already handles the recovery step. */
export const PASSWORD_RESET_REDIRECT = `${API_BASE_URL}/app`;

/** Name to show for the signed-in user (same rule as the web's accountLabel). */
export function accountLabel(user: User): string {
  const meta = user.user_metadata ?? {};
  const name = [meta.full_name, meta.name, meta.username && `@${meta.username}`].find(
    (value): value is string => typeof value === "string" && value.trim() !== "",
  );
  return name ?? user.email ?? "Обліковий запис";
}

export function useSession(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data.session);
      })
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

/** Deletes the signed-in account on the server, the same endpoint as the web. */
export async function deleteAccount(session: Session): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/account/delete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? `Account deletion failed with ${response.status}.`);
  }
}
