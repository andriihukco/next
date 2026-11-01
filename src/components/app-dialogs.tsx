import { lazy, Suspense } from "react";
import { AnimatePresence } from "motion/react";
import type { AppView } from "../lib/app-types";
import type { useOnboardingGate } from "../hooks/use-onboarding-gate";

// Each dialog is its own chunk: most visits open none of them, and settings pulls in Supabase.
const OnboardingDialog = lazy(() =>
  import("../features/onboarding/onboarding-dialog").then((module) => ({ default: module.OnboardingDialog })),
);
const BenefitsDialog = lazy(() =>
  import("../features/onboarding/benefits-dialog").then((module) => ({ default: module.BenefitsDialog })),
);
const SettingsDialog = lazy(() =>
  import("../features/settings/settings-dialog").then((module) => ({ default: module.SettingsDialog })),
);

type AppDialogsProps = {
  onboarding: ReturnType<typeof useOnboardingGate>;
  activeView: AppView;
  settingsOpen: boolean;
  passwordRecovery: boolean;
  onCloseSettings: () => void;
  onRequestLocation: () => void;
};

/** Onboarding, the benefits prompt, and settings. At most one is open at a time. */
export function AppDialogs({
  onboarding,
  activeView,
  settingsOpen,
  passwordRecovery,
  onCloseSettings,
  onRequestLocation,
}: AppDialogsProps) {
  return (
    <Suspense fallback={null}>
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
          initialView={passwordRecovery ? "account" : "main"}
          onClose={onCloseSettings}
          onRequestLocation={onRequestLocation}
          onReplayOnboarding={onboarding.restart}
        />
      )}
    </AnimatePresence>
    </Suspense>
  );
}
