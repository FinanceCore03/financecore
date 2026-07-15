import React, { useState } from "react";
import { Calendar, ChevronRight, Clock, CreditCard, Tag, Info } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";

interface Commitment {
  type: 'fatura' | 'assinatura' | 'transacao';
  title: string;
  value?: string;
  dateLabel?: string;
  priority: number;
}

interface UpcomingCommitmentsProps {
  transactions: any[];
  creditTransactions?: any[];
  subscriptions: any[];
  moeda: string;
}

export function UpcomingCommitments({ transactions, creditTransactions = [], subscriptions, moeda }: UpcomingCommitmentsProps) {
  const [showAll, setShowAll] = useState(false);

  const commitments = React.useMemo(() => {
    const list: Commitment[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const normalize = (str: string) => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const nextMonth = new Date(currentYear, currentMonth + 1, 1);
    const endOfNextMonth = new Date(currentYear, currentMonth + 2, 0);
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const nextMonthName = monthNames[nextMonth.getMonth()];

    const nextMonthTransactionsTotal = transactions.reduce((acc, tx) => {
      const isSaida = normalize(tx.tipo) === "saida";
      const metodo = normalize(tx.metodo_pagamento || "");
      const isCredito = metodo.includes("credito") || metodo.includes("parcelado");

      // Only process common transactions (NOT credit)
      if (!isSaida || isCredito) return acc;

      const startStr = tx.data_inicio;
      if (!startStr) return acc;
      const [y, m, d] = startStr.split('-').map(Number);
      const start = new Date(y, m - 1, d);
      
      const endStr = tx.data_fim;
      const end = endStr ? new Date(endStr.split('-')[0], parseInt(endStr.split('-')[1]) - 1, parseInt(endStr.split('-')[2])) : null;

      const isNextMonth = start >= nextMonth && start <= endOfNextMonth;
      const overlapsNextMonth = start <= endOfNextMonth && (end && end >= nextMonth);

      if (isNextMonth || overlapsNextMonth) {
        return acc + parseFloat(tx.valor || "0");
      }
      return acc;
    }, 0);

    const nextMonthCreditTotal = creditTransactions.reduce((acc, ctx) => {
      if (!ctx.data_vencimento) return acc;
      const [y, m, d] = ctx.data_vencimento.split('-').map(Number);
      const start = new Date(y, m - 1, d);

      if (start >= nextMonth && start <= endOfNextMonth) {
        return acc + parseFloat(ctx.valor || "0");
      }
      return acc;
    }, 0);

    const activeSubscriptions = subscriptions.filter(sub => sub.status !== false);
    const nextMonthSubsTotal = activeSubscriptions.reduce((acc, sub) => acc + parseFloat(sub.valor || "0"), 0);
    const faturaTotal = nextMonthTransactionsTotal + nextMonthCreditTotal + nextMonthSubsTotal;

    if (faturaTotal > 0) {
      list.push({
        type: 'fatura',
        title: `Fatura de ${nextMonthName}`,
        value: formatCurrency(faturaTotal, moeda),
        priority: 1
      });
    }

    activeSubscriptions.forEach(sub => {
      list.push({
        type: 'assinatura',
        title: sub.nome || 'Assinatura',
        dateLabel: `cobrança dia ${sub.dia_cobranca}`,
        priority: 2
      });
    });

    transactions
      .filter(tx => {
        if (!tx.data_inicio) return false;
        const [y, m, d] = tx.data_inicio.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return date > now;
      })
      .forEach(tx => {
        const [y, m, d] = tx.data_inicio.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        list.push({
          type: 'transacao',
          title: tx.descricao || tx.categoria || 'Transação futura',
          value: formatCurrency(tx.valor, moeda),
          dateLabel: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`,
          priority: 3
        });
      });

    return list.sort((a, b) => a.priority - b.priority);
  }, [transactions, creditTransactions, subscriptions, moeda]);

  const displayedCommitments = showAll ? commitments : commitments.slice(0, 5);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold tracking-tight text-slate-900">Próximos Compromissos</h3>
        <div className="p-2 bg-primary/10 rounded-xl">
          <Calendar className="size-5 text-primary" />
        </div>
      </div>

      <div className="space-y-4 flex-1">
        {commitments.length === 0 ? (
          <div className="py-8 text-center">
            <div className="size-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <Info className="size-6 text-slate-300" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhum compromisso futuro encontrado.</p>
          </div>
        ) : (
          displayedCommitments.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100 transition-colors group hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`shrink-0 p-2 rounded-lg ${
                  item.type === 'fatura' ? 'bg-primary/10 text-primary' :
                  item.type === 'assinatura' ? 'bg-amber-100 text-amber-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {item.type === 'fatura' ? <CreditCard className="size-4" /> : 
                   item.type === 'assinatura' ? <Tag className="size-4" /> : 
                   <Clock className="size-4" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors">{item.title}</p>
                  {item.dateLabel && <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{item.dateLabel}</p>}
                </div>
              </div>
              {item.value && <p className="text-sm font-bold text-slate-900 tabular-nums">{item.value}</p>}
            </div>
          ))
        )}
      </div>

      {commitments.length > 5 && (
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