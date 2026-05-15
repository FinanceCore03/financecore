import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Filters } from "@/components/dashboard/Filters";
import { StatCards } from "@/components/dashboard/StatCards";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { TopExpenses } from "@/components/dashboard/TopExpenses";
import { Transactions } from "@/components/dashboard/Transactions";
import { CategoryBars } from "@/components/dashboard/CategoryBars";
import { DistributionDonut } from "@/components/dashboard/DistributionDonut";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Financeiro Core — Dashboard pessoal" },
      { name: "description", content: "Dashboard financeiro pessoal moderno com visão geral de saldo, gastos e categorias." },
    ],
  }),
  component: () => <Dashboard />,
});

function Dashboard() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 px-8 py-6 space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
              <p className="text-sm text-muted-foreground mt-1">Resumo financeiro do seu mês</p>
            </div>
            <Filters />
          </header>

          <StatCards />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2"><SpendingChart /></div>
            <div><TopExpenses /></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Transactions />
            <CategoryBars />
            <DistributionDonut />
          </div>

          <footer className="text-center text-xs text-muted-foreground pt-4 pb-2">
            Financeiro Core © 2025
          </footer>
        </main>
      </div>
    </div>
  );
}
