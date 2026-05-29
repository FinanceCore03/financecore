import { Calendar, ChevronRight, Wallet, Calendar as CalendarIcon, ChevronLeft } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { startOfDay } from "date-fns";
import { useNavigate } from "@tanstack/react-router";

interface InvoiceCardProps {
  transactions: any[];
  creditTransactions?: any[];
  subscriptions?: any[];
  moeda: string;
}

export function InvoiceCard({ moeda }: InvoiceCardProps) {
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
  }, []);

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
    return creditTransactions.reduce((acc, ctx) => {
      if (!ctx.data_vencimento) return acc;
      const date = new Date(ctx.data_vencimento + 'T00:00:00');
      if (date.getMonth() === invoiceTarget.month && date.getFullYear() === invoiceTarget.year) {
        return acc + parseFloat(ctx.valor || "0");
      }
      return acc;
    }, 0);
  }, [creditTransactions, invoiceTarget]);

  const invoiceCount = creditTransactions.filter(ctx => {
    if (!ctx.data_vencimento) return false;
    const date = new Date(ctx.data_vencimento + 'T00:00:00');
    return date.getMonth() === invoiceTarget.month && date.getFullYear() === invoiceTarget.year;
  }).length;

  const monthsList = useMemo(() => {
    const months: { month: number; year: number; total: number; label: string }[] = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const m = date.getMonth();
      const y = date.getFullYear();
      
      const total = creditTransactions.reduce((acc, ctx) => {
        if (!ctx.data_vencimento) return acc;
        const d = new Date(ctx.data_vencimento + 'T00:00:00');
        if (d.getMonth() === m && d.getFullYear() === y) {
          return acc + parseFloat(ctx.valor || "0");
        }
        return acc;
      }, 0);

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
    return creditTransactions
      .filter(ctx => {
        if (!ctx.data_vencimento) return false;
        const d = new Date(ctx.data_vencimento + 'T00:00:00');
        return d.getMonth() === selectedMonth.month && d.getFullYear() === selectedMonth.year;
      })
      .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());
  }, [creditTransactions, selectedMonth]);

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
                  onClick={() => setView(view === 'month-details' ? 'month-list' : 'main')}
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

          <div className="p-6 pt-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {view === 'main' && (
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    setSelectedMonth(invoiceTarget);
                    setView('month-details');
                  }}
                  className="w-full flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 rounded-2xl border border-primary/10 transition-colors group"
                >
                  <div className="text-left">
                    <div className="text-sm font-bold text-primary">Este mês</div>
                    <div className="text-xs text-muted-foreground">Próxima fatura válida</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-bold text-primary">{formatCurrency(invoiceTotal, moeda)}</div>
                    <ChevronRight className="size-4 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                <button 
                  onClick={() => setView('month-list')}
                  className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border/50 transition-colors group"
                >
                  <div className="text-left">
                    <div className="text-sm font-bold text-foreground">Outro mês</div>
                    <div className="text-xs text-muted-foreground">Ver faturas futuras</div>
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
                      setSelectedMonth({ month: m.month, year: m.year });
                      setView('month-details');
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
              <div className="space-y-1">
                <div className="bg-muted/20 p-4 rounded-2xl mb-4 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total da Fatura</div>
                  <div className="text-lg font-bold text-foreground">
                    {formatCurrency(selectedMonthTransactions.reduce((acc, t) => acc + parseFloat(t.valor || 0), 0), moeda)}
                  </div>
                </div>

                {selectedMonthTransactions.length > 0 ? (
                  <div className="space-y-0">
                    {selectedMonthTransactions.map((tx, idx) => {
                      const dueDate = new Date(tx.data_vencimento + 'T00:00:00');
                      const isOverdue = dueDate < startOfDay(new Date());
                      const displayDate = tx.data_vencimento.split('-').reverse().join('/');
                      
                      return (
                        <div 
                          key={tx.id} 
                          onClick={() => {
                            setIsDetailsOpen(false);
                            navigate({ 
                              to: '/transactions', 
                              search: { highlight: tx.id_transacao } 
                            });
                          }}
                          className="p-4 rounded-2xl border border-transparent hover:border-border/60 hover:bg-muted/30 transition-all cursor-pointer group"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="text-sm font-medium text-foreground">
                              {tx.categoria || "Sem categoria"}
                              {tx.numero_parcela && <span className="text-xs text-muted-foreground ml-2">Parcela {tx.numero_parcela}</span>}
                            </div>
                            <div className="text-sm font-semibold text-foreground">
                              {formatCurrency(tx.valor, moeda)}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="size-3" />
                                {displayDate}
                              </span>
                            </div>
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight ${isOverdue ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
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
        </DialogContent>
      </Dialog>
    </>
  );
}
