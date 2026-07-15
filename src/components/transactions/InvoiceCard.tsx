import { Calendar, ChevronRight, Wallet, Calendar as CalendarIcon, ChevronLeft } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { startOfDay, format } from "date-fns";
import { useNavigate } from "@tanstack/react-router";

interface InvoiceCardProps {
  transactions: any[];
  creditTransactions?: any[];
  subscriptions?: any[];
  moeda: string;
}

export function InvoiceCard({ moeda, transactions, subscriptions: propsSubscriptions }: InvoiceCardProps) {
  const [creditTransactions, setCreditTransactions] = useState<any[]>([]);
  const [diaVencimento, setDiaVencimento] = useState<number>(19);
  const [loading, setLoading] = useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [view, setView] = useState<'main' | 'month-list' | 'month-details'>('main');
  const [animating, setAnimating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: usuario } = await supabase
          .from("Usuarios")
          .select("id, Dia_vencimento")
          .eq("id_auth", user.id)
          .maybeSingle();

        if (usuario) {
          if (usuario.Dia_vencimento) {
            setDiaVencimento(parseInt(usuario.Dia_vencimento));
          }
          const { data } = await supabase
            .from("Transacoes_Credito")
            .select("*")
            .eq("id_usuario", usuario.id);
          setCreditTransactions(data || []);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [transactions]); // Update when transactions change (e.g. after deletion)

  const getNextInvoiceDate = () => {
    const now = new Date();
    const todayDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (todayDay > diaVencimento) {
      const nextDate = new Date(currentYear, currentMonth + 1, 1);
      return {
        month: nextDate.getMonth(),
        year: nextDate.getFullYear()
      };
    }

    return {
      month: currentMonth,
      year: currentYear
    };
  };

  const invoiceTarget = getNextInvoiceDate();

  const invoiceTotal = useMemo(() => {
    const creditTotal = creditTransactions.reduce((acc, ctx) => {
      if (!ctx.data_vencimento) return acc;
      const date = new Date(ctx.data_vencimento + 'T00:00:00');
      if (date.getMonth() === invoiceTarget.month && date.getFullYear() === invoiceTarget.year) {
        return acc + parseFloat(ctx.valor || "0");
      }
      return acc;
    }, 0);

    const subscriptionsTotal = (propsSubscriptions || [])
      .filter(sub => sub.status !== false)
      .reduce((acc, sub) => acc + parseFloat(sub.valor || "0"), 0);

    return creditTotal + subscriptionsTotal;
  }, [creditTransactions, invoiceTarget, propsSubscriptions]);

  const monthsList = useMemo(() => {
    const months: { month: number; year: number; total: number; label: string }[] = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const m = date.getMonth();
      const y = date.getFullYear();
      
      const creditTotal = creditTransactions.reduce((acc, ctx) => {
        if (!ctx.data_vencimento) return acc;
        const d = new Date(ctx.data_vencimento + 'T00:00:00');
        if (d.getMonth() === m && d.getFullYear() === y) {
          return acc + parseFloat(ctx.valor || "0");
        }
        return acc;
      }, 0);

      const subscriptionsTotal = (propsSubscriptions || [])
        .filter(sub => sub.status !== false)
        .reduce((acc, sub) => acc + parseFloat(sub.valor || "0"), 0);

      const total = creditTotal + subscriptionsTotal;

      if (total > 0 || i < 3) {
        const label = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        months.push({ 
          month: m, 
          year: y, 
          total, 
          label: label.charAt(0).toUpperCase() + label.slice(1) 
        });
      }
    }
    return months;
  }, [creditTransactions]);

  const selectedMonthTransactions = useMemo(() => {
    if (!selectedMonth) return [];
    
    const creditOnMonth = creditTransactions
      .filter(ctx => {
        if (!ctx.data_vencimento) return false;
        const d = new Date(ctx.data_vencimento + 'T00:00:00');
        return d.getMonth() === selectedMonth.month && d.getFullYear() === selectedMonth.year;
      })
      .map(tx => ({ ...tx, isSubscription: false }));

    const subsOnMonth = (propsSubscriptions || [])
      .filter(sub => sub.status !== false)
      .map(sub => ({
        id: `sub-${sub.id}`,
        id_transacao: null,
        categoria: "Assinatura",
        valor: sub.valor,
        data_vencimento: format(new Date(selectedMonth.year, selectedMonth.month, parseInt(sub.dia_cobranca || "1")), "yyyy-MM-dd"),
        numero_parcela: null,
        isSubscription: true,
        nome: sub.nome || sub.descricao
      }));

    return [...creditOnMonth, ...subsOnMonth]
      .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());
  }, [creditTransactions, selectedMonth, propsSubscriptions]);

  if (loading) return null;

  return (
    <>
      <div 
        onClick={() => {
          setIsDetailsOpen(true);
          setView('main');
        }}
        className="bg-card border border-border rounded-2xl p-6 shadow-sm cursor-pointer hover:bg-muted/30 transition-colors group"
      >
        <div className="flex justify-between items-start">
          <div className="size-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-4">
            <Calendar className="size-5" />
          </div>
          <ChevronRight className="size-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Fatura</div>
        <div className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
          {formatCurrency(invoiceTotal, moeda)}
        </div>
        <div className="text-[11px] text-muted-foreground font-medium mt-2">
          {invoiceTotal > 0 
            ? `Gasto programado para a próxima fatura`
            : "Nenhuma fatura programada"}
        </div>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center gap-2 mb-2">
              {view !== 'main' && (
                <button 
                  onClick={() => {
                    setAnimating(true);
                    setTimeout(() => {
                      setView(view === 'month-details' ? 'month-list' : 'main');
                      setAnimating(false);
                    }, 150);
                  }}
                  className="p-1 hover:bg-muted rounded-full transition-colors mr-1"
                >
                  <ChevronLeft className="size-5" />
                </button>
              )}
              <DialogTitle className="text-xl font-bold tracking-tight">
                {view === 'main' ? 'Detalhes da Fatura' : view === 'month-list' ? 'Outros meses' : selectedMonth?.month !== undefined ? new Date(selectedMonth.year, selectedMonth.month).toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase()) : 'Detalhes'}
              </DialogTitle>
            </div>
          </DialogHeader>

          <ScrollArea className={`max-h-[70vh] transition-all duration-300 ease-in-out ${animating ? 'opacity-0 scale-[0.98] blur-[2px]' : 'opacity-100 scale-100 blur-0'}`}>
          <div className="p-6 pt-2">
            {view === 'main' && (
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    setAnimating(true);
                    setTimeout(() => {
                      setSelectedMonth(invoiceTarget);
                      setView('month-details');
                      setAnimating(false);
                    }, 150);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-primary/5 rounded-2xl border border-border hover:border-primary/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] transition-all group active:scale-[0.99]"
                >
                  <div className="text-left">
                    <div className="text-sm font-bold text-primary group-hover:scale-105 transition-transform origin-left">Este mês</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Próxima fatura válida</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-black text-primary">{formatCurrency(invoiceTotal, moeda)}</div>
                    <ChevronRight className="size-4 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                <button 
                  onClick={() => {
                    setAnimating(true);
                    setTimeout(() => {
                      setView('month-list');
                      setAnimating(false);
                    }, 150);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-muted/30 rounded-2xl border border-border shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] transition-all group active:scale-[0.99]"
                >
                  <div className="text-left">
                    <div className="text-sm font-bold text-slate-700">Outro mês</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Ver faturas futuras</div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {view === 'month-list' && (
              <div className="space-y-2">
                {monthsList.map((m, idx) => (
                  <button 
                    key={`${m.year}-${m.month}`}
                    onClick={() => {
                      setAnimating(true);
                      setTimeout(() => {
                        setSelectedMonth({ month: m.month, year: m.year });
                        setView('month-details');
                        setAnimating(false);
                      }, 150);
                    }}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 rounded-2xl border border-transparent hover:border-border/50 transition-all group"
                  >
                    <div className="text-sm font-medium text-foreground">{m.label}</div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold text-foreground">{formatCurrency(m.total, moeda)}</div>
                      <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {view === 'month-details' && (
              <div className="space-y-2">
                <div className="bg-muted/40 p-5 rounded-2xl mb-2 flex items-center justify-between border border-border/40">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Total da Fatura</div>
                  <div className="text-lg font-bold text-foreground">
                    {formatCurrency(selectedMonthTransactions.reduce((acc, t) => acc + parseFloat(t.valor || 0), 0), moeda)}
                  </div>
                </div>

                {selectedMonthTransactions.length > 0 ? (
                  <div className="space-y-2 bg-muted/30 p-2 rounded-[24px] border border-border/30">
                    {selectedMonthTransactions.map((tx, idx) => {
                      const dueDate = new Date(tx.data_vencimento + 'T00:00:00');
                      const isOverdue = dueDate < startOfDay(new Date());
                      const displayDate = tx.data_vencimento.split('-').reverse().join('/');
                      
                      return (
                        <div 
                          key={tx.id} 
                            onClick={() => {
                              if (tx.isSubscription) return;
                              setIsDetailsOpen(false);
                              navigate({ 
                                to: '/transactions', 
                                search: { highlight: tx.id_transacao } 
                              });
                            }}
                            className={`p-4 rounded-2xl bg-card border border-border/40 hover:border-border/80 hover:shadow-sm transition-all group ${tx.isSubscription ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-sm font-medium text-foreground">
                                {tx.isSubscription ? (tx.nome || "Assinatura") : (tx.categoria || "Sem categoria")}
                              {tx.numero_parcela && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-md text-muted-foreground ml-2 font-normal">Parcela {tx.numero_parcela}</span>}
                            </div>
                            <div className="text-sm font-semibold text-foreground">
                              {formatCurrency(tx.valor, moeda)}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1.5 opacity-80">
                                <CalendarIcon className="size-3" />
                                {displayDate}
                              </span>
                            </div>
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight ${isOverdue ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                              <div className={`size-1 rounded-full ${isOverdue ? 'bg-danger' : 'bg-success'}`} />
                              {isOverdue ? 'Vencida' : 'A vencer'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <Wallet className="size-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Nenhuma transação encontrada para este mês.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
