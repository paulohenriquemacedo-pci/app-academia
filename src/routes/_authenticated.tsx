import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { fetchOnboardingStep, type OnboardingStep } from "@/lib/supabase";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }
    let cancelled = false;
    fetchOnboardingStep(user.id).then((step: OnboardingStep) => {
      if (cancelled) return;
      const inOnboarding = pathname.startsWith("/onboarding");
      if (step === "complete" && inOnboarding) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      if (step !== "complete" && !inOnboarding) {
        navigate({
          to: step === "energy_tracking" ? "/onboarding/energy" : "/onboarding",
          replace: true,
        });
        return;
      }
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loading, user, pathname, navigate]);

  if (loading || !user || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Carregando…</div>
      </div>
    );
  }

  return <Outlet />;
}