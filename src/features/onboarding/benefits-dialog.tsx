import { useRef } from "react";
import { motion } from "motion/react";
import { Button } from "../../components/ui/button";
import { MaterialIcon } from "../../components/ui/material-icon";
import { exitTransition, spring } from "../../lib/motion";
import { useDialogFocus } from "../../lib/use-dialog-focus";
import "./onboarding.css";

type BenefitsDialogProps = {
  notificationMessage: string;
  onRequestLocation: () => void;
  onRequestNotifications: () => void;
  onDismiss: () => void;
};

const BENEFITS = [
  { icon: "directions_transit", label: "Прибуття транспорту поруч" },
  { icon: "event", label: "Майбутні події у Львові" },
  { icon: "local_offer", label: "Місцеві знижки й пропозиції" },
] as const;

/** Asked once, after onboarding: permissions are optional and requested only on tap. */
export function BenefitsDialog({
  notificationMessage,
  onRequestLocation,
  onRequestNotifications,
  onDismiss,
}: BenefitsDialogProps) {
  const cardRef = useRef<HTMLElement>(null);
  useDialogFocus(cardRef, { onEscape: onDismiss });

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
        <div className="benefits-actions">
          <Button type="button" size="lg" onClick={onRequestLocation}>
            <MaterialIcon name="my_location" size={18} />
            Дозволити геолокацію
          </Button>
          <Button type="button" size="lg" variant="outline" onClick={onRequestNotifications}>
            <MaterialIcon name="notifications" size={18} />
            Увімкнути сповіщення
          </Button>
        </div>
        <p className="benefits-note" role="status" aria-live="polite">
          {notificationMessage ||
            "Сповіщення про ці теми з’являться після підключення відповідних джерел."}
        </p>
        <Button type="button" variant="ghost" className="benefits-dismiss" onClick={onDismiss}>
          Не зараз
        </Button>
      </motion.section>
    </motion.div>
  );
}
