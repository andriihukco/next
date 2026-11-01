/** Admin dataset overrides saved in local storage and read back with validation. */
import { isDevRouteActive } from "./dev-tools/route";
import { ADMIN_OVERRIDES_KEY } from "./dev-tools/storage";
import type { AdminDatasetId, AdminOverrides } from "./app-types";
import { isRecord } from "./app-validators";

export const readAdminOverrides = (): AdminOverrides => {
  try {
    const saved = localStorage.getItem(ADMIN_OVERRIDES_KEY);
    if (!saved) return {};
    const parsed: unknown = JSON.parse(saved);
    if (!isRecord(parsed)) {
      console.error("Saved admin overrides are invalid; ignoring them.");
      return {};
    }
    return parsed as AdminOverrides;
  } catch (error) {
    console.error("Could not read local admin overrides.", error);
    return {};
  }
};

export const readAdminOverride = <T,>(
  id: AdminDatasetId,
  fallback: T,
  guard: (value: unknown) => value is T,
): T => {
  if (!isDevRouteActive()) return fallback;
  const override = readAdminOverrides()[id];
  if (override === undefined) return fallback;
  if (guard(override)) return override;
  console.error(`Saved admin override for ${id} is invalid; ignoring it.`);
  return fallback;
};

export const persistAdminOverride = (id: AdminDatasetId, value: unknown): string | null => {
  if (!isDevRouteActive()) {
    return "Редагування доступне лише на маршруті /dev.";
  }
  try {
    const overrides = readAdminOverrides();
    localStorage.setItem(
      ADMIN_OVERRIDES_KEY,
      JSON.stringify({ ...overrides, [id]: value }),
    );
    return null;
  } catch (error) {
    console.error(`Could not save the ${id} admin override.`, error);
    return "Зміни не збережено. Перевірте доступ до локального сховища.";
  }
};
