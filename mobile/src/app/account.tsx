import { useState } from "react";
import { ActivityIndicator, Alert, TextInput } from "react-native";
import type { AuthError } from "@supabase/supabase-js";
import {
  ACCOUNT_DELETION_ENABLED,
  accountLabel,
  deleteAccount,
  PASSWORD_RESET_REDIRECT,
  supabase,
  useSession,
} from "../lib/supabase";
import { colors, fonts, themed } from "../lib/theme";
import { Button, EmptyState, ListRow, Page, radiusFor, Section, Segmented, space, Surface, Txt, useUiPlatform } from "../ui";

type Mode = "sign-in" | "sign-up" | "reset";
type Notice = { icon: "mark-email-unread" | "lock-reset" | "check-circle"; title: string; text: string };

/** Same messages as the web account view (src/features/settings/account-view.tsx). */
function authErrorMessage(error: AuthError | Error): string {
  const { status, code } = error as AuthError;
  if (status === 429 || code === "over_email_send_rate_limit" || code === "over_request_rate_limit")
    return "Забагато спроб. Зачекайте хвилину й спробуйте знову.";
  if (code === "invalid_credentials") return "Неправильна пошта або пароль.";
  if (code === "email_not_confirmed") return "Спершу підтвердіть пошту: відкрийте лист, який ми надіслали.";
  if (code === "user_already_exists" || code === "email_exists")
    return "Обліковий запис з цією поштою вже існує. Увійдіть або скиньте пароль.";
  if (code === "weak_password") return "Пароль занадто простий. Додайте літери різного регістру, цифри або символи.";
  if (code === "signup_disabled") return "Реєстрацію тимчасово вимкнено.";
  if (status === undefined || status === 0) return "Немає з’єднання з сервером. Перевірте інтернет і спробуйте ще раз.";
  return "Не вдалося виконати дію. Спробуйте ще раз.";
}

const MODES = [
  { id: "sign-in", label: "Вхід" },
  { id: "sign-up", label: "Реєстрація" },
] as const;

/** Профіль → Обліковий запис: email sign-in and sign-up on the same Supabase project as the web. */
export default function AccountScreen() {
  const platform = useUiPlatform();
  const { session, loading } = useSession();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const field = { borderRadius: radiusFor(platform).control };

  const run = async (action: () => Promise<void>): Promise<void> => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (caught: unknown) {
      setError(authErrorMessage(caught instanceof Error ? caught : new Error(String(caught))));
    } finally {
      setBusy(false);
    }
  };

  const submit = (): void => {
    if (!supabase) return;
    const client = supabase;
    const address = email.trim();
    void run(async () => {
      if (mode === "sign-in") {
        const { error: failure } = await client.auth.signInWithPassword({ email: address, password });
        if (failure) throw failure;
      } else if (mode === "sign-up") {
        const { data, error: failure } = await client.auth.signUp({
          email: address,
          password,
          options: { emailRedirectTo: PASSWORD_RESET_REDIRECT },
        });
        if (failure) throw failure;
        // With email confirmation on, there is no session until the link is opened.
        if (!data.session) {
          setNotice({
            icon: "mark-email-unread",
            title: "Підтвердіть пошту",
            text: `Ми надіслали лист на ${address}. Відкрийте посилання з нього, щоб завершити реєстрацію.`,
          });
        }
      } else {
        const { error: failure } = await client.auth.resetPasswordForEmail(address, { redirectTo: PASSWORD_RESET_REDIRECT });
        if (failure) throw failure;
        setNotice({
          icon: "lock-reset",
          title: "Перевірте пошту",
          text: `Якщо для ${address} є обліковий запис, ми надіслали посилання для нового пароля.`,
        });
      }
      setPassword("");
    });
  };

  const confirmDelete = (): void => {
    Alert.alert("Видалити обліковий запис?", "Обліковий запис і підписки на сповіщення буде стерто. Дію не можна скасувати.", [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити",
        style: "destructive",
        onPress: () =>
          void run(async () => {
            if (!supabase || !session) return;
            await deleteAccount(session);
            await supabase.auth.signOut({ scope: "local" });
            setNotice({
              icon: "check-circle",
              title: "Обліковий запис видалено",
              text: "Обліковий запис і підписки на сповіщення стерто. Мапою можна користуватися й далі.",
            });
          }),
      },
    ]);
  };

  if (!supabase) {
    return (
      <Page>
        <EmptyState icon="cloud-off" title="Вхід поки недоступний" text="Застосунок не підключено до сервера облікових записів." />
      </Page>
    );
  }
  if (loading) {
    return (
      <Page>
        <ActivityIndicator color={colors.primary} />
      </Page>
    );
  }
  if (notice) {
    return (
      <Page>
        <Surface>
          <EmptyState icon={notice.icon} title={notice.title} text={notice.text} action={{ label: "Зрозуміло", onPress: () => setNotice(null) }} />
        </Surface>
      </Page>
    );
  }
  if (session) {
    return (
      <Page>
        <Section grouped>
          <ListRow icon="account-circle" title={accountLabel(session.user)} subtitle={session.user.email ? `Пошта · ${session.user.email}` : undefined} last />
        </Section>
        <Button label="Вийти" variant="outline" stretch onPress={() => void supabase?.auth.signOut()} />
        {ACCOUNT_DELETION_ENABLED ? <Button label="Видалити обліковий запис" variant="danger" stretch onPress={confirmDelete} /> : null}
      </Page>
    );
  }

  return (
    <Page>
      {mode === "reset" ? (
        <Txt variant="callout" tone="muted">
          Надішлемо посилання для нового пароля на вашу пошту.
        </Txt>
      ) : (
        <Segmented
          options={MODES}
          value={mode}
          onChange={(next) => {
            setMode(next);
            setError("");
          }}
        />
      )}

      <Section title="Пошта">
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="name@example.com"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, field]}
        />
      </Section>
      {mode !== "reset" ? (
        <Section title="Пароль">
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            textContentType={mode === "sign-up" ? "newPassword" : "password"}
            placeholder="Щонайменше 6 символів"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, field]}
          />
        </Section>
      ) : null}

      {error ? (
        <Txt variant="subhead" tone="danger" accessibilityRole="alert">
          {error}
        </Txt>
      ) : null}

      {busy ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Button
          label={mode === "sign-in" ? "Увійти" : mode === "sign-up" ? "Зареєструватися" : "Надіслати посилання"}
          size="lg"
          stretch
          onPress={submit}
        />
      )}
      <Button
        label={mode === "reset" ? "Назад до входу" : "Забули пароль?"}
        variant="plain"
        stretch
        onPress={() => {
          setMode(mode === "reset" ? "sign-in" : "reset");
          setError("");
        }}
      />
    </Page>
  );
}

const styles = themed(() => ({
  input: {
    minHeight: 48,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    color: colors.foreground,
    fontFamily: fonts.regular,
    fontSize: 17,
  },
}));
