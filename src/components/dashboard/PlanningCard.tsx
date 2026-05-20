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
    <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold tracking-tight">Planejamento do Mês</h3>
        <span className="text-[11px] font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase tracking-wider">
          Ativo
        </span>
      </div>

      <div className="space-y-6 overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
        {planningItems.length === 0 ? (
          <div className="py-8 text-center">
            <div className="size-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <Wallet className="size-6 text-slate-300" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhum planejamento ativo.</p>
          </div>
        ) : (
          planningItems.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">{item.name}</span>
                  {item.isOver && <AlertTriangle className="size-3.5 text-rose-500" />}
                </div>
                <span className={`text-xs font-bold ${item.isOver ? 'text-rose-600' : 'text-slate-500'}`}>
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
              
              <Progress 
                value={Math.min(item.percentage, 100)} 
                className="h-1.5 rounded-full bg-slate-100"
                style={{ 
                  "--progress-background": item.isOver ? "#F43F5E" : "oklch(0.62 0.18 290)" 
                } as React.CSSProperties}
              />

              <div className="flex justify-between text-[11px] font-medium pt-1">
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase tracking-tighter">Gasto</span>
                  <span className="text-slate-700 font-bold">{formatCurrency(item.spent, moeda)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-muted-foreground uppercase tracking-tighter">
                    {item.isOver ? "Excedido" : "Restante"}
                  </span>
                  <span className={`font-bold ${item.isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCurrency(Math.abs(item.remaining), moeda)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-auto pt-6 border-t border-border mt-6">
        <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <TrendingUp className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Planejado</p>
              <p className="text-sm font-bold text-slate-900">
                {formatCurrency(planningItems.reduce((acc, curr) => acc + curr.planned, 0), moeda)}
              </p>
            </div>
          </div>
          <button className="text-[11px] font-bold text-primary hover:underline">Detalhes</button>
        </div>
      </div>
    </div>
  );
}
