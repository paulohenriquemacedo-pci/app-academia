import { createFileRoute } from "@tanstack/react-router";
import { OnboardingShell } from "@/components/onboarding-shell";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  return (
    <OnboardingShell step={1} totalSteps={2} label="Questionário inicial">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
          Vamos configurar seu sistema
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          O questionário inicial será construído nos próximos passos.
        </p>
      </div>
    </OnboardingShell>
  );
}