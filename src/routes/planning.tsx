import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Target } from "lucide-react";

export const Route = createFileRoute("/planning")({
  head: () => ({
    meta: [
      { title: "Planejamento — Financeiro Core" },
    ],
  }),
  component: () => <PlanningPage />,
});

function PlanningPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 px-8 py-6 space-y-6">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">Planejamento</h1>
            <p className="text-sm text-muted-foreground mt-1">Defina suas metas e planeje seu futuro financeiro.</p>
          </header>

          <div className="bg-white border-none shadow-sm rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Target className="size-8" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Em Breve</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Estamos trabalhando para trazer as melhores ferramentas de planejamento para você. Fique ligado!
              </p>
            </div>
          </div>

          <footer className="text-center text-xs text-muted-foreground pt-4 pb-2">
            Financeiro Core © 2025
          </footer>
        </main>
      </div>
    </div>
  );
}
