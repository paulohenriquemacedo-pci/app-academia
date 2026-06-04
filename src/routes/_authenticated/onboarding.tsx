import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import {
  SECTIONS,
  SCORE_LABELS,
  computeResult,
  type ProfileKey,
  type SectionScores,
} from "@/lib/questionnaire-data";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

type BasicData = {
  full_name: string;
  institution: string;
  research_level: string;
  research_area: string;
};

const basicSchema = z.object({
  full_name: z.string().trim().min(1, "Informe seu nome").max(200),
  institution: z.string().trim().min(1, "Informe a instituição").max(200),
  research_level: z.enum(["Mestrado", "Doutorado", "Pós-doutorado", "TCC", "Outro"]),
  research_area: z.string().trim().min(1, "Informe a área de pesquisa").max(200),
});

const TOTAL_STAGES = 1 + SECTIONS.length; // 1 dados + 6 partes

function emptyAnswers(): Record<ProfileKey, (number | null)[]> {
  const o = {} as Record<ProfileKey, (number | null)[]>;
  for (const s of SECTIONS) o[s.key] = Array(s.statements.length).fill(null);
  return o;
}

function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 0 = dados básicos | 1..6 = seções do questionário
  const [stage, setStage] = useState(0);
  const [basic, setBasic] = useState<BasicData>({
    full_name: "",
    institution: "",
    research_level: "",
    research_area: "",
  });
  const [basicErrors, setBasicErrors] = useState<Partial<Record<keyof BasicData, string>>>({});
  const [answers, setAnswers] = useState(emptyAnswers);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const progressPct = useMemo(() => Math.round(((stage + 1) / TOTAL_STAGES) * 100), [stage]);
  const stageLabel = stage === 0 ? "Dados básicos" : `Parte ${stage} de ${SECTIONS.length}`;

  const handleBasicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = basicSchema.safeParse(basic);
    if (!parsed.success) {
      const errs: Partial<Record<keyof BasicData, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof BasicData;
        if (!errs[k]) errs[k] = issue.message;
      }
      setBasicErrors(errs);
      return;
    }
    setBasicErrors({});
    setStage(1);
  };

  const currentSection = stage >= 1 ? SECTIONS[stage - 1] : null;
  const currentAnswers = currentSection ? answers[currentSection.key] : [];
  const allAnswered = currentAnswers.every((a) => a !== null);
  const isLastSection = stage === SECTIONS.length;

  const setScore = (idx: number, value: number) => {
    if (!currentSection) return;
    setAnswers((prev) => {
      const next = { ...prev };
      const arr = [...next[currentSection.key]];
      arr[idx] = value;
      next[currentSection.key] = arr;
      return next;
    });
  };

  const handleNext = async () => {
    if (!isLastSection) {
      setStage((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // Última seção: calcular, salvar e ir para /onboarding/result
    if (!user) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const scores: SectionScores = {
        perfeccionista_paralisado: 0,
        multitarefa_caotico: 0,
        procrastinador_criativo: 0,
        analista_perpetuo: 0,
        dependente_motivacao: 0,
        sobrecarregado_sistemico: 0,
      };
      for (const s of SECTIONS) {
        scores[s.key] = answers[s.key].reduce<number>((acc, v) => acc + (v ?? 0), 0);
      }
      const { dominant, secondary } = computeResult(scores);

      const payload = {
        user_id: user.id,
        full_name: basic.full_name.trim(),
        institution: basic.institution.trim(),
        research_level: basic.research_level,
        research_area: basic.research_area.trim(),
        dominant_profile: dominant.key,
        secondary_profile: secondary?.key ?? null,
        score_perfeccionista_paralisado: scores.perfeccionista_paralisado,
        score_multitarefa_caotico: scores.multitarefa_caotico,
        score_procrastinador_criativo: scores.procrastinador_criativo,
        score_analista_perpetuo: scores.analista_perpetuo,
        score_dependente_motivacao: scores.dependente_motivacao,
        score_sobrecarregado_sistemico: scores.sobrecarregado_sistemico,
        questionnaire_completed_at: new Date().toISOString(),
        onboarding_step: "energy_tracking",
      };

      const { error, data } = await supabase
        .from("user_profiles")
        .upsert(payload, { onConflict: "user_id" })
        .select();

      if (error) {
        console.error("[onboarding] upsert error", error, "payload:", payload);
        const details = [error.message, error.details, error.hint, error.code]
          .filter(Boolean)
          .join(" — ");
        throw new Error(details || "Erro desconhecido");
      }
      console.log("[onboarding] upsert ok", data);

      navigate({ to: "/onboarding/result", replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar respostas";
      console.error("[onboarding] save failed:", err);
      setSubmitError(msg);
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (stage === 0) return;
    setStage((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="font-display text-lg font-extrabold tracking-tight text-primary">
            Academia OS
          </div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{stageLabel}</div>
        </div>
        <div className="h-1 w-full bg-secondary">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPct}
          />
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 py-10 md:py-14">
        <div className="w-full max-w-2xl">
          {stage === 0 ? (
            <BasicForm
              data={basic}
              errors={basicErrors}
              onChange={(patch) => setBasic((b) => ({ ...b, ...patch }))}
              onSubmit={handleBasicSubmit}
            />
          ) : currentSection ? (
            <SectionForm
              sectionIndex={stage}
              statements={currentSection.statements}
              answers={currentAnswers}
              onSelect={setScore}
            />
          ) : null}

          {stage > 0 && (
            <div className="mt-10 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
                disabled={submitting}
              >
                ← Voltar
              </button>
              <div className="flex flex-col items-end gap-2">
                {submitError && (
                  <p className="text-xs text-destructive" role="alert">
                    {submitError}
                  </p>
                )}
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!allAnswered || submitting}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  size="lg"
                >
                  {submitting
                    ? "Salvando…"
                    : isLastSection
                      ? "Ver meu resultado"
                      : "Próxima parte"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function BasicForm({
  data,
  errors,
  onChange,
  onSubmit,
}: {
  data: BasicData;
  errors: Partial<Record<keyof BasicData, string>>;
  onChange: (patch: Partial<BasicData>) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary md:text-[28px]">
          Vamos começar
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algumas informações básicas antes do questionário de perfil.
        </p>
      </div>

      <Field id="full_name" label="Nome completo" error={errors.full_name}>
        <Input
          id="full_name"
          value={data.full_name}
          onChange={(e) => onChange({ full_name: e.target.value })}
          maxLength={200}
          autoComplete="name"
        />
      </Field>

      <Field id="institution" label="Instituição de ensino" error={errors.institution}>
        <Input
          id="institution"
          value={data.institution}
          onChange={(e) => onChange({ institution: e.target.value })}
          maxLength={200}
        />
      </Field>

      <Field id="research_level" label="Nível da pesquisa" error={errors.research_level}>
        <Select
          value={data.research_level}
          onValueChange={(v) => onChange({ research_level: v })}
        >
          <SelectTrigger id="research_level">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Mestrado">Mestrado</SelectItem>
            <SelectItem value="Doutorado">Doutorado</SelectItem>
            <SelectItem value="Pós-doutorado">Pós-doutorado</SelectItem>
            <SelectItem value="TCC">TCC</SelectItem>
            <SelectItem value="Outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field id="research_area" label="Área de pesquisa" error={errors.research_area}>
        <Input
          id="research_area"
          value={data.research_area}
          onChange={(e) => onChange({ research_area: e.target.value })}
          maxLength={200}
        />
      </Field>

      <div className="pt-2">
        <Button
          type="submit"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          size="lg"
        >
          Continuar
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SectionForm({
  sectionIndex,
  statements,
  answers,
  onSelect,
}: {
  sectionIndex: number;
  statements: string[];
  answers: (number | null)[];
  onSelect: (idx: number, value: number) => void;
}) {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary md:text-[28px]">
        Parte {sectionIndex} de {SECTIONS.length}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Marque o quanto cada afirmação descreve você.
      </p>

      <ol className="mt-8 space-y-6">
        {statements.map((text, idx) => (
          <li key={idx} className="rounded-lg border border-border bg-card p-4 md:p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-xs font-semibold text-muted-foreground">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <p className="text-base leading-relaxed text-foreground">{text}</p>
            </div>
            <ScoreScale
              value={answers[idx]}
              onChange={(v) => onSelect(idx, v)}
              labelId={`q-${sectionIndex}-${idx}`}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

function ScoreScale({
  value,
  onChange,
  labelId,
}: {
  value: number | null;
  onChange: (v: number) => void;
  labelId: string;
}) {
  return (
    <div
      className="mt-4 grid grid-cols-5 gap-2"
      role="radiogroup"
      aria-labelledby={labelId}
    >
      {SCORE_LABELS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "min-h-12 rounded-md border text-sm font-medium transition-colors",
              "flex flex-col items-center justify-center gap-0.5 px-1 py-2",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            <span className="text-xs font-semibold opacity-80">{opt.value}</span>
            <span className="hidden text-xs md:inline">{opt.full}</span>
            <span className="text-xs md:hidden">{opt.short}</span>
          </button>
        );
      })}
    </div>
  );
}