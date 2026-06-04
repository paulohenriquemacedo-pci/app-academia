import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { fetchOnboardingStep, routeForStep } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }
    fetchOnboardingStep(user.id).then((step) => {
      navigate({ to: routeForStep(step), replace: true });
    });
  }, [loading, user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-sm text-muted-foreground">Carregando…</div>
    </div>
  );
}
