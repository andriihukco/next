import { useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "../../components/ui/button";
import { MaterialIcon } from "../../components/ui/material-icon";
import { exitTransition, panelMotion, scrimMotion, spring } from "../../lib/motion";
import { useDialogFocus } from "../../lib/use-dialog-focus";
import { useMediaQuery } from "../../lib/use-media-query";
import { AppointmentFlow } from "./appointment-flow";
import { CinemaFlow } from "./cinema-flow";
import { MembershipFlow } from "./membership-flow";
import { ShopFlow } from "./shop-flow";
import { SERVICES, type ServiceId } from "./services";
import { TableFlow } from "./table-flow";
import { TaxiFlow } from "./taxi-flow";
import "./super-app.css";

type ServicesHubProps = {
  onClose: () => void;
};

function ServiceFlow({ id, onExit }: { id: ServiceId; onExit: () => void }) {
  switch (id) {
    case "groceries":
      return <ShopFlow mode="groceries" onExit={onExit} />;
    case "delivery":
      return <ShopFlow mode="delivery" onExit={onExit} />;
    case "restaurants":
      return <TableFlow onExit={onExit} />;
    case "doctors":
      return <AppointmentFlow onExit={onExit} />;
    case "cinema":
      return <CinemaFlow onExit={onExit} />;
    case "gyms":
      return <MembershipFlow onExit={onExit} />;
    case "taxi":
      return <TaxiFlow onExit={onExit} />;
  }
}

/**
 * Services hub: one grid of verticals. Each opens its own flow inside the same
 * panel. The panel is a side panel on desktop and a full-height sheet on mobile,
 * the same frame as profile and settings.
 */
export function ServicesHub({ onClose }: ServicesHubProps) {
  const panelRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<ServiceId | null>(null);
  const activeService = SERVICES.find((item) => item.id === active) ?? null;
  const mobile = useMediaQuery("(max-width: 800px)");

  useDialogFocus(panelRef, {
    onEscape: () => (active ? setActive(null) : onClose()),
    focusKey: active ?? "hub",
  });

  return (
    <motion.div
      className="services-overlay"
      {...scrimMotion}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.section
        ref={panelRef}
        className="services-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="services-title"
        {...panelMotion(mobile)}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {activeService === null ? (
            <motion.div
              key="hub"
              className="services-view"
              data-focus-scope="hub"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24, transition: exitTransition }}
              transition={spring.default}
            >
              <header className="services-header">
                <h2 id="services-title">Сервіси</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Закрити"
                  onClick={onClose}
                >
                  <MaterialIcon name="close" size={20} />
                </Button>
              </header>
              <p className="services-intro">
                Доставка, столик, запис до лікаря, квитки, абонемент і таксі. Кожен сервіс має свій
                крок-за-кроком сценарій.
              </p>
              <ul className="services-grid" aria-label="Сервіси">
                {SERVICES.map((service) => (
                  <li key={service.id}>
                    <button
                      type="button"
                      className="services-tile"
                      onClick={() => setActive(service.id)}
                    >
                      <span
                        className="services-tile-icon"
                        style={{ "--service-color": service.color } as CSSProperties}
                        aria-hidden="true"
                      >
                        <MaterialIcon name={service.icon} size={24} />
                      </span>
                      <span className="services-tile-title">{service.label}</span>
                      <span className="services-tile-description">{service.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="services-note">
                Сервіси в демонстраційному режимі. Замовлення, бронювання і оплата нічого не
                надсилають.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={activeService.id}
              className="services-view services-view--flow"
              data-focus-scope={activeService.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24, transition: exitTransition }}
              transition={spring.default}
            >
              <ServiceFlow id={activeService.id} onExit={() => setActive(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </motion.div>
  );
}
