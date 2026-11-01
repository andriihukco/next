import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import type { AuthError } from "@supabase/supabase-js";
import { PrimaryButton } from "../components/primary-button";
import {
  ACCOUNT_DELETION_ENABLED,
  accountLabel,
  deleteAccount,
  PASSWORD_RESET_REDIRECT,
  supabase,
  useSession,
} from "../lib/supabase";
import { colors, fonts, HIT_SLOP, MIN_TOUCH, radius, themed } from "../lib/theme";

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

/** Профіль → Обліковий запис: email sign-in and sign-up on the same Supabase project as the web. */
export default function AccountScreen() {
  const { session, loading } = useSession();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);

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
    Alert.alert(
      "Видалити обліковий запис?",
      "Обліковий запис і підписки на сповіщення буде стерто. Дію не можна скасувати.",
      [
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
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.nav}>
        <Pressable accessibilityRole="button" accessibilityLabel="Назад" hitSlop={HIT_SLOP} onPress={() => router.back()} style={styles.back}>
          <MaterialIcons name="chevron-left" size={26} color={colors.primary} />
          <Text style={styles.backText}>Профіль</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.largeTitle}>Обліковий запис</Text>

        {!supabase ? (
          <Text style={styles.caption}>Вхід поки недоступний: застосунок не підключено до сервера облікових записів.</Text>
        ) : loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : notice ? (
          <View style={styles.card}>
            <MaterialIcons name={notice.icon} size={32} color={colors.primary} />
            <Text style={styles.cardTitle}>{notice.title}</Text>
            <Text style={styles.caption}>{notice.text}</Text>
            <Pressable accessibilityRole="button" onPress={() => setNotice(null)} style={styles.outline}>
              <Text style={styles.outlineText}>Зрозуміло</Text>
            </Pressable>
          </View>
        ) : session ? (
          <View style={styles.card}>
            <MaterialIcons name="account-circle" size={40} color={colors.primary} />
            <Text style={styles.cardTitle}>{accountLabel(session.user)}</Text>
            {session.user.email ? <Text style={styles.caption}>Пошта · {session.user.email}</Text> : null}
            <Pressable accessibilityRole="button" onPress={() => void supabase?.auth.signOut()} style={styles.outline}>
              <Text style={styles.outlineText}>Вийти</Text>
            </Pressable>
            {ACCOUNT_DELETION_ENABLED && (
              <Pressable accessibilityRole="button" onPress={confirmDelete} style={styles.ghost}>
                <Text style={styles.danger}>Видалити обліковий запис</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <>
            {mode !== "reset" && (
              <View style={styles.segment} accessibilityRole="tablist">
                {(
                  [
                    { id: "sign-in", label: "Вхід" },
                    { id: "sign-up", label: "Реєстрація" },
                  ] as const
                ).map((tab) => {
                  const active = mode === tab.id;
                  return (
                    <Pressable
                      key={tab.id}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      onPress={() => {
                        setMode(tab.id);
                        setError("");
                      }}
                      style={[styles.segmentItem, active && styles.segmentActive]}
                    >
                      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{tab.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {mode === "reset" && <Text style={styles.caption}>Надішлемо посилання для нового пароля на вашу пошту.</Text>}

            <Text style={styles.label}>Пошта</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="name@example.com"
              placeholderTextColor={colors.mutedForeground}
              style={styles.input}
            />
            {mode !== "reset" && (
              <>
                <Text style={styles.label}>Пароль</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                  textContentType={mode === "sign-up" ? "newPassword" : "password"}
                  placeholder="Щонайменше 6 символів"
                  placeholderTextColor={colors.mutedForeground}
                  style={styles.input}
                />
              </>
            )}
            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
            ) : null}
            {busy ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <PrimaryButton
                label={mode === "sign-in" ? "Увійти" : mode === "sign-up" ? "Зареєструватися" : "Надіслати посилання"}
                onPress={submit}
              />
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMode(mode === "reset" ? "sign-in" : "reset");
                setError("");
              }}
              style={styles.ghost}
            >
              <Text style={styles.link}>{mode === "reset" ? "Назад до входу" : "Забули пароль?"}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = themed(() => ({
  screen: { flex: 1, backgroundColor: colors.background, paddingTop: 52 },
  nav: { paddingHorizontal: 12, minHeight: MIN_TOUCH, flexDirection: "row", alignItems: "center" },
  back: { flexDirection: "row", alignItems: "center", minHeight: MIN_TOUCH },
  backText: { fontFamily: fonts.bold, fontSize: 17, color: colors.primary },
  body: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  largeTitle: { fontFamily: fonts.extrabold, fontSize: 34, lineHeight: 40, letterSpacing: -0.8, color: colors.foreground },
  caption: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.mutedForeground },
  card: { gap: 10, padding: 16, borderRadius: radius.xl, backgroundColor: colors.card, alignItems: "flex-start" },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 20, letterSpacing: -0.3, color: colors.foreground },
  label: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground, marginTop: 4 },
  input: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    color: colors.foreground,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  segment: { flexDirection: "row", padding: 3, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  segmentItem: { flex: 1, minHeight: MIN_TOUCH - 8, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground },
  segmentTextActive: { color: colors.onPrimary },
  error: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 19, color: colors.destructive },
  outline: {
    minHeight: MIN_TOUCH,
    alignSelf: "stretch",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineText: { fontFamily: fonts.bold, fontSize: 16, color: colors.foreground },
  ghost: { minHeight: MIN_TOUCH, alignSelf: "stretch", alignItems: "center", justifyContent: "center" },
  link: { fontFamily: fonts.bold, fontSize: 15, color: colors.accentForeground },
  danger: { fontFamily: fonts.bold, fontSize: 15, color: colors.destructive },
}));
