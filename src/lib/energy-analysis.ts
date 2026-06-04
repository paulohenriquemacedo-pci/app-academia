export const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6..23

export const ENERGY_COLORS: Record<number, string> = {
  1: "#fca5a5", // vermelho suave
  2: "#fdba74", // laranja
  3: "#fde047", // amarelo
  4: "#86efac", // verde claro
  5: "#16a34a", // verde escuro
};

export const ENERGY_LABELS: Record<number, string> = {
  1: "Energia mínima — incapaz de trabalho produtivo",
  2: "Energia baixa — apenas tarefas administrativas simples",
  3: "Energia moderada — adequada para revisões e tarefas médias",
  4: "Energia alta — bom para escrita e análise",
  5: "Energia máxima — capaz de trabalho cognitivo complexo",
};

export type EnergyLog = {
  log_date: string; // YYYY-MM-DD
  hour: number;
  energy_level: number;
  note?: string | null;
};

export type Chronotype =
  | "matutino_extremo"
  | "matutino_moderado"
  | "vespertino"
  | "noturno";

export const CHRONOTYPE_LABEL: Record<Chronotype, string> = {
  matutino_extremo: "Matutino Extremo",
  matutino_moderado: "Matutino Moderado",
  vespertino: "Vespertino",
  noturno: "Noturno",
};

export const CHRONOTYPE_DESC: Record<Chronotype, string> = {
  matutino_extremo:
    "Pico cognitivo muito cedo. Proteja a primeira metade da manhã para Deep Work.",
  matutino_moderado:
    "Pico cognitivo nas primeiras horas após acordar. Concentre o trabalho profundo pela manhã.",
  vespertino:
    "Pico cognitivo no início da tarde. Reserve a tarde para escrita e análise.",
  noturno:
    "Pico cognitivo no final do dia. Proteja a noite para trabalho profundo.",
};

export type AnalysisResult = {
  hourlyAverages: Record<number, number | null>;
  goldenHoursStart: number | null;
  goldenHoursEnd: number | null;
  valleyStart: number | null;
  valleyEnd: number | null;
  chronotype: Chronotype | null;
};

function longestRun(hours: number[], predicate: (h: number) => boolean): [number, number] | null {
  let best: [number, number] | null = null;
  let curStart: number | null = null;
  for (const h of hours) {
    if (predicate(h)) {
      if (curStart === null) curStart = h;
      const len = h - curStart + 1;
      const bestLen = best ? best[1] - best[0] + 1 : 0;
      if (len > bestLen) best = [curStart, h];
    } else {
      curStart = null;
    }
  }
  return best;
}

export function analyzeEnergy(logs: EnergyLog[]): AnalysisResult {
  const byHour: Record<number, number[]> = {};
  HOURS.forEach((h) => (byHour[h] = []));
  for (const l of logs) {
    if (byHour[l.hour]) byHour[l.hour].push(l.energy_level);
  }
  const hourlyAverages: Record<number, number | null> = {};
  HOURS.forEach((h) => {
    const arr = byHour[h];
    hourlyAverages[h] = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  });

  const golden = longestRun(HOURS, (h) => {
    const v = hourlyAverages[h];
    return v !== null && v >= 4.0;
  });
  const goldenValid = golden && golden[1] - golden[0] + 1 >= 2 ? golden : null;

  const valley = longestRun(HOURS, (h) => {
    const v = hourlyAverages[h];
    return v !== null && v <= 2.0;
  });

  let chronotype: Chronotype | null = null;
  if (goldenValid) {
    const mid = (goldenValid[0] + goldenValid[1]) / 2;
    if (mid >= 6 && mid <= 10) chronotype = "matutino_extremo";
    else if (mid > 10 && mid <= 12) chronotype = "matutino_moderado";
    else if (mid > 12 && mid <= 18) chronotype = "vespertino";
    else chronotype = "noturno";
  }

  return {
    hourlyAverages,
    goldenHoursStart: goldenValid ? goldenValid[0] : null,
    goldenHoursEnd: goldenValid ? goldenValid[1] + 1 : null, // exclusive end (block end)
    valleyStart: valley ? valley[0] : null,
    valleyEnd: valley ? valley[1] + 1 : null,
    chronotype,
  };
}

export function formatHour(h: number | null): string {
  if (h === null) return "—";
  return `${String(h).padStart(2, "0")}h00`;
}

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysBetween(startISO: string, today: Date = new Date()): number {
  const [y, m, d] = startISO.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const diff = Math.floor(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      start.getTime()) /
      (1000 * 60 * 60 * 24),
  );
  return diff;
}