import { useEffect, useState, type FormEvent } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { MaterialIcon } from "../components/ui/material-icon";
import { supabase } from "../lib/supabase";

type Step =
  | { kind: "loading" }
  | { kind: "enroll"; factorId: string; qr: string; secret: string }
  | { kind: "verify"; factorId: string }
  | { kind: "error"; message: string };

/**
 * Second factor for admins (decision D-C). Enrolls a TOTP app on first use, otherwise asks
 * for the current code. On success the session is AAL2 and `onVerified` runs.
 */
export function AdminMfa({ onVerified }: { onVerified: () => void }) {
  const [step, setStep] = useState<Step>({ kind: "loading" });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const auth = supabase.auth;
    let active = true;
    const start = async (): Promise<void> => {
      const { data: factors, error: listError } = await auth.mfa.listFactors();
      if (listError) throw listError;
      const verified = factors.totp.find((factor) => factor.status === "verified");
      if (verified) {
        if (active) setStep({ kind: "verify", factorId: verified.id });
        return;
      }
      const { data, error: enrollError } = await auth.mfa.enroll({ factorType: "totp", friendlyName: "next admin" });
      if (enrollError) throw enrollError;
      if (active) setStep({ kind: "enroll", factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    };
    start().catch((caught: unknown) => {
      console.error("Could not start the second factor.", caught);
      if (active) setStep({ kind: "error", message: "Не вдалося почати перевірку. Оновіть сторінку." });
    });
    return () => {
      active = false;
    };
  }, []);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!supabase || (step.kind !== "enroll" && step.kind !== "verify")) return;
    setBusy(true);
    setError("");
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: step.factorId,
      code: code.trim(),
    });
    setBusy(false);
    if (verifyError) {
      setError("Код не підійшов. Введіть новий код із застосунку.");
      return;
    }
    onVerified();
  };

  if (step.kind === "loading") {
    return (
      <p className="admin-state" role="status">
        <MaterialIcon name="progress_activity" size={20} />
        Готуємо перевірку…
      </p>
    );
  }
  if (step.kind === "error") {
    return (
      <p className="admin-state" role="alert">
        <MaterialIcon name="error" size={20} />
        {step.message}
      </p>
    );
  }
  return (
    <form className="admin-mfa" onSubmit={(event) => void submit(event)} aria-labelledby="admin-mfa-title">
      <h1 id="admin-mfa-title">{step.kind === "enroll" ? "Увімкніть двофакторну перевірку" : "Підтвердіть вхід"}</h1>
      {step.kind === "enroll" ? (
        <>
          <p>Права адміністратора потребують другого фактора. Відскануйте код у застосунку-автентифікаторі.</p>
          <img className="admin-mfa-qr" src={step.qr} alt="QR-код для застосунку-автентифікатора" width={180} height={180} />
          <p className="admin-mfa-secret">
            Або введіть ключ вручну: <code>{step.secret}</code>
          </p>
        </>
      ) : (
        <p>Введіть шестизначний код із застосунку-автентифікатора.</p>
      )}
      <label className="admin-field">
        <span>Код</span>
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
        />
      </label>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={busy || code.length !== 6}>
        {busy ? "Перевіряємо…" : "Підтвердити"}
      </Button>
    </form>
  );
}
