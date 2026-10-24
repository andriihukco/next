import { createClient, type Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/** Null until the Supabase keys are set, so the app keeps working without an account backend. */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

/** Google sign-in shows only when the provider is enabled in Supabase and here. */
export const googleSignInEnabled = import.meta.env.VITE_AUTH_GOOGLE === "true";

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
