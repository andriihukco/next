import { useSyncExternalStore } from "react";

/*
 * Password-recovery flag without a Supabase import, so the app shell can read it
 * while the Supabase client stays out of the first load (refactor-plan R9).
 * lib/supabase.ts sets it when the client reports PASSWORD_RECOVERY.
 */

let passwordRecovery = false;
const listeners = new Set<() => void>();
const notify = (): void => listeners.forEach((listener) => listener());

export function markPasswordRecovery(): void {
  passwordRecovery = true;
  notify();
}

export function finishPasswordRecovery(): void {
  passwordRecovery = false;
  notify();
}

/** True after the user arrived from a password-reset link and has not set a new password yet. */
export function usePasswordRecovery(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => passwordRecovery,
  );
}

/** Magic links, OAuth and password resets return with tokens in the hash or a `code` query. */
export function hasAuthRedirect(location: Location = window.location): boolean {
  return (
    /(?:^#|&)(access_token|error_description|type=recovery)/.test(location.hash) ||
    /[?&](code|error_description)=/.test(location.search)
  );
}

/** Starts the Supabase client only when the URL carries an auth redirect for it to read. */
export function loadSupabaseForAuthRedirect(): void {
  if (!hasAuthRedirect()) return;
  void import("./supabase").catch((error: unknown) => console.error("Could not start sign-in.", error));
}
