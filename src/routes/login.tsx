import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase, MAIN_SITE_URL, fetchOnboardingStep, routeForStep } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  ssr: false,
  component: LoginPage,
});

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    fetchOnboardingStep(user.id).then((step) => {
      navigate({ to: routeForStep(step), replace: true });
    });
  }, [loading, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setError(traduzirErro(error.message));
    }
  };

  const handleSSO = () => {
    const redirect = encodeURIComponent(window.location.origin);
    window.location.href = `${MAIN_SITE_URL}/login?redirect=${redirect}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary">
            Academia OS
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acesse sua conta para continuar
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleSSO}
        >
          Entrar pelo site principal
        </Button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wide text-muted-foreground">ou</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={submitting}
          >
            {submitting ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function traduzirErro(msg: string) {
  if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(msg)) return "Confirme seu e-mail antes de entrar.";
  return msg;
}