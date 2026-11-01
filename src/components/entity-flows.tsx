import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./ui/button";
import { Toggle } from "./ui/toggle";
import { DetailChip } from "./ui/detail-layout";
import { Input } from "./ui/input";
import { MaterialIcon } from "./ui/material-icon";
import { exitTransition, spring } from "../lib/motion";
import { OrderPage } from "./order-page";
import { FLOWS, type EntityFlow, type MenuItem } from "./entity-flow-spec";

/**
 * Demo service flows for EntityDetail: order, table, room, appointment, tickets,
 * apply, viewing and catalog. Loaded lazily and only when SERVICES_ENABLED is on,
 * so production builds never ship them (platform-plan D-E).
 */

type EntityFlowPanelProps = {
  openFlow: EntityFlow | null;
  orderOpen: boolean;
  kind: string;
  placeName: string;
  menu: MenuItem[];
  catalog: MenuItem[];
  onCloseFlow: () => void;
  onCloseOrder: () => void;
  onDone: (message: string) => void;
};

export function EntityFlowPanel({
  openFlow,
  orderOpen,
  kind,
  placeName,
  menu,
  catalog,
  onCloseFlow,
  onCloseOrder,
  onDone,
}: EntityFlowPanelProps) {
  return (
    <>
      <AnimatePresence initial={false} mode="wait">
        {openFlow && (
          <motion.section
            key={openFlow}
            className="entity-flow"
            aria-label={FLOWS[openFlow].title}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: exitTransition }}
            transition={spring.default}
          >
            <header className="entity-flow-head">
              <h3>{FLOWS[openFlow].title}</h3>
              <DetailChip icon="science">Демо</DetailChip>
            </header>
            <FlowBody
              flow={openFlow}
              kind={kind}
              catalog={catalog}
              onDone={(message) => {
                onDone(message);
                onCloseFlow();
              }}
            />
          </motion.section>
        )}
      </AnimatePresence>
      {orderOpen &&
        createPortal(
          <OrderPage
            placeName={placeName}
            items={menu}
            onClose={onCloseOrder}
            onDone={(message) => {
              onDone(message);
              onCloseOrder();
            }}
          />,
          document.body,
        )}
    </>
  );
}

const DEMO_NOTE = "Це демо: запит нікуди не надіслано.";

function FlowBody({
  flow,
  kind,
  catalog,
  onDone,
}: {
  flow: EntityFlow;
  kind: string;
  catalog: MenuItem[];
  onDone: (message: string) => void;
}) {
  if (flow === "catalog") return <CatalogFlow items={catalog} onDone={onDone} />;
  return <FormFlow flow={flow} kind={kind} onDone={onDone} />;
}

function CatalogFlow({ items, onDone }: { items: MenuItem[]; onDone: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const visible = items.filter((item) =>
    `${item.name} ${item.description}`.toLocaleLowerCase("uk-UA").includes(query.trim().toLocaleLowerCase("uk-UA")),
  );
  return (
    <>
      <Input type="search" aria-label="Пошук у каталозі" placeholder="Знайти книгу" value={query} onChange={(event) => setQuery(event.target.value)} />
      <ul className="entity-menu">
        {visible.map((item) => (
          <li key={item.id}>
            <span className="entity-menu-copy">
              <strong>{item.name}</strong>
              <span>{item.description}</span>
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => onDone(`«${item.name}» зарезервовано. ${DEMO_NOTE}`)}>
              Зарезервувати
            </Button>
          </li>
        ))}
      </ul>
      {visible.length === 0 && <p className="entity-flow-empty">Нічого не знайдено в каталозі.</p>}
    </>
  );
}

const APPOINTMENT_CHOICES: Record<string, string[]> = {
  health: ["Терапевт", "Стоматолог", "Офтальмолог"],
  beauty: ["Стрижка", "Манікюр", "Догляд за обличчям"],
  veterinary: ["Огляд", "Щеплення", "Консультація"],
};

function FormFlow({ flow, kind, onDone }: { flow: EntityFlow; kind: string; onDone: (message: string) => void }) {
  const [error, setError] = useState("");
  const [count, setCount] = useState(2);
  const [choice, setChoice] = useState(APPOINTMENT_CHOICES[kind]?.[0] ?? "");
  const today = new Date().toISOString().slice(0, 10);

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (name: string): string => String(data.get(name) ?? "");
    if (flow === "room" && value("departure") <= value("arrival")) {
      setError("Дата виїзду має бути пізніше за дату заїзду.");
      return;
    }
    setError("");
    const summary: Record<EntityFlow, string> = {
      table: `Столик на ${count} ${count === 1 ? "особу" : "осіб"}, ${value("date")} о ${value("time")}.`,
      room: `Номер з ${value("arrival")} до ${value("departure")}, гостей: ${count}.`,
      appointment: `${choice ? `${choice}, ` : ""}${value("date")} о ${value("time")}.`,
      tickets: `${count} ${count === 1 ? "квиток" : count < 5 ? "квитки" : "квитків"}.`,
      apply: `Відгук від ${value("name")}.`,
      viewing: `Перегляд ${value("date")} о ${value("time")}.`,
      order: "",
      catalog: "",
    };
    onDone(`${summary[flow]} ${DEMO_NOTE}`);
  };

  const countLabel = flow === "tickets" ? "Кількість квитків" : flow === "room" ? "Гості" : "Кількість осіб";

  return (
    <form className="entity-form" onSubmit={submit} noValidate={false}>
      {flow === "room" ? (
        <div className="entity-form-row">
          <label className="entity-field">
            <span>Заїзд</span>
            <Input type="date" name="arrival" min={today} required />
          </label>
          <label className="entity-field">
            <span>Виїзд</span>
            <Input type="date" name="departure" min={today} required />
          </label>
        </div>
      ) : flow === "apply" ? (
        <>
          <label className="entity-field">
            <span>Ім’я</span>
            <Input name="name" autoComplete="name" required />
          </label>
          <label className="entity-field">
            <span>Телефон або email</span>
            <Input name="contact" autoComplete="email" required />
          </label>
        </>
      ) : flow !== "tickets" ? (
        <div className="entity-form-row">
          <label className="entity-field">
            <span>Дата</span>
            <Input type="date" name="date" min={today} defaultValue={today} required />
          </label>
          <label className="entity-field">
            <span>Час</span>
            <Input type="time" name="time" defaultValue="18:00" step={900} required />
          </label>
        </div>
      ) : null}

      {flow === "appointment" && APPOINTMENT_CHOICES[kind] && (
        <fieldset className="entity-field">
          <legend>Послуга</legend>
          <div className="entity-chips">
            {APPOINTMENT_CHOICES[kind].map((option) => (
              <Toggle variant="pill" key={option} size="sm" onClick={() => setChoice(option)} pressed={choice === option}>
                {option}
              </Toggle>
            ))}
          </div>
        </fieldset>
      )}

      {(flow === "table" || flow === "room" || flow === "tickets") && (
        <div className="entity-field">
          <span id={`entity-count-${flow}`}>{countLabel}</span>
          <span className="entity-stepper" role="group" aria-labelledby={`entity-count-${flow}`}>
            <Button type="button" variant="outline" size="icon" aria-label="Менше" disabled={count <= 1} onClick={() => setCount((c) => Math.max(1, c - 1))}>
              <MaterialIcon name="remove" size={18} />
            </Button>
            <output aria-live="polite">{count}</output>
            <Button type="button" variant="outline" size="icon" aria-label="Більше" disabled={count >= 10} onClick={() => setCount((c) => Math.min(10, c + 1))}>
              <MaterialIcon name="add" size={18} />
            </Button>
          </span>
        </div>
      )}

      {error && (
        <p className="entity-form-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="entity-flow-submit">
        {FLOWS[flow].flow === "apply" ? "Надіслати відгук" : flow === "tickets" ? "Придбати" : "Підтвердити"}
      </Button>
    </form>
  );
}
