import { useSyncExternalStore } from "react";

/**
 * @file route.ts
 * @description The `/dev` gate. The developer tools are reachable only while
 * the browser sits on the `/dev` path of the current host.
 */

export const DEV_ROUTE = "/dev";

/** Returns true for `/dev` and any nested path below it (`/dev/fixtures`). */
export function isDevPathname(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === DEV_ROUTE || path.startsWith(`${DEV_ROUTE}/`);
}

let currentPathname =
  typeof window === "undefined" ? "/" : window.location.pathname;
let devRouteActive = isDevPathname(currentPathname);
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/**
 * Recomputes the gate after any client-side navigation.
 * Called by the patched history API and by `popstate`.
 */
export function syncDevRoute(): boolean {
  const pathname = window.location.pathname;
  if (pathname === currentPathname) return devRouteActive;
  currentPathname = pathname;
  const next = isDevPathname(pathname);
  if (next !== devRouteActive) {
    devRouteActive = next;
    emit();
  }
  return devRouteActive;
}

const PATCH_FLAG = "__unDevRoutePatched__";

if (typeof window !== "undefined" && !(window as unknown as Record<string, unknown>)[PATCH_FLAG]) {
  (window as unknown as Record<string, unknown>)[PATCH_FLAG] = true;
  const { pushState, replaceState } = window.history;
  window.history.pushState = function patchedPushState(
    ...args: Parameters<History["pushState"]>
  ) {
    pushState.apply(this, args);
    syncDevRoute();
  };
  window.history.replaceState = function patchedReplaceState(
    ...args: Parameters<History["replaceState"]>
  ) {
    replaceState.apply(this, args);
    syncDevRoute();
  };
  window.addEventListener("popstate", () => {
    syncDevRoute();
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Module-level read for non-React code (data loaders, persistence helpers)
 * that must know whether the developer tools are unlocked.
 */
export function isDevRouteActive(): boolean {
  return devRouteActive;
}

/** React binding of the `/dev` gate. */
export function useDevRoute(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => devRouteActive,
    () => false,
  );
}
