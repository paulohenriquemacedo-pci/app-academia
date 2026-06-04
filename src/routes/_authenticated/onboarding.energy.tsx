import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { OnboardingShell } from "@/components/onboarding-shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import {
  HOURS,
  ENERGY_COLORS,
  ENERGY_LABELS,
  CHRONOTYPE_LABEL,
  CHRONOTYPE_DESC,
  analyzeEnergy,
  formatHour,
  isoDate,
  daysBetween,
  type EnergyLog,
  type AnalysisResult,
} from "@/lib/energy-analysis";

export const Route = createFileRoute("/_authenticated/onboarding/energy")({
  component: OnboardingEnergyPage,
});

const TOTAL_DAYS = 7;
const MIN_LOGS_PER_DAY = 5;
const MIN_VALID_DAYS = 5;

type DraftRow = { level: number | null; note: string };

function emptyDraft(): Record<number, DraftRow> {
  const r: Record<number, DraftRow> = {};
  HOURS.forEach((h) => (r[h] = { level: null, note: "" }));
  return r;
}

function OnboardingEnergyPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startedAt, setStartedAt] = useState<string | null>(null); // YYYY-MM-DD do dia 1
  const [logs, setLogs] = useState<EnergyLog[]>([]);
  const [draft, setDraft] = useState<Record<number, DraftRow>>(emptyDraft());
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});
  const [expandedHistory, setExpandedHistory] = useState<Record<number, boolean>>({});

  const [stage, setStage] = useState<"entry" | "processing" | "result">("entry");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Bootstrap: load profile + existing logs
  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("energy_tracking_started_at, onboarding_step")
          .eq("user_id", user.id)
          .maybeSingle();

        let start = profile?.energy_tracking_started_at as string | null | undefined;
        if (!start) {
          start = isoDate(new Date());
          await supabase
            .from("user_profiles")
            .upsert(
              {
                user_id: user.id,
                energy_tracking_started_at: start,
                onboarding_step: "energy_tracking",
              },
              { onConflict: "user_id" },
            );
        }

        const { data: logRows } = await supabase
          .from("energy_logs")
          .select("log_date, hour, energy_level, note")
          .eq("user_id", user.id)
          .order("log_date", { ascending: true });

        if (!active) return;
        setStartedAt(start);
        setLogs((logRows ?? []) as EnergyLog[]);

        const todayDay = Math.min(TOTAL_DAYS, Math.max(1, daysBetween(start) + 1));
        setSelectedDay(todayDay);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao carregar dados";
        setError(msg);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const dayDates = useMemo(() => {
    if (!startedAt) return [] as string[];
    const [y, m, d] = startedAt.split("-").map(Number);
    return Array.from({ length: TOTAL_DAYS }, (_, i) => {
      const dt = new Date(y, m - 1, d + i);
      return isoDate(dt);
    });
  }, [startedAt]);

  const logsByDate = useMemo(() => {
    const m: Record<string, EnergyLog[]> = {};
    logs.forEach((l) => {
      (m[l.log_date] ||= []).push(l);
    });
    return m;
  }, [logs]);

  // Load draft for selected day if not already saved
  useEffect(() => {
    const date = dayDates[selectedDay - 1];
    if (!date) return;
    const existing = logsByDate[date] ?? [];
    const next = emptyDraft();
    existing.forEach((l) => {
      if (next[l.hour]) next[l.hour] = { level: l.energy_level, note: l.note ?? "" };
    });
    setDraft(next);
    setExpandedNotes({});
  }, [selectedDay, dayDates, logsByDate]);

  const isDaySaved = (day: number) => {
    const date = dayDates[day - 1];
    return date ? (logsByDate[date]?.length ?? 0) > 0 : false;
  };

  const filledCount = HOURS.filter((h) => draft[h].level !== null).length;

  const handleSaveDay = async () => {
    if (!user || !startedAt) return;
    const date = dayDates[selectedDay - 1];
    if (!date) return;
    if (filledCount < MIN_LOGS_PER_DAY) {
      setError(`Registre pelo menos ${MIN_LOGS_PER_DAY} horários para salvar o dia.`);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      // Replace day's logs
      await supabase.from("energy_logs").delete().eq("user_id", user.id).eq("log_date", date);
      const rows = HOURS.filter((h) => draft[h].level !== null).map((h) => ({
        user_id: user.id,
        log_date: date,
        hour: h,
        energy_level: draft[h].level as number,
        note: draft[h].note?.trim() ? draft[h].note.trim() : null,
      }));
      const { error: insErr } = await supabase.from("energy_logs").insert(rows);
      if (insErr) throw insErr;

      // Refresh logs
      const { data: logRows } = await supabase
        .from("energy_logs")
        .select("log_date, hour, energy_level, note")
        .eq("user_id", user.id);
      setLogs((logRows ?? []) as EnergyLog[]);

      if (selectedDay >= TOTAL_DAYS) {
        await processResult((logRows ?? []) as EnergyLog[]);
      } else {
        setSelectedDay((d) => d + 1);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar o dia.");
    } finally {
      setSaving(false);
    }
  };

  const validDaysCount = (allLogs: EnergyLog[]) => {
    const map: Record<string, number> = {};
    allLogs.forEach((l) => (map[l.log_date] = (map[l.log_date] ?? 0) + 1));
    return Object.values(map).filter((c) => c >= MIN_LOGS_PER_DAY).length;
  };

  const processResult = async (allLogs: EnergyLog[]) => {
    if (!user) return;
    setStage("processing");
    await new Promise((r) => setTimeout(r, 2200));

    if (validDaysCount(allLogs) < MIN_VALID_DAYS) {
      setError(
        `São necessários pelo menos ${MIN_VALID_DAYS} dias válidos (cada um com ${MIN_LOGS_PER_DAY}+ registros) para gerar o resultado.`,
      );
      setStage("entry");
      return;
    }

    const validLogs = (() => {
      const map: Record<string, EnergyLog[]> = {};
      allLogs.forEach((l) => ((map[l.log_date] ||= []).push(l)));
      return Object.values(map)
        .filter((arr) => arr.length >= MIN_LOGS_PER_DAY)
        .flat();
    })();

    const r = analyzeEnergy(validLogs);
    setResult(r);

    await supabase
      .from("user_profiles")
      .upsert(
        {
          user_id: user.id,
          chronotype: r.chronotype,
          golden_hours_start: r.goldenHoursStart,
          golden_hours_end: r.goldenHoursEnd,
          energy_valley_start: r.valleyStart,
          energy_valley_end: r.valleyEnd,
          onboarding_step: "complete",
          onboarding_completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    setStage("result");
  };

  if (authLoading || loading) {
    return (
      <OnboardingShell step={2} totalSteps={2} label="Mapeamento de energia">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </OnboardingShell>
    );
  }

  if (stage === "processing") {
    return (
      <OnboardingShell step={2} totalSteps={2} label="Analisando">
        <div className="text-center">
          <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-primary" />
          <p className="font-display text-lg font-semibold text-primary">
            Analisando seus padrões de energia…
          </p>
        </div>
      </OnboardingShell>
    );
  }

  if (stage === "result" && result) {
    return <ResultView result={result} dayDates={dayDates} logsByDate={logsByDate} onGo={() => navigate({ to: "/dashboard" })} />;
  }

  // ENTRY
  const progressPct = Math.round((selectedDay / TOTAL_DAYS) * 100);
  const currentDate = dayDates[selectedDay - 1];

  return (
    <OnboardingShell step={2} totalSteps={2} label="Mapeamento de energia">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary">
          Mapeamento de Energia
        </h1>
        <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>Dia {selectedDay} de {TOTAL_DAYS}</span>
          {currentDate && <span>{formatDateBR(currentDate)}</span>}
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
        </div>

        <p className="mt-4 text-sm text-foreground/80">
          Registre seu nível de energia (1 a 5) nas horas em que esteve acordado. Mínimo de{" "}
          {MIN_LOGS_PER_DAY} registros por dia.
        </p>

        <div className="mt-6 divide-y divide-border rounded-lg border border-border">
          {HOURS.map((h) => (
            <div key={h} className="p-3">
              <div className="flex items-center gap-3">
                <span className="w-10 shrink-0 font-mono text-sm text-muted-foreground">
                  {String(h).padStart(2, "0")}h
                </span>
                <div className="flex flex-1 gap-1.5">
                  {[1, 2, 3, 4, 5].map((lvl) => {
                    const selected = draft[h].level === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() =>
                          setDraft((p) => ({
                            ...p,
                            [h]: { ...p[h], level: selected ? null : lvl },
                          }))
                        }
                        title={ENERGY_LABELS[lvl]}
                        className="flex-1 rounded-md border py-1.5 text-sm font-semibold transition-all"
                        style={{
                          background: selected ? ENERGY_COLORS[lvl] : "transparent",
                          borderColor: selected ? ENERGY_COLORS[lvl] : "var(--border)",
                          color: selected ? "#1a1a1a" : "var(--muted-foreground)",
                        }}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedNotes((p) => ({ ...p, [h]: !p[h] }))}
                  className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary"
                  aria-label="Adicionar observação"
                >
                  📝
                </button>
              </div>
              {expandedNotes[h] && (
                <input
                  value={draft[h].note}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, [h]: { ...p[h], note: e.target.value } }))
                  }
                  maxLength={200}
                  placeholder="Observação opcional"
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {filledCount} de 18 horários preenchidos
          </span>
          <button
            type="button"
            disabled={saving || filledCount < MIN_LOGS_PER_DAY}
            onClick={handleSaveDay}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Salvando…"
              : selectedDay >= TOTAL_DAYS
                ? "Salvar dia 7 e analisar"
                : `Salvar dia ${selectedDay}`}
          </button>
        </div>

        {/* Histórico */}
        <div className="mt-8">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Histórico
          </h2>
          <div className="mt-2 space-y-2">
            {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((dayN) => {
              const date = dayDates[dayN - 1];
              const dayLogs = (date && logsByDate[date]) || [];
              const saved = dayLogs.length > 0;
              const avg =
                dayLogs.length > 0
                  ? (
                      dayLogs.reduce((s, l) => s + l.energy_level, 0) / dayLogs.length
                    ).toFixed(1)
                  : "—";
              const isCurrent = dayN === selectedDay;
              return (
                <div key={dayN} className="rounded-md border border-border">
                  <button
                    type="button"
                    onClick={() => {
                      if (saved) {
                        setExpandedHistory((p) => ({ ...p, [dayN]: !p[dayN] }));
                      }
                      setSelectedDay(dayN);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                  >
                    <span className={isCurrent ? "font-semibold text-primary" : ""}>
                      Dia {dayN} {date && `— ${formatDateBR(date)}`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {saved
                        ? `${dayLogs.length} registros — média ${avg}`
                        : isCurrent
                          ? "em preenchimento"
                          : "pendente"}
                    </span>
                  </button>
                  {saved && expandedHistory[dayN] && (
                    <div className="border-t border-border p-3">
                      <DayHeatmap logs={dayLogs} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

function DayHeatmap({ logs }: { logs: EnergyLog[] }) {
  const byHour: Record<number, number | null> = {};
  HOURS.forEach((h) => (byHour[h] = null));
  logs.forEach((l) => (byHour[l.hour] = l.energy_level));
  return (
    <div className="flex gap-1">
      {HOURS.map((h) => {
        const v = byHour[h];
        return (
          <div key={h} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="h-6 w-full rounded-sm border border-border"
              style={{ background: v ? ENERGY_COLORS[v] : "#f1f5f9" }}
            />
            <span className="text-[10px] text-muted-foreground">{h}</span>
          </div>
        );
      })}
    </div>
  );
}

function ResultView({
  result,
  dayDates,
  logsByDate,
  onGo,
}: {
  result: AnalysisResult;
  dayDates: string[];
  logsByDate: Record<string, EnergyLog[]>;
  onGo: () => void;
}) {
  const goldenLabel =
    result.goldenHoursStart !== null && result.goldenHoursEnd !== null
      ? `${formatHour(result.goldenHoursStart)} — ${formatHour(result.goldenHoursEnd)}`
      : "Não identificadas";
  const valleyLabel =
    result.valleyStart !== null && result.valleyEnd !== null
      ? `${formatHour(result.valleyStart)} — ${formatHour(result.valleyEnd)}`
      : "Não identificado";

  return (
    <OnboardingShell step={2} totalSteps={2} label="Resultado do mapeamento">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary">
          Seus padrões de energia
        </h1>

        {/* Heatmap semanal */}
        <div className="mt-6 overflow-x-auto rounded-lg border border-border p-3">
          <div className="min-w-[480px]">
            <div className="grid" style={{ gridTemplateColumns: `40px repeat(${dayDates.length}, 1fr)` }}>
              <div />
              {dayDates.map((_, i) => (
                <div key={i} className="text-center text-[10px] text-muted-foreground">
                  D{i + 1}
                </div>
              ))}
              {HOURS.map((h) => (
                <FragRow key={h} hour={h} dayDates={dayDates} logsByDate={logsByDate} />
              ))}
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">⏰ Suas Horas de Ouro</div>
            <div className="mt-2 font-display text-xl font-bold text-primary">{goldenLabel}</div>
            <p className="mt-2 text-sm text-foreground/80">
              Este é seu pico de capacidade cognitiva. O app vai reservar este período para suas
              sessões de Deep Work.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Seu Cronótipo</div>
            <div className="mt-2 font-display text-xl font-bold text-primary">
              {result.chronotype ? CHRONOTYPE_LABEL[result.chronotype] : "Indefinido"}
            </div>
            <p className="mt-2 text-sm text-foreground/80">
              {result.chronotype ? CHRONOTYPE_DESC[result.chronotype] : "Dados insuficientes para classificação."}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Vale Energético</div>
            <div className="mt-2 font-display text-xl font-bold text-primary">{valleyLabel}</div>
            <p className="mt-2 text-sm text-foreground/80">
              Reserve este período para tarefas administrativas, e-mails e reuniões.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onGo}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Acessar o Academia OS
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
}

function FragRow({
  hour,
  dayDates,
  logsByDate,
}: {
  hour: number;
  dayDates: string[];
  logsByDate: Record<string, EnergyLog[]>;
}) {
  return (
    <>
      <div className="pr-2 text-right text-[10px] text-muted-foreground">{hour}h</div>
      {dayDates.map((date) => {
        const log = (logsByDate[date] ?? []).find((l) => l.hour === hour);
        const bg = log ? ENERGY_COLORS[log.energy_level] : "#f1f5f9";
        return <div key={date} className="m-[1px] h-5 rounded-sm" style={{ background: bg }} />;
      })}
    </>
  );
}