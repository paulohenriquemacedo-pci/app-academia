export type ProfileKey =
  | "perfeccionista_paralisado"
  | "multitarefa_caotico"
  | "procrastinador_criativo"
  | "analista_perpetuo"
  | "dependente_motivacao"
  | "sobrecarregado_sistemico";

export type Section = {
  key: ProfileKey;
  statements: string[];
};

export const SECTIONS: Section[] = [
  {
    key: "perfeccionista_paralisado",
    statements: [
      "Passo muito tempo refinando frases e parágrafos antes de prosseguir",
      'Tenho dificuldade para considerar meus trabalhos "prontos"',
      "Prefiro não mostrar trabalhos em andamento para evitar críticas",
      "Frequentemente reescrevo seções inteiras múltiplas vezes",
      "Sinto ansiedade física quando pressionado por prazos",
      "Evito feedback porque tenho medo de descobrir problemas",
      'Abandono projetos quando percebo que não estão "perfeitos"',
      "Prefiro trabalhar sozinho para manter controle total sobre a qualidade",
    ],
  },
  {
    key: "multitarefa_caotico",
    statements: [
      "Mantenho múltiplas abas abertas e salto entre elas constantemente",
      "Inicio novos projetos antes de finalizar os anteriores",
      "Minha mesa/área de trabalho está sempre desorganizada",
      "Tenho dificuldade para trabalhar em uma coisa por mais de 1 hora",
      "Aceito facilmente novos compromissos e oportunidades",
      "Sinto-me sempre ocupado, mas com pouco progresso real",
      "Uso tarefas secundárias para evitar trabalho difícil",
      "Tenho muitos projetos 80% prontos e poucos 100% finalizados",
    ],
  },
  {
    key: "procrastinador_criativo",
    statements: [
      "Acredito genuinamente que trabalho melhor sob pressão",
      "Deixo tarefas importantes para a última hora intencionalmente",
      "Tenho explosões intensas de produtividade seguidas de períodos inativos",
      'Evito começar projetos "muito cedo" para não perder inspiração',
      "Uso adrenalina de prazos apertados como combustível criativo",
      'Racionalizo a procrastinação como "tempo de incubação"',
      "Vivo em constante stress, mas produzo trabalhos de qualidade",
      "Considero sistemas de organização limitantes da criatividade",
    ],
  },
  {
    key: "analista_perpetuo",
    statements: [
      "Pesquiso excessivamente antes de começar qualquer projeto",
      'Sempre sinto que preciso "ler mais um artigo" antes de escrever',
      'Tenho centenas de PDFs salvos "para ler depois"',
      "Passo mais tempo coletando informações que produzindo conteúdo",
      "Mudo frequentemente o foco ao descobrir novos aspectos",
      "Tenho dificuldade para delimitar o escopo de projetos",
      "Evito tomar posições definidas por medo de estar mal informado",
      "Confundo preparação extensiva com progresso real",
    ],
  },
  {
    key: "dependente_motivacao",
    statements: [
      "Minha produtividade varia drasticamente baseada no humor do dia",
      "Preciso me sentir inspirado para trabalhar efetivamente",
      "Abandono projetos facilmente quando perdo o entusiasmo inicial",
      "Busco constantemente estímulos externos para me motivar",
      'Tenho dificuldade extrema para trabalhar em tarefas "chatas"',
      "Espero me sentir motivado antes de começar",
      'Paro completamente em partes "desinteressantes" dos projetos',
      "Busco constantemente novos métodos e ferramentas",
    ],
  },
  {
    key: "sobrecarregado_sistemico",
    statements: [
      "Raramente tenho blocos de 3+ horas livres para trabalho focado",
      "Sinto culpa ao recusar pedidos de colegas ou orientadores",
      "Minha agenda está lotada, mas progrido pouco nos projetos principais",
      'Trabalho fins de semana para "compensar" tempo perdido',
      "Sinto que todos dependem de mim para múltiplas questões",
      "Uso compromissos externos para evitar trabalho individual difícil",
      "Vivo em constante sensação de urgência e falta de tempo",
      "Trabalho muitas horas, mas com resultados desproporcionalmente baixos",
    ],
  },
];

export const SCORE_LABELS: { value: number; full: string; short: string }[] = [
  { value: 0, full: "Nunca", short: "N" },
  { value: 1, full: "Raramente", short: "R" },
  { value: 2, full: "Às vezes", short: "Às" },
  { value: 3, full: "Frequentemente", short: "Fr" },
  { value: 4, full: "Sempre", short: "S" },
];

export type Intensity = "muito_forte" | "forte" | "moderado" | "leve" | "ausente";

export function intensityFor(score: number): Intensity {
  if (score >= 25) return "muito_forte";
  if (score >= 20) return "forte";
  if (score >= 15) return "moderado";
  if (score >= 10) return "leve";
  return "ausente";
}

export const INTENSITY_LABEL: Record<Intensity, string> = {
  muito_forte: "Muito forte",
  forte: "Forte",
  moderado: "Moderado",
  leve: "Leve",
  ausente: "Ausente",
};

export const PROFILE_LABEL: Record<ProfileKey, string> = {
  perfeccionista_paralisado: "Perfeccionista Paralisado",
  multitarefa_caotico: "Multitarefa Caótico",
  procrastinador_criativo: "Procrastinador Criativo",
  analista_perpetuo: "Analista Perpétuo",
  dependente_motivacao: "Dependente de Motivação",
  sobrecarregado_sistemico: "Sobrecarregado Sistêmico",
};

export const PROFILE_SHORT_LABEL: Record<ProfileKey, string> = {
  perfeccionista_paralisado: "Perfeccionista",
  multitarefa_caotico: "Multitarefa",
  procrastinador_criativo: "Procrastinador",
  analista_perpetuo: "Analista",
  dependente_motivacao: "Dependente",
  sobrecarregado_sistemico: "Sobrecarregado",
};

export const PROFILE_META: Record<
  ProfileKey,
  { description: string; protocol: string }
> = {
  perfeccionista_paralisado: {
    description:
      "Você refina mais do que produz. O loop de revisão está substituindo o avanço real.",
    protocol:
      "O app vai priorizar registro de output bruto e separação rígida entre fases de escrita e revisão.",
  },
  multitarefa_caotico: {
    description:
      "Você começa muito e conclui pouco. Movimento está sendo confundido com progresso.",
    protocol:
      "O app vai implementar o CEO da Semana — um projeto prioritário por vez, com foco monitorado.",
  },
  procrastinador_criativo: {
    description:
      "Você opera em ciclos de adrenalina. O padrão é insustentável em projetos de 2 a 6 anos.",
    protocol:
      "O app vai estruturar Sprints Acadêmicos com mini-deadlines que simulam urgência de forma controlada.",
  },
  analista_perpetuo: {
    description:
      "Você pesquisa como proteção contra o julgamento. A coleta infinita está substituindo a escrita.",
    protocol:
      "O app vai aplicar a Regra dos 3 Artigos e monitorar a proporção leitura/escrita nas sessões.",
  },
  dependente_motivacao: {
    description:
      "Sua produtividade está atrelada ao estado emocional do dia. Sistema substitui motivação.",
    protocol:
      "O app vai criar rituais fixos e blocos de trabalho independentes de como você está se sentindo.",
  },
  sobrecarregado_sistemico: {
    description:
      "Sua agenda pertence aos outros. As Horas de Ouro estão sendo consumidas por urgências externas.",
    protocol:
      "O app vai proteger blocos de trabalho focado e tornar visível o custo do que você aceita.",
  },
};

export type SectionScores = Record<ProfileKey, number>;

export function computeResult(scores: SectionScores) {
  const entries = (Object.keys(scores) as ProfileKey[])
    .map((k) => ({ key: k, score: scores[k] }))
    .sort((a, b) => b.score - a.score);
  const dominant = entries[0];
  const second = entries[1];
  const secondary = second && second.score > 20 ? second : null;
  return {
    dominant: { key: dominant.key, score: dominant.score, intensity: intensityFor(dominant.score) },
    secondary: secondary
      ? { key: secondary.key, score: secondary.score, intensity: intensityFor(secondary.score) }
      : null,
  };
}