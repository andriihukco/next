import { useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./ui/button";
import { Chip } from "./ui/chip";
import { ActionBar, ActionBarButton, DetailChip, DetailSection, ListRow } from "./ui/detail-layout";
import { IconButton } from "./ui/icon-button";
import { Input } from "./ui/input";
import { MaterialIcon } from "./ui/material-icon";
import { exitTransition, spring } from "../lib/motion";
import "./entity-detail.css";

/**
 * One detail layout for every entity: places, schools, services, jobs, homes
 * and events (DESIGN.md §7). They differ only in their primary action, which
 * is chosen from the entity kind: order, book a table or room, sign up, buy a
 * ticket, apply, book a viewing. Directions, call, share and save are shared.
 *
 * None of these flows is connected to a provider yet, so every result says so
 * and nothing leaves the device (DESIGN.md §1, §9).
 */

export type EntityFlow =
  | "order"
  | "table"
  | "room"
  | "appointment"
  | "tickets"
  | "apply"
  | "viewing"
  | "catalog";

export type MenuItem = { id: string; name: string; description: string; price: number };

type FlowSpec = { flow: EntityFlow; label: string; icon: string; title: string };

const FLOWS: Record<EntityFlow, FlowSpec> = {
  order: { flow: "order", label: "Замовити", icon: "shopping_bag", title: "Замовлення" },
  table: { flow: "table", label: "Столик", icon: "table_restaurant", title: "Бронювання столика" },
  room: { flow: "room", label: "Номер", icon: "hotel", title: "Бронювання номера" },
  appointment: { flow: "appointment", label: "Записатися", icon: "event_available", title: "Запис" },
  tickets: { flow: "tickets", label: "Квитки", icon: "confirmation_number", title: "Квитки" },
  apply: { flow: "apply", label: "Відгукнутися", icon: "send", title: "Відгук на вакансію" },
  viewing: { flow: "viewing", label: "Перегляд", icon: "calendar_month", title: "Запис на перегляд" },
  catalog: { flow: "catalog", label: "Каталог", icon: "menu_book", title: "Каталог" },
};

/** Which flows an entity offers, primary first. Unknown kinds get directions only. */
export function flowsForKind(kind: string): EntityFlow[] {
  switch (kind) {
    case "food":
      return ["order", "table"];
    case "groceries":
    case "flowers":
    case "pharmacy":
      return ["order"];
    case "stay":
      return ["room"];
    case "health":
    case "beauty":
    case "veterinary":
    case "car-repair":
    case "car-wash":
    case "tire-service":
    case "service":
      return ["appointment"];
    case "culture":
    case "tourism":
    case "sports":
    case "event":
      return ["tickets"];
    case "job":
      return ["apply"];
    case "home":
      return ["viewing"];
    case "library":
    case "education":
      return ["catalog"];
    default:
      return [];
  }
}

export type InfoRow = { icon: string; label: string; value: string; href?: string };

type EntityDetailProps = {
  kind: string;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  /** Replaces the icon for dated entities (events). */
  date?: { day: string; month: string };
  demo?: boolean;
  live?: string;
  description?: string;
  info?: InfoRow[];
  menu?: MenuItem[];
  catalog?: MenuItem[];
  coordinates: [number, number];
  phone?: string;
  website?: string;
  sourceUrl?: string;
  saved: boolean;
  onToggleSaved: () => void;
  onShowOnMap: () => void;
  onDirections: () => void;
  children?: ReactNode;
};

export function EntityDetail({
  kind,
  title,
  eyebrow,
  subtitle,
  icon = "place",
  iconColor,
  date,
  demo,
  live,
  description,
  info = [],
  menu = [],
  catalog = [],
  phone,
  website,
  sourceUrl,
  saved,
  onToggleSaved,
  onShowOnMap,
  onDirections,
  children,
}: EntityDetailProps) {
  const flows = flowsForKind(kind);
  const [openFlow, setOpenFlow] = useState<EntityFlow | null>(null);
  const [status, setStatus] = useState("");

  const share = (): void => {
    const text = [title, subtitle].filter(Boolean).join(" · ");
    if (navigator.share) {
      navigator.share({ title, text, url: window.location.href }).catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Could not share.", error);
      });
      return;
    }
    navigator.clipboard
      ?.writeText(`${text} — ${window.location.href}`)
      .then(() => setStatus("Посилання скопійовано."))
      .catch((error: unknown) => console.error("Could not copy the link.", error));
  };

  const toggleFlow = (flow: EntityFlow): void => {
    setStatus("");
    setOpenFlow((current) => (current === flow ? null : flow));
  };

  return (
    <article className="entity-detail" aria-labelledby="entity-detail-title">
      <header className="entity-hero">
        {date ? (
          <span className="entity-date" aria-hidden="true">
            <strong>{date.day}</strong>
            <span>{date.month}</span>
          </span>
        ) : (
          <span
            className="entity-icon"
            style={iconColor ? ({ "--entity-color": iconColor } as CSSProperties) : undefined}
            aria-hidden="true"
          >
            <MaterialIcon name={icon} size={24} />
          </span>
        )}
        <div className="entity-hero-copy">
          {eyebrow && <span className="detail-eyebrow">{eyebrow}</span>}
          <h2 id="entity-detail-title">{title}</h2>
          {subtitle && <p>{subtitle}</p>}
          {(demo || live) && (
            <div className="detail-chips">
              {live && (
                <DetailChip icon="sensors" tone="live">
                  {live}
                </DetailChip>
              )}
              {demo && <DetailChip icon="science">Демо</DetailChip>}
            </div>
          )}
        </div>
        <div className="entity-hero-tools">
          <IconButton label="Поділитися" onClick={share}>
            <MaterialIcon name="ios_share" size={20} />
          </IconButton>
          <IconButton label={saved ? "Прибрати зі збережених" : "Зберегти"} aria-pressed={saved} onClick={onToggleSaved}>
            <MaterialIcon name={saved ? "bookmark_added" : "bookmark_add"} size={20} filled={saved} />
          </IconButton>
        </div>
      </header>

      <ActionBar>
        {flows.map((flow, index) => (
          <ActionBarButton
            key={flow}
            icon={FLOWS[flow].icon}
            label={FLOWS[flow].label}
            primary={index === 0 && openFlow !== flow}
            pressed={openFlow === flow}
            onClick={() => toggleFlow(flow)}
          />
        ))}
        <ActionBarButton icon="directions" label="Маршрут" primary={flows.length === 0} onClick={onDirections} />
        {phone ? (
          <ActionBarButton icon="call" label="Дзвінок" onClick={() => window.open(`tel:${phone.replace(/[^\d+]/g, "")}`, "_self")} />
        ) : flows.length < 2 ? (
          <ActionBarButton icon="map" label="На мапі" onClick={onShowOnMap} />
        ) : null}
      </ActionBar>

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
              menu={menu}
              catalog={catalog}
              onDone={(message) => {
                setStatus(message);
                setOpenFlow(null);
              }}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {status && (
        <p className="entity-status" role="status">
          <MaterialIcon name="check_circle" size={18} />
          {status}
        </p>
      )}

      {description && (
        <DetailSection title="Опис">
          <p className="entity-description">{description}</p>
        </DetailSection>
      )}

      {(info.length > 0 || website || sourceUrl) && (
        <DetailSection title="Інформація">
          {info.map((row) => (
            <ListRow
              key={row.label}
              leading={<MaterialIcon name={row.icon} size={20} />}
              title={row.value}
              subtitle={row.label}
              onClick={row.href ? () => window.open(row.href, row.href?.startsWith("http") ? "_blank" : "_self") : undefined}
            />
          ))}
          {website && (
            <ListRow
              leading={<MaterialIcon name="language" size={20} />}
              title={website.replace(/^https?:\/\//, "")}
              subtitle="Сайт"
              onClick={() => window.open(website.startsWith("http") ? website : `https://${website}`, "_blank")}
            />
          )}
          {sourceUrl && (
            <ListRow
              leading={<MaterialIcon name="open_in_new" size={20} />}
              title="Відкрити в OpenStreetMap"
              subtitle="Джерело даних"
              onClick={() => window.open(sourceUrl, "_blank")}
            />
          )}
        </DetailSection>
      )}

      {children}
    </article>
  );
}

const DEMO_NOTE = "Це демо: запит нікуди не надіслано.";
const money = new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH", maximumFractionDigits: 0 });

function FlowBody({
  flow,
  kind,
  menu,
  catalog,
  onDone,
}: {
  flow: EntityFlow;
  kind: string;
  menu: MenuItem[];
  catalog: MenuItem[];
  onDone: (message: string) => void;
}) {
  if (flow === "order") return <OrderFlow items={menu} onDone={onDone} />;
  if (flow === "catalog") return <CatalogFlow items={catalog} onDone={onDone} />;
  return <FormFlow flow={flow} kind={kind} onDone={onDone} />;
}

function OrderFlow({ items, onDone }: { items: MenuItem[]; onDone: (message: string) => void }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * (cart[item.id] ?? 0), 0),
    [items, cart],
  );
  const count = Object.values(cart).reduce((sum, value) => sum + value, 0);
  const change = (id: string, delta: number): void =>
    setCart((current) => ({ ...current, [id]: Math.max(0, (current[id] ?? 0) + delta) }));

  if (items.length === 0) {
    return <p className="entity-flow-empty">Меню цього закладу ще не підключене.</p>;
  }
  return (
    <>
      <ul className="entity-menu">
        {items.map((item) => {
          const quantity = cart[item.id] ?? 0;
          return (
            <li key={item.id}>
              <span className="entity-menu-copy">
                <strong>{item.name}</strong>
                <span>{item.description}</span>
                <span className="entity-menu-price">{money.format(item.price)}</span>
              </span>
              <span className="entity-stepper" role="group" aria-label={`Кількість: ${item.name}`}>
                {quantity > 0 && (
                  <>
                    <Button type="button" variant="outline" size="icon" aria-label="Менше" onClick={() => change(item.id, -1)}>
                      <MaterialIcon name="remove" size={18} />
                    </Button>
                    <output aria-live="polite">{quantity}</output>
                  </>
                )}
                <Button type="button" variant="outline" size="icon" aria-label={`Додати ${item.name}`} onClick={() => change(item.id, 1)}>
                  <MaterialIcon name="add" size={18} />
                </Button>
              </span>
            </li>
          );
        })}
      </ul>
      <Button
        type="button"
        size="lg"
        className="entity-flow-submit"
        disabled={count === 0}
        onClick={() => onDone(`Замовлення на ${money.format(total)}. ${DEMO_NOTE}`)}
      >
        {count === 0 ? "Додайте страви" : `Оформити · ${money.format(total)}`}
      </Button>
    </>
  );
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
              <Chip key={option} size="sm" selected={choice === option} onClick={() => setChoice(option)}>
                {option}
              </Chip>
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
