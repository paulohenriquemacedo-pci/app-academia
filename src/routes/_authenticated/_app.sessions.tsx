import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/sessions")({
  component: SessionsPage,
});

function SessionsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Sessões</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Registro de sessões de trabalho. Conteúdo será adicionado nos próximos passos.
      </p>
    </div>
  );
}