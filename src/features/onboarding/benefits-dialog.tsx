import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "../../components/ui/button";
import { ListRow } from "../../components/ui/detail-layout";
import { MaterialIcon } from "../../components/ui/material-icon";
import { Switch } from "../../components/ui/switch";
import { exitTransition, spring } from "../../lib/motion";
import { useDialogFocus } from "../../lib/use-dialog-focus";
import "./onboarding.css";

type BenefitsDialogProps = {
  notificationMessage: string;
  onRequestLocation: () => void;
  onRequestNotifications: () => Promise<void>;
  onDismiss: () => void;
};

const BENEFITS = [
  { icon: "directions_transit", label: "Прибуття транспорту поруч" },
  { icon: "event", label: "Майбутні події у Львові" },
  { icon: "local_offer", label: "Місцеві знижки й пропозиції" },
] as const;

const PERMISSIONS = [
  { id: "location", icon: "my_location", title: "Геолокація", subtitle: "Найближчі зупинки й місця" },
  { id: "notifications", icon: "notifications", title: "Сповіщення", subtitle: "Коли підключимо джерела подій" },
] as const;

type PermissionId = (typeof PERMISSIONS)[number]["id"];

/**
 * Asked once, after onboarding. Both switches start off; the browser prompts run only
 * on «Зберегти», which appears once a switch is on and closes the dialog when done.
 */
export function BenefitsDialog({
  notificationMessage,
  onRequestLocation,
  onRequestNotifications,
  onDismiss,
}: BenefitsDialogProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [chosen, setChosen] = useState<Record<PermissionId, boolean>>({ location: false, notifications: false });
  const [saving, setSaving] = useState(false);
  const anyChosen = chosen.location || chosen.notifications;
  useDialogFocus(cardRef, { onEscape: onDismiss });

  const save = async (): Promise<void> => {
    setSaving(true);
    if (chosen.location) onRequestLocation();
    if (chosen.notifications) await onRequestNotifications();
    onDismiss();
  };

  return (
    <motion.div
      className="benefits-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: exitTransition }}
      transition={{ duration: 0.2 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onDismiss();
      }}
    >
      <motion.section
        ref={cardRef}
        className="benefits-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="benefits-title"
        aria-describedby="benefits-intro"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, transition: exitTransition }}
        transition={spring.default}
      >
        <span className="onboarding-icon" aria-hidden="true">
          <MaterialIcon name="near_me" size={22} filled />
        </span>
        <h2 id="benefits-title" className="onboarding-heading">
          Більше корисного поруч
        </h2>
        <p id="benefits-intro" className="onboarding-intro">
          Геолокація допоможе знайти найближчі місця. Дозвіл можна не надавати — мапа й інші
          розділи залишаться доступними.
        </p>
        <ul className="benefits-list">
          {BENEFITS.map((item) => (
            <li key={item.label}>
              <MaterialIcon name={item.icon} size={20} />
              {item.label}
            </li>
          ))}
        </ul>
        <div className="benefits-permissions">
          {PERMISSIONS.map((item) => (
            <ListRow
              key={item.id}
              leading={<MaterialIcon name={item.icon} size={20} />}
              title={item.title}
              subtitle={item.subtitle}
              trailing={
                <Switch
                  aria-label={item.title}
                  checked={chosen[item.id]}
                  disabled={saving}
                  onCheckedChange={(checked) => setChosen((current) => ({ ...current, [item.id]: checked }))}
                />
              }
            />
          ))}
        </div>
        <p className="benefits-note" role="status" aria-live="polite">
          {notificationMessage || "Браузер попросить підтвердити кожен дозвіл. Змінити їх можна в налаштуваннях."}
        </p>
        <AnimatePresence initial={false}>
          {anyChosen && (
            <motion.div
              key="save"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8, transition: exitTransition }}
              transition={spring.default}
            >
              <Button type="button" size="lg" className="benefits-save" disabled={saving} onClick={() => void save()}>
                Зберегти
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        <Button type="button" variant="ghost" className="benefits-dismiss" onClick={onDismiss}>
          Не зараз
        </Button>
      </motion.section>
    </motion.div>
  );
}
