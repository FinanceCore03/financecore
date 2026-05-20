import { Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface InvoiceCardProps {
  transactions: any[];
  subscriptions?: any[];
  moeda: string;
}

export function InvoiceCard({ transactions, subscriptions = [], moeda }: InvoiceCardProps) {
  // Logic to calculate next month's scheduled value
  const nextMonthTotal = (() => {
    const now = new Date();
    // Start of next month
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    // End of next month
    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    const txTotal = transactions.reduce((acc, tx) => {
      if (tx.tipo !== "saida") return acc;
      
      const start = tx.data_inicio ? new Date(tx.data_inicio) : null;
      const end = tx.data_fim ? new Date(tx.data_fim) : null;
      
      if (!start) return acc;

      // Rules: Credit, Installment, transactions with start and end dates, or those reaching next month
      // Normalize method check
      const metodo = (tx.metodo_pagamento || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const isCredito = metodo.includes("credito");

      const isActiveNextMonth = start <= endOfNextMonth && (!end || end >= nextMonth);
      const isCurrentMonthCredito = isCredito && start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();

      if (isActiveNextMonth || isCurrentMonthCredito) {
        return acc + parseFloat(tx.valor || "0");
      }
      
      return acc;
    }, 0);

    const activeSubs = subscriptions.filter(sub => sub.status !== false);
    const subsTotal = activeSubs.reduce((acc, sub) => acc + parseFloat(sub.valor || "0"), 0);

    return txTotal + subsTotal;
  })();

  const scheduledCount = transactions.filter(tx => {
    if (tx.tipo !== "saida") return false;
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const start = tx.data_inicio ? new Date(tx.data_inicio) : null;
    const end = tx.data_fim ? new Date(tx.data_fim) : null;

    const metodo = (tx.metodo_pagamento || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isCredito = metodo.includes("credito");

    return (start && start <= endOfNextMonth && (!end || end >= nextMonth)) || (isCredito && start && start.getMonth() === now.getMonth());
  }).length + subscriptions.filter(sub => sub.status !== false).length;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="size-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-4">
        <Calendar className="size-5" />
      </div>
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Fatura</div>
      <div className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
        {formatCurrency(nextMonthTotal, moeda)}
      </div>
      <div className="text-[11px] text-muted-foreground font-medium mt-2">
        {nextMonthTotal > 0 
          ? `Gasto programado para o próximo mês`
          : "Nenhum gasto programado para o próximo mês"}
      </div>
      {scheduledCount > 0 && (
        <div className="text-[10px] text-primary font-bold mt-1 bg-primary/5 inline-block px-2 py-0.5 rounded-md">
          {scheduledCount} {scheduledCount === 1 ? 'item programado' : 'itens programados'}
        </div>
      )}
    </div>
  );
}