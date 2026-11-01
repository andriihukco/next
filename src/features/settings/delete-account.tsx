import { useState } from "react";
import { Button } from "../../components/ui/button";
import { deleteAccount } from "../../lib/account";
import { disablePush } from "../../lib/push";
import { supabase } from "../../lib/supabase";

/** «Видалити обліковий запис», with a confirm step. Required for App Store accounts (platform-plan S8). */
export function DeleteAccount({ onDeleted }: { onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const remove = async (): Promise<void> => {
    if (!supabase) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("No session.");
      // Unsubscribe this browser while the session can still remove its row.
      await disablePush().catch((pushError: unknown) => console.error("Could not remove the push subscription.", pushError));
      await deleteAccount(data.session);
      await supabase.auth.signOut({ scope: "local" });
      onDeleted();
    } catch (caught: unknown) {
      console.error("Could not delete the account.", caught);
      setError("Не вдалося видалити обліковий запис. Спробуйте ще раз або напишіть нам.");
    } finally {
      setBusy(false);
    }
  };

  if (!confirming) {
    return (
      <Button type="button" size="lg" variant="ghost" onClick={() => setConfirming(true)}>
        Видалити обліковий запис
      </Button>
    );
  }
  return (
    <div className="settings-delete-account" role="group" aria-labelledby="delete-account-title">
      <p id="delete-account-title">
        Обліковий запис і сповіщення буде видалено назавжди. Профіль і збережені місця на цьому пристрої лишаться.
      </p>
      {error && (
        <p className="settings-error" role="alert">
          {error}
        </p>
      )}
      <Button type="button" size="lg" variant="destructive" disabled={busy} onClick={() => void remove()}>
        {busy ? "Видаляємо…" : "Так, видалити назавжди"}
      </Button>
      <Button type="button" size="lg" variant="outline" disabled={busy} onClick={() => setConfirming(false)}>
        Скасувати
      </Button>
    </div>
  );
}
