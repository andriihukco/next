import { readOnboardingValue, saveOnboardingValue } from "../onboarding/storage";

// The `un-` prefix stays until the brand decision (DESIGN.md D2) renames all keys at once.
export const LOCAL_PROFILE_KEY = "un-profile";

/**
 * A profile that lives only on this device. There is no account backend yet,
 * so nothing here is sent anywhere (DESIGN.md §1, "Honest data").
 */
export type LocalProfile = {
  name: string;
  visitorType: string;
  home: string;
  work: string;
};

export const EMPTY_PROFILE: LocalProfile = { name: "", visitorType: "", home: "", work: "" };

export const VISITOR_TYPES = ["Місцевий житель", "Студент", "Турист", "Працюю у Львові"] as const;

export function readLocalProfile(): LocalProfile | null {
  const raw = readOnboardingValue(LOCAL_PROFILE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    const text = (key: keyof LocalProfile): string =>
      typeof record[key] === "string" ? (record[key] as string) : "";
    return { name: text("name"), visitorType: text("visitorType"), home: text("home"), work: text("work") };
  } catch (error) {
    console.error("Could not parse the saved profile.", error);
    return null;
  }
}

export function saveLocalProfile(profile: LocalProfile): void {
  saveOnboardingValue(LOCAL_PROFILE_KEY, JSON.stringify(profile));
}

/** Removes everything this app stores in the browser for this site. */
export function clearDeviceData(): void {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (error) {
    console.error("Could not clear device storage.", error);
  }
}
