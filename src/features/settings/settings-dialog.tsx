import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "../../components/ui/button";
import { Toggle } from "../../components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { DetailSection, ListRow, SheetNavBar } from "../../components/ui/detail-layout";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";
import { MaterialIcon } from "../../components/ui/material-icon";
import { panelMotion, scrimMotion, spring, exitTransition } from "../../lib/motion";
import {
  disablePush,
  enablePush,
  readPushStatus,
  readPushTopics,
  savePushTopics,
  sendTestPush,
  type PushStatus,
  type PushTopic,
} from "../../lib/push";
import { accountLabel, supabase, usePasswordRecovery, useSession } from "../../lib/supabase";
import { useDialogFocus } from "../../lib/use-dialog-focus";
import { useMediaQuery } from "../../lib/use-media-query";
import { setThemePreference, useThemePreference, type ThemePreference } from "../../lib/use-theme";
import {
  EMPTY_PROFILE,
  VISITOR_TYPES,
  clearDeviceData,
  readLocalProfile,
  saveLocalProfile,
  type LocalProfile,
} from "./profile";
import { AccountView } from "./account-view";
import "./settings.css";

type PermissionState = "granted" | "denied" | "prompt" | "unsupported";

type SettingsDialogProps = {
  cityName: string;
  onClose: () => void;
  onOpenCityPicker: () => void;
  onRequestLocation: () => void;
  onReplayOnboarding: () => void;
  /** Opens straight on a sub-view, for example the account after a password-reset link. */
  initialView?: View;
};

export type View = "main" | "profile" | "account";

const PUSH_TOPICS: { topic: PushTopic; icon: string; title: string; subtitle: string }[] = [
  { topic: "air-alert", icon: "campaign", title: "Початок тривоги", subtitle: "Повітряна тривога у Львівській області" },
  { topic: "all-clear", icon: "verified_user", title: "Відбій тривоги", subtitle: "Коли загрозу знято" },
  { topic: "threats", icon: "radar", title: "Загрози для Львова", subtitle: "Нові повідомлення про дрони й авіабомби" },
];

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

const PUSH_LABEL: Record<PushStatus, string> = {
  unsupported: "Цей браузер не підтримує push-сповіщення",
  "ios-install": "На iPhone спершу додайте next на початковий екран: Поділитися → На початковий екран",
  unconfigured: "Сповіщення ще не налаштовані на сервері",
  denied: "Вимкнено в налаштуваннях браузера",
  off: "Вимкнено",
  on: "Увімкнено на цьому пристрої",
};

function usePushStatus(): [PushStatus | null, (status: PushStatus) => void] {
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

/** Profile and settings. On mobile it is a full-height sheet; on desktop a side panel. */
export function SettingsDialog({
  cityName,
  onClose,
  onOpenCityPicker,
  onRequestLocation,
  onReplayOnboarding,
  initialView = "main",
}: SettingsDialogProps) {
  const panelRef = useRef<HTMLElement>(null);
  const [view, setView] = useState<View>(initialView);
  const [profile, setProfile] = useState<LocalProfile | null>(() => readLocalProfile());
  const [confirmClear, setConfirmClear] = useState(false);
  const location = useGeolocationPermission();
  const { session } = useSession();
  const [push, setPush] = usePushStatus();
  const [pushBusy, setPushBusy] = useState(false);
  const [topics, setTopics] = useState<PushTopic[] | null>(null);
  const [status, setStatus] = useState("");
  const recovering = usePasswordRecovery();

  useEffect(() => {
    if (push !== "on") {
      setTopics(null);
      return;
    }
    let active = true;
    readPushTopics()
      .then((next) => {
        if (active) setTopics(next);
      })
      .catch((error: unknown) => {
        console.error("Could not read notification topics.", error);
        if (active) setStatus("Не вдалося завантажити налаштування сповіщень.");
      });
    return () => {
      active = false;
    };
  }, [push, session]);

  const toggleTopic = async (topic: PushTopic, enabled: boolean): Promise<void> => {
    if (!topics) return;
    const previous = topics;
    const next = enabled ? [...topics, topic] : topics.filter((item) => item !== topic);
    setTopics(next);
    try {
      await savePushTopics(next);
    } catch (error: unknown) {
      console.error("Could not save notification topics.", error);
      setTopics(previous);
      setStatus("Не вдалося зберегти налаштування сповіщень. Спробуйте ще раз.");
    }
  };
  useDialogFocus(panelRef, {
    onEscape: () => (view === "main" ? onClose() : setView("main")),
    focusKey: view,
  });

  const togglePush = async (enable: boolean): Promise<void> => {
    if (enable && !session) {
      setView("account");
      return;
    }
    setPushBusy(true);
    setStatus("");
    try {
      const next = enable ? await enablePush() : await disablePush();
      setPush(next);
      if (enable && next === "on") setStatus("Сповіщення увімкнено. Виберіть, про що повідомляти.");
      if (enable && next === "denied") setStatus("Дозвіл не надано. Його можна змінити в налаштуваннях браузера.");
    } catch (error: unknown) {
      console.error("Could not change the push subscription.", error);
      setStatus(enable ? "Не вдалося увімкнути сповіщення. Спробуйте ще раз." : "Не вдалося вимкнути сповіщення.");
    } finally {
      setPushBusy(false);
    }
  };

  const testPush = async (): Promise<void> => {
    if (!session) return;
    setPushBusy(true);
    try {
      setStatus(await sendTestPush(session));
    } catch (error: unknown) {
      console.error("Could not request a test notification.", error);
      setStatus("Немає з’єднання з сервером. Спробуйте пізніше.");
    } finally {
      setPushBusy(false);
    }
  };

  const signOut = async (): Promise<void> => {
    if (!supabase) return;
    // The subscription row belongs to this account, so drop it while the session can still delete it.
    if (push === "on") await disablePush().then(setPush).catch((error: unknown) => console.error("Could not remove the push subscription.", error));
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Could not sign out.", error);
      setStatus("Не вдалося вийти. Спробуйте ще раз.");
      return;
    }
    setStatus("Ви вийшли з облікового запису.");
    setView("main");
  };

  const themePreference = useThemePreference();
  const displayName = profile?.name.trim() || "Гість";
  const mobile = useMediaQuery("(max-width: 800px)");

  return (
    <motion.div
      className="settings-overlay"
      {...scrimMotion}
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
        {...panelMotion(mobile)}
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
                  leading={<MaterialIcon name={session ? "account_circle" : "login"} size={20} />}
                  title={session ? accountLabel(session.user) : "Увійти або зареєструватися"}
                  subtitle={session ? "Ви увійшли" : "Для сповіщень про тривогу"}
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
              </DetailSection>

              <DetailSection title="Сповіщення">
                <ListRow
                  leading={<MaterialIcon name="notifications" size={20} />}
                  title="Сповіщення на цьому пристрої"
                  subtitle={
                    push === null
                      ? "Перевіряємо…"
                      : push === "off" && !session
                        ? "Увійдіть, щоб отримувати сповіщення"
                        : PUSH_LABEL[push]
                  }
                  trailing={
                    <Switch
                      aria-label="Сповіщення на цьому пристрої"
                      checked={push === "on"}
                      disabled={pushBusy || (push !== "on" && push !== "off")}
                      onCheckedChange={(checked) => void togglePush(checked)}
                    />
                  }
                />
                {push === "on" &&
                  PUSH_TOPICS.map((item) => (
                    <ListRow
                      key={item.topic}
                      leading={<MaterialIcon name={item.icon} size={20} />}
                      title={item.title}
                      subtitle={item.subtitle}
                      trailing={
                        <Switch
                          aria-label={item.title}
                          checked={topics?.includes(item.topic) ?? false}
                          disabled={topics === null}
                          onCheckedChange={(checked) => void toggleTopic(item.topic, checked)}
                        />
                      }
                    />
                  ))}
                {push === "on" && session && (
                  <ListRow
                    leading={<MaterialIcon name="send" size={20} />}
                    title="Тестове сповіщення"
                    subtitle="Перевірте, чи сповіщення доходять"
                    trailing={
                      <Button type="button" size="sm" variant="outline" disabled={pushBusy} onClick={() => void testPush()}>
                        Надіслати
                      </Button>
                    }
                  />
                )}
              </DetailSection>

              <DetailSection title="Вигляд">
                <ListRow
                  leading={<MaterialIcon name="dark_mode" size={20} />}
                  title="Тема"
                  subtitle="Системна, світла або темна"
                  trailing={
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      size="sm"
                      value={themePreference}
                      onValueChange={(value) => {
                        if (value) setThemePreference(value as ThemePreference);
                      }}
                      aria-label="Тема"
                    >
                      <ToggleGroupItem value="system">Системна</ToggleGroupItem>
                      <ToggleGroupItem value="light">Світла</ToggleGroupItem>
                      <ToggleGroupItem value="dark">Темна</ToggleGroupItem>
                    </ToggleGroup>
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
              <AccountView
                user={session?.user ?? null}
                recovering={recovering}
                onSignOut={() => void signOut()}
                onSetUpProfile={() => setView("profile")}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {status && view === "main" && (
          <p className="settings-status" role="status">
            {status}
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
            <Toggle variant="pill"
              key={type}
              size="sm"
             
              onClick={() =>
                setDraft((current) => ({ ...current, visitorType: current.visitorType === type ? "" : type }))
              } pressed={draft.visitorType === type}>
              {type}
            </Toggle>
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
