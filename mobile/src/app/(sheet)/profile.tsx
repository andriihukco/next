import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { clearDeviceData, EMPTY_PROFILE, readLocalProfile, type LocalProfile } from "../../lib/local-profile";
import { iconTileFor } from "../../lib/icon-tiles";
import { useThemePreference, type ThemePreference } from "../../lib/theme-provider";
import { accountLabel, useSession } from "../../lib/supabase";
import { Badge, ListRow, Page, Section, Segmented, SwitchRow } from "../../ui";

const THEME_OPTIONS: readonly { id: ThemePreference; label: string }[] = [
  { id: "system", label: "Системна" },
  { id: "light", label: "Світла" },
  { id: "dark", label: "Темна" },
];
const PERMISSION_LABEL: Record<string, string> = { granted: "Дозволено", denied: "Заборонено", undetermined: "Не запитано" };

/** Профіль: account, your profile, permissions, look, and data on the device. Same groups as the web settings. */
export default function ProfileScreen() {
  const [, setProfile] = useState<LocalProfile>(EMPTY_PROFILE);
  const [location, setLocation] = useState("undetermined");
  const theme = useThemePreference();
  const { session } = useSession();

  // Re-read when the page shows again, e.g. after editing the profile.
  useFocusEffect(
    useCallback(() => {
      void readLocalProfile().then(setProfile);
      void Location.getForegroundPermissionsAsync().then(({ status }) => setLocation(status));
    }, []),
  );

  const clearData = () => {
    Alert.alert("Видалити профіль і налаштування?", "Буде очищено все, що застосунок зберігає на цьому пристрої. Дію не можна скасувати.", [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити",
        style: "destructive",
        onPress: async () => {
          await clearDeviceData();
          setProfile(EMPTY_PROFILE);
        },
      },
    ]);
  };

  return (
    <Page>
      <Section grouped>
        <ListRow
          icon={session ? "account-circle" : "login"}
          iconTile={iconTileFor("my-profile")}
          title="Мій профіль"
          subtitle={session ? accountLabel(session.user) : "Увійти або зареєструватися"}
          onPress={() => router.push("/account")}
          last
        />
      </Section>

      <Section title="Вигляд" footer="Системна тема змінюється разом із налаштуваннями телефона.">
        <Segmented options={THEME_OPTIONS} value={theme.preference} onChange={theme.setPreference} />
      </Section>

      <Section title="Дозволи" grouped>
        <ListRow
          icon="my-location"
          iconTile={iconTileFor("location")}
          title="Геолокація"
          value={PERMISSION_LABEL[location] ?? location}
          onPress={
            location === "undetermined"
              ? () => void Location.requestForegroundPermissionsAsync().then(({ status }) => setLocation(status))
              : undefined
          }
          last
        />
      </Section>

      <Section title="Сповіщення" grouped footer="Сповіщення з’являться, коли підключимо push у збірці застосунку.">
        <SwitchRow icon="campaign" iconTile={iconTileFor("alert-start")} title="Початок тривоги" value={false} onValueChange={() => {}} disabled />
        <SwitchRow icon="verified-user" iconTile={iconTileFor("alert-end")} title="Відбій тривоги" value={false} onValueChange={() => {}} disabled />
        <ListRow icon="radar" iconTile={iconTileFor("threats")} title="Загрози для Львова" trailing={<Badge label="Незабаром" />} last />
      </Section>

      <Section title="Про застосунок" grouped>
        <ListRow icon="tour" iconTile={iconTileFor("tour")} title="Показати знайомство ще раз" onPress={() => router.replace({ pathname: "/transport", params: { tour: "1" } })} />
        <ListRow icon="directions-walk" iconTile={iconTileFor("walk")} title="Прогулянка центром" subtitle="Демо маршруту з прогресом ходьби" onPress={() => router.push("/welcome")} />
        <ListRow icon="palette" iconTile={iconTileFor("design")} title="Дизайн-система" subtitle="Усі елементи для iOS і Android" onPress={() => router.push("/design")} last />
      </Section>

      <Section grouped>
        <ListRow icon="delete-outline" iconTile={iconTileFor("clear-data")} title="Очистити дані на пристрої" destructive onPress={clearData} navigates={false} last />
      </Section>
    </Page>
  );
}
