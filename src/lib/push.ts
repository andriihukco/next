import type { Session } from "@supabase/supabase-js";
import { apiUrl } from "./api";
import { supabase } from "./supabase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim();

export type PushStatus = "unsupported" | "ios-install" | "unconfigured" | "denied" | "off" | "on";

const isIos = (): boolean => /iP(hone|ad|od)/.test(navigator.userAgent);
const isStandalone = (): boolean => window.matchMedia("(display-mode: standalone)").matches;

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration("/");
  return (await registration?.pushManager.getSubscription()) ?? null;
}

export async function readPushStatus(): Promise<PushStatus> {
  const supported = "serviceWorker" in navigator && "PushManager" in window && typeof Notification !== "undefined";
  // iOS delivers Web Push only to an app added to the Home Screen.
  if (!supported) return isIos() && !isStandalone() ? "ios-install" : "unsupported";
  if (!supabase || !VAPID_PUBLIC_KEY) return "unconfigured";
  if (Notification.permission === "denied") return "denied";
  return (await currentSubscription()) ? "on" : "off";
}

/** Asks for permission, subscribes this browser and stores the subscription for the signed-in user. */
export async function enablePush(): Promise<PushStatus> {
  if (!supabase || !VAPID_PUBLIC_KEY) return "unconfigured";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(VAPID_PUBLIC_KEY),
    }));
  const { endpoint, keys } = subscription.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint,
      p256dh: keys?.p256dh,
      auth: keys?.auth,
      user_agent: navigator.userAgent.slice(0, 300),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );
  if (error) {
    await subscription.unsubscribe();
    throw new Error(error.message);
  }
  return "on";
}

/** Removes the stored subscription first, so the server stops sending even if unsubscribing fails. */
export async function disablePush(): Promise<PushStatus> {
  const subscription = await currentSubscription();
  if (!subscription) return "off";
  if (supabase) {
    const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
    if (error) throw new Error(error.message);
  }
  await subscription.unsubscribe();
  return "off";
}

const TEST_PUSH_MESSAGE: Record<number, string> = {
  401: "Сесія завершилася. Увійдіть знову.",
  404: "Цей пристрій не підписаний на сповіщення. Вимкніть і знову увімкніть їх.",
  503: "Сервер ще не налаштований для надсилання сповіщень.",
};

/** Asks the server to push a test notification to this account's devices. Returns a status message. */
export async function sendTestPush(session: Session): Promise<string> {
  const response = await fetch(apiUrl("/api/push/test"), {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (response.ok) return "Тестове сповіщення надіслано. Воно з’явиться за кілька секунд.";
  return TEST_PUSH_MESSAGE[response.status] ?? "Не вдалося надіслати тестове сповіщення. Спробуйте пізніше.";
}
