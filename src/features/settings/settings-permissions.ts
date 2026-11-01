import { useEffect, useState } from "react";
import { readPushStatus, type PushStatus, type PushTopic } from "../../lib/push";

/** Location and push permission state, and the push topics the settings list offers. */

export type PermissionState = "granted" | "denied" | "prompt" | "unsupported";

export const PUSH_TOPICS: { topic: PushTopic; icon: string; title: string; subtitle: string }[] = [
  { topic: "air-alert", icon: "campaign", title: "Початок тривоги", subtitle: "Повітряна тривога у Львівській області" },
  { topic: "all-clear", icon: "verified_user", title: "Відбій тривоги", subtitle: "Коли загрозу знято" },
  { topic: "threats", icon: "radar", title: "Загрози для Львова", subtitle: "Нові повідомлення про дрони й авіабомби" },
];

export const PERMISSION_LABEL: Record<PermissionState, string> = {
  granted: "Дозволено",
  denied: "Вимкнено в налаштуваннях браузера",
  prompt: "Не надано",
  unsupported: "Не підтримується цим браузером",
};

export function useGeolocationPermission(): PermissionState {
  const [state, setState] = useState<PermissionState>("prompt");
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState("unsupported");
      return;
    }
    if (!navigator.permissions?.query) return;
    let status: PermissionStatus | null = null;
    const sync = (): void => setState((status?.state as PermissionState | undefined) ?? "prompt");
    navigator.permissions
      .query({ name: "geolocation" })
      .then((result) => {
        status = result;
        sync();
        result.addEventListener("change", sync);
      })
      .catch((error: unknown) => console.error("Could not read the location permission.", error));
    return () => status?.removeEventListener("change", sync);
  }, []);
  return state;
}

export const PUSH_LABEL: Record<PushStatus, string> = {
  unsupported: "Цей браузер не підтримує push-сповіщення",
  "ios-install": "На iPhone спершу додайте next на початковий екран: Поділитися → На початковий екран",
  unconfigured: "Сповіщення ще не налаштовані на сервері",
  denied: "Вимкнено в налаштуваннях браузера",
  off: "Вимкнено",
  on: "Увімкнено на цьому пристрої",
};

export function usePushStatus(): [PushStatus | null, (status: PushStatus) => void] {
  const [status, setStatus] = useState<PushStatus | null>(null);
  useEffect(() => {
    let active = true;
    readPushStatus()
      .then((next) => {
        if (active) setStatus(next);
      })
      .catch((error: unknown) => {
        console.error("Could not read the push subscription.", error);
        if (active) setStatus("unsupported");
      });
    return () => {
      active = false;
    };
  }, []);
  return [status, setStatus];
}
