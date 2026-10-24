import { useState, type FormEvent, type ReactNode } from "react";
import type { AuthError, User } from "@supabase/supabase-js";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { MaterialIcon } from "../../components/ui/material-icon";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  accountLabel,
  authProvider,
  authRedirectUrl,
  finishPasswordRecovery,
  googleSignInEnabled,
  supabase,
} from "../../lib/supabase";
import { signInWithTelegram, telegramBotId } from "../../lib/telegram-auth";

type Mode = "sign-in" | "sign-up" | "magic" | "reset" | "new-password";
type Notice = { icon: string; title: string; text: string };

const MIN_PASSWORD = 8;

const PROVIDER_LABEL = {
  email: "Вхід через електронну пошту",
  google: "Вхід через Google",
  telegram: "Вхід через Telegram",
} as const;

function authErrorMessage(error: AuthError | Error): string {
  const { status, code } = error as AuthError;
  if (status === 429 || code === "over_email_send_rate_limit" || code === "over_request_rate_limit")
    return "Забагато спроб. Зачекайте хвилину й спробуйте знову.";
  if (code === "invalid_credentials") return "Неправильна пошта або пароль.";
  if (code === "email_not_confirmed") return "Спершу підтвердіть пошту: відкрийте лист, який ми надіслали.";
  if (code === "user_already_exists" || code === "email_exists")
    return "Обліковий запис з цією поштою вже існує. Увійдіть або скиньте пароль.";
  if (code === "weak_password") return "Пароль занадто простий. Додайте літери різного регістру, цифри або символи.";
  if (code === "same_password") return "Новий пароль має відрізнятися від попереднього.";
  if (code === "signup_disabled") return "Реєстрацію тимчасово вимкнено.";
  if (status === undefined || status === 0) return "Немає з’єднання з сервером. Перевірте інтернет і спробуйте ще раз.";
  return "Не вдалося виконати дію. Спробуйте ще раз.";
}

/** Matching icon for the provider buttons. Monochrome, so it follows the button text color. */
function ProviderLogo({ provider }: { provider: "google" | "telegram" }) {
  return provider === "telegram" ? (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M21.9 4.3 18.7 19.4c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.2-8.3c.4-.4-.1-.6-.6-.2L6.1 13 1.2 11.5c-1-.3-1.1-1 .2-1.5L20.5 2.7c.9-.3 1.7.2 1.4 1.6Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3ZM12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Zm-5.6-8c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.1L6.4 14Zm5.6-8c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.3 3-4 5.6-4Z" />
    </svg>
  );
}

function AccountMessage({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="settings-account" role="status">
      <span className="settings-account-icon" aria-hidden="true">
        <MaterialIcon name={icon} size={28} />
      </span>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

type AccountViewProps = {
  user: User | null;
  recovering: boolean;
  onSignOut: () => void;
  onSetUpProfile: () => void;
};

/** Sign in, sign up, password reset and the signed-in summary. */
export function AccountView({ user, recovering, onSignOut, onSetUpProfile }: AccountViewProps) {
  const [mode, setMode] = useState<Mode>(recovering ? "new-password" : "sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);

  if (!supabase) {
    return (
      <AccountMessage icon="cloud_sync" title="Вхід тимчасово недоступний">
        <p>Обліковий запис ще не підключено на цьому сайті. Профіль зберігається лише в цьому браузері.</p>
        <Button type="button" size="lg" variant="outline" onClick={onSetUpProfile}>
          Налаштувати профіль на пристрої
        </Button>
      </AccountMessage>
    );
  }

  const switchMode = (next: Mode): void => {
    setMode(next);
    setError("");
    setPassword("");
  };

  const run = async (action: () => Promise<void>): Promise<void> => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (caught: unknown) {
      console.error("Account action failed.", caught);
      setError(authErrorMessage(caught instanceof Error ? caught : new Error(String(caught))));
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const address = email.trim();
    void run(async () => {
      if (mode === "sign-in") {
        const { error: failure } = await supabase.auth.signInWithPassword({ email: address, password });
        if (failure) throw failure;
      } else if (mode === "sign-up") {
        const { data, error: failure } = await supabase.auth.signUp({
          email: address,
          password,
          options: { emailRedirectTo: authRedirectUrl() },
        });
        if (failure) throw failure;
        // With email confirmation on, there is no session until the link is opened.
        if (!data.session) {
          setNotice({
            icon: "mark_email_unread",
            title: "Підтвердіть пошту",
            text: `Ми надіслали лист на ${address}. Відкрийте посилання з нього, щоб завершити реєстрацію.`,
          });
        }
      } else if (mode === "magic") {
        const { error: failure } = await supabase.auth.signInWithOtp({
          email: address,
          options: { emailRedirectTo: authRedirectUrl() },
        });
        if (failure) throw failure;
        setNotice({
          icon: "mark_email_read",
          title: "Перевірте пошту",
          text: `Ми надіслали посилання для входу на ${address}. Відкрийте його на цьому пристрої.`,
        });
      } else if (mode === "reset") {
        const { error: failure } = await supabase.auth.resetPasswordForEmail(address, { redirectTo: authRedirectUrl() });
        if (failure) throw failure;
        setNotice({
          icon: "lock_reset",
          title: "Перевірте пошту",
          text: `Якщо для ${address} є обліковий запис, ми надіслали посилання для нового пароля.`,
        });
      } else {
        const { error: failure } = await supabase.auth.updateUser({ password });
        if (failure) throw failure;
        finishPasswordRecovery();
        setPassword("");
        setNotice({ icon: "check_circle", title: "Пароль змінено", text: "Тепер входьте з новим паролем." });
      }
    });
  };

  const oauthGoogle = (): void =>
    void run(async () => {
      const { error: failure } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: authRedirectUrl() },
      });
      if (failure) throw failure;
    });

  const telegram = (): void =>
    void run(async () => {
      await signInWithTelegram();
    });

  if (notice) {
    return (
      <AccountMessage icon={notice.icon} title={notice.title}>
        <p>{notice.text}</p>
        <Button type="button" size="lg" variant="outline" onClick={() => setNotice(null)}>
          {user ? "Готово" : "Назад"}
        </Button>
      </AccountMessage>
    );
  }

  if (user && mode !== "new-password") {
    const provider = authProvider(user);
    return (
      <AccountMessage icon="account_circle" title={accountLabel(user)}>
        <p>
          {PROVIDER_LABEL[provider]}
          {provider !== "telegram" && user.email ? ` · ${user.email}` : ""}
        </p>
        {provider === "email" && (
          <Button type="button" size="lg" variant="outline" onClick={() => switchMode("new-password")}>
            Змінити пароль
          </Button>
        )}
        <Button type="button" size="lg" variant="outline" onClick={onSignOut}>
          Вийти
        </Button>
      </AccountMessage>
    );
  }

  const needsPassword = mode === "sign-in" || mode === "sign-up" || mode === "new-password";
  const needsEmail = mode !== "new-password";
  const providers = !user && (telegramBotId || googleSignInEnabled);
  const submitLabel = {
    "sign-in": "Увійти",
    "sign-up": "Створити обліковий запис",
    magic: "Надіслати посилання для входу",
    reset: "Надіслати посилання",
    "new-password": "Зберегти пароль",
  }[mode];

  return (
    <div className="settings-auth">
      {providers && (
        <div className="settings-auth-providers">
          {telegramBotId && (
            <Button type="button" size="lg" variant="outline" disabled={busy} onClick={telegram}>
              <ProviderLogo provider="telegram" />
              Продовжити з Telegram
            </Button>
          )}
          {googleSignInEnabled && (
            <Button type="button" size="lg" variant="outline" disabled={busy} onClick={oauthGoogle}>
              <ProviderLogo provider="google" />
              Продовжити з Google
            </Button>
          )}
          <p className="settings-auth-divider">
            <span>або поштою</span>
          </p>
        </div>
      )}

      {(mode === "sign-in" || mode === "sign-up") && (
        <Tabs value={mode} onValueChange={(value) => switchMode(value as Mode)}>
          <TabsList className="w-full">
            <TabsTrigger value="sign-in">Вхід</TabsTrigger>
            <TabsTrigger value="sign-up">Реєстрація</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      {mode === "magic" && <h3 className="settings-auth-title">Вхід без пароля</h3>}
      {mode === "reset" && <h3 className="settings-auth-title">Скидання пароля</h3>}
      {mode === "new-password" && <h3 className="settings-auth-title">Новий пароль</h3>}

      <form className="settings-auth-form" onSubmit={submit}>
        {mode === "magic" && <p className="settings-hint">Ми надішлемо на пошту посилання, яке одразу вас впустить.</p>}
        {mode === "reset" && <p className="settings-hint">Вкажіть пошту облікового запису. Ми надішлемо посилання для нового пароля.</p>}
        {needsEmail && (
          <label className="settings-field">
            <span>Електронна пошта</span>
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@example.com"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "settings-auth-error" : undefined}
              data-autofocus
            />
          </label>
        )}
        {needsPassword && (
          <label className="settings-field">
            <span>{mode === "new-password" ? "Новий пароль" : "Пароль"}</span>
            <Input
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              required
              minLength={mode === "sign-in" ? undefined : MIN_PASSWORD}
              maxLength={72}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={mode === "sign-in" ? undefined : "settings-password-hint"}
              data-autofocus={needsEmail ? undefined : true}
            />
            {mode !== "sign-in" && (
              <small id="settings-password-hint" className="settings-hint">
                Щонайменше {MIN_PASSWORD} символів.
              </small>
            )}
          </label>
        )}
        {error && (
          <p id="settings-auth-error" className="settings-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Зачекайте…" : submitLabel}
        </Button>
      </form>

      <div className="settings-auth-links">
        {mode === "sign-in" && (
          <>
            <Button type="button" variant="link" onClick={() => switchMode("reset")}>
              Забули пароль?
            </Button>
            <Button type="button" variant="link" onClick={() => switchMode("magic")}>
              Увійти без пароля
            </Button>
          </>
        )}
        {(mode === "magic" || mode === "reset") && (
          <Button type="button" variant="link" onClick={() => switchMode("sign-in")}>
            Назад до входу
          </Button>
        )}
        {mode === "new-password" && user && !recovering && (
          <Button type="button" variant="link" onClick={() => switchMode("sign-in")}>
            Скасувати
          </Button>
        )}
      </div>
    </div>
  );
}
