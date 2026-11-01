import { useState } from "react";
import type { AppView } from "../lib/app-types";
import { isDevRouteActive } from "../lib/dev-tools/route";
import { ONBOARDING_STEPS, type OnboardingProfile } from "../features/onboarding/steps";
import {
  BENEFITS_DISMISSED_KEY,
  ONBOARDING_COMPLETE_KEY,
  ONBOARDING_PREVIEW_KEY,
  ONBOARDING_PROFILE_KEY,
  readOnboardingValue,
  saveOnboardingValue,
} from "../features/onboarding/storage";

export type OnboardingPhase = "welcome" | "profile" | "tour";

const previewRequested = (): boolean =>
  isDevRouteActive() && readOnboardingValue(ONBOARDING_PREVIEW_KEY) === "true";

const NOTIFICATIONS_GRANTED =
  "Дозвіл надано. Сповіщення про повітряну тривогу вмикаються в Профілі після входу.";

/** First-run onboarding, the tour steps, and the benefits dialog that follows it. */
export function useOnboardingGate(setActiveView: (view: AppView) => void) {
  const [phase, setPhase] = useState<OnboardingPhase>("welcome");
  const [showOnboarding, setShowOnboarding] = useState(
    () => readOnboardingValue(ONBOARDING_COMPLETE_KEY) !== "true" || previewRequested(),
  );
  const [step, setStep] = useState(0);
  const [showBenefits, setShowBenefits] = useState(
    () =>
      readOnboardingValue(ONBOARDING_COMPLETE_KEY) === "true" &&
      readOnboardingValue(BENEFITS_DISMISSED_KEY) !== "true" &&
      !previewRequested(),
  );
  const [notificationMessage, setNotificationMessage] = useState("");

  const finish = (): void => {
    saveOnboardingValue(ONBOARDING_COMPLETE_KEY, "true");
    setShowOnboarding(false);
    setShowBenefits(readOnboardingValue(BENEFITS_DISMISSED_KEY) !== "true");
  };
  const startTour = (profile: OnboardingProfile): void => {
    saveOnboardingValue(ONBOARDING_PROFILE_KEY, JSON.stringify(profile));
    setPhase("tour");
    setStep(0);
    setActiveView("city");
  };
  const goToStep = (next: number): void => {
    if (next >= ONBOARDING_STEPS.length) {
      finish();
      return;
    }
    const index = Math.max(0, next);
    setActiveView(ONBOARDING_STEPS[index].view);
    setStep(index);
  };
  const restart = (): void => {
    setStep(0);
    setPhase("welcome");
    setActiveView("city");
    setShowBenefits(false);
    setShowOnboarding(true);
  };
  const dismissBenefits = (): void => {
    saveOnboardingValue(BENEFITS_DISMISSED_KEY, "true");
    setShowBenefits(false);
  };
  const requestNotificationPermission = (): void => {
    if (typeof Notification === "undefined") {
      setNotificationMessage("Цей браузер не підтримує системні сповіщення.");
      return;
    }
    if (Notification.permission === "granted") {
      setNotificationMessage(NOTIFICATIONS_GRANTED);
      return;
    }
    if (Notification.permission === "denied") {
      setNotificationMessage("Доступ вимкнено в налаштуваннях браузера. Його можна змінити там.");
      return;
    }
    void Notification.requestPermission()
      .then((permission) => {
        setNotificationMessage(
          permission === "granted"
            ? NOTIFICATIONS_GRANTED
            : "Дозвіл не надано. Його можна змінити в налаштуваннях браузера.",
        );
      })
      .catch((error: unknown) => {
        console.error("Could not request notification permission.", error);
        setNotificationMessage("Не вдалося запросити дозвіл на сповіщення.");
      });
  };

  return {
    phase,
    setPhase,
    step,
    showOnboarding,
    showBenefits,
    notificationMessage,
    finish,
    startTour,
    goToStep,
    restart,
    dismissBenefits,
    requestNotificationPermission,
  };
}
