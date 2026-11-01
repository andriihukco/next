import type { Session } from "@supabase/supabase-js";
import { apiUrl } from "./api";

/** Deletes the signed-in account on the server. Its subscriptions and profile go with it. */
export async function deleteAccount(session: Session): Promise<void> {
  const response = await fetch(apiUrl("/api/account/delete"), {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? `Account deletion failed with ${response.status}.`);
  }
}
