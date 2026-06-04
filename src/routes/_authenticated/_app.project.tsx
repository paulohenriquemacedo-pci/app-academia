import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/project")({
  component: ProjectPage,
});

function ProjectPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Meu Projeto</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Gestão do seu projeto de pesquisa. Conteúdo será adicionado nos próximos passos.
      </p>
    </div>
  );
}