import { useMemo, useState } from "react";
import { Toggle } from "../../components/ui/toggle";
import { MaterialIcon } from "../../components/ui/material-icon";
import { FlowField, FlowOption, FlowResult, FlowShell, QuantityStepper } from "./flow-shell";
import {
  MENUS,
  RESTAURANTS,
  TIME_SLOTS,
  formatDay,
  formatUAH,
  isDemoSlotFree,
  nextDays,
} from "./demo-data";

/**
 * Table booking with optional pre-order (TheFork and restaurant reservation
 * pattern): restaurant, then date, time and guests, then an optional menu,
 * then contact details.
 */
const STEPS = ["Заклад", "Дата і час", "Передзамовлення", "Контакти"] as const;
const PHONE_DIGITS = 9;

export function TableFlow({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [guests, setGuests] = useState(2);
  const [preorder, setPreorder] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reference] = useState(() => String(100 + Math.floor(Math.random() * 900)));

  const days = useMemo(() => nextDays(7), []);
  const restaurant = RESTAURANTS.find((item) => item.id === restaurantId) ?? null;
  const menu = restaurantId ? (MENUS[restaurantId] ?? []) : [];
  const preorderLines = menu.flatMap((item) => {
    const qty = preorder[item.id] ?? 0;
    return qty > 0 ? [{ item, qty }] : [];
  });
  const preorderTotal = preorderLines.reduce((sum, { item, qty }) => sum + item.price * qty, 0);
  const phoneDigits = phone.replace(/\D/g, "");
  const contactMissing = name.trim().length < 2 || phoneDigits.length < PHONE_DIGITS;

  const back = (): void => {
    if (step === 0) onExit();
    else setStep(step - 1);
  };

  const dayLabel = dayIndex === null ? "" : formatDay(days[dayIndex]);

  if (step >= STEPS.length) {
    return (
      <FlowResult
        icon="event_available"
        title="Столик заброньовано"
        onClose={onExit}
        closeLabel="До сервісів"
      >
        <p>
          {restaurant?.name} · {dayLabel}, {slot} · {guests} гост.
        </p>
        <p>Бронь №{reference}. Заклад підтверджує бронь телефоном.</p>
        {preorderLines.length > 0 && <p>Передзамовлення: {formatUAH(preorderTotal)}</p>}
      </FlowResult>
    );
  }

  return (
    <FlowShell
      title="Столик"
      steps={STEPS}
      current={step}
      backLabel={step === 0 ? "Сервіси" : "Назад"}
      onBack={back}
      summary={
        step === 2 ? (
          <span>
            {preorderLines.length > 0
              ? `Передзамовлення ${formatUAH(preorderTotal)}`
              : "Без передзамовлення"}
          </span>
        ) : step === 1 && slot ? (
          <span>
            {dayLabel}, {slot} · {guests} гост.
          </span>
        ) : undefined
      }
      onNext={
        step === 0
          ? undefined
          : step === 1
            ? () => setStep(2)
            : step === 2
              ? () => setStep(3)
              : () => setStep(STEPS.length)
      }
      nextLabel={
        step === 2
          ? preorderLines.length > 0
            ? "Далі"
            : "Пропустити"
          : step === 3
            ? "Підтвердити бронь"
            : "Далі"
      }
      nextDisabled={
        (step === 1 && (dayIndex === null || slot === null)) || (step === 3 && contactMissing)
      }
      nextHint={
        step === 1 && (dayIndex === null || slot === null)
          ? "Оберіть день і час."
          : step === 3 && contactMissing
            ? "Вкажіть імʼя і телефон, щоб підтвердити."
            : undefined
      }
    >
      {step === 0 && (
        <section aria-label="Оберіть заклад">
          <h4 className="flow-section-title">Оберіть заклад</h4>
          <div className="flow-list">
            {RESTAURANTS.map((item) => (
              <FlowOption
                key={item.id}
                title={item.name}
                subtitle={`${item.kind} · ${item.hours} · ${item.address}`}
                icon="restaurant"
                selected={restaurantId === item.id}
                onSelect={() => {
                  setRestaurantId(item.id);
                  setPreorder({});
                  setStep(1);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section aria-label="Дата і час">
          <h4 className="flow-section-title">День</h4>
          <div className="flow-chips" role="group" aria-label="День">
            {days.map((day, index) => (
              <Toggle variant="pill"
                key={day.toISOString()}
               
                onClick={() => {
                  setDayIndex(index);
                  setSlot(null);
                }} pressed={dayIndex === index}>
                {formatDay(day)}
              </Toggle>
            ))}
          </div>

          <h4 className="flow-section-title">Час</h4>
          {dayIndex === null ? (
            <p className="flow-intro">Спершу оберіть день.</p>
          ) : (
            <div className="flow-chips" role="group" aria-label="Час">
              {TIME_SLOTS.map((time, index) => {
                const free = isDemoSlotFree(dayIndex * 7 + index);
                return (
                  <Toggle variant="pill"
                    key={time}
                   
                    disabled={!free}
                    onClick={() => setSlot(time)} pressed={slot === time}>
                    {time}
                  </Toggle>
                );
              })}
            </div>
          )}

          <h4 className="flow-section-title">Гості</h4>
          <QuantityStepper
            label="Кількість гостей"
            value={guests}
            min={1}
            max={8}
            onChange={setGuests}
          />
        </section>
      )}

      {step === 2 && (
        <section aria-label="Передзамовлення">
          <h4 className="flow-section-title">Страви до столика</h4>
          <p className="flow-intro">Необовʼязково. Страви подадуть після вашого приходу.</p>
          <ul className="flow-list flow-list--rows">
            {menu.map((item) => (
              <li key={item.id} className="flow-row">
                <span className="flow-row-text">
                  <span className="flow-option-title">{item.name}</span>
                  <span className="flow-option-subtitle">
                    {item.unit} · {formatUAH(item.price)}
                  </span>
                </span>
                <QuantityStepper
                  label={item.name}
                  value={preorder[item.id] ?? 0}
                  onChange={(qty) => setPreorder((current) => ({ ...current, [item.id]: qty }))}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {step === 3 && (
        <section aria-label="Контакти">
          <h4 className="flow-section-title">Контакти</h4>
          <FlowField label="Імʼя" value={name} onChange={setName} autoComplete="name" required />
          <FlowField
            label="Телефон"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={setPhone}
            autoComplete="tel"
            placeholder="+380"
            required
          />
          <p className="flow-note">
            <MaterialIcon name="info" size={16} /> Заклад підтверджує бронь за телефоном.
          </p>
        </section>
      )}
    </FlowShell>
  );
}
