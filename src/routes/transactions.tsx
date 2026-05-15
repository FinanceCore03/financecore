import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Wallet, TrendingUp, TrendingDown, MoreHorizontal, Search, Filter, Plus, ShoppingBag, Car, Utensils, Briefcase, Tv, Dumbbell, Home, Pill as PillIcon, PiggyBank, Trash2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Transações — Financeiro Core" },
    ],
  }),
  component: () => <TransactionsPage />,
});

// As variáveis de estado e efeitos foram movidas para dentro do componente TransactionsPage

const distributionData = [
  { name: "Moradia", value: 42, color: "var(--primary)" },
  { name: "Alimentação", value: 24, color: "#8E9196" }, // Soft Neutral
  { name: "Transporte", value: 13, color: "#D3E4FD" }, // Soft Blue
  { name: "Lazer", value: 11, color: "#FDE1D3" }, // Soft Orange/Peach
  { name: "Assinaturas", value: 6, color: "#FEC6A1" }, // Soft Orange
  { name: "Outros", value: 4, color: "#E5DEFF" }, // Soft Purple
];

const subscriptions = [
  { name: "Netflix", icon: Tv, color: "bg-danger-soft text-danger", price: "R$ 39,90", period: "Mensal" },
  { name: "Spotify", icon: Tv, color: "bg-success-soft text-success", price: "R$ 21,90", period: "Mensal" },
  { name: "YouTube Premium", icon: Tv, color: "bg-danger-soft text-danger", price: "R$ 24,90", period: "Mensal" },
  { name: "Google One", icon: Wallet, color: "bg-info-soft text-info", price: "R$ 9,90", period: "Mensal" },
  { name: "iCloud", icon: Wallet, color: "bg-info-soft text-info", price: "R$ 14,90", period: "Mensal" },
  { name: "Amazon Prime", icon: ShoppingBag, color: "bg-warning-soft text-warning", price: "R$ 19,90", period: "Mensal" },
];

function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Primeiro buscamos o ID do usuário na tabela Usuarios usando o id_auth (UUID do Supabase Auth)
        const { data: userData } = await supabase
          .from("Usuarios")
          .select("id")
          .eq("id_auth", session.user.id)
          .single();

        if (userData) {
          // Agora filtramos as transações usando o ID interno (id_usuario)
          const { data, error } = await supabase
            .from("Transacoes")
            .select("*")
            .eq("id_usuario", userData.id)
            .order("data", { ascending: false });
          
          if (data) {
            setTransactions(data);
          }
        }
      }
      setLoading(false);
    };
    fetchTransactions();
  }, []);

  const deleteTransaction = async (id: number) => {
    const { error } = await supabase.from("Transacoes").delete().eq("id", id);
    if (!error) {
      setTransactions(prev => prev.filter(tx => tx.id !== id));
    }
  };

  const totals = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalAccount = 0;
    let monthEntradas = 0;
    let monthSaidas = 0;

    transactions.forEach(tx => {
      const val = parseFloat(tx.valor || "0");
      const isEntrada = tx.tipo === "entrada";
      
      // Total account: sum all entries, subtract all exits
      if (isEntrada) totalAccount += val;
      else totalAccount -= val;

      // Current month stats
      if (tx.data) {
        const txDate = new Date(tx.data);
        if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
          if (isEntrada) monthEntradas += val;
          else monthSaidas += val;
        }
      }
    });

    return { totalAccount, monthEntradas, monthSaidas };
  }, [transactions]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 px-8 py-6 space-y-6">
          <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Transações</h1>
            <p className="text-sm text-muted-foreground">Visualize e gerencie suas entradas e saídas em um só lugar.</p>
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
              <div className="text-xs text-muted-foreground mb-1">Entradas (Mês)</div>
              <div className="text-2xl font-semibold tracking-tight">R$ {totals.monthEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs text-success font-medium mt-2">Total recebido este mês</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="size-10 rounded-xl bg-danger-soft text-danger flex items-center justify-center mb-4">
                <TrendingDown className="size-5" />
              </div>
              <div className="text-xs text-muted-foreground mb-1">Saídas (Mês)</div>
              <div className="text-2xl font-semibold tracking-tight">R$ {totals.monthSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs text-danger font-medium mt-2">Total gasto este mês</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="size-10 rounded-xl bg-success-soft text-success flex items-center justify-center mb-4">
                <PiggyBank className="size-5" />
              </div>
              <div className="text-xs text-muted-foreground mb-1">Economia no Mês</div>
              <div className="text-2xl font-semibold tracking-tight">R$ {(totals.monthEntradas - totals.monthSaidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs text-success font-medium mt-2">Balanço mensal</div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-full">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <h3 className="font-semibold text-lg tracking-tight">Atividade de Transações</h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Buscar transação" 
                        className="bg-muted/50 border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-48"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b border-border">
                        <th className="text-left font-medium py-3 px-2">Categoria</th>
                        <th className="text-left font-medium py-3 px-2">Data</th>
                        <th className="text-left font-medium py-3 px-2">Horário</th>
                        <th className="text-left font-medium py-3 px-2">Quantia</th>
                        <th className="text-left font-medium py-3 px-2">Método</th>
                        <th className="text-right font-medium py-3 px-2">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {loading ? (
                        <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">Carregando...</td></tr>
                      ) : transactions.length === 0 ? (
                        <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">Nenhuma transação encontrada.</td></tr>
                      ) : transactions.map((tx) => {
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
                            <td className="py-4 px-2 text-muted-foreground">{dateObj?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || "-"}</td>
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

            {/* Right Column: Distribution & Subscriptions */}
            <div className="w-full lg:w-80 space-y-6 shrink-0">
              {/* Distribution Donut Chart Card */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold tracking-tight">Distribuição dos Gastos</h3>
                  <button className="text-[11px] text-primary font-semibold hover:underline">Ver detalhes</button>
                </div>
                
                <div className="relative h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={distributionData} 
                        dataKey="value" 
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
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total</div>
                    <div className="text-lg font-bold tracking-tight">R$ 2.356</div>
                  </div>
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

              {/* Subscriptions Card */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold tracking-tight">Assinaturas</h3>
                  <button className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-[11px] font-semibold hover:bg-primary/20 transition">
                    <Plus className="size-3" />
                    <span>Adicionar</span>
                  </button>
                </div>

                <div className="divide-y divide-border">
                  {subscriptions.map((sub) => (
                    <div key={sub.name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className={`size-8 rounded-lg flex items-center justify-center ${sub.color}`}>
                          <sub.icon className="size-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{sub.name}</div>
                          <div className="text-[10px] text-muted-foreground">{sub.period}</div>
                        </div>
                      </div>
                      <div className="text-xs font-semibold tabular-nums">{sub.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <footer className="text-center text-xs text-muted-foreground pt-4 pb-2">
            Financeiro Core © 2025
          </footer>
        </main>
      </div>
    </div>
  );
}