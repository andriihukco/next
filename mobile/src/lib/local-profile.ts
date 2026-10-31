import AsyncStorage from "@react-native-async-storage/async-storage";

// Same shape as src/features/settings/profile.ts (web). Stored only on this device; nothing is sent.
export const LOCAL_PROFILE_KEY = "un-profile";
export const VISITOR_TYPES = ["Місцевий житель", "Студент", "Турист", "Працюю у Львові"] as const;

export type LocalProfile = {
  name: string;
  visitorType: string;
  home: string;
  work: string;
};

export const EMPTY_PROFILE: LocalProfile = { name: "", visitorType: "", home: "", work: "" };

export async function readLocalProfile(): Promise<LocalProfile> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_PROFILE_KEY);
    if (!raw) return EMPTY_PROFILE;
    const parsed = JSON.parse(raw) as Partial<LocalProfile>;
    return {
      name: parsed.name ?? "",
      visitorType: parsed.visitorType ?? "",
      home: parsed.home ?? "",
      work: parsed.work ?? "",
    };
  } catch {
    return EMPTY_PROFILE;
  }
}

export async function saveLocalProfile(profile: LocalProfile): Promise<void> {
  await AsyncStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
}

/** Removes everything this app stores on the device. */
export async function clearDeviceData(): Promise<void> {
  await AsyncStorage.clear();
}
