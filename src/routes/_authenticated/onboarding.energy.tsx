import { createFileRoute } from "@tanstack/react-router";
import { OnboardingShell } from "@/components/onboarding-shell";

export const Route = createFileRoute("/_authenticated/onboarding/energy")({
  component: OnboardingEnergyPage,
});

function OnboardingEnergyPage() {
  return (
    <OnboardingShell step={2} totalSteps={2} label="Mapeamento de energia">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
          Mapeamento de energia
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          O rastreamento de energia será construído nos próximos passos.
        </p>
      </div>
    </OnboardingShell>
  );
}