import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Visão geral do seu progresso. Conteúdo será adicionado nos próximos passos.
      </p>
    </div>
  );
}