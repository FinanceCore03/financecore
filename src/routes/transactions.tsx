import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Wallet, TrendingUp, TrendingDown, MoreHorizontal, Search, Filter, Plus, ShoppingBag, Car, Utensils, Briefcase, Tv, Dumbbell, Home, Pill as PillIcon, PiggyBank, Trash2, ChevronDown, X, ChevronLeft, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
import { SubscriptionsCard } from "@/components/transactions/SubscriptionsCard";
import { InvoiceCard } from "@/components/transactions/InvoiceCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Transações — Financeiro Core" },
    ],
  }),
  component: () => <TransactionsPage />,
});

function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("Todas");
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [moeda, setMoeda] = useState<string>("Real");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("Todas");
  const [metodoFilter, setMetodoFilter] = useState<string>("Todos");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTransactions = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log("Auth user:", user);
    console.log("Auth user id:", user?.id);
    console.log("Auth user email:", user?.email);

    if (user) {
      const { data: usuario, error: usuarioError } = await supabase
        .from("Usuarios")
        .select("id, Moeda")
        .eq("id_auth", user.id)
        .maybeSingle();

      console.log("Usuário interno encontrado:", usuario);
      console.log("ID usado para buscar transações:", usuario?.id);

      if (usuario) {
        setUsuarioId(usuario.id);
        setMoeda(usuario.Moeda || "Real");
        
        const { data: transacoes, error } = await supabase
          .from("Transacoes")
          .select("*")
          .eq("id_usuario", usuario.id)
          .order("data_inicio", { ascending: false });
        
        console.log("Transações encontradas:", transacoes);
        console.log("Erro ao buscar transações:", error);

        if (transacoes) {
          setTransactions(transacoes);
          if (transacoes.length === 0) {
            console.log("Busca retornou vazia para Usuarios.id:", usuario.id);
          }
        } else {
          console.log("Erro ou nenhuma transação retornada para Usuarios.id:", usuario.id);
        }
      } else {
        console.error("Usuário não encontrado na tabela Usuarios");
        toast.error("Erro ao carregar dados do usuário.");
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch("https://autowebhook.dudaclientes.site/webhook/Transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Webhook respondeu com ${response.status}`);

      toast.success("Transação excluída.");
      setTransactions(prev => prev.filter(tx => tx.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      console.error("Erro ao excluir transação via webhook:", err);
      toast.error("Não foi possível excluir agora. Tente novamente.");
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
    const [year, month, day] = parts;
    const formatted = `${day}/${month}/${year}`;
    console.log("Data original recebida:", dateStr);
    console.log("Data formatada exibida:", formatted);
    return formatted;
  };

  const matchPeriod = (tx: any) => {
    if (periodFilter === "Todas") return true;
    if (!tx.data_inicio) return true;
    const txDate = parseISOAsLocal(tx.data_inicio);
    if (!txDate) return true;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (periodFilter === "Hoje") return txDate.getTime() === today.getTime();
    if (periodFilter === "Esta semana") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return txDate >= startOfWeek;
    }
    if (periodFilter === "Este mês") {
      return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
    }
    if (periodFilter === "Últimos 3 meses") {
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      return txDate >= threeMonthsAgo;
    }
    return true;
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

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(tx => {
      if (!matchPeriod(tx)) return false;
      if (categoriaFilter !== "Todas" && tx.categoria !== categoriaFilter) return false;
      if (metodoFilter !== "Todos" && tx.metodo_pagamento !== metodoFilter) return false;
      return true;
    });
  }, [transactions, periodFilter, categoriaFilter, metodoFilter]);

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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [periodFilter, categoriaFilter, metodoFilter]);

  const totals = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let totalAccount = 0;
    let periodEntradas = 0;
    let periodSaidas = 0;

    transactions.forEach(tx => {
      const val = parseFloat(tx.valor || "0");
      const isEntrada = tx.tipo === "entrada";
      
      // 3. Card "Total em Conta" -> all transactions of user
      if (isEntrada) totalAccount += val;
      else totalAccount -= val;

      // Filter for period-based cards
      let inPeriod = true;
      if (periodFilter !== "Todas" && tx.data_inicio) {
        const txDate = parseISOAsLocal(tx.data_inicio);
        if (txDate) {
          if (periodFilter === "Hoje") {
            inPeriod = txDate.getTime() === today.getTime();
          } else if (periodFilter === "Esta semana") {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            inPeriod = txDate >= startOfWeek;
          } else if (periodFilter === "Este mês") {
            inPeriod = txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
          } else if (periodFilter === "Últimos 3 meses") {
            const threeMonthsAgo = new Date(today);
            threeMonthsAgo.setMonth(today.getMonth() - 3);
            inPeriod = txDate >= threeMonthsAgo;
          }
        }
      }

      if (inPeriod) {
        if (isEntrada) periodEntradas += val;
        else periodSaidas += val;
      }
    });

    console.log("Totais calculados:", {
      totalEmConta: totalAccount,
      entradasPeriodo: periodEntradas,
      saidasPeriodo: periodSaidas,
      economia: periodEntradas - periodSaidas
    });

    return { totalAccount, periodEntradas, periodSaidas };
  }, [transactions, periodFilter]);

  const distributionData = useMemo(() => {
    const categoriesMap: Record<string, number> = {};
    let totalExps = 0;

    // "Distribuição dos Gastos deve considerar apenas as transações de saída do usuário logado ... no período selecionado"
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    transactions
      .filter(tx => {
        if (tx.tipo !== "saida") return false;
        if (periodFilter === "Todas") return true;
        if (!tx.data_inicio) return true;
        const txDate = parseISOAsLocal(tx.data_inicio);
        if (!txDate) return true;
        if (periodFilter === "Hoje") return txDate.getTime() === today.getTime();
        if (periodFilter === "Esta semana") {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          return txDate >= startOfWeek;
        }
        if (periodFilter === "Este mês") return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
        if (periodFilter === "Últimos 3 meses") {
          const threeMonthsAgo = new Date(today);
          threeMonthsAgo.setMonth(today.getMonth() - 3);
          return txDate >= threeMonthsAgo;
        }
        return true;
      })
      .forEach(tx => {
        const cat = tx.categoria || "Outros";
        const val = parseFloat(tx.valor || "0");
        categoriesMap[cat] = (categoriesMap[cat] || 0) + val;
        totalExps += val;
      });

    const colors = ["var(--primary)", "#8E9196", "#D3E4FD", "#FDE1D3", "#FEC6A1", "#E5DEFF"];

    return Object.entries(categoriesMap).map(([name, value], i) => ({
      name,
      value: totalExps > 0 ? Math.round((value / totalExps) * 100) : 0,
      amount: value,
      color: colors[i % colors.length]
    })).sort((a, b) => b.amount - a.amount);
  }, [transactions, periodFilter]);

  const { moeda: dashboardMoeda } = useDashboardData();
  const effectiveMoeda = dashboardMoeda || moeda;
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
              <div className="flex gap-3">
                <Skeleton className="h-10 w-32 rounded-xl" />
                <Skeleton className="h-10 w-40 rounded-xl" />
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <Skeleton className="h-8 w-48 mb-6" />
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
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
        <main className="flex-1 px-8 py-8 space-y-6">
          <header className="flex flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">Transações</h1>
              <p className="text-sm text-muted-foreground">Visualize e gerencie suas entradas e saídas em um só lugar.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Popover open={isPeriodOpen} onOpenChange={setIsPeriodOpen}>
                <PopoverTrigger asChild>
                  <button 
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition shadow-sm"
                  >
                    <span>{periodFilter}</span>
                    <ChevronDown className={`size-4 text-muted-foreground transition-transform ${isPeriodOpen ? 'rotate-180' : ''}`} />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 p-1 rounded-xl border-border shadow-lg">
                  {["Todas", "Hoje", "Esta semana", "Este mês", "Últimos 3 meses"].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setPeriodFilter(option);
                        setIsPeriodOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors ${periodFilter === option ? 'text-primary font-medium bg-primary/5' : 'text-foreground'}`}
                    >
                      {option}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
              
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition shadow-sm"
              >
                <Plus className="size-4" />
                <span>Adicionar Transação</span>
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="size-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-4">
                <Wallet className="size-5" />
              </div>
              <div className="text-xs text-muted-foreground mb-1">Total em Conta</div>
              <div className="text-2xl font-semibold tracking-tight">{formatCurrency(totals.totalAccount, effectiveMoeda)}</div>
              <div className="text-xs text-success font-medium mt-2">Saldo total disponível</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="size-10 rounded-xl bg-success-soft text-success flex items-center justify-center mb-4">
                <TrendingUp className="size-5" />
              </div>
              <div className="text-xs text-muted-foreground mb-1">Entradas ({periodFilter === "Este mês" ? "Mês" : periodFilter})</div>
              <div className="text-2xl font-semibold tracking-tight">{formatCurrency(totals.periodEntradas, effectiveMoeda)}</div>
              <div className="text-xs text-success font-medium mt-2">Total recebido no período</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="size-10 rounded-xl bg-danger-soft text-danger flex items-center justify-center mb-4">
                <TrendingDown className="size-5" />
              </div>
              <div className="text-xs text-muted-foreground mb-1">Saídas ({periodFilter === "Este mês" ? "Mês" : periodFilter})</div>
              <div className="text-2xl font-semibold tracking-tight">{formatCurrency(totals.periodSaidas, effectiveMoeda)}</div>
              <div className="text-xs text-danger font-medium mt-2">Total gasto no período</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className={`size-10 rounded-xl flex items-center justify-center mb-4 ${economyValue >= 0 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                <PiggyBank className="size-5" />
              </div>
              <div className="text-xs text-muted-foreground mb-1">Economia ({periodFilter === "Este mês" ? "Mês" : periodFilter})</div>
              <div className="text-2xl font-semibold tracking-tight">{formatCurrency(economyValue, effectiveMoeda)}</div>
              <div className={`text-xs font-medium mt-2 ${economyValue >= 0 ? 'text-success' : 'text-danger'}`}>
                {economyValue >= 0 ? 'Balanço positivo' : 'Balanço negativo'}
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-full">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <h3 className="font-semibold text-lg tracking-tight">Atividade de Transações</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-sm">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Página anterior"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <div className="w-px h-4 bg-border mx-1" />
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Próxima página"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>

                    <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                      <PopoverTrigger asChild>
                        <button className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition shadow-sm">
                          <Filter className="size-4 text-muted-foreground" />
                          <span>Filtrar</span>
                          {(categoriaFilter !== "Todas" || metodoFilter !== "Todos" || periodFilter !== "Todas") && (
                            <span className="ml-1 size-2 rounded-full bg-primary" />
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-72 rounded-2xl p-5 shadow-xl border-border bg-white">
                        <div className="space-y-5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold tracking-tight text-[#1A1A1A]">Filtros</h4>
                            <button
                              onClick={() => {
                                setCategoriaFilter("Todas");
                                setMetodoFilter("Todos");
                                setPeriodFilter("Todas");
                              }}
                              className="text-xs text-primary font-bold hover:opacity-80 transition-opacity"
                            >
                              Limpar filtros
                            </button>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Categoria</label>
                            <div className="relative group">
                              <select
                                value={categoriaFilter}
                                onChange={(e) => setCategoriaFilter(e.target.value)}
                                className="w-full h-11 pl-4 pr-10 rounded-xl border border-border bg-[#F8F9FA] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer"
                              >
                                <option value="Todas">Todas as categorias</option>
                                {availableCategories.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none group-hover:text-foreground transition-colors" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Período</label>
                            <div className="relative group">
                              <select
                                value={periodFilter}
                                onChange={(e) => setPeriodFilter(e.target.value)}
                                className="w-full h-11 pl-4 pr-10 rounded-xl border border-border bg-[#F8F9FA] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer"
                              >
                                {["Todas", "Hoje", "Esta semana", "Este mês", "Últimos 3 meses"].map((p) => (
                                  <option key={p} value={p}>{p === "Todas" ? "Todo o período" : p}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none group-hover:text-foreground transition-colors" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Método de Pagamento</label>
                            <div className="relative group">
                              <select
                                value={metodoFilter}
                                onChange={(e) => setMetodoFilter(e.target.value)}
                                className="w-full h-11 pl-4 pr-10 rounded-xl border border-border bg-[#F8F9FA] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer"
                              >
                                <option value="Todos">Todos os métodos</option>
                                {availableMethods.map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none group-hover:text-foreground transition-colors" />
                            </div>
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
                        <th className="text-left font-medium py-3 px-4">Categoria</th>
                        <th className="text-left font-medium py-3 px-4">Período</th>
                        <th className="text-left font-medium py-3 px-4">Descrição</th>
                        <th className="text-left font-medium py-3 px-4">Quantia</th>
                        <th className="text-left font-medium py-3 px-4">Método</th>
                        <th className="text-center font-medium py-3 px-4">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {loading ? (
                        <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">Carregando...</td></tr>
                      ) : paginatedTransactions.length === 0 ? (
                        <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">Nenhuma transação encontrada.</td></tr>
                      ) : paginatedTransactions.map((tx) => {
                        const isEntrada = tx.tipo === "entrada";
                        return (
                          <tr key={tx.id} className="text-sm hover:bg-muted/30 transition">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`size-8 rounded-full flex items-center justify-center ${isEntrada ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                                  <Wallet className="size-4" />
                                </div>
                                <span className="font-medium whitespace-nowrap">{tx.categoria || "Geral"}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-muted-foreground whitespace-nowrap">
                              {(() => {
                                if (!tx.data_inicio) return "—";
                                const startStr = formatDisplayDate(tx.data_inicio);
                                if (!tx.data_fim || tx.data_inicio === tx.data_fim) return startStr;
                                const endStr = formatDisplayDate(tx.data_fim);
                                return `${startStr} até ${endStr}`;
                              })()}
                            </td>
                            <td className="py-4 px-4 text-muted-foreground truncate max-w-[200px]">{tx.descricao || "-"}</td>
                            <td className={`py-4 px-4 font-semibold tabular-nums whitespace-nowrap ${isEntrada ? 'text-success' : 'text-danger'}`}>
                              {isEntrada ? '+' : '-'}{formatCurrency(tx.valor, effectiveMoeda)}
                            </td>
                            <td className="py-4 px-4">
                              <span className="px-2 py-1 bg-muted rounded-md text-[11px] font-medium whitespace-nowrap">{tx.metodo_pagamento || "N/A"}</span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <button 
                                onClick={() => setDeleteTarget(tx)}
                                className="p-1 text-muted-foreground hover:text-danger transition-colors inline-flex items-center justify-center"
                                title="Excluir transação"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-80 space-y-6 shrink-0">
              <InvoiceCard transactions={transactions} moeda={effectiveMoeda} />
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold tracking-tight">Distribuição dos Gastos</h3>
                </div>
                
                <div className="relative h-[180px]">
                  {distributionData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={distributionData} 
                            dataKey="amount" 
                            innerRadius={55} 
                            outerRadius={80} 
                            paddingAngle={2} 
                            stroke="none"
                          >
                            {distributionData.map((d, i) => (
                              <Cell key={`cell-${i}`} fill={d.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Gastos</div>
                        <div className="text-lg font-bold tracking-tight">{formatCurrency(totals.periodSaidas, effectiveMoeda)}</div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                      Nenhum gasto no período
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-3 mt-4">
                  {distributionData.map((d) => (
                    <div key={d.name} className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-[10px] text-muted-foreground font-medium truncate">{d.name}</span>
                      </div>
                      <span className="text-xs font-bold tabular-nums ml-3.5">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <SubscriptionsCard usuarioId={usuarioId} moeda={effectiveMoeda} />
            </div>
          </div>
        </main>
      </div>
      <AddTransactionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchTransactions}
        moeda={effectiveMoeda}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !isDeleting) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Essa ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
              disabled={isDeleting}
              className="rounded-xl bg-danger text-danger-foreground hover:bg-danger/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
