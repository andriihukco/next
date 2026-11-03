import { useId, useState, type FormEvent } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { MaterialIcon } from "../components/ui/material-icon";
import { Toggle } from "../components/ui/toggle";
import { PUBLISHED_LEGAL } from "../legal/legal-content";
import { supabase } from "../lib/supabase";
import { LEAD_KINDS, type LeadKind } from "./landing-content";

type Status = { state: "idle" | "sending" | "done" } | { state: "error"; message: string };

/**
 * Landing sign-up (public.leads). Insert only: the page can never read sign-ups back.
 * A repeat address counts as done, so the form never reveals who already signed up.
 */
export function LandingLeadForm({ source = "landing", cityName }: { source?: string; cityName?: string }) {
  // A city page only takes a waitlist sign-up for that city; the venue form is global.
  const kinds = cityName ? LEAD_KINDS.filter((item) => item.id === "waitlist") : LEAD_KINDS;
  const [kind, setKind] = useState<LeadKind>("waitlist");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
  // Bots fill every field; people never see this one.
  const [trap, setTrap] = useState("");
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const id = useId();
  const copy = cityName
    ? {
        title: `Напишіть, коли відкриємо ${cityName}.`,
        text: `Залиште пошту, і ми напишемо, щойно мапа міста буде готова. Не частіше ніж раз на місяць.`,
        button: "Підписатися",
      }
    : (kinds.find((item) => item.id === kind) ?? LEAD_KINDS[0]);
  const privacyPublished = PUBLISHED_LEGAL.includes("privacy");

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (trap) {
      setStatus({ state: "done" });
      return;
    }
    if (!supabase) {
      setStatus({ state: "error", message: "Форма тимчасово недоступна. Спробуйте пізніше." });
      return;
    }
    setStatus({ state: "sending" });
    const { error } = await supabase.from("leads").insert({
      kind,
      email: email.trim(),
      business_name: kind === "business" ? business.trim() || null : null,
      source,
    });
    if (error && error.code !== "23505") {
      console.error("Could not save the sign-up.", error);
      setStatus({ state: "error", message: "Не вдалося зберегти. Перевірте адресу й спробуйте ще раз." });
      return;
    }
    setStatus({ state: "done" });
  };

  return (
    <div className="landing-lead">
      {kinds.length > 1 && (
        <div className="landing-lead-kinds" role="group" aria-label="Кому цікаво">
          {kinds.map((item) => (
            <Toggle
              key={item.id}
              variant="pill"
              pressed={kind === item.id}
              onClick={() => {
                setKind(item.id);
                setStatus({ state: "idle" });
              }}
            >
              {item.label}
            </Toggle>
          ))}
        </div>
      )}
      <h3 className="landing-lead-title">{copy.title}</h3>
      <p className="landing-lead-text">{copy.text}</p>
      {status.state === "done" ? (
        <p className="landing-lead-done" role="status">
          <MaterialIcon name="check_circle" size={20} filled />
          Дякуємо! Ми напишемо на {email.trim() || "вашу пошту"}.
        </p>
      ) : (
        <form className="landing-lead-form" onSubmit={(event) => void submit(event)}>
          {kind === "business" && (
            <label className="landing-lead-field" htmlFor={`${id}-business`}>
              <span>Назва закладу</span>
              <Input
                id={`${id}-business`}
                name="organization"
                autoComplete="organization"
                maxLength={120}
                required
                value={business}
                onChange={(event) => setBusiness(event.target.value)}
              />
            </label>
          )}
          <label className="landing-lead-field" htmlFor={`${id}-email`}>
            <span>Електронна пошта</span>
            <Input
              id={`${id}-email`}
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <input
            className="landing-lead-trap"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            name="website"
            value={trap}
            onChange={(event) => setTrap(event.target.value)}
          />
          <Button type="submit" size="lg" className="landing-btn landing-btn-primary" disabled={status.state === "sending"}>
            {status.state === "sending" ? "Надсилаємо…" : copy.button}
          </Button>
          <p className="landing-lead-note">
            Пошту використаємо лише для цих листів. Відписатися можна відповіддю на будь-який лист.
            {privacyPublished && (
              <>
                {" "}
                <a href="/privacy">Конфіденційність</a>
              </>
            )}
          </p>
          {status.state === "error" && (
            <p className="landing-lead-error" role="alert">
              {status.message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
