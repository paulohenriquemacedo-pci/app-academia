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
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    fetchOnboardingStep(user.id).then((step) => {
      navigate({ to: routeForStep(step), replace: true });
    });
  }, [loading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setSubmitting(true);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setSubmitting(false);
      if (error) {
        setError(traduzirErro(error.message));
        return;
      }
      if (!data.session) {
        // Confirmação de e-mail está ativa no projeto Supabase — tenta login direto.
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) {
          setInfo("Cadastro criado. Verifique seu e-mail ou desative a confirmação no Supabase.");
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setSubmitting(false);
      if (error) {
        setError(traduzirErro(error.message));
      }
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm text-muted-foreground" role="status">
              {info}
            </p>
          )}
          <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={submitting}
          >
            {submitting
              ? mode === "signup"
                ? "Criando conta…"
                : "Entrando…"
              : mode === "signup"
                ? "Criar conta"
                : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
          <button
            type="button"
            className="font-semibold text-primary hover:underline"
            onClick={() => {
              setMode((m) => (m === "signin" ? "signup" : "signin"));
              setError(null);
              setInfo(null);
            }}
          >
            {mode === "signin" ? "Criar cadastro" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
}

function traduzirErro(msg: string) {
  if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(msg)) return "Confirme seu e-mail antes de entrar.";
  if (/user already registered/i.test(msg)) return "Este e-mail já está cadastrado.";
  if (/password.*at least/i.test(msg)) return "A senha deve ter pelo menos 6 caracteres.";
  return msg;
}