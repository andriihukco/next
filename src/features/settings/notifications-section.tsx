import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { DetailSection, ListRow } from "../../components/ui/detail-layout";
import { iconTileFor } from "../../lib/icon-tiles";
import { Switch } from "../../components/ui/switch";
import { MaterialIcon } from "../../components/ui/material-icon";
import {
  disablePush,
  enablePush,
  readPushTopics,
  savePushTopics,
  sendTestPush,
  type PushTopic,
} from "../../lib/push";
import { useSession } from "../../lib/supabase";
import "./settings.css";
import { PUSH_TOPICS, PUSH_LABEL, usePushStatus } from "./settings-permissions";

/** Push permission, the topic switches and the test notification for this device. */
export function usePushSettings(
  session: ReturnType<typeof useSession>["session"],
  setStatus: (message: string) => void,
  onNeedAccount: () => void,
) {
  const [push, setPush] = usePushStatus();
  const [pushBusy, setPushBusy] = useState(false);
  const [topics, setTopics] = useState<PushTopic[] | null>(null);

  useEffect(() => {
    if (push !== "on") {
      setTopics(null);
      return;
    }
    let active = true;
    readPushTopics()
      .then((next) => {
        if (active) setTopics(next);
      })
      .catch((error: unknown) => {
        console.error("Could not read notification topics.", error);
        if (active) setStatus("Не вдалося завантажити налаштування сповіщень.");
      });
    return () => {
      active = false;
    };
  }, [push, session, setStatus]);

  const toggleTopic = async (topic: PushTopic, enabled: boolean): Promise<void> => {
    if (!topics) return;
    const previous = topics;
    const next = enabled ? [...topics, topic] : topics.filter((item) => item !== topic);
    setTopics(next);
    try {
      await savePushTopics(next);
    } catch (error: unknown) {
      console.error("Could not save notification topics.", error);
      setTopics(previous);
      setStatus("Не вдалося зберегти налаштування сповіщень. Спробуйте ще раз.");
    }
  };

  const togglePush = async (enable: boolean): Promise<void> => {
    if (enable && !session) {
      onNeedAccount();
      return;
    }
    setPushBusy(true);
    setStatus("");
    try {
      const next = enable ? await enablePush() : await disablePush();
      setPush(next);
      if (enable && next === "on") setStatus("Сповіщення увімкнено. Виберіть, про що повідомляти.");
      if (enable && next === "denied") setStatus("Дозвіл не надано. Його можна змінити в налаштуваннях браузера.");
    } catch (error: unknown) {
      console.error("Could not change the push subscription.", error);
      setStatus(enable ? "Не вдалося увімкнути сповіщення. Спробуйте ще раз." : "Не вдалося вимкнути сповіщення.");
    } finally {
      setPushBusy(false);
    }
  };

  const testPush = async (): Promise<void> => {
    if (!session) return;
    setPushBusy(true);
    try {
      setStatus(await sendTestPush(session));
    } catch (error: unknown) {
      console.error("Could not request a test notification.", error);
      setStatus("Немає з’єднання з сервером. Спробуйте пізніше.");
    } finally {
      setPushBusy(false);
    }
  };

  return { push, setPush, pushBusy, topics, toggleTopic, togglePush, testPush };
}

/** «Сповіщення» in settings. */
export function NotificationsSection({
  settings,
  signedIn,
}: {
  settings: ReturnType<typeof usePushSettings>;
  signedIn: boolean;
}) {
  const { push, pushBusy, topics, toggleTopic, togglePush, testPush } = settings;
  return (
    <DetailSection title="Сповіщення">
      <ListRow
        leading={<MaterialIcon name="notifications" size={20} />}
        tile={iconTileFor("notifications")}
        title="Сповіщення на цьому пристрої"
        subtitle={
          push === null
            ? "Перевіряємо…"
            : push === "off" && !signedIn
              ? "Увійдіть, щоб отримувати сповіщення"
              : PUSH_LABEL[push]
        }
        trailing={
          <Switch
            aria-label="Сповіщення на цьому пристрої"
            checked={push === "on"}
            disabled={pushBusy || (push !== "on" && push !== "off")}
            onCheckedChange={(checked) => void togglePush(checked)}
          />
        }
      />
      {push === "on" &&
        PUSH_TOPICS.map((item) => (
          <ListRow
            key={item.topic}
            leading={<MaterialIcon name={item.icon} size={20} />}
            tile={iconTileFor(item.topic)}
            title={item.title}
            subtitle={item.subtitle}
            trailing={
              <Switch
                aria-label={item.title}
                checked={topics?.includes(item.topic) ?? false}
                disabled={topics === null}
                onCheckedChange={(checked) => void toggleTopic(item.topic, checked)}
              />
            }
          />
        ))}
      {push === "on" && signedIn && (
        <ListRow
          leading={<MaterialIcon name="send" size={20} />}
          tile={iconTileFor("test-push")}
          title="Тестове сповіщення"
          subtitle="Перевірте, чи сповіщення доходять"
          trailing={
            <Button type="button" size="sm" variant="outline" disabled={pushBusy} onClick={() => void testPush()}>
              Надіслати
            </Button>
          }
        />
      )}
    </DetailSection>
  );
}
