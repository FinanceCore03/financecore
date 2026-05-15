import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Wallet, TrendingUp, TrendingDown, MoreHorizontal, Search, Filter, Plus, ShoppingBag, Car, Utensils, Briefcase, Tv, Dumbbell, Home, Pill as PillIcon, CreditCard, Send, ArrowUpRight, ArrowDownRight, Banknote } from "lucide-react";
import { ExpenseDoughnutChart } from "@/components/dashboard/ExpenseDoughnutChart";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Transações — Financeiro Core" },
    ],
  }),
  component: () => <TransactionsPage />,
});

const transactions = [
  { id: 1, category: "Salário", icon: Wallet, color: "bg-success-soft text-success", date: "10/11/2025", time: "08:15", amount: "+R$ 5.000,00", method: "Pix" },
  { id: 2, category: "Mercado", icon: ShoppingBag, color: "bg-primary-soft text-primary", date: "11/11/2025", time: "14:20", amount: "-R$ 320,00", method: "Cartão de Débito" },
  { id: 3, category: "Transporte", icon: Car, color: "bg-info-soft text-info", date: "12/11/2025", time: "09:40", amount: "-R$ 48,00", method: "Cartão de Crédito" },
  { id: 4, category: "Restaurante", icon: Utensils, color: "bg-warning-soft text-warning", date: "12/11/2025", time: "21:10", amount: "-R$ 120,00", method: "Pix" },
  { id: 5, category: "Freelance", icon: Briefcase, color: "bg-primary-soft text-primary", date: "13/11/2025", time: "16:30", amount: "+R$ 800,00", method: "Transferência" },
  { id: 6, category: "Netflix", icon: Tv, color: "bg-danger-soft text-danger", date: "14/11/2025", time: "07:00", amount: "-R$ 39,90", method: "Cartão de Crédito" },
  { id: 7, category: "Academia", icon: Dumbbell, color: "bg-info-soft text-info", date: "15/11/2025", time: "10:00", amount: "-R$ 99,90", method: "Cartão de Crédito" },
  { id: 8, category: "Aluguel", icon: Home, color: "bg-danger-soft text-danger", date: "05/11/2025", time: "08:00", amount: "-R$ 1.200,00", method: "Pix" },
  { id: 9, category: "Farmácia", icon: PillIcon, color: "bg-warning-soft text-warning", date: "16/11/2025", time: "18:45", amount: "-R$ 85,00", method: "Cartão de Débito" },
  { id: 10, category: "Uber", icon: Car, color: "bg-info-soft text-info", date: "17/11/2025", time: "22:15", amount: "-R$ 42,00", method: "Cartão de Crédito" },
];

const categories = [
  { name: "Moradia", pct: 42, color: "bg-primary" },
  { name: "Alimentação", pct: 24, color: "bg-chart-2" },
  { name: "Transporte", pct: 13, color: "bg-chart-4" },
  { name: "Lazer", pct: 11, color: "bg-chart-3" },
  { name: "Assinaturas", pct: 6, color: "bg-chart-5" },
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
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 px-8 py-6 space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Total em Conta</span>
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Banknote className="size-4" />
                </div>
              </div>
              <div className="text-xl font-bold tracking-tight">R$ 12.450,00</div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-[10px] text-success font-medium">+2.5%</span>
                <span className="text-[10px] text-muted-foreground">vs mês ant.</span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Entradas</span>
                <div className="size-8 rounded-lg bg-success/10 text-success flex items-center justify-center">
                  <ArrowUpRight className="size-4" />
                </div>
              </div>
              <div className="text-xl font-bold tracking-tight text-success">R$ 5.800,00</div>
              <div className="flex items-center gap-1 mt-2 text-[10px]">
                <span className="text-success font-medium">85% da meta</span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Saídas</span>
                <div className="size-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center">
                  <ArrowDownRight className="size-4" />
                </div>
              </div>
              <div className="text-xl font-bold tracking-tight text-danger">R$ 3.240,00</div>
              <div className="flex items-center gap-1 mt-2 text-[10px]">
                <span className="text-danger font-medium">12% a mais que out</span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Economia no Mês</span>
                <div className="size-8 rounded-lg bg-info/10 text-info flex items-center justify-center">
                  <TrendingUp className="size-4" />
                </div>
              </div>
              <div className="text-xl font-bold tracking-tight text-primary">R$ 2.560,00</div>
              <div className="flex items-center gap-1 mt-2 text-[10px]">
                <span className="text-primary font-medium">44% das entradas</span>
              </div>
            </div>
          </div>

          {/* Page Title */}
          <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Transações</h1>
            <p className="text-sm text-muted-foreground">Visualize e gerencie suas entradas e saídas em um só lugar.</p>
          </header>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column: Stats & Main Table */}
            <div className="flex-1 space-y-6 min-w-0">
              {/* Resumo Cards (Existing Stats) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <div className="size-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-4">
                    <Wallet className="size-5" />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Total de Transações</div>
                  <div className="text-2xl font-semibold tracking-tight">R$ 6.358,00</div>
                  <div className="text-xs text-success font-medium mt-2">+6,4% em relação ao mês passado</div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <div className="size-10 rounded-xl bg-success-soft text-success flex items-center justify-center mb-4">
                    <TrendingUp className="size-5" />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Entradas</div>
                  <div className="text-2xl font-semibold tracking-tight">R$ 4.296,00</div>
                  <div className="text-xs text-success font-medium mt-2">Crescimento positivo</div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <div className="size-10 rounded-xl bg-danger-soft text-danger flex items-center justify-center mb-4">
                    <TrendingDown className="size-5" />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Saídas</div>
                  <div className="text-2xl font-semibold tracking-tight">R$ 2.356,00</div>
                  <div className="text-xs text-danger font-medium mt-2">Aumento de gastos</div>
                </div>
              </div>

              {/* Transactions Activity Card */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
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
                    <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition">
                      <Filter className="size-4" />
                      <span>Filtrar</span>
                    </button>
                    <button className="p-1.5 border border-border rounded-lg text-muted-foreground hover:bg-muted transition">
                      <MoreHorizontal className="size-4" />
                    </button>
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
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="text-sm hover:bg-muted/30 transition">
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-3">
                              <div className={`size-8 rounded-full flex items-center justify-center ${tx.color}`}>
                                <tx.icon className="size-4" />
                              </div>
                              <span className="font-medium">{tx.category}</span>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-muted-foreground">{tx.date}</td>
                          <td className="py-4 px-2 text-muted-foreground">{tx.time}</td>
                          <td className={`py-4 px-2 font-semibold tabular-nums ${tx.amount.startsWith('+') ? 'text-success' : 'text-danger'}`}>
                            {tx.amount}
                          </td>
                          <td className="py-4 px-2">
                            <span className="px-2 py-1 bg-muted rounded-md text-[11px] font-medium">{tx.method}</span>
                          </td>
                          <td className="py-4 px-2 text-right">
                            <button className="p-1 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                  <span className="text-xs text-muted-foreground">Exibindo 10 de 45 transações</span>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 border border-border rounded text-xs font-medium hover:bg-muted disabled:opacity-50" disabled>Anterior</button>
                    <button className="px-3 py-1 border border-primary bg-primary text-primary-foreground rounded text-xs font-medium">1</button>
                    <button className="px-3 py-1 border border-border rounded text-xs font-medium hover:bg-muted">2</button>
                    <button className="px-3 py-1 border border-border rounded text-xs font-medium hover:bg-muted">3</button>
                    <button className="px-3 py-1 border border-border rounded text-xs font-medium hover:bg-muted">Próximo</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Distribution & Subscriptions */}
            <div className="w-full lg:w-80 space-y-6 shrink-0">
              {/* Distribution Doughnut Chart Card */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold tracking-tight">Distribuição dos Gastos</h3>
                  <button className="text-[11px] text-primary font-semibold hover:underline">Ver detalhes</button>
                </div>
                
                <ExpenseDoughnutChart data={categories} />
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