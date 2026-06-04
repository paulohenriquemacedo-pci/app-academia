import type { ReactNode } from "react";

export function OnboardingShell({
  children,
  step,
  totalSteps,
  label,
}: {
  children: ReactNode;
  step: number;
  totalSteps: number;
  label: string;
}) {
  const pct = Math.round((step / totalSteps) * 100);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="font-display text-lg font-extrabold tracking-tight text-primary">
            Academia OS
          </div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Etapa {step} de {totalSteps}
          </div>
        </div>
        <div className="h-1 w-full bg-secondary">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${pct}%` }}
            aria-label={label}
          />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">{children}</main>
    </div>
  );
}