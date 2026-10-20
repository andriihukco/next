// Storage keys keep the `un-` prefix until the brand decision (DESIGN.md D2)
// renames them in one migration.
export const ONBOARDING_COMPLETE_KEY = "un-onboarding-complete";
export const ONBOARDING_PREVIEW_KEY = "un-onboarding-preview";
export const BENEFITS_DISMISSED_KEY = "un-benefits-dismissed";
export const ONBOARDING_PROFILE_KEY = "un-onboarding-profile";

export const readOnboardingValue = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Could not read ${key} from local storage.`, error);
    return null;
  }
};

export const saveOnboardingValue = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Could not save ${key} to local storage.`, error);
  }
};
