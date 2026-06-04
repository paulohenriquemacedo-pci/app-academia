import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import {
  INTENSITY_LABEL,
  PROFILE_LABEL,
  intensityFor,
  type ProfileKey,
} from "@/lib/questionnaire-data";

export const Route = createFileRoute("/_authenticated/onboarding/result")({
  component: ResultPage,
});

type ProfileRow = {
  dominant_profile: ProfileKey | null;
  secondary_profile: ProfileKey | null;
  score_perfeccionista_paralisado: number | null;
  score_multitarefa_caotico: number | null;
  score_procrastinador_criativo: number | null;
  score_analista_perpetuo: number | null;
  score_dependente_motivacao: number | null;
  score_sobrecarregado_sistemico: number | null;
};

function ResultPage() {
  const { user } = useAuth();
  const [row, setRow] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_profiles")
      .select(
        "dominant_profile, secondary_profile, score_perfeccionista_paralisado, score_multitarefa_caotico, score_procrastinador_criativo, score_analista_perpetuo, score_dependente_motivacao, score_sobrecarregado_sistemico",
      )
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setRow(data as ProfileRow | null);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Carregando seu resultado…</div>
      </div>
    );
  }

  const scoreOf = (k: ProfileKey): number => {
    if (!row) return 0;
    const map: Record<ProfileKey, number> = {
      perfeccionista_paralisado: row.score_perfeccionista_paralisado ?? 0,
      multitarefa_caotico: row.score_multitarefa_caotico ?? 0,
      procrastinador_criativo: row.score_procrastinador_criativo ?? 0,
      analista_perpetuo: row.score_analista_perpetuo ?? 0,
      dependente_motivacao: row.score_dependente_motivacao ?? 0,
      sobrecarregado_sistemico: row.score_sobrecarregado_sistemico ?? 0,
    };
    return map[k];
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="font-display text-lg font-extrabold tracking-tight text-primary">
            Academia OS
          </div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Seu perfil
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 md:py-14">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary md:text-[28px]">
          Seu resultado
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Resumo dos perfis identificados a partir das suas respostas.
        </p>

        <div className="mt-8 space-y-4">
          {row?.dominant_profile && (
            <ProfileCard
              label="Perfil dominante"
              profile={row.dominant_profile}
              score={scoreOf(row.dominant_profile)}
            />
          )}
          {row?.secondary_profile && (
            <ProfileCard
              label="Perfil secundário"
              profile={row.secondary_profile}
              score={scoreOf(row.secondary_profile)}
            />
          )}
        </div>

        <div className="mt-10">
          <Button
            asChild
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Link to="/onboarding/energy">Continuar</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function ProfileCard({
  label,
  profile,
  score,
}: {
  label: string;
  profile: ProfileKey;
  score: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-bold text-primary">
        {PROFILE_LABEL[profile]}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">
        Pontuação {score}/32 · Intensidade {INTENSITY_LABEL[intensityFor(score)]}
      </div>
    </div>
  );
}