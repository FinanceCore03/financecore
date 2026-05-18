import { useState, useMemo, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { createFileRoute } from "@tanstack/react-router";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell
} from "recharts";
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Home, 
  Utensils, 
  Car, 
  Gamepad2, 
  PiggyBank,
  Wallet,
  Settings,
  ShoppingBag,
  HeartPulse,
  BookOpen,
  Coffee,
  Plane,
  Gift
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/planning")({
  head: () => ({
    meta: [
      { title: "Planejamento — Financeiro Core" },
    ],
  }),
  component: () => <PlanningPage />,
});

const DEFAULT_PLANNING = [
  { name: "Moradia", budget: 2500, icon: Home, color: "#8B5CF6" },
  { name: "Alimentação", budget: 800, icon: Utensils, color: "#EC4899" },
  { name: "Transporte", budget: 500, icon: Car, color: "#3B82F6" },
  { name: "Lazer", budget: 300, icon: Gamepad2, color: "#F59E0B" },
  { name: "Economia", budget: 1200, icon: PiggyBank, color: "#10B981" },
];

function PlanningPage() {
  const { transactions, loading } = useDashboardData();
  const [activeTab, setActiveTab] = useState("overview");
  const [budgets, setBudgets] = useState(DEFAULT_PLANNING);

  const planningData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const spendingByCategory: Record<string, number> = {};
    
    transactions.forEach(tx => {
      const rawTipo = (tx.tipo || "").toLowerCase();
      const normalizedTipo = rawTipo.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      if (normalizedTipo === "saida" && tx.data_inicio) {
        const [year, month] = tx.data_inicio.split('-').map(Number);
        if (month - 1 === currentMonth && year === currentYear) {
          const cat = tx.categoria || "Outros";
          const val = parseFloat(tx.valor || "0");
          spendingByCategory[cat] = (spendingByCategory[cat] || 0) + val;
        }
      }
    });

    const categories = budgets.map(b => {
      const spent = spendingByCategory[b.name] || 0;
      const remaining = b.budget - spent;
      const percentage = Math.min((spent / b.budget) * 100, 150);
      const isOver = spent > b.budget;

      return {
        ...b,
        spent,
        remaining: Math.abs(remaining),
        percentage,
        isOver
      };
    });

    const totalPlanned = budgets.reduce((acc, curr) => acc + curr.budget, 0);
    const totalSpent = categories.reduce((acc, curr) => acc + curr.spent, 0);
    const difference = totalPlanned - totalSpent;

    return {
      categories,
      totalPlanned,
      totalSpent,
      difference
    };
  }, [transactions, budgets]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 px-8 py-6 space-y-6">
          <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">Planejamento</h1>
            <p className="text-sm text-muted-foreground">Gerencie suas metas mensais e acompanhe seus gastos por categoria.</p>
          </header>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
            <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-8">
              <TabsTrigger 
                value="overview" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 text-sm font-medium transition-all"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="categories" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 text-sm font-medium transition-all"
              >
                Categories
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 text-sm font-medium transition-all"
              >
                Analytics
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <TabsContent value="overview" className="m-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-none shadow-sm rounded-2xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Target className="size-4" />
                          Orçamento Planejado
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(planningData.totalPlanned)}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm rounded-2xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <TrendingDown className="size-4" />
                          Gasto Atual
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(planningData.totalSpent)}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm rounded-2xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <DollarSign className="size-4" />
                          Diferença
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${planningData.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(planningData.difference)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {planningData.categories.map((cat) => (
                      <Card key={cat.name} className="border-none shadow-sm rounded-2xl overflow-hidden group">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                                <cat.icon className="size-5" />
                              </div>
                              <span className="font-semibold text-[#1A1A1A]">{cat.name}</span>
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded-lg" style={{ backgroundColor: cat.isOver ? '#FEE2E2' : '#DCFCE7', color: cat.isOver ? '#EF4444' : '#22C55E' }}>
                              {cat.percentage.toFixed(0)}%
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Gasto: {formatCurrency(cat.spent)}</span>
                              <span className="font-medium">Meta: {formatCurrency(cat.budget)}</span>
                            </div>
                            <Progress 
                              value={cat.percentage} 
                              className="h-2 bg-slate-100"
                              style={{ 
                                "--progress-background": cat.isOver ? "#EF4444" : "oklch(0.62 0.18 290)" 
                              } as React.CSSProperties}
                            />
                          </div>

                          <div className="pt-2 flex items-center justify-between border-t border-slate-50 mt-4">
                            <span className="text-xs text-muted-foreground">
                              {cat.isOver ? "Excedido" : "Restante"}
                            </span>
                            <span className={`text-sm font-bold ${cat.isOver ? 'text-red-500' : 'text-green-500'}`}>
                              {formatCurrency(cat.remaining)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="categories" className="m-0">
                  <Card className="border-none shadow-sm rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Ajustar Metas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 p-6">
                      {planningData.categories.map((cat, index) => (
                        <div key={cat.name} className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                                <cat.icon className="size-4" />
                              </div>
                              <span className="font-medium">{cat.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Meta planejada</p>
                                <p className="font-bold">{formatCurrency(cat.budget)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Gasto atual</p>
                                <p className="font-medium">{formatCurrency(cat.spent)}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Slider 
                              defaultValue={[cat.budget]} 
                              max={5000} 
                              step={50}
                              onValueChange={(val) => {
                                const newBudgets = [...budgets];
                                newBudgets[index].budget = val[0];
                                setBudgets(newBudgets);
                              }}
                              className="py-2"
                            />
                            <div className="flex justify-between items-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${cat.isOver ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {cat.isOver ? 'Acima do limite' : 'Dentro do limite'}
                              </span>
                              <span className="text-xs text-muted-foreground">Arraste para ajustar o planejamento</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="m-0">
                  <Card className="border-none shadow-sm rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Análise do Planejamento</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-[400px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={planningData.categories}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            barGap={8}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#64748B', fontSize: 12 }}
                              dy={10}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#64748B', fontSize: 12 }}
                              tickFormatter={(value) => `R$ ${value}`}
                            />
                            <Tooltip 
                              cursor={{ fill: '#F8FAFC' }}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                              formatter={(value: any) => [formatCurrency(Number(value)), ""]}
                            />
                            <Legend 
                              verticalAlign="bottom" 
                              height={36} 
                              iconType="circle"
                              wrapperStyle={{ paddingTop: '20px' }}
                            />
                            <Bar 
                              name="Planejado" 
                              dataKey="budget" 
                              fill="#E2E8F0" 
                              radius={[4, 4, 0, 0]} 
                              barSize={32}
                            />
                            <Bar 
                              name="Gasto atual" 
                              dataKey="spent" 
                              fill="oklch(0.62 0.18 290)" 
                              radius={[4, 4, 0, 0]} 
                              barSize={32}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>

          <footer className="text-center text-xs text-muted-foreground pt-4 pb-2">
            Financeiro Core © 2025
          </footer>
        </main>
      </div>
    </div>
  );
}
