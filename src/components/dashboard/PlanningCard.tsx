import { useMemo } from "react";
import { formatCurrency } from "@/lib/currency";
import { Progress } from "@/components/ui/progress";
import { Wallet, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface PlanningCardProps {
  usuarioId: number | null;
  moeda: string;
  transactions: any[];
}

export function PlanningCard({ usuarioId, moeda, transactions }: PlanningCardProps) {
  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["planning", usuarioId],
    queryFn: async () => {
      if (!usuarioId) return [];
      const { data, error } = await supabase
        .from("Planejamento")
        .select("*")
        .eq("id_usuario", usuarioId)
        .eq("Visivel", true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!usuarioId,
  });

  const planningItems = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const spendingByCategory: Record<string, number> = {};
    
    transactions.forEach(tx => {
      const rawTipo = (tx.tipo || "").toLowerCase();
      const normalizedTipo = rawTipo.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      if (normalizedTipo === "saida") {
        const cat = tx.categoria || "Outros";
        if (tx.data_inicio) {
          const [year, month] = tx.data_inicio.split('-').map(Number);
          if (month - 1 === currentMonth && year === currentYear) {
            const val = parseFloat(tx.valor || "0");
            spendingByCategory[cat] = (spendingByCategory[cat] || 0) + val;
          }
        }
      }
    });

    return budgets.map(item => {
      const name = item.Categoria || "Sem nome";
      const planned = parseFloat(item.Valor || "0");
      const spent = spendingByCategory[name] || 0;
      const remaining = planned - spent;
      const percentage = planned > 0 ? (spent / planned) * 100 : (spent > 0 ? 150 : 0);
      
      return {
        id: item.id,
        name,
        planned,
        spent,
        remaining,
        percentage,
        isOver: remaining < 0
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [budgets, transactions]);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] animate-pulse h-full">
        <div className="h-6 w-32 bg-slate-100 rounded mb-6"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="mb-6">
            <div className="flex justify-between mb-2">
              <div className="h-4 w-20 bg-slate-100 rounded"></div>
              <div className="h-4 w-12 bg-slate-100 rounded"></div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold tracking-tight text-slate-900">Planejamento do Mês</h3>
      </div>

      <div className="space-y-8 overflow-y-auto max-h-[420px] pr-1 custom-scrollbar flex-1">
        {planningItems.length === 0 ? (
          <div className="py-8 text-center">
            <div className="size-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <Wallet className="size-6 text-slate-300" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhum planejamento ativo.</p>
          </div>
        ) : (
          planningItems.map((item) => (
            <div key={item.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">{item.name}</span>
                <span className="text-sm font-bold text-slate-900">
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
              
              <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(item.percentage, 100)}%`,
                    backgroundColor: item.isOver ? "#F43F5E" : "oklch(0.62 0.18 290)"
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
