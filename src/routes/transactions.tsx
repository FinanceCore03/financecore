import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Wallet, TrendingUp, TrendingDown, MoreHorizontal, Search, Filter, Plus, ShoppingBag, Car, Utensils, Briefcase, Tv, Dumbbell, Home, Pill as PillIcon, PiggyBank, Trash2, ChevronDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
import { toast } from "sonner";

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
  const [periodFilter, setPeriodFilter] = useState("Este mês");
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    console.log("Usuário autenticado atual (auth.user.id):", user?.id);

    if (user) {
      const { data: usuario, error: usuarioError } = await supabase
        .from("Usuarios")
        .select("id")
        .eq("id_auth", user.id)
        .maybeSingle();

      console.log("Resultado encontrado na tabela Usuarios:", usuario || "Não encontrado");

      if (usuario) {
        setUsuarioId(usuario.id);
        console.log("ID do usuário interno:", usuario.id);
        
        const { data, error: transacoesError } = await supabase
          .from("Transacoes")
          .select("*")
          .eq("id_usuario", usuario.id)
          .order("data", { ascending: false });
        
        if (data) {
          setTransactions(data);
          console.log("Quantidade de transações encontradas:", data.length);
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

  const deleteTransaction = async (id: number) => {
    if (!usuarioId) return;
    
    const { error } = await supabase
      .from("Transacoes")
      .delete()
      .eq("id", id)
      .eq("id_usuario", usuarioId);

    if (!error) {
      toast.success("Transação excluída.");
      setTransactions(prev => prev.filter(tx => tx.id !== id));
    } else {
      toast.error("Erro ao excluir transação.");
    }
  };

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    const now = new Date();
    
    // As per user request, table activity can show all by default or respect filter if applied.
    // The request said: "Os cards ... devem respeitar o período selecionado. A tabela ... pode continuar mostrando todas ... a menos que o filtro seja aplicado diretamente"
    // However, typical behavior is to filter the table too. Let's filter it.
    
    return transactions.filter(tx => {
      if (periodFilter === "Todas") return true;
      if (!tx.data) return true;
      const txDate = new Date(tx.data);
      
      if (periodFilter === "Hoje") {
        return txDate.toDateString() === now.toDateString();
      }
      
      if (periodFilter === "Esta semana") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return txDate >= startOfWeek;
      }
      
      if (periodFilter === "Este mês") {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      
      if (periodFilter === "Últimos 3 meses") {
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        threeMonthsAgo.setHours(0, 0, 0, 0);
        return txDate >= threeMonthsAgo;
      }
      
      return true;
    });
  }, [transactions, periodFilter]);

  const totals = useMemo(() => {
    const now = new Date();
    
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
      if (periodFilter !== "Todas" && tx.data) {
        const txDate = new Date(tx.data);
        if (periodFilter === "Hoje") {
          inPeriod = txDate.toDateString() === now.toDateString();
        } else if (periodFilter === "Esta semana") {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          inPeriod = txDate >= startOfWeek;
        } else if (periodFilter === "Este mês") {
          inPeriod = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        } else if (periodFilter === "Últimos 3 meses") {
          const threeMonthsAgo = new Date(now);
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          threeMonthsAgo.setHours(0, 0, 0, 0);
          inPeriod = txDate >= threeMonthsAgo;
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
    transactions
      .filter(tx => {
        if (tx.tipo !== "saida") return false;
        if (!tx.data) return true;
        const txDate = new Date(tx.data);
        if (periodFilter === "Hoje") return txDate.toDateString() === now.toDateString();
        if (periodFilter === "Esta semana") {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          return txDate >= startOfWeek;
        }
        if (periodFilter === "Este mês") return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        if (periodFilter === "Últimos 3 meses") {
          const threeMonthsAgo = new Date(now);
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          threeMonthsAgo.setHours(0, 0, 0, 0);
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

  const economyValue = totals.periodEntradas - totals.periodSaidas;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 px-8 py-6 space-y-6">
          <header className="flex flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">Transações</h1>
              <p className="text-sm text-muted-foreground">Visualize e gerencie suas entradas e saídas em um só lugar.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition shadow-sm"
                >
                  <span>{periodFilter}</span>
                  <ChevronDown className={`size-4 text-muted-foreground transition-transform ${isPeriodOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isPeriodOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                    {["Hoje", "Esta semana", "Este mês", "Últimos 3 meses"].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setPeriodFilter(option);
                          setIsPeriodOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${periodFilter === option ? 'text-primary font-medium bg-primary/5' : 'text-foreground'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
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
              <div className="text-2xl font-semibold tracking-tight">R$ {totals.totalAccount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs text-success font-medium mt-2">Saldo total disponível</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="size-10 rounded-xl bg-success-soft text-success flex items-center justify-center mb-4">
                <TrendingUp className="size-5" />
              </div>
              <div className="text-xs text-muted-foreground mb-1">Entradas ({periodFilter === "Este mês" ? "Mês" : periodFilter})</div>
              <div className="text-2xl font-semibold tracking-tight">R$ {totals.periodEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs text-success font-medium mt-2">Total recebido no período</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="size-10 rounded-xl bg-danger-soft text-danger flex items-center justify-center mb-4">
                <TrendingDown className="size-5" />
              </div>
              <div className="text-xs text-muted-foreground mb-1">Saídas ({periodFilter === "Este mês" ? "Mês" : periodFilter})</div>
              <div className="text-2xl font-semibold tracking-tight">R$ {totals.periodSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs text-danger font-medium mt-2">Total gasto no período</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className={`size-10 rounded-xl flex items-center justify-center mb-4 ${economyValue >= 0 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                <PiggyBank className="size-5" />
              </div>
              <div className="text-xs text-muted-foreground mb-1">Economia ({periodFilter === "Este mês" ? "Mês" : periodFilter})</div>
              <div className="text-2xl font-semibold tracking-tight">R$ {economyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
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
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b border-border">
                        <th className="text-left font-medium py-3 px-2">Categoria</th>
                        <th className="text-left font-medium py-3 px-2">Data</th>
                        <th className="text-left font-medium py-3 px-2">Descrição</th>
                        <th className="text-left font-medium py-3 px-2">Quantia</th>
                        <th className="text-left font-medium py-3 px-2">Método</th>
                        <th className="text-right font-medium py-3 px-2">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {loading ? (
                        <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">Carregando...</td></tr>
                      ) : filteredTransactions.length === 0 ? (
                        <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">Nenhuma transação encontrada.</td></tr>
                      ) : filteredTransactions.map((tx) => {
                        const isEntrada = tx.tipo === "entrada";
                        const dateObj = tx.data ? new Date(tx.data) : null;
                        return (
                          <tr key={tx.id} className="text-sm hover:bg-muted/30 transition">
                            <td className="py-4 px-2">
                              <div className="flex items-center gap-3">
                                <div className={`size-8 rounded-full flex items-center justify-center ${isEntrada ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                                  <Wallet className="size-4" />
                                </div>
                                <span className="font-medium">{tx.categoria || "Geral"}</span>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-muted-foreground">{dateObj?.toLocaleDateString('pt-BR') || "-"}</td>
                            <td className="py-4 px-2 text-muted-foreground truncate max-w-[150px]">{tx.descricao || "-"}</td>
                            <td className={`py-4 px-2 font-semibold tabular-nums ${isEntrada ? 'text-success' : 'text-danger'}`}>
                              {isEntrada ? '+' : '-'}R$ {parseFloat(tx.valor || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-2">
                              <span className="px-2 py-1 bg-muted rounded-md text-[11px] font-medium">{tx.metodo_pagamento || "N/A"}</span>
                            </td>
                            <td className="py-4 px-2 text-right">
                              <button 
                                onClick={() => deleteTransaction(tx.id)}
                                className="p-1 text-muted-foreground hover:text-danger transition-colors"
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
                        <div className="text-lg font-bold tracking-tight">R$ {totals.periodSaidas.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
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
            </div>
          </div>
        </main>
      </div>
      <AddTransactionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchTransactions}
      />
    </div>
  );
}
