import { useState } from "react";
import { Toggle } from "../../components/ui/toggle";
import { IconButton } from "../../components/ui/icon-button";
import { MaterialIcon } from "../../components/ui/material-icon";
import { FlowField, FlowOption, FlowResult, FlowShell } from "./flow-shell";
import { TAXI_CLASSES, TAXI_PLACES, estimateTripKm, formatUAH } from "./demo-data";

/**
 * Taxi (Uber and Bolt pattern): route, car class with a fare estimate, then
 * the request. The fare is an estimate from straight-line distance, labeled
 * «Оцінка». Requesting shows a search state; no driver is assigned in the demo.
 */
const STEPS = ["Маршрут", "Авто", "Замовлення"] as const;
const PAYMENTS = ["Картою", "Готівкою водію"] as const;

/** Rounds up to the nearest 5 hryvnia, the way fare estimates are shown. */
function roundFare(amount: number): number {
  return Math.ceil(amount / 5) * 5;
}

export function TaxiFlow({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [fromIndex, setFromIndex] = useState<number | null>(null);
  const [toIndex, setToIndex] = useState<number | null>(null);
  const [classId, setClassId] = useState<string>(TAXI_CLASSES[0].id);
  const [payment, setPayment] = useState<(typeof PAYMENTS)[number]>(PAYMENTS[0]);
  const [comment, setComment] = useState("");

  const from = fromIndex === null ? null : TAXI_PLACES[fromIndex];
  const to = toIndex === null ? null : TAXI_PLACES[toIndex];
  const routeReady = fromIndex !== null && toIndex !== null && fromIndex !== toIndex;
  const km = fromIndex !== null && toIndex !== null ? estimateTripKm(fromIndex, toIndex) : 0;
  const pickupMinutes = fromIndex === null ? 0 : 3 + (fromIndex % 4);
  const car = TAXI_CLASSES.find((item) => item.id === classId) ?? TAXI_CLASSES[0];
  const fare = roundFare(car.base + car.perKm * km);

  const back = (): void => {
    if (step === 0) onExit();
    else setStep(step - 1);
  };

  const swap = (): void => {
    setFromIndex(toIndex);
    setToIndex(fromIndex);
  };

  if (step >= STEPS.length) {
    return (
      <FlowResult icon="local_taxi" title="Шукаємо водія" onClose={onExit} closeLabel="До сервісів">
        <p role="status">
          {from?.name} → {to?.name}
        </p>
        <p>
          {car.label} · оцінка {formatUAH(fare)} · подача приблизно {pickupMinutes} хв
        </p>
        <p>Водій не призначений: це демонстрація.</p>
      </FlowResult>
    );
  }

  return (
    <FlowShell
      title="Таксі"
      steps={STEPS}
      current={step}
      backLabel={step === 0 ? "Сервіси" : "Назад"}
      onBack={back}
      summary={
        step >= 1 && routeReady ? (
          <span>
            {car.label} · оцінка {formatUAH(fare)}
          </span>
        ) : undefined
      }
      onNext={() => setStep(step + 1)}
      nextLabel={step === 0 ? "Далі" : step === 1 ? "Обрати авто" : "Замовити таксі"}
      nextDisabled={step === 0 && !routeReady}
      nextHint={
        step === 0 && fromIndex !== null && fromIndex === toIndex
          ? "Початок і кінець мають відрізнятися."
          : step === 0 && !routeReady
            ? "Оберіть звідки і куди."
            : undefined
      }
    >
      {step === 0 && (
        <section aria-label="Маршрут">
          <h4 className="flow-section-title">Звідки</h4>
          <div className="flow-chips" role="group" aria-label="Звідки">
            {TAXI_PLACES.map((place, index) => (
              <Toggle variant="pill"
                key={place.id}
               
                onClick={() => setFromIndex(index)} pressed={fromIndex === index}>
                {place.name}
              </Toggle>
            ))}
          </div>

          <div className="flow-route-swap">
            <span className="flow-route-line" aria-hidden="true" />
            <IconButton label="Поміняти місцями" tooltipSide="top" variant="outline" onClick={swap}>
              <MaterialIcon name="swap_vert" size={18} />
            </IconButton>
          </div>

          <h4 className="flow-section-title">Куди</h4>
          <div className="flow-chips" role="group" aria-label="Куди">
            {TAXI_PLACES.map((place, index) => (
              <Toggle variant="pill" key={place.id} onClick={() => setToIndex(index)} pressed={toIndex === index}>
                {place.name}
              </Toggle>
            ))}
          </div>

          {routeReady && from && to && (
            <p className="flow-intro">
              {from.name} → {to.name} · близько {km.toFixed(1)} км (оцінка)
            </p>
          )}
        </section>
      )}

      {step === 1 && (
        <section aria-label="Клас авто">
          <h4 className="flow-section-title">Оберіть клас</h4>
          <div className="flow-list">
            {TAXI_CLASSES.map((item) => {
              const itemFare = roundFare(item.base + item.perKm * km);
              return (
                <FlowOption
                  key={item.id}
                  title={item.label}
                  subtitle={`Оцінка ${formatUAH(itemFare)} · подача ${pickupMinutes} хв`}
                  icon={item.icon}
                  selected={classId === item.id}
                  onSelect={() => setClassId(item.id)}
                />
              );
            })}
          </div>
          <p className="flow-note">
            <MaterialIcon name="info" size={16} /> Оцінка може змінитися після підтвердження
            маршруту.
          </p>
        </section>
      )}

      {step === 2 && (
        <section aria-label="Замовлення">
          <h4 className="flow-section-title">Оплата</h4>
          <div className="flow-chips" role="group" aria-label="Спосіб оплати">
            {PAYMENTS.map((option) => (
              <Toggle variant="pill" key={option} onClick={() => setPayment(option)} pressed={payment === option}>
                {option}
              </Toggle>
            ))}
          </div>
          <FlowField
            label="Коментар водієві (необовʼязково)"
            value={comment}
            onChange={setComment}
            placeholder="Наприклад, біля входу"
          />
          <p className="flow-intro">
            {car.label} · оцінка {formatUAH(fare)}
          </p>
        </section>
      )}
    </FlowShell>
  );
}
