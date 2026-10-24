import { useMemo, useState } from "react";
import { Toggle } from "../../components/ui/toggle";
import { MaterialIcon } from "../../components/ui/material-icon";
import { FlowField, FlowOption, FlowResult, FlowShell } from "./flow-shell";
import { DOCTORS, SPECIALTIES, TIME_SLOTS, formatDay, isDemoSlotFree, nextDays } from "./demo-data";

/**
 * Doctor appointment (Doctolib pattern): specialty, then doctor, then a slot,
 * then the patient. Unavailable slots stay visible, disabled, so the person
 * can see the day is busy instead of wondering why a time is missing.
 */
const STEPS = ["Спеціальність", "Лікар", "Час", "Пацієнт"] as const;
const PHONE_DIGITS = 9;

export function AppointmentFlow({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [specialtyId, setSpecialtyId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [patient, setPatient] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [reference] = useState(() => String(10000 + Math.floor(Math.random() * 90000)));

  const days = useMemo(() => nextDays(5), []);
  const specialty = SPECIALTIES.find((item) => item.id === specialtyId) ?? null;
  const doctors = DOCTORS.filter((item) => item.specialtyId === specialtyId);
  const doctor = DOCTORS.find((item) => item.id === doctorId) ?? null;
  const doctorIndex = doctor ? DOCTORS.indexOf(doctor) : 0;
  const phoneDigits = phone.replace(/\D/g, "");
  const patientMissing = patient.trim().length < 2 || phoneDigits.length < PHONE_DIGITS;

  const back = (): void => {
    if (step === 0) onExit();
    else setStep(step - 1);
  };

  const dayLabel = dayIndex === null ? "" : formatDay(days[dayIndex]);

  if (step >= STEPS.length) {
    return (
      <FlowResult
        icon="event_available"
        title="Запис створено"
        onClose={onExit}
        closeLabel="До сервісів"
      >
        <p>
          {doctor?.name} · {specialty?.label.toLowerCase()}
        </p>
        <p>
          {dayLabel}, {slot} · {doctor?.clinic}
        </p>
        <p>Запис №{reference}. Клініка підтверджує візит телефоном.</p>
      </FlowResult>
    );
  }

  return (
    <FlowShell
      title="Запис до лікаря"
      steps={STEPS}
      current={step}
      backLabel={step === 0 ? "Сервіси" : "Назад"}
      onBack={back}
      summary={
        step >= 2 && doctor && dayIndex !== null && slot ? (
          <span>
            {dayLabel}, {slot}
          </span>
        ) : undefined
      }
      onNext={
        step === 0 || step === 1 || step === 2
          ? () => setStep(step + 1)
          : () => setStep(STEPS.length)
      }
      nextLabel={step === 3 ? "Записатися" : "Далі"}
      nextDisabled={
        (step === 0 && specialtyId === null) ||
        (step === 1 && doctorId === null) ||
        (step === 2 && (dayIndex === null || slot === null)) ||
        (step === 3 && patientMissing)
      }
      nextHint={
        step === 3 && patientMissing
          ? "Вкажіть імʼя і телефон пацієнта."
          : step === 2 && (dayIndex === null || slot === null)
            ? "Оберіть день і час."
            : undefined
      }
    >
      {step === 0 && (
        <section aria-label="Спеціальність">
          <h4 className="flow-section-title">Яка потрібна спеціальність?</h4>
          <div className="flow-chips" role="group" aria-label="Спеціальність">
            {SPECIALTIES.map((item) => (
              <Toggle variant="pill"
                key={item.id}
               
               
                onClick={() => {
                  setSpecialtyId(item.id);
                  setDoctorId(null);
                  setSlot(null);
                  setStep(1);
                }} pressed={specialtyId === item.id}><MaterialIcon name={item.icon} size={18} filled={specialtyId === item.id} />
                {item.label}
              </Toggle>
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section aria-label="Лікар">
          <h4 className="flow-section-title">{specialty?.label}</h4>
          <div className="flow-list">
            {doctors.map((item) => (
              <FlowOption
                key={item.id}
                title={item.name}
                subtitle={item.clinic}
                icon="medical_services"
                selected={doctorId === item.id}
                onSelect={() => {
                  setDoctorId(item.id);
                  setDayIndex(null);
                  setSlot(null);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {step === 2 && doctor && (
        <section aria-label="Час">
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

          <h4 className="flow-section-title">Вільний час</h4>
          {dayIndex === null ? (
            <p className="flow-intro">Спершу оберіть день.</p>
          ) : (
            <div className="flow-chips" role="group" aria-label="Час">
              {TIME_SLOTS.map((time, index) => {
                const free = isDemoSlotFree(doctorIndex * 31 + dayIndex * 7 + index);
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
          <p className="flow-note">
            <MaterialIcon name="info" size={16} /> Сірі години зайняті.
          </p>
        </section>
      )}

      {step === 3 && (
        <section aria-label="Пацієнт">
          <h4 className="flow-section-title">Пацієнт</h4>
          <FlowField
            label="Імʼя та прізвище"
            value={patient}
            onChange={setPatient}
            autoComplete="name"
            required
          />
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
          <FlowField
            label="Причина візиту (необовʼязково)"
            value={reason}
            onChange={setReason}
            placeholder="Наприклад, профілактика"
          />
        </section>
      )}
    </FlowShell>
  );
}
