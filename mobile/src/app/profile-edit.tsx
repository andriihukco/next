import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { router, Stack } from "expo-router";
import { EMPTY_PROFILE, readLocalProfile, saveLocalProfile, VISITOR_TYPES, type LocalProfile } from "../lib/local-profile";
import { colors, fonts, themed } from "../lib/theme";
import { Button, Chip, Page, Section, space, radiusFor, useUiPlatform } from "../ui";

/** Мій профіль: name, who you are in the city, home and work districts. Kept on the device only. */
export default function ProfileEditScreen() {
  const platform = useUiPlatform();
  const [draft, setDraft] = useState<LocalProfile>(EMPTY_PROFILE);
  useEffect(() => {
    void readLocalProfile().then(setDraft);
  }, []);

  const save = async () => {
    await saveLocalProfile(draft);
    router.back();
  };
  const field = { borderRadius: radiusFor(platform).control };

  return (
    <>
      <Stack.Screen options={{ title: "Мій профіль" }} />
      <Page>
        <Section title="Імʼя" footer="Зберігається лише на цьому пристрої. Нічого не надсилається.">
          <TextInput
            value={draft.name}
            onChangeText={(name) => setDraft({ ...draft, name })}
            placeholder="Як до вас звертатися"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, field]}
          />
        </Section>
        <Section title="Хто ви в місті">
          <View style={styles.chips}>
            {VISITOR_TYPES.map((type) => (
              <Chip key={type} label={type} selected={draft.visitorType === type} onPress={() => setDraft({ ...draft, visitorType: type })} />
            ))}
          </View>
        </Section>
        <Section title="Дім (район)">
          <TextInput
            value={draft.home}
            onChangeText={(home) => setDraft({ ...draft, home })}
            placeholder="Наприклад, Личаків"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, field]}
          />
        </Section>
        <Section title="Робота (район)">
          <TextInput
            value={draft.work}
            onChangeText={(work) => setDraft({ ...draft, work })}
            placeholder="Наприклад, Центр"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, field]}
          />
        </Section>
        <Button label="Зберегти" size="lg" stretch onPress={() => void save()} />
      </Page>
    </>
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
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
}));
