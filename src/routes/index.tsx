import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Filters } from "@/components/dashboard/Filters";
import { StatCards } from "@/components/dashboard/StatCards";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { TopExpenses } from "@/components/dashboard/TopExpenses";
import { PlanningCard } from "@/components/dashboard/PlanningCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { MonthlyAlerts } from "@/components/dashboard/MonthlyAlerts";
import { UpcomingCommitments } from "@/components/dashboard/UpcomingCommitments";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTransition, AnimatedItem } from "@/components/PageTransition";

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
  const { 
    transactions, 
    loading, 
    stats, 
    chartData, 
    categoriesData,
    usuarioId,
    moeda,
    subscriptions
  } = useDashboardData();

  const { data: planning = [] } = useQuery({
    queryKey: ["planning", usuarioId],
    queryFn: async () => {
      if (!usuarioId) return [];
      const { data, error } = await supabase
        .from("Planejamento")
        .select("*")
        .eq("id_usuario", usuarioId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!usuarioId,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <main className="flex-1 px-8 py-8 space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-32 rounded-xl" />
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <Skeleton className="xl:col-span-2 h-[350px] rounded-2xl" />
              <Skeleton className="h-[350px] rounded-2xl" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <PageTransition>
          <main className="flex-1 px-8 py-8 space-y-6">
            <AnimatedItem>
              <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
                  <p className="text-sm text-muted-foreground mt-1">Resumo financeiro do seu mês</p>
                </div>
                {/* Filters removed as per user request */}
              </header>
            </AnimatedItem>

            <AnimatedItem>
              <StatCards stats={stats} moeda={moeda} />
            </AnimatedItem>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <AnimatedItem className="xl:col-span-2">
                <SpendingChart data={chartData} moeda={moeda} transactions={transactions} />
              </AnimatedItem>
              <AnimatedItem>
                <TopExpenses categories={categoriesData.list} moeda={moeda} />
              </AnimatedItem>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <AnimatedItem>
                <PlanningCard usuarioId={usuarioId} moeda={moeda} transactions={transactions} subscriptions={subscriptions} />
              </AnimatedItem>
              <AnimatedItem>
                <MonthlyAlerts 
                  transactions={transactions} 
                  subscriptions={subscriptions} 
                  planning={planning} 
                  stats={stats} 
                  moeda={moeda} 
                />
              </AnimatedItem>
              <AnimatedItem>
                <UpcomingCommitments 
                  transactions={transactions} 
                  subscriptions={subscriptions} 
                  moeda={moeda} 
                />
              </AnimatedItem>
            </div>

            <AnimatedItem>
              <footer className="text-center text-xs text-muted-foreground pt-4 pb-2">
                Financeiro Core © 2025
              </footer>
            </AnimatedItem>
          </main>
        </PageTransition>
      </div>
    </div>
  );
}