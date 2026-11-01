import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "../../components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { DetailSection, ListRow, SheetNavBar } from "../../components/ui/detail-layout";
import { MaterialIcon } from "../../components/ui/material-icon";
import { panelMotion, scrimMotion, spring, exitTransition } from "../../lib/motion";
import { disablePush } from "../../lib/push";
import { accountLabel, supabase, usePasswordRecovery, useSession } from "../../lib/supabase";
import { useDialogFocus } from "../../lib/use-dialog-focus";
import { useMediaQuery } from "../../lib/use-media-query";
import { setThemePreference, useThemePreference, type ThemePreference } from "../../lib/use-theme";
import {
  EMPTY_PROFILE,
  clearDeviceData,
  readLocalProfile,
  saveLocalProfile,
  type LocalProfile,
} from "./profile";
import { AccountView } from "./account-view";
import "./settings.css";
import { PERMISSION_LABEL, useGeolocationPermission } from "./settings-permissions";
import { ProfileForm } from "./profile-form";
import { NotificationsSection, usePushSettings } from "./notifications-section";
import { isLegalSlug } from "../../legal/legal-content";

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

// Legal and trust pages (platform-plan S8).
const ABOUT_LINKS = [
  { href: "/updates", icon: "new_releases", title: "Що нового" },
  { href: "/terms", icon: "gavel", title: "Умови користування" },
  { href: "/privacy", icon: "shield_person", title: "Політика конфіденційності" },
  { href: "/sources", icon: "dataset", title: "Джерела даних" },
  { href: "/accessibility", icon: "accessibility_new", title: "Доступність" },
].filter(({ href }) => href === "/updates" || isLegalSlug(href.slice(1)));


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
  const [status, setStatus] = useState("");
  const pushSettings = usePushSettings(session, setStatus, () => setView("account"));
  const { push, setPush } = pushSettings;
  const recovering = usePasswordRecovery();


  useDialogFocus(panelRef, {
    onEscape: () => (view === "main" ? onClose() : setView("main")),
    focusKey: view,
  });


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

              <NotificationsSection settings={pushSettings} signedIn={Boolean(session)} />

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
                {ABOUT_LINKS.map((link) => (
                  <ListRow
                    key={link.href}
                    leading={<MaterialIcon name={link.icon} size={20} />}
                    title={link.title}
                    onClick={() => window.location.assign(link.href)}
                  />
                ))}
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
