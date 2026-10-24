import { useMemo, useState } from "react";
import { Toggle } from "../../components/ui/toggle";
import { MaterialIcon } from "../../components/ui/material-icon";
import { FlowField, FlowOption, FlowResult, FlowShell } from "./flow-shell";
import { GYMS, GYM_PLANS, formatDay, formatUAH, nextDays } from "./demo-data";

/**
 * Gym membership (gym app pattern): gym, plan, start, contact. Prices are per
 * plan length. A trial day is offered only where the gym has one.
 */
const STEPS = ["Зал", "План", "Початок", "Контакти"] as const;
const PHONE_DIGITS = 9;

export function MembershipFlow({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [gymId, setGymId] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [startIndex, setStartIndex] = useState<number | null>(null);
  const [trial, setTrial] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reference] = useState(() => String(1000 + Math.floor(Math.random() * 9000)));

  const days = useMemo(() => nextDays(7), []);
  const gym = GYMS.find((item) => item.id === gymId) ?? null;
  const plan = GYM_PLANS.find((item) => item.id === planId) ?? null;
  const startLabel = startIndex === null ? "" : formatDay(days[startIndex]);
  const phoneDigits = phone.replace(/\D/g, "");
  const contactMissing = name.trim().length < 2 || phoneDigits.length < PHONE_DIGITS;

  const back = (): void => {
    if (step === 0) onExit();
    else setStep(step - 1);
  };

  if (step >= STEPS.length) {
    return (
      <FlowResult
        icon="fitness_center"
        title="Заявку створено"
        onClose={onExit}
        closeLabel="До сервісів"
      >
        <p>
          {gym?.name} · {plan?.label.toLowerCase()} · {formatUAH(plan?.price ?? 0)}
        </p>
        <p>
          Початок: {trial ? "пробне заняття" : "абонемент"}, {startLabel}
        </p>
        <p>Заявка №{reference}. Зал зв’яжеться з вами для оплати.</p>
      </FlowResult>
    );
  }

  return (
    <FlowShell
      title="Абонемент у зал"
      steps={STEPS}
      current={step}
      backLabel={step === 0 ? "Сервіси" : "Назад"}
      onBack={back}
      summary={
        step >= 1 && plan ? (
          <span>
            {plan.label} · {formatUAH(plan.price)}
          </span>
        ) : undefined
      }
      onNext={step < 3 ? () => setStep(step + 1) : () => setStep(STEPS.length)}
      nextLabel={step === 3 ? "Оформити заявку" : "Далі"}
      nextDisabled={
        (step === 0 && gymId === null) ||
        (step === 1 && planId === null) ||
        (step === 2 && startIndex === null) ||
        (step === 3 && contactMissing)
      }
      nextHint={
        step === 3 && contactMissing ? "Вкажіть імʼя і телефон, щоб оформити заявку." : undefined
      }
    >
      {step === 0 && (
        <section aria-label="Зал">
          <h4 className="flow-section-title">Оберіть зал</h4>
          <div className="flow-list">
            {GYMS.map((item) => (
              <FlowOption
                key={item.id}
                title={item.name}
                subtitle={`${item.address} · ${item.hours}${item.trial ? " · є пробне заняття" : ""}`}
                icon="fitness_center"
                selected={gymId === item.id}
                onSelect={() => {
                  setGymId(item.id);
                  setTrial(false);
                  setStep(1);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section aria-label="План">
          <h4 className="flow-section-title">Тривалість абонементу</h4>
          <div className="flow-list">
            {GYM_PLANS.map((item) => (
              <FlowOption
                key={item.id}
                title={item.label}
                subtitle={`${formatUAH(item.price)} · ${formatUAH(Math.round(item.price / item.months))} на місяць`}
                icon="calendar_month"
                selected={planId === item.id}
                onSelect={() => {
                  setPlanId(item.id);
                  setStep(2);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section aria-label="Початок">
          <h4 className="flow-section-title">Коли почнете?</h4>
          <div className="flow-chips" role="group" aria-label="Дата початку">
            {days.map((day, index) => (
              <Toggle variant="pill"
                key={day.toISOString()}
               
                onClick={() => setStartIndex(index)} pressed={startIndex === index}>
                {formatDay(day)}
              </Toggle>
            ))}
          </div>
          {gym?.trial && (
            <>
              <h4 className="flow-section-title">Пробне заняття</h4>
              <div className="flow-chips" role="group" aria-label="Пробне заняття">
                <Toggle variant="pill" onClick={() => setTrial(!trial)} pressed={trial}><MaterialIcon name="card_giftcard" size={18} filled={trial} />
                  Спершу пробне заняття
                </Toggle>
              </div>
            </>
          )}
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
        </section>
      )}
    </FlowShell>
  );
}
