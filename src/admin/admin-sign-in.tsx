import { useState, type FormEvent } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { MaterialIcon } from "../components/ui/material-icon";
import { supabase } from "../lib/supabase";

/**
 * Email and password for the admin. Access is still decided by the server: a user without
 * the admin role sees the 404 page after signing in, and admins then pass the second factor.
 */
export function AdminSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: failure } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (failure) {
      console.error("Admin sign-in failed.", failure);
      setError("Неправильна пошта або пароль.");
      return;
    }
    setPassword("");
  };

  return (
    <main className="admin-gate">
      <form className="admin-mfa" onSubmit={(event) => void submit(event)} aria-labelledby="admin-sign-in-title">
        <h1 id="admin-sign-in-title">Вхід для адміністратора</h1>
        <p>Увійдіть обліковим записом адміністратора. Далі буде перевірка другим фактором.</p>
        <label className="admin-field">
          <span>Пошта</span>
          <Input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="admin-field">
          <span>Пароль</span>
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && (
          <p className="admin-error" role="alert">
            <MaterialIcon name="error" size={16} /> {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={busy || !email || !password}>
          {busy ? "Входимо…" : "Увійти"}
        </Button>
      </form>
    </main>
  );
}
