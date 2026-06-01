import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Wallet, TrendingUp, TrendingDown, MoreHorizontal, Search, Filter, Plus, ShoppingBag, Car, Utensils, Briefcase, Tv, Dumbbell, Home, Pill as PillIcon, PiggyBank, Trash2, ChevronDown, X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Eye, EyeOff, CalendarDays } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
import { SubscriptionsCard } from "@/components/transactions/SubscriptionsCard";
import { InvoiceCard } from "@/components/transactions/InvoiceCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isWithinInterval, startOfDay, endOfDay, isSameDay, isSameMonth, startOfMonth, endOfMonth, addMonths, subMonths, isSameWeek, isToday, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { PageTransition, AnimatedItem } from "@/components/PageTransition";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/transactions")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      highlight: (search.highlight as number) || undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Transações — Financeiro Core" },
    ],
  }),
  component: () => <TransactionsPage />,
});

function TransactionsPage() {
  const { isPrivate, togglePrivacy } = usePrivacy();
  const searchParams = useSearch({ from: '/transactions' });
  const navigate = useNavigate();
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [periodFilter, setPeriodFilter] = useState<string>("Este mês");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [moeda, setMoeda] = useState<string>("Real");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("Todas");
  const [metodoFilter, setMetodoFilter] = useState<string>("Todos");
  const [tipoFilter, setTipoFilter] = useState<string>("Todas");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedTxId, setExpandedTxId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTransactions = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: usuario, error: usuarioError } = await supabase
        .from("Usuarios")
        .select("id, Moeda")
        .eq("id_auth", user.id)
        .maybeSingle();

      if (usuario) {
        setUsuarioId(usuario.id);
        setMoeda(usuario.Moeda || "Real");
        
        const [transacoesRes, assinaturasRes, creditoRes] = await Promise.all([
          supabase
            .from("Transacoes")
            .select("*")
            .eq("id_usuario", usuario.id)
            .order("data_inicio", { ascending: false }),
          supabase
            .from("Assinaturas")
            .select("*")
            .eq("id_usuario", usuario.id),
          supabase
            .from("Transacoes_Credito")
            .select("*")
            .eq("id_usuario", usuario.id)
        ]);
        
        if (transacoesRes.data) {
          setTransactions(transacoesRes.data);
        }
        if (assinaturasRes.data) {
          setSubscriptions(assinaturasRes.data);
        }
        if (creditoRes.data) {
          setCreditTransactions(creditoRes.data);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (searchParams.highlight) {
      setHighlightedId(searchParams.highlight);
      setExpandedTxId(searchParams.highlight);
      
      // Scroll to the highlighted transaction
      setTimeout(() => {
        const element = document.getElementById(`tx-${searchParams.highlight}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      // Reset highlight after animation
      const timer = setTimeout(() => {
        setHighlightedId(null);
        // Also clear URL param to avoid re-triggering on reload
        navigate({ search: {} as any, replace: true });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams.highlight, navigate]);

  const confirmDelete = async () => {
    if (!deleteTarget || !usuarioId || isDeleting) return;
    setIsDeleting(true);

    const payload: any = {
      acao: "deletar",
      id_transacao: deleteTarget.id,
      id_usuario: usuarioId,
      categoria: deleteTarget.categoria || "",
      descricao: deleteTarget.descricao || "",
      valor: deleteTarget.valor || "",
      metodo_pagamento: deleteTarget.metodo_pagamento || "",
      data_inicio: deleteTarget.data_inicio || "",
      data_fim: deleteTarget.data_fim || "",
      tipo: deleteTarget.tipo || "",
    };

    try {
      const response = await fetch("https://autowebhook.dudaclientes.site/webhook/Transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Webhook respondeu with ${response.status}`);

      toast.success("Transação excluída.");
      setTransactions(prev => prev.filter(tx => tx.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error("Não foi possível excluir agora.");
    } finally {
      setIsDeleting(false);
    }
  };

  const parseISOAsLocal = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const matchSubscriptionPeriod = (sub: any) => {
    if (sub.status === false) return false;
    return true;
  };

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(tx => {
      if (!tx.data_inicio) return false;
      const txDate = parseISOAsLocal(tx.data_inicio);
      if (!txDate) return false;
      
      // Filtro de Período (Prioritário se não for "Este mês" padrão ou se for Personalizado)
      if (periodFilter !== "Todas") {
        const today = new Date();
        if (periodFilter === "Hoje") {
          if (!isToday(txDate)) return false;
        } else if (periodFilter === "Esta semana") {
          if (!isSameWeek(txDate, today, { weekStartsOn: 0 })) return false;
        } else if (periodFilter === "Este mês") {
          if (!isSameMonth(txDate, selectedMonth)) return false;
        } else if (periodFilter === "Últimos 3 meses") {
          const threeMonthsAgo = subDays(today, 90);
          if (txDate < threeMonthsAgo || txDate > today) return false;
        } else if (periodFilter === "Personalizado" && dateRange?.from) {
          const from = startOfDay(dateRange.from);
          const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
          if (txDate < from || txDate > to) return false;
        }
      } else {
        // Se for "Todas", ainda respeitamos o selectedMonth se o usuário não mudou nada? 
        // Na verdade, se o usuário selecionou "Todas", deve mostrar tudo ignorando o mês?
        // O pedido diz: "navegar por mês... ou usar a opção Personalizado".
        // Vamos manter a lógica do selectedMonth como fallback se for "Todas" mas selectedMonth estiver ativo.
        if (!isSameMonth(txDate, selectedMonth)) return false;
      }
      
      // Outros filtros
      if (categoriaFilter !== "Todas" && tx.categoria !== categoriaFilter) return false;
      if (metodoFilter !== "Todos" && tx.metodo_pagamento !== metodoFilter) return false;
      if (tipoFilter !== "Todas") {
        if (tipoFilter === "Entradas" && tx.tipo !== "entrada") return false;
        if (tipoFilter === "Saídas" && tx.tipo !== "saida") return false;
      }
      
      // Assinatura NUNCA deve entrar como Saída nas listas e totais de transações normais
      if (tx.categoria === "Assinatura") return false;

      return true;
    });
  }, [transactions, selectedMonth, categoriaFilter, metodoFilter, tipoFilter, periodFilter, dateRange]);

  const totals = useMemo(() => {
    let totalAccount = 0;
    let periodEntradas = 0;
    let periodSaidas = 0;

    const normalizeStr = (str: string) => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const lastDayOfMonth = endOfMonth(selectedMonth);

    transactions.forEach(tx => {
      const val = parseFloat(tx.valor || "0");
      const isEntrada = tx.tipo === "entrada";
      const isCreditMethod = tx.metodo_pagamento === "Crédito à vista" || tx.metodo_pagamento === "Crédito Parcelado";
      const isAssinatura = tx.categoria === "Assinatura";
      const isSaldoAnterior = normalizeStr(tx.categoria) === "saldo anterior";
      
      const txDate = tx.data_inicio ? parseISOAsLocal(tx.data_inicio) : null;
      if (!txDate) return;

      // 1. Total em Conta: Acumulado até o último dia do mês selecionado
      if (!isCreditMethod && !isAssinatura && txDate <= lastDayOfMonth) {
        if (isEntrada) totalAccount += val;
        else totalAccount -= val;
      }

      // 2. Entradas e Saídas: Apenas o mês selecionado
      if (isSameMonth(txDate, selectedMonth) && !isCreditMethod && !isAssinatura) {
        if (isEntrada && !isSaldoAnterior) {
          periodEntradas += val;
        } else if (tx.tipo === "saida") {
          periodSaidas += val;
        }
      }
    });

    // Assinaturas ativas NUNCA entram como Saída normal, apenas no card Fatura
    // (A lógica do InvoiceCard já busca assinaturas independentemente)
    /*
    subscriptions.forEach(sub => {
      if (sub.status !== false) {
        periodSaidas += parseFloat(sub.valor || "0");
        totalAccount -= parseFloat(sub.valor || "0");
      }
    });
    */

    return { totalAccount, periodEntradas, periodSaidas };
  }, [transactions, creditTransactions, subscriptions, selectedMonth]);

  const distributionData = useMemo(() => {
    const categoriesMap: Record<string, number> = {};
    let totalExps = 0;
    const normalizeStr = (str: string) => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    filteredTransactions
      .filter(tx => tx.tipo === "saida")
      .forEach(tx => {
        const isCreditMethod = tx.metodo_pagamento === "Crédito à vista" || tx.metodo_pagamento === "Crédito Parcelado";
        if (!isCreditMethod) {
          const cat = tx.categoria || "Outros";
          const val = parseFloat(tx.valor || "0");
          categoriesMap[cat] = (categoriesMap[cat] || 0) + val;
          totalExps += val;
        }
      });

    /*
    creditTransactions.forEach(ctx => {
      if (ctx.data_vencimento) {
        const ctxDate = parseISOAsLocal(ctx.data_vencimento);
        if (ctxDate && isSameMonth(ctxDate, selectedMonth)) {
          const cat = ctx.categoria || "Outros";
          const val = parseFloat(ctx.valor || "0");
          categoriesMap[cat] = (categoriesMap[cat] || 0) + val;
          totalExps += val;
        }
      }
    });
    */

    /*
    subscriptions.forEach(sub => {
      if (sub.status !== false) {
        const cat = "Assinatura";
        const val = parseFloat(sub.valor || "0");
        categoriesMap[cat] = (categoriesMap[cat] || 0) + val;
        totalExps += val;
      }
    });
    */

    const colors = ["var(--primary)", "#8E9196", "#D3E4FD", "#FDE1D3", "#FEC6A1", "#E5DEFF"];

    return Object.entries(categoriesMap).map(([name, value], i) => ({
      name,
      value: totalExps > 0 ? Math.round((value / totalExps) * 100) : 0,
      amount: value,
      color: colors[i % colors.length]
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, creditTransactions, subscriptions, periodFilter, dateRange]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  }, [currentPage, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  }, [currentPage]);

  const handleResetFilters = () => {
    setCategoriaFilter("Todas");
    setMetodoFilter("Todos");
    setTipoFilter("Todas");
    setPeriodFilter("Este mês");
    setDateRange(undefined);
  };

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(tx => tx.categoria && set.add(tx.categoria));
    return Array.from(set).sort();
  }, [transactions]);

  const availableMethods = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(tx => tx.metodo_pagamento && set.add(tx.metodo_pagamento));
    return Array.from(set).sort();
  }, [transactions]);

  const effectiveMoeda = moeda;
  const economyValue = totals.periodEntradas - totals.periodSaidas;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <main className="flex-1 px-8 py-8 space-y-6">
            <header className="flex flex-row items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
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
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <h1 className="text-2xl font-semibold tracking-tight">Transações</h1>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 p-1 bg-white/50 backdrop-blur-sm rounded-2xl border border-border/40 shadow-sm">
                    <button 
                      onClick={() => {
                        setSelectedMonth(prev => subMonths(prev, 1));
                        setPeriodFilter("Este mês");
                      }}
                      className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-muted-foreground hover:text-primary active:scale-95"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-sm font-bold text-slate-900 group">
                          <span className="capitalize">
                            {periodFilter === "Personalizado" && dateRange?.from 
                              ? `${format(dateRange.from, "dd/MM")} - ${dateRange.to ? format(dateRange.to, "dd/MM") : ""}`
                              : format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                          <ChevronDown className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="center" className="w-[320px] p-0 rounded-3xl border-border shadow-2xl bg-white overflow-hidden">
                        <div className="p-4">
                          <div className="grid grid-cols-3 gap-1.5 mb-4">
                            {Array.from({ length: 12 }).map((_, i) => {
                              const monthDate = new Date(selectedMonth.getFullYear(), i, 1);
                              const isSelected = i === selectedMonth.getMonth() && periodFilter === "Este mês";
                              return (
                                <button
                                  key={i}
                                  onClick={() => {
                                    setSelectedMonth(monthDate);
                                    setPeriodFilter("Este mês");
                                  }}
                                  className={`py-2 text-xs rounded-xl transition-all capitalize font-medium ${isSelected ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'hover:bg-muted text-muted-foreground hover:text-slate-900'}`}
                                >
                                  {format(monthDate, "MMM", { locale: ptBR })}
                                </button>
                              );
                            })}
                          </div>
                          
                          <div className="pt-3 border-t border-border/50 flex items-center justify-between px-1 mb-4">
                            <button 
                              onClick={() => setSelectedMonth(prev => subMonths(prev, 12))}
                              className="p-1.5 hover:bg-muted rounded-xl transition-colors"
                            >
                              <ChevronLeft className="size-4" />
                            </button>
                            <span className="text-sm font-bold tracking-tight text-slate-900">{selectedMonth.getFullYear()}</span>
                            <button 
                              onClick={() => setSelectedMonth(prev => addMonths(prev, 12))}
                              className="p-1.5 hover:bg-muted rounded-xl transition-colors"
                            >
                              <ChevronRight className="size-4" />
                            </button>
                          </div>

                          <div className="pt-3 border-t border-border/50">
                            <button 
                              onClick={() => {
                                setPeriodFilter("Personalizado");
                                setIsPeriodOpen(true);
                              }}
                              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${periodFilter === "Personalizado" ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                            >
                              <CalendarDays className="size-4" />
                              Personalizado
                            </button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    <button 
                      onClick={() => {
                        setSelectedMonth(prev => addMonths(prev, 1));
                        setPeriodFilter("Este mês");
                      }}
                      className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-muted-foreground hover:text-primary active:scale-95"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>

                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                  >
                    <Plus className="size-4" strokeWidth={3} />
                    <span>Adicionar</span>
                  </button>
                </div>
              </header>
            </AnimatedItem>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnimatedItem>
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm h-full">
                  <div className="size-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-4">
                    <Wallet className="size-5" />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Total em Conta</div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-semibold tracking-tight mb-1">
                      {isPrivate ? `${getCurrencySymbol(effectiveMoeda)} - - - - - -` : formatCurrency(totals.totalAccount, effectiveMoeda)}
                    </div>
                    <button 
                      onClick={togglePrivacy}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:opacity-100"
                      title={isPrivate ? "Mostrar valores" : "Ocultar valores"}
                    >
                      {isPrivate ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                  <div className="text-[10px] text-muted-foreground">Saldo total disponível</div>
                </div>
              </AnimatedItem>
              <AnimatedItem>
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm h-full">
                  <div className="size-10 rounded-xl bg-success-soft text-success flex items-center justify-center mb-4">
                    <TrendingUp className="size-5" />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Entradas</div>
                  <div className="text-2xl font-semibold tracking-tight mb-1">
                    {isPrivate ? `${getCurrencySymbol(effectiveMoeda)} - - - - - -` : formatCurrency(totals.periodEntradas, effectiveMoeda)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Total recebido no período</div>
                </div>
              </AnimatedItem>
              <AnimatedItem>
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm h-full">
                  <div className="size-10 rounded-xl bg-danger-soft text-danger flex items-center justify-center mb-4">
                    <TrendingDown className="size-5" />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Saídas</div>
                  <div className="text-2xl font-semibold tracking-tight mb-1">
                    {isPrivate ? `${getCurrencySymbol(effectiveMoeda)} - - - - - -` : formatCurrency(totals.periodSaidas, effectiveMoeda)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Total gasto no período</div>
                </div>
              </AnimatedItem>
              <AnimatedItem>
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm h-full">
                  <div className={`size-10 rounded-xl flex items-center justify-center mb-4 ${economyValue >= 0 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                    <PiggyBank className="size-5" />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Economia</div>
                  <div className="text-2xl font-semibold tracking-tight mb-1">
                    {isPrivate ? `${getCurrencySymbol(effectiveMoeda)} - - - - - -` : formatCurrency(economyValue, effectiveMoeda)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Balanço positivo</div>
                </div>
              </AnimatedItem>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <AnimatedItem className="flex-1 min-w-0">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-full">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <h3 className="font-semibold text-lg tracking-tight">Atividade de Transações</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 border border-border rounded-xl p-1 bg-muted/20 mr-1">
                        <button 
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className="p-1.5 hover:bg-card rounded-lg disabled:opacity-40 transition-colors"
                        >
                          <ChevronLeft className="size-4" />
                        </button>
                        <button 
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="p-1.5 hover:bg-card rounded-lg disabled:opacity-40 transition-colors"
                        >
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <PopoverTrigger asChild>
                          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border/50 rounded-2xl text-sm font-bold hover:bg-muted/50 transition-all shadow-sm active:scale-95">
                            <Filter className="size-4 text-primary" />
                            <span>Filtrar</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[340px] rounded-[2rem] p-6 shadow-2xl border-border bg-white max-h-[85vh] overflow-y-auto custom-scrollbar">
                          <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-lg tracking-tight">Filtros</h4>
                                <button 
                                  onClick={handleResetFilters}
                                  className="text-xs font-bold text-primary hover:underline"
                                >
                                  Limpar todos
                                </button>
                              </div>
                              
                              <div className="space-y-3">
                                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/80">Período</label>
                                <Select value={periodFilter} onValueChange={(val) => {
                                  setPeriodFilter(val);
                                  if (val === "Personalizado") setIsPeriodOpen(true);
                                }}>
                                  <SelectTrigger className="w-full h-12 rounded-2xl border-border/60 bg-muted/20 px-4 font-medium transition-all focus:ring-primary/20">
                                    <SelectValue placeholder="Selecione o período" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-2xl border-border shadow-xl">
                                    <SelectItem value="Todas" className="rounded-xl">Todas</SelectItem>
                                    <SelectItem value="Hoje" className="rounded-xl">Hoje</SelectItem>
                                    <SelectItem value="Esta semana" className="rounded-xl">Esta semana</SelectItem>
                                    <SelectItem value="Este mês" className="rounded-xl">Este mês</SelectItem>
                                    <SelectItem value="Últimos 3 meses" className="rounded-xl">Últimos 3 meses</SelectItem>
                                    <SelectItem value="Personalizado" className="rounded-xl">Personalizado</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-3">
                                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/80">Tipo</label>
                                <div className="grid grid-cols-3 gap-2">
                                  {["Todas", "Entradas", "Saídas"].map((t) => (
                                    <button
                                      key={t}
                                      onClick={() => setTipoFilter(t)}
                                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${tipoFilter === t ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20' : 'bg-muted/20 border-transparent text-muted-foreground hover:bg-muted/40'}`}
                                    >
                                      {t}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/80">Categoria</label>
                                <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                                  <SelectTrigger className="w-full h-12 rounded-2xl border-border/60 bg-muted/20 px-4 font-medium transition-all focus:ring-primary/20">
                                    <SelectValue placeholder="Todas as categorias" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-2xl border-border shadow-xl max-h-[300px]">
                                    <SelectItem value="Todas" className="rounded-xl">Todas</SelectItem>
                                    {availableCategories.map(c => <SelectItem key={c} value={c} className="rounded-xl">{c}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-3">
                                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/80">Método de Pagamento</label>
                                <Select value={metodoFilter} onValueChange={setMetodoFilter}>
                                  <SelectTrigger className="w-full h-12 rounded-2xl border-border/60 bg-muted/20 px-4 font-medium transition-all focus:ring-primary/20">
                                    <SelectValue placeholder="Todos os métodos" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-2xl border-border shadow-xl max-h-[300px]">
                                    <SelectItem value="Todos" className="rounded-xl">Todos os métodos</SelectItem>
                                    {availableMethods.map(m => <SelectItem key={m} value={m} className="rounded-xl">{m}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>

                              <Button 
                                onClick={() => setIsFilterOpen(false)}
                                className="w-full h-12 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 mt-2"
                              >
                                Aplicar Filtros
                              </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b border-border">
                          <th className="text-left py-3 px-4">Categoria</th>
                          <th className="text-left py-3 px-4">Data / Período</th>
                          <th className="text-left py-3 px-4">Descrição</th>
                          <th className="text-left py-3 px-4">Valor</th>
                          <th className="text-left py-3 px-4">Método</th>
                          <th className="text-center py-3 px-4">Ação</th>
                        </tr>
                      </thead>
                       <tbody className="divide-y divide-border">
                        <AnimatePresence mode="wait">
                          {paginatedTransactions.map((tx) => {
                          const isCredit = tx.metodo_pagamento === "Crédito à vista" || tx.metodo_pagamento === "Crédito Parcelado";
                          const isExpanded = expandedTxId === tx.id;
                          const relatedInstallments = creditTransactions
                            .filter(ctx => ctx.id_transacao === tx.id)
                            .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());

                          return (
                            <Fragment key={tx.id}>
                              <motion.tr 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                <td className="py-4 px-4 font-medium">{tx.categoria || "Geral"}</td>
                                <td className="py-4 px-4 text-muted-foreground">
                                  {tx.data_fim && tx.data_fim !== tx.data_inicio ? `${formatDisplayDate(tx.data_inicio)} - ${formatDisplayDate(tx.data_fim)}` : formatDisplayDate(tx.data_inicio)}
                                </td>
                                <td className="py-4 px-4 text-muted-foreground max-w-[200px] truncate">{tx.descricao || "—"}</td>
                                <td className={`py-4 px-4 font-semibold ${tx.tipo === 'entrada' ? 'text-success' : 'text-danger'}`}>
                                  {tx.tipo === 'entrada' ? '+' : '-'}{formatCurrency(tx.valor, effectiveMoeda)}
                                </td>
                                <td className="py-4 px-4 text-muted-foreground">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-foreground font-medium">{tx.metodo_pagamento || "—"}</span>
                                      {isCredit && (
                                        <div className="bg-slate-100 p-0.5 rounded-md">
                                          <ChevronRight className={`size-3 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                                        </div>
                                      )}
                                    </div>
                                    {isCredit && (
                                      <span className="text-[10px] text-slate-400 mt-0.5">
                                        {tx.metodo_pagamento === "Crédito à vista" ? "1x" : `${relatedInstallments.length}x`}
                                        {" • "}
                                        {(!tx.Juros || tx.Juros === 0 || tx.Juros === "0") ? "Sem juros" : `juros ${tx.Juros}%`}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteTarget(tx);
                                    }} 
                                    className="p-1 text-muted-foreground hover:text-danger transition-colors"
                                  >
                                    <Trash2 size={16}/>
                                  </button>
                                </td>
                              </tr>
                              {isCredit && (
                                <tr>
                                  <td colSpan={6} className="p-0 border-none">
                                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                      <div className="bg-white px-6 py-4 mx-4 mb-4 rounded-2xl border border-border/60 shadow-sm">
                                        <div className="space-y-0">
                                          {relatedInstallments.length > 0 ? (
                                            <>
                                              <div className="grid grid-cols-4 items-center text-[11px] text-muted-foreground uppercase tracking-wider py-2 px-2 border-b border-border mb-1">
                                                <div>Parcela</div>
                                                <div>Data de Vencimento</div>
                                                <div>Valor</div>
                                                <div>Vencimento</div>
                                              </div>
                                              {relatedInstallments.map((ctx, idx) => {
                                                const dueDate = parseISOAsLocal(ctx.data_vencimento);
                                                const isOverdue = dueDate && dueDate < startOfDay(new Date());
                                                return (
                                                  <div key={ctx.id} className="grid grid-cols-4 items-center text-[12px] py-4 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors px-2">
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-foreground">
                                                        {ctx.numero_parcela ? `Parcela ${ctx.numero_parcela}` : `Item ${idx + 1}`}
                                                      </span>
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                      {formatDisplayDate(ctx.data_vencimento)}
                                                    </div>
                                                    <div className="text-foreground">
                                                      {formatCurrency(ctx.valor, effectiveMoeda)}
                                                    </div>
                                                    <div className="flex justify-start">
                                                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] tracking-tight ${isOverdue ? 'bg-danger/10 text-danger border border-danger/10' : 'bg-success/10 text-success border border-success/10'}`}>
                                                        <div className={`size-1.5 rounded-full ${isOverdue ? 'bg-danger' : 'bg-success'}`} />
                                                        {isOverdue ? 'Vencida' : 'A vencer'}
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </>
                                          ) : (
                                            <div className="text-xs text-muted-foreground text-center py-2">
                                              Nenhuma parcela encontrada para esta transação.
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                              );
                            })}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">Página {currentPage} de {totalPages}</p>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className="p-2 border border-border rounded-lg disabled:opacity-50 hover:bg-muted transition shadow-sm"
                        >
                          <ChevronLeft className="size-4" />
                        </button>
                        <button 
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="p-2 border border-border rounded-lg disabled:opacity-50 hover:bg-muted transition shadow-sm"
                        >
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </AnimatedItem>

              <div className="w-full lg:w-80 space-y-6">
                <AnimatedItem>
                  <InvoiceCard transactions={transactions} subscriptions={subscriptions} moeda={effectiveMoeda} />
                </AnimatedItem>
                
                <AnimatedItem>
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="font-semibold text-lg tracking-tight mb-6">Distribuição dos Gastos</h3>
                    <div className="h-[220px] w-full mb-6 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="amount"
                            onMouseEnter={(_, index) => setActiveCategory(distributionData[index].name)}
                            onMouseLeave={() => setActiveCategory(null)}
                          >
                            {distributionData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.color} 
                                stroke="none" 
                                className="transition-all duration-300 outline-none"
                                style={{
                                  filter: activeCategory === entry.name ? 'brightness(1.1)' : 'none',
                                  opacity: activeCategory && activeCategory !== entry.name ? 0.6 : 1,
                                  transform: activeCategory === entry.name ? 'scale(1.05)' : 'scale(1)',
                                  transformOrigin: 'center'
                                }}
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value: any) => formatCurrency(Number(value), effectiveMoeda)}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total de Gastos</span>
                        <span className="text-lg font-bold tracking-tight">
                          {formatCurrency(distributionData.reduce((acc, curr) => acc + curr.amount, 0), effectiveMoeda)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                      {distributionData.map((item) => (
                        <div 
                          key={item.name} 
                          onMouseEnter={() => setActiveCategory(item.name)}
                          onMouseLeave={() => setActiveCategory(null)}
                          className={`flex items-center justify-between group py-1.5 px-2 rounded-xl transition-all duration-300 cursor-default ${activeCategory === item.name ? 'bg-muted shadow-sm scale-[1.02]' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="size-2.5 rounded-full shrink-0 transition-transform duration-300" style={{ backgroundColor: item.color, transform: activeCategory === item.name ? 'scale(1.2)' : 'scale(1)' }} />
                            <span className={`text-xs truncate max-w-[100px] transition-colors duration-300 ${activeCategory === item.name ? 'text-foreground font-medium' : 'text-muted-foreground'}`} title={item.name}>{item.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-medium transition-colors duration-300 ${activeCategory === item.name ? 'text-primary' : 'text-muted-foreground/70'}`}>{item.value}%</span>
                            <span className={`text-xs font-semibold transition-colors duration-300 ${activeCategory === item.name ? 'text-foreground' : ''}`}>{formatCurrency(item.amount, effectiveMoeda)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </AnimatedItem>

                <AnimatedItem>
                  <SubscriptionsCard usuarioId={usuarioId} moeda={effectiveMoeda} />
                </AnimatedItem>
              </div>
            </div>
          </main>
        </PageTransition>
      </div>

      <AddTransactionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchTransactions}
        moeda={effectiveMoeda}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-[2rem] p-8 border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold tracking-tight">Excluir Transação?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium">
              Esta ação não pode ser desfeita. A transação será removida permanentemente de sua conta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="rounded-xl font-bold border-border/50 hover:bg-muted/50">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="rounded-xl font-bold bg-danger hover:bg-danger/90 shadow-lg shadow-danger/20"
            >
              {isDeleting ? "Excluindo..." : "Sim, excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Popover open={isPeriodOpen} onOpenChange={setIsPeriodOpen}>
        <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-[2rem] overflow-hidden" align="center">
          <div className="flex flex-col md:flex-row bg-white">
            <div className="p-4 border-r border-border/40 space-y-1 min-w-[180px] bg-muted/5">
              {[
                "Todas", "Hoje", "Esta semana", "Este mês", "Últimos 3 meses", "Personalizado"
              ].map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setPeriodFilter(opt);
                    if (opt !== "Personalizado") setIsPeriodOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${periodFilter === opt ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="p-4 flex flex-col items-center">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  if (range?.from && range?.to) {
                    setPeriodFilter("Personalizado");
                  }
                }}
                locale={ptBR}
                className="rounded-xl border-none"
              />
              <div className="mt-4 w-full flex justify-end gap-3 px-4 pb-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsPeriodOpen(false)}
                  className="rounded-xl font-bold text-xs"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    if (dateRange?.from) {
                      setPeriodFilter("Personalizado");
                    }
                    setIsPeriodOpen(false);
                  }}
                  className="rounded-xl font-bold text-xs px-6 shadow-lg shadow-primary/20"
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
