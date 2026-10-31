import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import * as Location from "expo-location";
import { MaterialIcons } from "@expo/vector-icons";
import { PrimaryButton } from "../components/primary-button";
import { SettingsRow, SettingsSection } from "../components/settings/settings-parts";
import { ChipRow } from "../components/services/flow-parts";
import { clearDeviceData, EMPTY_PROFILE, readLocalProfile, saveLocalProfile, VISITOR_TYPES, type LocalProfile } from "../lib/local-profile";
import { colors, fonts, MIN_TOUCH, radius, HIT_SLOP } from "../lib/theme";

type View_ = "main" | "profile";
const PERMISSION_LABEL: Record<string, string> = { granted: "Дозволено", denied: "Заборонено", undetermined: "Не запитано" };

/** Settings and profile, grouped as in the web's settings dialog. Account sign-in is not built yet. */
export default function ProfileScreen() {
  const [view, setView] = useState<View_>("main");
  const [profile, setProfile] = useState<LocalProfile>(EMPTY_PROFILE);
  const [draft, setDraft] = useState<LocalProfile>(EMPTY_PROFILE);
  const [location, setLocation] = useState<string>("undetermined");
  const [notifications, setNotifications] = useState(false);

  useEffect(() => {
    void readLocalProfile().then((saved) => {
      setProfile(saved);
      setDraft(saved);
    });
    void Location.getForegroundPermissionsAsync().then(({ status }) => setLocation(status));
  }, []);

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocation(status);
  };

  const saveProfile = async () => {
    await saveLocalProfile(draft);
    setProfile(draft);
    setView("main");
  };

  const clearData = () => {
    Alert.alert("Видалити профіль і налаштування?", "Буде очищено все, що застосунок зберігає на цьому пристрої. Дію не можна скасувати.", [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити",
        style: "destructive",
        onPress: async () => {
          await clearDeviceData();
          setProfile(EMPTY_PROFILE);
          setDraft(EMPTY_PROFILE);
        },
      },
    ]);
  };

  if (view === "profile") {
    return (
      <View style={styles.screen}>
        <View style={styles.nav}>
          <Pressable accessibilityRole="button" onPress={() => setView("main")} style={styles.back}>
            <MaterialIcons name="chevron-left" size={26} color={colors.primary} />
            <Text style={styles.backText}>Профіль</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={styles.largeTitle}>Мій профіль</Text>
          <Text style={styles.caption}>Зберігається лише на цьому пристрої. Нічого не надсилається.</Text>
          <Text style={styles.label}>Імʼя</Text>
          <TextInput value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} placeholder="Як до вас звертатися" placeholderTextColor={colors.mutedForeground} style={styles.input} />
          <Text style={styles.label}>Хто ви в місті</Text>
          <ChipRow
            items={VISITOR_TYPES.map((type) => ({ key: type, label: type }))}
            selected={draft.visitorType || null}
            onSelect={(visitorType) => setDraft({ ...draft, visitorType })}
          />
          <Text style={styles.label}>Дім (район)</Text>
          <TextInput value={draft.home} onChangeText={(home) => setDraft({ ...draft, home })} placeholder="Наприклад, Личаків" placeholderTextColor={colors.mutedForeground} style={styles.input} />
          <Text style={styles.label}>Робота (район)</Text>
          <TextInput value={draft.work} onChangeText={(work) => setDraft({ ...draft, work })} placeholder="Наприклад, Центр" placeholderTextColor={colors.mutedForeground} style={styles.input} />
          <PrimaryButton label="Зберегти" onPress={() => void saveProfile()} />
        </ScrollView>
      </View>
    );
  }

  const initial = profile.name ? profile.name.trim().charAt(0).toUpperCase() : "?";

  return (
    <View style={styles.screen}>
      <View style={styles.nav}>
        <Pressable accessibilityRole="button" accessibilityLabel="Закрити" hitSlop={HIT_SLOP} onPress={() => router.back()} style={styles.close}>
          <MaterialIcons name="close" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.largeTitle}>Профіль</Text>

        <Pressable accessibilityRole="button" onPress={() => setView("profile")} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>{profile.name || "Додати імʼя"}</Text>
            <Text style={styles.caption}>{profile.visitorType || "Для сповіщень про тривогу"}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.mutedForeground} />
        </Pressable>

        <SettingsSection title="Місто">
          <SettingsRow icon="location-city" title="Львів" subtitle="Місто поки одне" disabled />
        </SettingsSection>

        <SettingsSection title="Дозволи">
          <SettingsRow
            icon="my-location"
            title="Геолокація"
            subtitle={PERMISSION_LABEL[location] ?? location}
            trailing={
              location === "undetermined" ? (
                <Pressable accessibilityRole="button" onPress={() => void requestLocation()} style={styles.smallButton}>
                  <Text style={styles.smallButtonText}>Дозволити</Text>
                </Pressable>
              ) : undefined
            }
          />
        </SettingsSection>

        <SettingsSection title="Сповіщення">
          <SettingsRow
            icon="campaign"
            title="Початок тривоги"
            subtitle="Скоро: сповіщення з’являться в наступній версії"
            disabled
            trailing={<Switch value={notifications} disabled onValueChange={setNotifications} />}
          />
          <SettingsRow icon="verified-user" title="Відбій тривоги" subtitle="Коли загрозу знято" disabled trailing={<Switch value={false} disabled />} />
          <SettingsRow icon="radar" title="Загрози для Львова" subtitle="Нові повідомлення про дрони й авіабомби" disabled trailing={<Switch value={false} disabled />} />
        </SettingsSection>

        <SettingsSection title="Вигляд">
          <View style={styles.themeBox}>
            <Text style={styles.themeTitle}>Тема</Text>
            <View style={styles.segment}>
              {["Системна", "Світла", "Темна"].map((label, index) => (
                <View key={label} style={[styles.segmentItem, index === 1 && styles.segmentActive]} accessibilityState={{ disabled: index !== 1 }}>
                  <Text style={[styles.segmentText, index === 1 && styles.segmentTextActive, index !== 1 && styles.segmentDisabled]}>{label}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.caption}>Поки лише світла тема. Темну й системну додамо окремо.</Text>
          </View>
        </SettingsSection>

        <SettingsSection title="Про застосунок">
          <SettingsRow icon="tour" title="Показати знайомство ще раз" onPress={() => router.push("/welcome")} />
        </SettingsSection>

        <SettingsSection title="Дані на пристрої">
          <SettingsRow icon="delete-outline" title="Очистити дані на пристрої" onPress={clearData} />
        </SettingsSection>

        <Text style={styles.footnote}>Вхід в обліковий запис буде доступний після підключення бекенду.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingTop: 52 },
  nav: { paddingHorizontal: 12, minHeight: MIN_TOUCH, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { flexDirection: "row", alignItems: "center", minHeight: MIN_TOUCH },
  backText: { fontFamily: fonts.bold, fontSize: 17, color: colors.primary },
  close: { width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: MIN_TOUCH / 2, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center", marginLeft: "auto" },
  body: { paddingHorizontal: 16, paddingBottom: 40, gap: 16 },
  largeTitle: { fontFamily: fonts.extrabold, fontSize: 34, lineHeight: 40, letterSpacing: -0.8, color: colors.foreground },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.mutedForeground },
  card: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: radius.xl, borderCurve: "continuous", backgroundColor: colors.card },
  pressed: { opacity: 0.92 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 24, color: "#ffffff" },
  cardCopy: { flex: 1, gap: 2 },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 18, letterSpacing: -0.3, color: colors.foreground },
  smallButton: { minHeight: MIN_TOUCH - 8, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.accent, justifyContent: "center" },
  smallButtonText: { fontFamily: fonts.bold, fontSize: 14, color: colors.accentForeground },
  themeBox: { padding: 14, gap: 10 },
  themeTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.foreground },
  segment: { flexDirection: "row", padding: 3, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  segmentItem: { flex: 1, minHeight: MIN_TOUCH - 8, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground },
  segmentTextActive: { color: "#ffffff" },
  segmentDisabled: { color: colors.mutedForeground },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.mutedForeground, marginTop: 8 },
  input: { minHeight: MIN_TOUCH, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 16, color: colors.foreground },
  footnote: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.mutedForeground, textAlign: "center", paddingHorizontal: 12 },
});
