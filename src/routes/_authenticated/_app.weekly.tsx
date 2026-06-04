import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/weekly")({
  component: WeeklyPage,
});

function WeeklyPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Semanal</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dashboard semanal. Conteúdo será adicionado nos próximos passos.
      </p>
    </div>
  );
}