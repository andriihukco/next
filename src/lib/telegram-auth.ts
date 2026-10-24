import { apiUrl } from "./api";
import { supabase } from "./supabase";

/** Numeric bot id (the part of the bot token before the colon). The button shows only when it is set. */
export const telegramBotId = import.meta.env.VITE_TELEGRAM_BOT_ID?.trim() || "";

type TelegramUser = Record<string, string | number>;

declare global {
  interface Window {
    Telegram?: {
      Login: {
        auth: (options: { bot_id: string; request_access?: "write"; lang?: string }, callback: (user: TelegramUser | false) => void) => void;
      };
    };
  }
}

let widget: Promise<void> | null = null;

function loadWidget(): Promise<void> {
  widget ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      widget = null;
      reject(new Error("Could not load the Telegram login widget."));
    };
    document.head.append(script);
  });
  return widget;
}

/**
 * Opens the Telegram login popup, lets the server verify the signed result, and
 * exchanges the returned one-time token for a Supabase session.
 * Resolves false when the user closes the popup.
 */
export async function signInWithTelegram(): Promise<boolean> {
  if (!supabase || !telegramBotId) throw new Error("Telegram sign-in is not configured.");
  await loadWidget();
  const user = await new Promise<TelegramUser | false>((resolve) =>
    window.Telegram!.Login.auth({ bot_id: telegramBotId, request_access: "write", lang: "uk" }, resolve),
  );
  if (!user) return false;
  const response = await fetch(apiUrl("/api/auth/telegram"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  const body: unknown = await response.json().catch(() => null);
  const tokenHash = body && typeof body === "object" && "tokenHash" in body ? String(body.tokenHash) : "";
  if (!response.ok || !tokenHash) throw new Error(`Telegram sign-in failed with ${response.status}`);
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (error) throw error;
  return true;
}
