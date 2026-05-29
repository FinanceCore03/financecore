import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Wallet, TrendingUp, TrendingDown, MoreHorizontal, Search, Filter, Plus, ShoppingBag, Car, Utensils, Briefcase, Tv, Dumbbell, Home, Pill as PillIcon, PiggyBank, Trash2, ChevronDown, X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Eye, EyeOff } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
import { SubscriptionsCard } from "@/components/transactions/SubscriptionsCard";
import { InvoiceCard } from "@/components/transactions/InvoiceCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isWithinInterval, startOfDay, endOfDay, isSameDay, isSameMonth } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { PageTransition, AnimatedItem } from "@/components/PageTransition";
import { usePrivacy } from "@/contexts/PrivacyContext";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Transações — Financeiro Core" },
    ],
  }),
  component: () => <TransactionsPage />,
});

function TransactionsPage() {
  const { isPrivate, togglePrivacy } = usePrivacy();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("Todas");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [moeda, setMoeda] = useState<string>("Real");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("Todas");
  const [metodoFilter, setMetodoFilter] = useState<string>("Todos");
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

  const matchPeriod = (date: Date) => {
    if (periodFilter === "Todas") return true;
    
    if (periodFilter === "Personalizado" && dateRange?.from) {
      const from = startOfDay(dateRange.from);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      return date >= from && date <= to;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (periodFilter === "Hoje") return isSameDay(date, today);
    if (periodFilter === "Esta semana") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return date >= startOfWeek;
    }
    if (periodFilter === "Este mês") {
      return isSameMonth(date, today);
    }
    if (periodFilter === "Últimos 3 meses") {
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      return date >= threeMonthsAgo;
    }
    return true;
  };

  const matchSubscriptionPeriod = (sub: any) => {
    if (sub.status === false) return false;
    if (periodFilter === "Todas") return true;

    const now = new Date();
    const diaCobranca = parseInt(sub.dia_cobranca);
    if (isNaN(diaCobranca)) return true;
    
    if (periodFilter === "Hoje") {
      return now.getDate() === diaCobranca;
    }
    
    if (periodFilter === "Personalizado" && dateRange?.from) {
      let check = new Date(dateRange.from);
      const to = dateRange.to || dateRange.from;
      while (check <= to) {
        if (check.getDate() === diaCobranca) return true;
        check.setDate(check.getDate() + 1);
      }
      return false;
    }

    return true;
  };

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(tx => {
      if (!tx.data_inicio) return true;
      const txDate = parseISOAsLocal(tx.data_inicio);
      if (!txDate || !matchPeriod(txDate)) return false;
      if (categoriaFilter !== "Todas" && tx.categoria !== categoriaFilter) return false;
      if (metodoFilter !== "Todos" && tx.metodo_pagamento !== metodoFilter) return false;
      return true;
    });
  }, [transactions, periodFilter, dateRange, categoriaFilter, metodoFilter]);

  const totals = useMemo(() => {
    let totalAccount = 0;
    let periodEntradas = 0;
    let periodSaidas = 0;

    const normalizeStr = (str: string) => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    transactions.forEach(tx => {
      const val = parseFloat(tx.valor || "0");
      const isEntrada = tx.tipo === "entrada";
      const isCreditMethod = tx.metodo_pagamento === "Crédito à vista" || tx.metodo_pagamento === "Crédito Parcelado";
      const isSaldoAnterior = normalizeStr(tx.categoria) === "saldo anterior";
      
      // Update overall balance only if not credit
      if (!isCreditMethod) {
        if (isEntrada) totalAccount += val;
        else totalAccount -= val;
      }

      if (tx.data_inicio) {
        const txDate = parseISOAsLocal(tx.data_inicio);
        // Only count in period totals if not credit AND not Saldo Anterior for income
        if (txDate && matchPeriod(txDate) && !isCreditMethod) {
          if (isEntrada && !isSaldoAnterior) periodEntradas += val;
          else if (tx.tipo === "saida") periodSaidas += val;
        }
      }
    });

    // Transacoes_Credito SHOULD NOT enter Saídas or Total Account cards in this context
    // It is used only for the Invoice Card
    /* 
    creditTransactions.forEach(ctx => {
      const val = parseFloat(ctx.valor || "0");
      totalAccount -= val;

      if (ctx.data_vencimento) {
        const ctxDate = parseISOAsLocal(ctx.data_vencimento);
        if (ctxDate && matchPeriod(ctxDate)) {
          periodSaidas += val;
        }
      }
    });
    */

    subscriptions.forEach(sub => {
      if (matchSubscriptionPeriod(sub)) {
        const val = parseFloat(sub.valor || "0");
        periodSaidas += val;
        totalAccount -= val;
      }
    });

    return { totalAccount, periodEntradas, periodSaidas };
  }, [transactions, creditTransactions, subscriptions, periodFilter, dateRange]);

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

    // Distribution should NOT include credit transactions from Transacoes_Credito
    /*
    creditTransactions.forEach(ctx => {
      if (ctx.data_vencimento) {
        const ctxDate = parseISOAsLocal(ctx.data_vencimento);
        if (ctxDate && matchPeriod(ctxDate)) {
          const cat = ctx.categoria || "Outros";
          const val = parseFloat(ctx.valor || "0");
          categoriesMap[cat] = (categoriesMap[cat] || 0) + val;
          totalExps += val;
        }
      }
    });
    */

    subscriptions.forEach(sub => {
      if (matchSubscriptionPeriod(sub)) {
        const cat = "Assinatura";
        const val = parseFloat(sub.valor || "0");
        categoriesMap[cat] = (categoriesMap[cat] || 0) + val;
        totalExps += val;
      }
    });

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

  useEffect(() => {
    setCurrentPage(1);
  }, [periodFilter, categoriaFilter, metodoFilter]);

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
              <header className="flex flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-semibold tracking-tight">Transações</h1>
                  <p className="text-sm text-muted-foreground">Visualize e gerencie suas entradas e saídas.</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Popover open={isPeriodOpen} onOpenChange={setIsPeriodOpen}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition shadow-sm">
                        <CalendarIcon className="size-4 text-muted-foreground" />
                        <span>{periodFilter === "Personalizado" && dateRange?.from ? 
                          `${format(dateRange.from, "dd/MM")}${dateRange.to ? ` - ${format(dateRange.to, "dd/MM")}` : ""}` : 
                          periodFilter}</span>
                        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${isPeriodOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-auto p-0 rounded-2xl border-border shadow-xl bg-white overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="p-2 border-r border-border min-w-[160px] bg-muted/5">
                          {["Todas", "Hoje", "Esta semana", "Este mês", "Últimos 3 meses"].map((option) => (
                            <button
                              key={option}
                              onClick={() => { setPeriodFilter(option); setIsPeriodOpen(false); setDateRange(undefined); }}
                              className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors mb-1 ${periodFilter === option ? 'text-primary font-medium bg-primary/5' : 'text-foreground'}`}
                            >
                              {option}
                            </button>
                          ))}
                          <div className="h-px bg-border my-2 mx-2" />
                          <button
                            onClick={() => setPeriodFilter("Personalizado")}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors ${periodFilter === "Personalizado" ? 'text-primary font-medium bg-primary/5' : 'text-foreground'}`}
                          >
                            Personalizado
                          </button>
                        </div>
                        {periodFilter === "Personalizado" && (
                          <div className="p-3">
                            <Calendar
                              initialFocus
                              mode="range"
                              defaultMonth={dateRange?.from}
                              selected={dateRange}
                              onSelect={setDateRange}
                              numberOfMonths={1}
                              className="rounded-md border-none"
                            />
                            <div className="mt-3 flex justify-end">
                              <button 
                                onClick={() => setIsPeriodOpen(false)}
                                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
                              >
                                Aplicar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition shadow-sm"
                  >
                    <Plus className="size-4" />
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
                          <button className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition shadow-sm">
                            <Filter className="size-4 text-muted-foreground" />
                            <span>Filtrar</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-80 rounded-2xl p-5 shadow-xl border-border bg-white max-h-[85vh] overflow-y-auto custom-scrollbar">
                          <div className="space-y-4">
                              <h4 className="font-bold text-sm">Filtros</h4>
                              
                              <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Período</label>
                                <select 
                                  value={periodFilter} 
                                  onChange={(e) => {
                                    setPeriodFilter(e.target.value);
                                    if (e.target.value !== "Personalizado") setDateRange(undefined);
                                  }}
                                  className="w-full h-10 px-3 rounded-xl border border-border bg-muted/30 text-sm mb-2"
                                >
                                  {["Todas", "Hoje", "Esta semana", "Este mês", "Últimos 3 meses", "Personalizado"].map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                
                                {periodFilter === "Personalizado" && (
                                  <div className="p-2 border border-border rounded-xl bg-muted/10">
                                    <Calendar
                                      mode="range"
                                      selected={dateRange}
                                      onSelect={setDateRange}
                                      initialFocus
                                      className="rounded-md"
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Categoria</label>
                                <select 
                                  value={categoriaFilter} 
                                  onChange={(e) => setCategoriaFilter(e.target.value)}
                                  className="w-full h-10 px-3 rounded-xl border border-border bg-muted/30 text-sm"
                                >
                                  <option value="Todas">Todas</option>
                                  {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Método</label>
                                <select 
                                  value={metodoFilter} 
                                  onChange={(e) => setMetodoFilter(e.target.value)}
                                  className="w-full h-10 px-3 rounded-xl border border-border bg-muted/30 text-sm"
                                >
                                  <option value="Todos">Todos</option>
                                  {availableMethods.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                              </div>
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
                        {paginatedTransactions.map((tx) => {
                          const isCredit = tx.metodo_pagamento === "Crédito à vista" || tx.metodo_pagamento === "Crédito Parcelado";
                          const isExpanded = expandedTxId === tx.id;
                          const relatedInstallments = creditTransactions
                            .filter(ctx => ctx.id_transacao === tx.id)
                            .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());

                          return (
                            <Fragment key={tx.id}>
                              <tr 
                                onClick={() => isCredit && setExpandedTxId(isExpanded ? null : tx.id)}
                                className={`text-sm hover:bg-muted/30 transition-colors ${isCredit ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-muted/40' : ''}`}
                              >
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
                                        {(!tx.juros || tx.juros === 0 || tx.juros === "0") ? "Sem juros" : `juros ${tx.juros}%`}
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
                                      <div className="bg-muted/30 px-6 py-4 mx-4 mb-4 rounded-2xl border border-border/60 shadow-inner">
                                        <div className="space-y-1">
                                          {relatedInstallments.length > 0 ? (
                                            relatedInstallments.map((ctx, idx) => {
                                              const dueDate = parseISOAsLocal(ctx.data_vencimento);
                                              const isOverdue = dueDate && dueDate < startOfDay(new Date());
                                              return (
                                                <div key={ctx.id} className="grid grid-cols-4 items-center text-[12px] py-3 border-b border-border/20 last:border-0 hover:bg-white/40 transition-colors px-2 rounded-lg">
                                                  <div className="flex items-center gap-2">
                                                    <div className="size-2 rounded-full bg-slate-300" />
                                                    <span className="text-foreground font-semibold">
                                                      {ctx.numero_parcela ? `Parcela ${ctx.numero_parcela}` : `Item ${idx + 1}`}
                                                    </span>
                                                  </div>
                                                  <div className="text-slate-500 flex items-center gap-1.5">
                                                    <CalendarIcon className="size-3 text-slate-400" />
                                                    <span>Vencimento: <span className="text-foreground font-medium">{formatDisplayDate(ctx.data_vencimento)}</span></span>
                                                  </div>
                                                  <div className="text-slate-500 flex items-center gap-1.5">
                                                    <Wallet className="size-3 text-slate-400" />
                                                    <span>Valor: <span className="text-foreground font-bold">{formatCurrency(ctx.valor, effectiveMoeda)}</span></span>
                                                  </div>
                                                  <div className="flex justify-start">
                                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-tight ${isOverdue ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-success/10 text-success border border-success/20'}`}>
                                                      <div className={`size-1.5 rounded-full animate-pulse ${isOverdue ? 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`} />
                                                      {isOverdue ? 'VENCIDA' : 'A VENCER'}
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })
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
                  <InvoiceCard transactions={transactions} moeda={effectiveMoeda} />
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
                          <Tooltip 
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
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir?</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta transação?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-danger text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
