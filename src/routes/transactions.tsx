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
import { PageTransition, AnimatedItem } from "@/components/PageTransition";

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
    
    if (user) {
      const { data: usuario, error: usuarioError } = await supabase
        .from("Usuarios")
        .select("id, Moeda")
        .eq("id_auth", user.id)
        .maybeSingle();

      if (usuario) {
        setUsuarioId(usuario.id);
        setMoeda(usuario.Moeda || "Real");
        
        const { data: transacoes, error } = await supabase
          .from("Transacoes")
          .select("*")
          .eq("id_usuario", usuario.id)
          .order("data_inicio", { ascending: false });
        
        if (transacoes) {
          setTransactions(transacoes);
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
      
      if (isEntrada) totalAccount += val;
      else totalAccount -= val;

      let inPeriod = true;
      if (periodFilter !== "Todas" && tx.data_inicio) {
        const txDate = parseISOAsLocal(tx.data_inicio);
        if (txDate) {
          if (periodFilter === "Hoje") inPeriod = txDate.getTime() === today.getTime();
          else if (periodFilter === "Esta semana") {
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

    return { totalAccount, periodEntradas, periodSaidas };
  }, [transactions, periodFilter]);

  const distributionData = useMemo(() => {
    const categoriesMap: Record<string, number> = {};
    let totalExps = 0;
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
                        <span>{periodFilter}</span>
                        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${isPeriodOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-48 p-1 rounded-xl border-border shadow-lg bg-white">
                      {["Todas", "Hoje", "Esta semana", "Este mês", "Últimos 3 meses"].map((option) => (
                        <button
                          key={option}
                          onClick={() => { setPeriodFilter(option); setIsPeriodOpen(false); }}
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
                  <div className="text-2xl font-semibold tracking-tight">{formatCurrency(totals.totalAccount, effectiveMoeda)}</div>
                </div>
              </AnimatedItem>
              <AnimatedItem>
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm h-full">
                  <div className="size-10 rounded-xl bg-success-soft text-success flex items-center justify-center mb-4">
                    <TrendingUp className="size-5" />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Entradas</div>
                  <div className="text-2xl font-semibold tracking-tight">{formatCurrency(totals.periodEntradas, effectiveMoeda)}</div>
                </div>
              </AnimatedItem>
              <AnimatedItem>
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm h-full">
                  <div className="size-10 rounded-xl bg-danger-soft text-danger flex items-center justify-center mb-4">
                    <TrendingDown className="size-5" />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Saídas</div>
                  <div className="text-2xl font-semibold tracking-tight">{formatCurrency(totals.periodSaidas, effectiveMoeda)}</div>
                </div>
              </AnimatedItem>
              <AnimatedItem>
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm h-full">
                  <div className={`size-10 rounded-xl flex items-center justify-center mb-4 ${economyValue >= 0 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                    <PiggyBank className="size-5" />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Economia</div>
                  <div className="text-2xl font-semibold tracking-tight">{formatCurrency(economyValue, effectiveMoeda)}</div>
                </div>
              </AnimatedItem>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <AnimatedItem className="flex-1 min-w-0">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-full">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <h3 className="font-semibold text-lg tracking-tight">Atividade</h3>
                    <div className="flex items-center gap-3">
                      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <PopoverTrigger asChild>
                          <button className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition shadow-sm">
                            <Filter className="size-4 text-muted-foreground" />
                            <span>Filtrar</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-72 rounded-2xl p-5 shadow-xl border-border bg-white">
                          <div className="space-y-4">
                              <h4 className="font-bold text-sm">Filtros</h4>
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
                        {paginatedTransactions.map((tx) => (
                          <tr key={tx.id} className="text-sm hover:bg-muted/30 transition">
                            <td className="py-4 px-4 font-medium">{tx.categoria || "Geral"}</td>
                            <td className="py-4 px-4 text-muted-foreground">
                              {tx.data_fim ? `${formatDisplayDate(tx.data_inicio)} - ${formatDisplayDate(tx.data_fim)}` : formatDisplayDate(tx.data_inicio)}
                            </td>
                            <td className="py-4 px-4 text-muted-foreground max-w-[200px] truncate">{tx.descricao || "—"}</td>
                            <td className={`py-4 px-4 font-semibold ${tx.tipo === 'entrada' ? 'text-success' : 'text-danger'}`}>
                              {tx.tipo === 'entrada' ? '+' : '-'}{formatCurrency(tx.valor, effectiveMoeda)}
                            </td>
                            <td className="py-4 px-4 text-muted-foreground">{tx.metodo_pagamento || "—"}</td>
                            <td className="py-4 px-4 text-center">
                              <button onClick={() => setDeleteTarget(tx)} className="p-1 text-muted-foreground hover:text-danger transition-colors"><Trash2 size={16}/></button>
                            </td>
                          </tr>
                        ))}
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