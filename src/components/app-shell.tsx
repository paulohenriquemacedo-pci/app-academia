import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, FolderKanban, Timer, CalendarRange, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/project", label: "Meu Projeto", icon: FolderKanban },
  { to: "/sessions", label: "Sessões", icon: Timer },
  { to: "/weekly", label: "Semanal", icon: CalendarRange },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email ??
    "";

  return (
    <div className="min-h-screen bg-secondary">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-6 py-6">
          <Link to="/dashboard" className="font-display text-xl font-extrabold tracking-tight">
            Academia OS
          </Link>
        </div>
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {nav.map((item) => {
              const active = path === item.to || path.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="md:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
          <div className="font-display text-base font-bold tracking-tight md:hidden">Academia OS</div>
          <div className="hidden md:block" />
          <div className="text-sm text-muted-foreground truncate max-w-[60%] text-right">
            {displayName}
          </div>
        </header>

        <main className="px-4 pb-24 pt-6 md:px-8 md:pb-10">{children}</main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background md:hidden">
        <ul className="grid grid-cols-4">
          {nav.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}