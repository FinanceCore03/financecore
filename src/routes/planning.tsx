import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const categoryIcons: Record<string, any> = {
  "Moradia": Home,
  "Alimentação": Utensils,
  "Transporte": Car,
  "Lazer": Gamepad2,
  "Economia": PiggyBank,
  "Saúde": HeartPulse,
  "Educação": BookOpen,
  "Compras": ShoppingBag,
  "Viagem": Plane,
  "Presentes": Gift,
  "Café": Coffee,
};

const categoryColors: Record<string, string> = {
  "Moradia": "#8B5CF6",
  "Alimentação": "#EC4899",
  "Transporte": "#3B82F6",
  "Lazer": "#F59E0B",
  "Economia": "#10B981",
  "Saúde": "#EF4444",
  "Educação": "#6366F1",
  "Compras": "#F43F5E",
  "Viagem": "#0EA5E9",
  "Presentes": "#D946EF",
  "Café": "#92400E",
};

function PlanningPage() {
  const { transactions, loading: dashboardLoading, usuarioId } = useDashboardData();
  const [activeTab, setActiveTab] = useState("overview");
  const [dbBudgets, setDbBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = async () => {
    if (!usuarioId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("Planejamento")
        .select("*")
        .eq("id_usuario", usuarioId);
      
      if (error) throw error;
      setDbBudgets(data || []);
    } catch (error) {
      console.error("Erro ao buscar planejamentos:", error);
      toast.error("Erro ao carregar planejamentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (usuarioId) {
      fetchBudgets();
    }
  }, [usuarioId]);

  const planningData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const spendingByCategory: Record<string, number> = {};
    
    transactions.forEach(tx => {
      const rawTipo = (tx.tipo || "").toLowerCase();
      const normalizedTipo = rawTipo.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      if (normalizedTipo === "saida") {
        const cat = tx.categoria || "Outros";

        if (tx.data_inicio) {
          const [year, month] = tx.data_inicio.split('-').map(Number);
          if (month - 1 === currentMonth && year === currentYear) {
            const val = parseFloat(tx.valor || "0");
            spendingByCategory[cat] = (spendingByCategory[cat] || 0) + val;
          }
        }
      }
    });

    const categories = dbBudgets.map(item => {
      const name = item.Categoria || "Sem nome";
      const budget = parseFloat(item.Valor || "0");
      const spent = spendingByCategory[name] || 0;
      const remaining = budget - spent;
      
      // Calculate percentage avoiding division by zero
      let percentage = 0;
      if (budget > 0) {
        percentage = Math.min((spent / budget) * 100, 150);
      } else if (spent > 0) {
        percentage = 150; // Visual indicator that it's over budget (since budget is 0)
      }
      
      const isOver = budget > 0 ? spent > budget : spent > 0;
      const Icon = categoryIcons[name] || Wallet;
      const color = categoryColors[name] || "#94A3B8";

      return {
        id: item.id,
        name,
        budget,
        spent,
        remaining: Math.abs(remaining),
        percentage,
        isOver,
        icon: Icon,
        color
      };
    });

    const totalPlanned = categories.reduce((acc, curr) => acc + curr.budget, 0);
    const totalSpent = categories.reduce((acc, curr) => acc + curr.spent, 0);
    const difference = totalPlanned - totalSpent;

    return {
      categories,
      totalPlanned,
      totalSpent,
      difference
    };
  }, [transactions, dbBudgets]);

  const handleBudgetChange = async (id: number, value: number) => {
    // Ensure minimum value is 0
    const finalValue = Math.max(0, value);
    
    console.log("Atualizando valor planejado:", id, finalValue);
    
    try {
      const { error } = await supabase
        .from("Planejamento")
        .update({ Valor: finalValue.toString() })
        .eq("id", id);
      
      if (error) {
        console.log("Erro ao atualizar Planejamento:", error);
        throw error;
      }
      
      // Update local state for immediate feedback
      setDbBudgets(prev => prev.map(item => item.id === id ? { ...item, Valor: finalValue.toString() } : item));
    } catch (error) {
      console.error("Erro ao atualizar planejamento:", error);
      toast.error("Erro ao salvar alteração.");
    }
  };

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
        <main className="flex-1 px-8 py-6 space-y-8">
          <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">Planejamento</h1>
            <p className="text-sm text-muted-foreground">Gerencie suas metas mensais e acompanhe seus gastos por categoria.</p>
          </header>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
            <TabsList className="bg-[#F1F3F5] p-1 h-11 rounded-xl w-fit inline-flex">
              <TabsTrigger 
                value="overview" 
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm px-6 py-2 text-sm font-medium transition-all duration-200"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="categories" 
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm px-6 py-2 text-sm font-medium transition-all duration-200"
              >
                Categories
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm px-6 py-2 text-sm font-medium transition-all duration-200"
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
                <TabsContent value="overview" className="m-0 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border border-slate-200/60 shadow-sm rounded-2xl bg-white">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <Target className="size-4" />
                          </div>
                          Orçamento Planejado
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-black text-[#1A1A1A]">{formatCurrency(planningData.totalPlanned)}</div>
                      </CardContent>
                    </Card>
                    <Card className="border border-slate-200/60 shadow-sm rounded-2xl bg-white">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
                            <TrendingDown className="size-4" />
                          </div>
                          Gasto Atual
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-black text-[#1A1A1A]">{formatCurrency(planningData.totalSpent)}</div>
                      </CardContent>
                    </Card>
                    <Card className="border border-slate-200/60 shadow-sm rounded-2xl bg-white">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${planningData.difference >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            <DollarSign className="size-4" />
                          </div>
                          Diferença
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-black ${planningData.difference >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(planningData.difference)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {planningData.categories.map((cat) => (
                      <Card key={cat.name} className="border border-slate-200/60 shadow-sm rounded-2xl bg-white overflow-hidden group hover:shadow-md transition-all duration-300">
                        <CardContent className="p-6 space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="size-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300" style={{ backgroundColor: `${cat.color}10`, color: cat.color }}>
                                <cat.icon className="size-6" />
                              </div>
                              <div>
                                <h3 className="font-bold text-[#1A1A1A]">{cat.name}</h3>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Categoria</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: cat.isOver ? '#FEF2F2' : '#F0FDF4', color: cat.isOver ? '#EF4444' : '#22C55E' }}>
                              {cat.percentage.toFixed(0)}%
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-end">
                              <div className="space-y-0.5">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Gasto</p>
                                <p className="text-lg font-bold text-slate-700">{formatCurrency(cat.spent)}</p>
                              </div>
                              <div className="text-right space-y-0.5">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Meta</p>
                                <p className="text-sm font-semibold text-slate-500">{formatCurrency(cat.budget)}</p>
                              </div>
                            </div>
                            <Progress 
                              value={cat.percentage} 
                              className="h-2.5 bg-slate-100 rounded-full"
                              style={{ 
                                "--progress-background": cat.isOver ? "#EF4444" : "oklch(0.62 0.18 290)" 
                              } as React.CSSProperties}
                            />
                          </div>

                          <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                {cat.isOver ? "Excedido" : "Disponível"}
                              </span>
                              <span className={`text-sm font-black ${cat.isOver ? 'text-red-500' : 'text-emerald-500'}`}>
                                {formatCurrency(cat.remaining)}
                              </span>
                            </div>
                            <div className={`size-8 rounded-full flex items-center justify-center ${cat.isOver ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                              {cat.isOver ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="categories" className="m-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {planningData.categories.map((cat) => (
                      <motion.div
                        key={cat.name}
                        whileHover={{ 
                          scale: 1.02,
                          transition: { duration: 0.2 }
                        }}
                        className="group"
                      >
                        <Card className="border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl bg-white overflow-hidden">
                          <CardContent className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div 
                                  className="size-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300" 
                                  style={{ backgroundColor: `${cat.color}10`, color: cat.color }}
                                >
                                  <cat.icon className="size-6" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-[#1A1A1A] text-lg">{cat.name}</h3>
                                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${cat.isOver ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                    {cat.isOver ? 'Acima do limite' : 'Dentro do limite'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Meta Planejada</p>
                                  <p className="text-xl font-black text-[#1A1A1A]">{formatCurrency(cat.budget)}</p>
                                </div>
                                <div className="text-right space-y-1">
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Gasto Atual</p>
                                  <p className="text-sm font-bold text-slate-600">{formatCurrency(cat.spent)}</p>
                                </div>
                              </div>
                              
                              <div className="pt-2">
                                <Slider 
                                  value={[cat.budget]} 
                                  max={10000} 
                                  step={100}
                                  onValueChange={(val) => handleBudgetChange(cat.id, val[0])}
                                  className="py-2 cursor-pointer"
                                />
                                <p className="text-[10px] text-center text-muted-foreground mt-2 italic">Deslize para ajustar sua meta</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="m-0">
                  <Card className="border border-slate-200/60 shadow-sm rounded-2xl bg-white overflow-hidden">
                    <CardHeader className="border-b border-slate-50 px-8 py-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl font-bold text-[#1A1A1A]">Análise do Planejamento</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">Comparativo entre o orçamento planejado e seus gastos reais por categoria.</p>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="size-3 rounded-full bg-slate-200" />
                            <span className="font-medium text-slate-600">Planejado</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="size-3 rounded-full bg-primary" />
                            <span className="font-medium text-slate-600">Gasto Real</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-8 py-10">
                      <div className="h-[500px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={planningData.categories}
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            barGap={12}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#64748B', fontSize: 13, fontWeight: 500 }}
                              dy={15}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#64748B', fontSize: 12 }}
                              tickFormatter={(value) => `R$ ${value}`}
                            />
                            <Tooltip 
                              cursor={{ fill: '#F8FAFC', radius: 8 }}
                              contentStyle={{ 
                                borderRadius: '16px', 
                                border: 'none', 
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                                padding: '12px 16px'
                              }}
                              itemStyle={{ padding: '4px 0', fontWeight: 600 }}
                              labelStyle={{ marginBottom: '8px', fontWeight: 700, color: '#1A1A1A' }}
                              formatter={(value: any) => [formatCurrency(Number(value)), ""]}
                            />
                            <Bar 
                              name="Planejado" 
                              dataKey="budget" 
                              fill="#E2E8F0" 
                              radius={[6, 6, 0, 0]} 
                              barSize={40}
                            />
                            <Bar 
                              name="Gasto Real" 
                              dataKey="spent" 
                              radius={[6, 6, 0, 0]} 
                              barSize={40}
                            >
                              {planningData.categories.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.isOver ? '#EF4444' : 'oklch(0.62 0.18 290)'} />
                              ))}
                            </Bar>
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
