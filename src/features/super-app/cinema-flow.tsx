import { useMemo, useState } from "react";
import { Toggle } from "../../components/ui/toggle";
import { MaterialIcon } from "../../components/ui/material-icon";
import { FlowOption, FlowResult, FlowShell } from "./flow-shell";
import {
  FILMS,
  MAX_SEATS,
  SEAT_ROWS,
  SEATS_PER_ROW,
  SESSION_TEMPLATES,
  formatDay,
  formatUAH,
  nextDays,
} from "./demo-data";

/**
 * Cinema tickets (cinema booking pattern): film, session, seats, checkout,
 * ticket. Seats are picked on a map; taken seats are disabled and labeled.
 */
const STEPS = ["Фільм", "Сеанс", "Місця", "Оплата"] as const;
const DISCOUNT = 0.5;

/** Deterministic demo seat map: about one seat in seven is already taken. */
function isSeatTaken(row: number, col: number, seedDay: number, seedFilm: number): boolean {
  return (row * 5 + col * 3 + seedDay * 2 + seedFilm) % 7 === 0;
}

export function CinemaFlow({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [filmId, setFilmId] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [seats, setSeats] = useState<string[]>([]);
  const [discount, setDiscount] = useState(false);
  const [payment, setPayment] = useState<"card" | "cash">("card");
  const [ticketNumber] = useState(() => String(100000 + Math.floor(Math.random() * 900000)));

  const days = useMemo(() => nextDays(3), []);
  const film = FILMS.find((item) => item.id === filmId) ?? null;
  const filmIndex = film ? FILMS.indexOf(film) : 0;
  const session = SESSION_TEMPLATES.find((item) => item.id === sessionId) ?? null;
  const unitPrice = session ? (discount ? session.price * DISCOUNT : session.price) : 0;
  const total = unitPrice * seats.length;

  const toggleSeat = (seat: string): void => {
    setSeats((current) => {
      if (current.includes(seat)) return current.filter((item) => item !== seat);
      if (current.length >= MAX_SEATS) return current;
      return [...current, seat];
    });
  };

  const back = (): void => {
    if (step === 0) onExit();
    else setStep(step - 1);
  };

  if (step >= STEPS.length) {
    return (
      <FlowResult
        icon="confirmation_number"
        title="Квитки куплено"
        onClose={onExit}
        closeLabel="До сервісів"
      >
        <p>
          {film?.title} · {formatDay(days[dayIndex])}, {session?.time} · {session?.format}
        </p>
        <p>Місця: {[...seats].sort().join(", ")}</p>
        <p>
          Квиток №{ticketNumber} · разом {formatUAH(total)}
        </p>
        <div className="flow-ticket-code" aria-label="QR-код квитка (демо)">
          <MaterialIcon name="qr_code_2" size={48} />
          <span>QR-код з’явиться після оплати в реальному застосунку.</span>
        </div>
      </FlowResult>
    );
  }

  return (
    <FlowShell
      title="Квитки в кіно"
      steps={STEPS}
      current={step}
      backLabel={step === 0 ? "Сервіси" : "Назад"}
      onBack={back}
      summary={
        step === 2 || step === 3 ? (
          <span>
            {seats.length > 0 ? `${seats.length} місць · ${formatUAH(total)}` : "Місця не обрано"}
          </span>
        ) : undefined
      }
      onNext={
        step === 0 || step === 1 || step === 2
          ? () => setStep(step + 1)
          : () => setStep(STEPS.length)
      }
      nextLabel={step === 3 ? "Купити квитки" : "Далі"}
      nextDisabled={
        (step === 0 && filmId === null) ||
        (step === 1 && sessionId === null) ||
        (step === 2 && seats.length === 0)
      }
      nextHint={step === 2 && seats.length === 0 ? "Оберіть хоча б одне місце." : undefined}
    >
      {step === 0 && (
        <section aria-label="Фільм">
          <h4 className="flow-section-title">Фільми сьогодні і завтра</h4>
          <div className="flow-list">
            {FILMS.map((item) => (
              <FlowOption
                key={item.id}
                title={item.title}
                subtitle={`${item.meta} · ${item.description}`}
                icon="movie"
                selected={filmId === item.id}
                onSelect={() => {
                  setFilmId(item.id);
                  setSessionId(null);
                  setSeats([]);
                  setStep(1);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {step === 1 && film && (
        <section aria-label="Сеанс">
          <h4 className="flow-section-title">{film.title}</h4>
          <div className="flow-chips" role="group" aria-label="День">
            {days.map((day, index) => (
              <Toggle variant="pill"
                key={day.toISOString()}
               
                onClick={() => {
                  setDayIndex(index);
                  setSessionId(null);
                  setSeats([]);
                }} pressed={dayIndex === index}>
                {formatDay(day)}
              </Toggle>
            ))}
          </div>
          <div className="flow-list">
            {SESSION_TEMPLATES.map((item) => (
              <FlowOption
                key={`${item.id}-${dayIndex}`}
                title={`${item.time} · ${item.format}`}
                subtitle={`Кінотеатр «Демо» · ${formatUAH(item.price)}`}
                icon="schedule"
                selected={sessionId === item.id}
                onSelect={() => {
                  setSessionId(item.id);
                  setSeats([]);
                  setStep(2);
                }}
              />
            ))}
          </div>
          <p className="flow-note">
            <MaterialIcon name="info" size={16} /> Ціна орієнтовна, вказана для демо.
          </p>
        </section>
      )}

      {step === 2 && film && (
        <section aria-label="Місця">
          <h4 className="flow-section-title">Оберіть місця, до {MAX_SEATS}</h4>
          <div className="flow-screen-bar" aria-hidden="true">
            Екран
          </div>
          <div className="flow-seat-map" role="group" aria-label="Схема залу">
            {SEAT_ROWS.map((row, rowIndex) => (
              <div key={row} className="flow-seat-row">
                <span className="flow-seat-row-label" aria-hidden="true">
                  {row}
                </span>
                {Array.from({ length: SEATS_PER_ROW }, (_, colIndex) => {
                  const seat = `${row}${colIndex + 1}`;
                  const taken = isSeatTaken(rowIndex, colIndex, dayIndex, filmIndex);
                  const selected = seats.includes(seat);
                  return (
                    <button
                      key={seat}
                      type="button"
                      className="flow-seat"
                      aria-pressed={selected}
                      disabled={taken}
                      aria-label={`Ряд ${row}, місце ${colIndex + 1}, ${taken ? "зайняте" : selected ? "обране" : "вільне"}`}
                      onClick={() => toggleSeat(seat)}
                    >
                      {taken ? <MaterialIcon name="close" size={12} /> : colIndex + 1}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="flow-note">
            <MaterialIcon name="info" size={16} /> Зайняті місця закреслені. Обрано: {seats.length}{" "}
            з {MAX_SEATS}.
          </p>
        </section>
      )}

      {step === 3 && session && (
        <section aria-label="Оплата">
          <h4 className="flow-section-title">Квитки</h4>
          <div className="flow-chips" role="group" aria-label="Тип квитка">
            <Toggle variant="pill" onClick={() => setDiscount(false)} pressed={!discount}>
              Звичайний · {formatUAH(session.price)}
            </Toggle>
            <Toggle variant="pill" onClick={() => setDiscount(true)} pressed={discount}>
              Пільговий −50%
            </Toggle>
          </div>
          <p className="flow-intro">
            {seats.length} × {formatUAH(unitPrice)} = {formatUAH(total)} ·{" "}
            {[...seats].sort().join(", ")}
          </p>
          <h4 className="flow-section-title">Оплата</h4>
          <div className="flow-chips" role="group" aria-label="Спосіб оплати">
            <Toggle variant="pill"
             
             
              onClick={() => setPayment("card")} pressed={payment === "card"}><MaterialIcon name="credit_card" size={18} filled={payment === "card"} />
              Картою онлайн
            </Toggle>
            <Toggle variant="pill" onClick={() => setPayment("cash")} pressed={payment === "cash"}><MaterialIcon name="payments" size={18} filled={payment === "cash"} />
              Готівкою в касі
            </Toggle>
          </div>
        </section>
      )}
    </FlowShell>
  );
}
