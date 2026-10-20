/**
 * @file storage.ts
 * @description LocalStorage keys owned by the developer tools plus helpers to
 * wipe them in one action.
 */

export const ADMIN_OVERRIDES_KEY = "edem.admin-overrides";
export const FIXTURE_SETTINGS_KEY = "un.dev-fixture-settings";
export const DEV_TOOLS_POSITION_KEY = "un.dev-tools.position";
export const ONBOARDING_PREVIEW_KEY = "un-onboarding-preview";
export const ONBOARDING_COMPLETE_KEY = "un-onboarding-complete";

export const DEV_STORAGE_KEYS = [
  FIXTURE_SETTINGS_KEY,
  ADMIN_OVERRIDES_KEY,
  DEV_TOOLS_POSITION_KEY,
  ONBOARDING_PREVIEW_KEY,
] as const;

/** Removes every developer-owned localStorage key. Returns removed keys. */
export function clearDevStorage(): string[] {
  const removed: string[] = [];
  for (const key of DEV_STORAGE_KEYS) {
    try {
      if (localStorage.getItem(key) === null) continue;
      localStorage.removeItem(key);
      removed.push(key);
    } catch (error) {
      console.error(`Could not remove the local storage key ${key}.`, error);
    }
  }
  return removed;
}
