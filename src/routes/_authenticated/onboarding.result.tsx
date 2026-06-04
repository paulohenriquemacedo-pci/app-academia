import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import {
  INTENSITY_LABEL,
  PROFILE_LABEL,
  PROFILE_META,
  PROFILE_SHORT_LABEL,
  intensityFor,
  type ProfileKey,
} from "@/lib/questionnaire-data";

export const Route = createFileRoute("/_authenticated/onboarding/result")({
  component: ResultPage,
});

type ProfileRow = {
  full_name: string | null;
  dominant_profile: ProfileKey | null;
  secondary_profile: ProfileKey | null;
  score_perfeccionista_paralisado: number | null;
  score_multitarefa_caotico: number | null;
  score_procrastinador_criativo: number | null;
  score_analista_perpetuo: number | null;
  score_dependente_motivacao: number | null;
  score_sobrecarregado_sistemico: number | null;
};

const PROFILE_ORDER: ProfileKey[] = [
  "perfeccionista_paralisado",
  "multitarefa_caotico",
  "procrastinador_criativo",
  "analista_perpetuo",
  "dependente_motivacao",
  "sobrecarregado_sistemico",
];

function ResultPage() {
  const { user } = useAuth();
  const [row, setRow] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_profiles")
      .select(
        "full_name, dominant_profile, secondary_profile, score_perfeccionista_paralisado, score_multitarefa_caotico, score_procrastinador_criativo, score_analista_perpetuo, score_dependente_motivacao, score_sobrecarregado_sistemico",
      )
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setRow(data as ProfileRow | null);
        setLoading(false);
      });
  }, [user]);

  const scoresByKey = useMemo<Record<ProfileKey, number>>(
    () => ({
      perfeccionista_paralisado: row?.score_perfeccionista_paralisado ?? 0,
      multitarefa_caotico: row?.score_multitarefa_caotico ?? 0,
      procrastinador_criativo: row?.score_procrastinador_criativo ?? 0,
      analista_perpetuo: row?.score_analista_perpetuo ?? 0,
      dependente_motivacao: row?.score_dependente_motivacao ?? 0,
      sobrecarregado_sistemico: row?.score_sobrecarregado_sistemico ?? 0,
    }),
    [row],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Carregando seu resultado…</div>
      </div>
    );
  }

  const firstName = (row?.full_name ?? "").trim().split(/\s+/)[0] ?? "";
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const dominant = row?.dominant_profile ?? null;
  const secondary = row?.secondary_profile ?? null;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-[600px] px-4 py-10 md:py-14">
        {/* Seção 1 — Cabeçalho */}
        <header>
          <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-tight text-primary">
            Seu perfil{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Resultado baseado em {today}</p>
        </header>

        {/* Seção 2 — Perfil dominante */}
        {dominant && (
          <section className="mt-10 border-l-4 border-primary bg-card pl-5 py-1">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Perfil Dominante
            </div>
            <h2 className="mt-1 font-display text-[28px] font-bold leading-tight tracking-tight text-foreground">
              {PROFILE_LABEL[dominant]}
            </h2>
            <div className="mt-1 text-sm text-muted-foreground">
              {scoresByKey[dominant]}/32 pontos — {INTENSITY_LABEL[intensityFor(scoresByKey[dominant])]}
            </div>
            <p className="mt-4 text-base leading-relaxed text-foreground">
              {PROFILE_META[dominant].description}
            </p>
            <div className="mt-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Como o app vai trabalhar com você:
              </div>
              <p className="mt-1 text-base italic leading-relaxed text-foreground">
                {PROFILE_META[dominant].protocol}
              </p>
            </div>
          </section>
        )}

        {/* Seção 3 — Perfil secundário (apenas se > 20) */}
        {secondary && scoresByKey[secondary] > 20 && (
          <section className="mt-8 border-l-4 border-accent bg-card pl-5 py-1">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Perfil Secundário
            </div>
            <h2 className="mt-1 font-display text-xl font-bold leading-tight tracking-tight text-foreground">
              {PROFILE_LABEL[secondary]}
            </h2>
            <div className="mt-1 text-sm text-muted-foreground">
              {scoresByKey[secondary]}/32 pontos — {INTENSITY_LABEL[intensityFor(scoresByKey[secondary])]}
            </div>
            <p className="mt-3 text-base leading-relaxed text-foreground">
              {PROFILE_META[secondary].description}
            </p>
          </section>
        )}

        {/* Seção 4 — Gráfico */}
        <section className="mt-10">
          <h3 className="font-display text-base font-bold uppercase tracking-wide text-muted-foreground">
            Distribuição
          </h3>
          <ul className="mt-4 space-y-3">
            {PROFILE_ORDER.map((key) => {
              const score = scoresByKey[key];
              const pct = (score / 32) * 100;
              const isDominant = key === dominant;
              const isSecondary =
                key === secondary && secondary !== null && scoresByKey[secondary] > 20;
              const barColor = isDominant
                ? "bg-primary"
                : isSecondary
                  ? "bg-accent"
                  : "bg-[#d1d5db]";
              const labelEmphasis =
                isDominant || isSecondary ? "text-foreground font-medium" : "text-muted-foreground";
              return (
                <li key={key} className="flex items-center gap-3">
                  <div
                    className={`w-28 shrink-0 text-xs md:text-sm ${labelEmphasis}`}
                    title={PROFILE_LABEL[key]}
                  >
                    {PROFILE_SHORT_LABEL[key]}
                  </div>
                  <div className="relative h-3 flex-1 rounded-sm bg-secondary">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-sm ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground md:text-sm">
                    {score}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Seção 5 — Próximo passo */}
        <section className="mt-12 rounded-md bg-secondary p-6 md:p-8">
          <h3 className="font-display text-lg font-bold tracking-tight text-primary">
            Próxima etapa: Mapeamento de Energia Cognitiva
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-foreground md:text-base">
            Durante os próximos 7 dias, você vai registrar seu nível de energia hora a hora. Isso
            identifica suas Horas de Ouro — os períodos de pico cognitivo que o app vai proteger
            para suas sessões de Deep Work.
          </p>
          <div className="mt-6">
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link to="/onboarding/energy">Começar mapeamento de energia</Link>
            </Button>
          </div>
        </section>

        {/* Seção 6 — Rodapé */}
        <footer className="mt-10">
          <a
            href="https://sistemaacademia.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Rever meu livro antes de continuar
          </a>
        </footer>
      </main>
    </div>
  );
}