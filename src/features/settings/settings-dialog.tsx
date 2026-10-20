import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "../../components/ui/button";
import { Chip } from "../../components/ui/chip";
import { DetailSection, ListRow, SheetNavBar } from "../../components/ui/detail-layout";
import { Input } from "../../components/ui/input";
import { MaterialIcon } from "../../components/ui/material-icon";
import { exitTransition, spring } from "../../lib/motion";
import { useDialogFocus } from "../../lib/use-dialog-focus";
import {
  EMPTY_PROFILE,
  VISITOR_TYPES,
  clearDeviceData,
  readLocalProfile,
  saveLocalProfile,
  type LocalProfile,
} from "./profile";
import "./settings.css";

type PermissionState = "granted" | "denied" | "prompt" | "unsupported";

type SettingsDialogProps = {
  cityName: string;
  notificationMessage: string;
  onClose: () => void;
  onOpenCityPicker: () => void;
  onRequestLocation: () => void;
  onRequestNotifications: () => void;
  onReplayOnboarding: () => void;
};

type View = "main" | "profile" | "account";

const PERMISSION_LABEL: Record<PermissionState, string> = {
  granted: "Дозволено",
  denied: "Вимкнено в налаштуваннях браузера",
  prompt: "Не надано",
  unsupported: "Не підтримується цим браузером",
};

function useGeolocationPermission(): PermissionState {
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

function notificationPermission(): PermissionState {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission === "default" ? "prompt" : Notification.permission;
}

/** Profile and settings. On mobile it is a full-height sheet; on desktop a side panel. */
export function SettingsDialog({
  cityName,
  notificationMessage,
  onClose,
  onOpenCityPicker,
  onRequestLocation,
  onRequestNotifications,
  onReplayOnboarding,
}: SettingsDialogProps) {
  const panelRef = useRef<HTMLElement>(null);
  const [view, setView] = useState<View>("main");
  const [profile, setProfile] = useState<LocalProfile | null>(() => readLocalProfile());
  const [confirmClear, setConfirmClear] = useState(false);
  const location = useGeolocationPermission();
  const [notifications, setNotifications] = useState<PermissionState>(() => notificationPermission());
  useDialogFocus(panelRef, {
    onEscape: () => (view === "main" ? onClose() : setView("main")),
    focusKey: view,
  });

  useEffect(() => {
    // The permission prompt resolves asynchronously and reports through this message.
    setNotifications(notificationPermission());
  }, [notificationMessage]);

  const displayName = profile?.name.trim() || "Гість";

  return (
    <motion.div
      className="settings-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: exitTransition }}
      transition={{ duration: 0.2 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.section
        ref={panelRef}
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24, transition: exitTransition }}
        transition={spring.default}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {view === "main" && (
            <motion.div
              key="main"
              className="settings-view"
              data-focus-scope="main"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24, transition: exitTransition }}
              transition={spring.default}
            >
              <header className="settings-header">
                <h2 id="settings-title">Профіль</h2>
                <Button type="button" variant="ghost" size="icon" aria-label="Закрити" onClick={onClose}>
                  <MaterialIcon name="close" size={20} />
                </Button>
              </header>

              <button type="button" className="settings-profile-card" onClick={() => setView("profile")}>
                <span className="settings-avatar" aria-hidden="true">
                  {profile?.name.trim() ? profile.name.trim()[0].toUpperCase() : <MaterialIcon name="person" size={24} />}
                </span>
                <span className="settings-profile-copy">
                  <strong>{displayName}</strong>
                  <span>{profile ? "Профіль на цьому пристрої" : "Створіть профіль: адреси дому й роботи"}</span>
                </span>
                <MaterialIcon name="chevron_right" size={20} className="list-row-chevron" />
              </button>

              <DetailSection title="Обліковий запис">
                <ListRow
                  leading={<MaterialIcon name="login" size={20} />}
                  title="Увійти або зареєструватися"
                  subtitle="Синхронізація між пристроями · Незабаром"
                  onClick={() => setView("account")}
                />
              </DetailSection>

              <DetailSection title="Місто">
                <ListRow
                  leading={<MaterialIcon name="location_city" size={20} />}
                  title={cityName}
                  subtitle="Змінити місто"
                  onClick={() => {
                    onClose();
                    onOpenCityPicker();
                  }}
                />
              </DetailSection>

              <DetailSection title="Дозволи">
                <ListRow
                  leading={<MaterialIcon name="my_location" size={20} />}
                  title="Геолокація"
                  subtitle={PERMISSION_LABEL[location]}
                  trailing={
                    location === "prompt" ? (
                      <Button type="button" size="sm" variant="outline" onClick={onRequestLocation}>
                        Дозволити
                      </Button>
                    ) : undefined
                  }
                />
                <ListRow
                  leading={<MaterialIcon name="notifications" size={20} />}
                  title="Сповіщення"
                  subtitle={
                    notifications === "granted"
                      ? "Дозволено · надходитимуть після підключення джерел"
                      : PERMISSION_LABEL[notifications]
                  }
                  trailing={
                    notifications === "prompt" ? (
                      <Button type="button" size="sm" variant="outline" onClick={onRequestNotifications}>
                        Дозволити
                      </Button>
                    ) : undefined
                  }
                />
              </DetailSection>

              <DetailSection title="Про застосунок">
                <ListRow
                  leading={<MaterialIcon name="tour" size={20} />}
                  title="Показати знайомство ще раз"
                  onClick={() => {
                    onClose();
                    onReplayOnboarding();
                  }}
                />
                <ListRow
                  leading={<MaterialIcon name="dataset" size={20} />}
                  title="Джерела даних"
                  subtitle="Транспорт: GPS і GTFS від UA-GIS · Місця: OpenStreetMap · Тривоги: alerts.in.ua · Афіша, послуги, робота: демо"
                />
              </DetailSection>

              <DetailSection title="Дані на пристрої">
                {confirmClear ? (
                  <div className="settings-confirm" role="alertdialog" aria-labelledby="settings-clear-title">
                    <strong id="settings-clear-title">Видалити профіль і налаштування?</strong>
                    <span>Буде очищено все, що застосунок зберігає в цьому браузері. Дію не можна скасувати.</span>
                    <div className="settings-confirm-actions">
                      <Button type="button" variant="outline" onClick={() => setConfirmClear(false)}>
                        Скасувати
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          clearDeviceData();
                          window.location.reload();
                        }}
                      >
                        Видалити
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ListRow
                    leading={<MaterialIcon name="delete" size={20} />}
                    title="Очистити дані на пристрої"
                    onClick={() => setConfirmClear(true)}
                  />
                )}
              </DetailSection>
            </motion.div>
          )}

          {view === "profile" && (
            <motion.div
              key="profile"
              className="settings-view"
              data-focus-scope="profile"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24, transition: exitTransition }}
              transition={spring.default}
            >
              <SheetNavBar title="Мій профіль" onBack={() => setView("main")} backLabel="Профіль" />
              <ProfileForm
                initial={profile ?? EMPTY_PROFILE}
                onSave={(next) => {
                  saveLocalProfile(next);
                  setProfile(next);
                  setView("main");
                }}
              />
            </motion.div>
          )}

          {view === "account" && (
            <motion.div
              key="account"
              className="settings-view"
              data-focus-scope="account"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24, transition: exitTransition }}
              transition={spring.default}
            >
              <SheetNavBar title="Обліковий запис" onBack={() => setView("main")} backLabel="Профіль" />
              <div className="settings-account">
                <span className="settings-account-icon" aria-hidden="true">
                  <MaterialIcon name="cloud_sync" size={28} />
                </span>
                <h3>Обліковий запис — незабаром</h3>
                <p>
                  Вхід потрібен для синхронізації профілю, квитків і замовлень між пристроями. Поки
                  що профіль зберігається лише в цьому браузері, і ми нічого не надсилаємо на сервер.
                </p>
                <Button type="button" size="lg" disabled>
                  Увійти · Незабаром
                </Button>
                <Button type="button" size="lg" variant="outline" onClick={() => setView("profile")}>
                  Налаштувати профіль на пристрої
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {notificationMessage && view === "main" && (
          <p className="settings-status" role="status">
            {notificationMessage}
          </p>
        )}
      </motion.section>
    </motion.div>
  );
}

function ProfileForm({ initial, onSave }: { initial: LocalProfile; onSave: (profile: LocalProfile) => void }) {
  const [draft, setDraft] = useState<LocalProfile>(initial);
  const field = (key: keyof LocalProfile) => ({
    value: draft[key],
    onChange: (event: { target: { value: string } }) =>
      setDraft((current) => ({ ...current, [key]: event.target.value })),
  });
  const submit = (event: FormEvent): void => {
    event.preventDefault();
    onSave({
      name: draft.name.trim(),
      visitorType: draft.visitorType,
      home: draft.home.trim(),
      work: draft.work.trim(),
    });
  };

  return (
    <form className="settings-form" onSubmit={submit}>
      <label className="settings-field">
        <span>Ім’я</span>
        <Input autoComplete="given-name" placeholder="Як до вас звертатися" maxLength={40} data-autofocus {...field("name")} />
      </label>
      <fieldset className="settings-field">
        <legend>Хто ви у Львові</legend>
        <div className="settings-chips">
          {VISITOR_TYPES.map((type) => (
            <Chip
              key={type}
              size="sm"
              selected={draft.visitorType === type}
              onClick={() =>
                setDraft((current) => ({ ...current, visitorType: current.visitorType === type ? "" : type }))
              }
            >
              {type}
            </Chip>
          ))}
        </div>
      </fieldset>
      <label className="settings-field">
        <span>Дім</span>
        <Input autoComplete="street-address" placeholder="Вулиця й номер будинку" maxLength={120} {...field("home")} />
      </label>
      <label className="settings-field">
        <span>Робота або навчання</span>
        <Input placeholder="Вулиця й номер будинку" maxLength={120} {...field("work")} />
      </label>
      <p className="settings-hint">
        <MaterialIcon name="lock" size={16} />
        Зберігається лише на цьому пристрої. Адреси допоможуть швидше будувати маршрути.
      </p>
      <Button type="submit" size="lg">
        Зберегти
      </Button>
    </form>
  );
}
