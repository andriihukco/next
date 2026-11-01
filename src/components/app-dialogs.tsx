import { AnimatePresence } from "motion/react";
import { BenefitsDialog } from "../features/onboarding/benefits-dialog";
import { OnboardingDialog } from "../features/onboarding/onboarding-dialog";
import { SettingsDialog } from "../features/settings/settings-dialog";
import type { AppView } from "../lib/app-types";
import type { useOnboardingGate } from "../hooks/use-onboarding-gate";

type AppDialogsProps = {
  onboarding: ReturnType<typeof useOnboardingGate>;
  activeView: AppView;
  settingsOpen: boolean;
  passwordRecovery: boolean;
  onCloseSettings: () => void;
  onOpenCityPicker: () => void;
  onRequestLocation: () => void;
};

/** Onboarding, the benefits prompt, and settings. At most one is open at a time. */
export function AppDialogs({
  onboarding,
  activeView,
  settingsOpen,
  passwordRecovery,
  onCloseSettings,
  onOpenCityPicker,
  onRequestLocation,
}: AppDialogsProps) {
  return (
    <AnimatePresence>
      {onboarding.showOnboarding && (
        <OnboardingDialog
          key="onboarding"
          phase={onboarding.phase}
          step={onboarding.step}
          viewKey={activeView}
          onPhaseChange={onboarding.setPhase}
          onStartTour={onboarding.startTour}
          onStepChange={onboarding.goToStep}
          onFinish={onboarding.finish}
        />
      )}
      {onboarding.showBenefits && (
        <BenefitsDialog
          key="benefits"
          notificationMessage={onboarding.notificationMessage}
          onRequestLocation={onRequestLocation}
          onRequestNotifications={onboarding.requestNotificationPermission}
          onDismiss={onboarding.dismissBenefits}
        />
      )}
      {settingsOpen && (
        <SettingsDialog
          key="settings"
          cityName="Львів"
          initialView={passwordRecovery ? "account" : "main"}
          onClose={onCloseSettings}
          onOpenCityPicker={onOpenCityPicker}
          onRequestLocation={onRequestLocation}
          onReplayOnboarding={onboarding.restart}
        />
      )}
    </AnimatePresence>
  );
}
