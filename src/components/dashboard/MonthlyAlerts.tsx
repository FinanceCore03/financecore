import React, { useState } from "react";
import { AlertCircle, AlertTriangle, Clock, ChevronRight, Info } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";

interface Alert {
  type: 'danger' | 'warning' | 'info';
  message: string;
  priority: number;
}

interface MonthlyAlertsProps {
  transactions: any[];
  subscriptions: any[];
  planning: any[];
  stats: any;
  moeda: string;
}

export function MonthlyAlerts({ transactions, subscriptions, planning, stats, moeda }: MonthlyAlertsProps) {
  const [showAll, setShowAll] = useState(false);

  const alerts = React.useMemo(() => {
    const list: Alert[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Gasto total acima de 70% das entradas
    if (stats.monthIncome > 0) {
      const percentageUsed = (stats.monthExpenses / stats.monthIncome) * 100;
      if (percentageUsed >= 70) {
        list.push({
          type: 'danger',
          message: `Você já gastou ${percentageUsed.toFixed(0)}% das entradas deste mês.`,
          priority: 1
        });
      }
    }

    // 2. Fatura do próximo mês alta (>= 50% das entradas)
    // Fatura calculation logic similar to InvoiceCard + Subscriptions
    const nextMonth = new Date(currentYear, currentMonth + 1, 1);
    const endOfNextMonth = new Date(currentYear, currentMonth + 2, 0);
    
    const nextMonthTransactions = transactions.reduce((acc, tx) => {
      if (tx.tipo !== "saida") return acc;
      const start = tx.data_inicio ? new Date(tx.data_inicio) : null;
      const end = tx.data_fim ? new Date(tx.data_fim) : null;
      if (!start) return acc;
      const isActiveNextMonth = start <= endOfNextMonth && (!end || end >= nextMonth);
      return isActiveNextMonth ? acc + parseFloat(tx.valor || "0") : acc;
    }, 0);

    const activeSubscriptions = subscriptions.filter(sub => sub.status !== false);
    const nextMonthSubs = activeSubscriptions.reduce((acc, sub) => acc + parseFloat(sub.valor || "0"), 0);
    const faturaProximoMes = nextMonthTransactions + nextMonthSubs;

    let incomeForComparison = stats.monthIncome;
    if (incomeForComparison === 0) {
      // Logic for 3 months average omitted for simplicity if stats doesn't have it, 
      // but let's try to use what we have in stats (prevMonthIncome) or just monthIncome
      incomeForComparison = stats.prevMonthIncome;
    }

    if (incomeForComparison > 0) {
      const faturaPct = (faturaProximoMes / incomeForComparison) * 100;
      if (faturaPct >= 50) {
        list.push({
          type: 'warning',
          message: `Sua fatura do próximo mês já representa ${faturaPct.toFixed(0)}% das entradas deste mês.`,
          priority: 2
        });
      }
    }

    // 3 & 4. Category limit alerts
    const spendingByCategory: Record<string, number> = {};
    transactions.forEach(tx => {
      if (tx.tipo === "saida" && tx.data_inicio) {
        const [y, m] = tx.data_inicio.split('-').map(Number);
        if (m - 1 === currentMonth && y === currentYear) {
          const cat = tx.categoria || "Outros";
          spendingByCategory[cat] = (spendingByCategory[cat] || 0) + parseFloat(tx.valor || "0");
        }
      }
    });

    planning.filter(p => p.Visivel).forEach(plan => {
      const name = plan.Categoria;
      const meta = parseFloat(plan.Valor || "0");
      if (meta <= 0) return;
      
      const gasto = spendingByCategory[name] || 0;
      const excedido = gasto - meta;
      
      if (excedido > 0) {
        list.push({
          type: 'danger',
          message: `${name} ultrapassou a meta em ${formatCurrency(excedido, moeda)}.`,
          priority: 3
        });
      } else {
        const pct = (gasto / meta) * 100;
        if (pct >= 80) {
          list.push({
            type: 'warning',
            message: `${name} já usou ${pct.toFixed(0)}% da meta.`,
            priority: 4
          });
        }
      }
    });

    // 5. Subscription next 7 days
    activeSubscriptions.forEach(sub => {
      const diaCobranca = parseInt(sub.dia_cobranca);
      if (isNaN(diaCobranca)) return;
      
      let cobrancaDate = new Date(currentYear, currentMonth, diaCobranca);
      // If it already passed this month, check next month
      if (cobrancaDate < now && now.getDate() > diaCobranca) {
        cobrancaDate = new Date(currentYear, currentMonth + 1, diaCobranca);
      }
      
      const diffTime = cobrancaDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= 7) {
        list.push({
          type: 'info',
          message: `${sub.nome || 'Assinatura'} será cobrada em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}.`,
          priority: 5
        });
      }
    });

    return list.sort((a, b) => a.priority - b.priority);
  }, [transactions, subscriptions, planning, stats, moeda]);

  const displayedAlerts = showAll ? alerts : alerts.slice(0, 6);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold tracking-tight text-slate-900">Alertas do Mês</h3>
        <AlertCircle className="size-5 text-muted-foreground" />
      </div>

      <div className="space-y-4 flex-1">
        {alerts.length === 0 ? (
          <div className="py-8 text-center">
            <div className="size-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <Info className="size-6 text-slate-300" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhum alerta importante no momento.</p>
          </div>
        ) : (
          displayedAlerts.map((alert, idx) => (
            <div key={idx} className="flex gap-3 items-start p-3 rounded-xl bg-slate-50/50 border border-slate-100 transition-colors">
              <div className={`mt-0.5 shrink-0 p-1.5 rounded-lg ${
                alert.type === 'danger' ? 'bg-rose-50 text-rose-500' :
                alert.type === 'warning' ? 'bg-amber-50 text-amber-500' :
                'bg-blue-50 text-blue-500'
              }`}>
                {alert.type === 'danger' ? <AlertTriangle className="size-4" /> : 
                 alert.type === 'warning' ? <AlertTriangle className="size-4" /> : 
                 <Clock className="size-4" />}
              </div>
              <p className="text-sm font-medium text-slate-700 leading-snug">{alert.message}</p>
            </div>
          ))
        )}
      </div>

      {alerts.length > 6 && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-4 text-xs font-bold text-primary hover:bg-primary/5 mx-auto"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Ver menos" : "Ver mais"}
          <ChevronRight className={`size-3 ml-1 transition-transform ${showAll ? 'rotate-90' : ''}`} />
        </Button>
      )}
    </div>
  );
}