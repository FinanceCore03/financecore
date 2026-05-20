import { Calendar } from "lucide-react";

interface InvoiceCardProps {
  transactions: any[];
}

export function InvoiceCard({ transactions }: InvoiceCardProps) {
  // Logic to calculate next month's scheduled value
  const nextMonthTotal = (() => {
    const now = new Date();
    // Start of next month
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    // End of next month
    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    return transactions.reduce((acc, tx) => {
      if (tx.tipo !== "saida") return acc;
      
      const start = tx.data_inicio ? new Date(tx.data_inicio) : null;
      const end = tx.data_fim ? new Date(tx.data_fim) : null;
      
      if (!start) return acc;

      // Rule 5: Credit, Installment, transactions with start and end dates, or those reaching next month
      // We check if the transaction is active during next month
      const isActiveNextMonth = start <= endOfNextMonth && (!end || end >= nextMonth);
      
      if (isActiveNextMonth) {
        return acc + parseFloat(tx.valor || "0");
      }
      
      return acc;
    }, 0);
  })();

  const scheduledCount = transactions.filter(tx => {
    if (tx.tipo !== "saida") return false;
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const start = tx.data_inicio ? new Date(tx.data_inicio) : null;
    const end = tx.data_fim ? new Date(tx.data_fim) : null;
    return start && start <= endOfNextMonth && (!end || end >= nextMonth);
  }).length;

  return (
    <div className="bg-white border border-border/60 rounded-2xl p-6 shadow-[0_2px_14px_-4px_rgba(0,0,0,0.1)]">
      <div className="size-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-4">
        <Calendar className="size-5" />
      </div>
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Fatura</div>
      <div className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
        R$ {nextMonthTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </div>
      <div className="text-[11px] text-muted-foreground font-medium mt-2">
        {nextMonthTotal > 0 
          ? `Gasto programado para o próximo mês`
          : "Nenhum gasto programado para o próximo mês"}
      </div>
      {scheduledCount > 0 && (
        <div className="text-[10px] text-primary font-bold mt-1 bg-primary/5 inline-block px-2 py-0.5 rounded-md">
          {scheduledCount} {scheduledCount === 1 ? 'lançamento programado' : 'lançamentos programados'}
        </div>
      )}
    </div>
  );
}
