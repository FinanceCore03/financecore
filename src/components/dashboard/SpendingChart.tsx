import React from "react";
import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/currency";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SpendingChartProps {
  data: { m: string; income: number; expenses: number }[];
  moeda: string;
  transactions: any[];
  creditTransactions?: any[];
}

export function SpendingChart({ data: annualData, moeda, transactions, creditTransactions = [] }: SpendingChartProps) {
  const [period, setPeriod] = useState("Mês");
  const fmt = (n: number) => formatCurrency(n, moeda);

  const normalizeStr = (str: string) => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const chartData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (period === "Anual") {
      // Re-calculate annual data to exclude subscriptions and credit
      const monthsShort = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      return monthsShort.map((m, i) => {
        const monthTransactions = transactions.filter(tx => {
          if (!tx.data_inicio) return false;
          const [year, month] = tx.data_inicio.split('-').map(Number);
          const metodo = tx.metodo_pagamento || "";
          const isCredit = metodo === "Crédito à vista" || metodo === "Crédito Parcelado";
          const isAssinatura = tx.categoria === "Assinatura";
          return (month - 1) === i && year === currentYear && !isCredit && !isAssinatura;
        });

        const income = monthTransactions
          .filter(tx => normalizeStr(tx.tipo) === "entrada" && normalizeStr(tx.categoria) !== "saldo anterior")
          .reduce((sum, tx) => sum + parseFloat(tx.valor || "0"), 0);

        const expenses = monthTransactions
          .filter(tx => normalizeStr(tx.tipo) === "saida")
          .reduce((sum, tx) => sum + parseFloat(tx.valor || "0"), 0);

        return { m, income, expenses };
      });
    }

    if (period === "3 meses") {
      const monthsShort = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const last3 = [];
      for (let i = 2; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        const mIdx = d.getMonth();
        const year = d.getFullYear();
        
        const monthTransactions = transactions.filter(tx => {
          if (!tx.data_inicio) return false;
          const [txYear, txMonth] = tx.data_inicio.split('-').map(Number);
          const metodo = tx.metodo_pagamento || "";
          const isCredit = metodo === "Crédito à vista" || metodo === "Crédito Parcelado";
          const isAssinatura = tx.categoria === "Assinatura";
          return (txMonth - 1) === mIdx && txYear === year && !isCredit && !isAssinatura;
        });

        const income = monthTransactions
          .filter(tx => normalizeStr(tx.tipo) === "entrada" && normalizeStr(tx.categoria) !== "saldo anterior")
          .reduce((sum, tx) => sum + parseFloat(tx.valor || "0"), 0);

        const commonExpenses = monthTransactions
          .filter(tx => normalizeStr(tx.tipo) === "saida")
          .reduce((sum, tx) => sum + parseFloat(tx.valor || "0"), 0);

        last3.push({ m: monthsShort[mIdx], income, expenses: commonExpenses });
      }
      return last3;
    }

    if (period === "Mês") {
      const weeks = [];
      for (let i = 0; i < 4; i++) {
        const startDay = i * 7 + 1;
        const endDay = (i + 1) * 7;
        
        const weekTransactions = transactions.filter(tx => {
          if (!tx.data_inicio) return false;
          const [year, month, day] = tx.data_inicio.split('-').map(Number);
          const metodo = tx.metodo_pagamento || "";
          const isCredit = metodo === "Crédito à vista" || metodo === "Crédito Parcelado";
          const isAssinatura = tx.categoria === "Assinatura";
          return (month - 1) === currentMonth && year === currentYear && day >= startDay && day <= endDay && !isCredit && !isAssinatura;
        });

        const income = weekTransactions
          .filter(tx => normalizeStr(tx.tipo) === "entrada" && normalizeStr(tx.categoria) !== "saldo anterior")
          .reduce((sum, tx) => sum + parseFloat(tx.valor || "0"), 0);

        const commonExpenses = weekTransactions
          .filter(tx => normalizeStr(tx.tipo) === "saida")
          .reduce((sum, tx) => sum + parseFloat(tx.valor || "0"), 0);

        weeks.push({ m: `Semana ${i + 1}`, income, expenses: commonExpenses });
      }
      return weeks;
    }

    if (period === "Semana") {
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const dayTransactions = transactions.filter(tx => {
          const metodo = tx.metodo_pagamento || "";
          const isCredit = metodo === "Crédito à vista" || metodo === "Crédito Parcelado";
          const isAssinatura = tx.categoria === "Assinatura";
          return tx.data_inicio === dateStr && !isCredit && !isAssinatura;
        });

        const income = dayTransactions
          .filter(tx => normalizeStr(tx.tipo) === "entrada" && normalizeStr(tx.categoria) !== "saldo anterior")
          .reduce((sum, tx) => sum + parseFloat(tx.valor || "0"), 0);

        const commonExpenses = dayTransactions
          .filter(tx => normalizeStr(tx.tipo) === "saida")
          .reduce((sum, tx) => sum + parseFloat(tx.valor || "0"), 0);

        last7Days.push({ 
          m: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''), 
          income, 
          expenses: commonExpenses
        });
      }
      return last7Days;
    }

    return annualData;
  }, [period, annualData, transactions]);

  const yDomain = useMemo(() => {
    const maxVal = Math.max(...chartData.map(d => Math.max(d.income, d.expenses)), 0);
    if (maxVal === 0) return [0, 1000];
    return [0, Math.ceil(maxVal * 1.2)];
  }, [chartData]);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] h-[320px] md:h-[450px] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-slate-900">Fluxo de Caixa</h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Entradas vs Saídas no período selecionado</p>
        </div>

        <div className="flex items-center gap-6 self-end md:self-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-[#f43f5e]" />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Saídas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-[#10b981]" />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Entradas</span>
            </div>
          </div>

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px] h-9 rounded-full bg-slate-50 border-border text-[11px] font-bold">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              <SelectItem value="Semana" className="text-[11px] font-medium">Semana</SelectItem>
              <SelectItem value="Mês" className="text-[11px] font-medium">Mês</SelectItem>
              <SelectItem value="3 meses" className="text-[11px] font-medium">3 meses</SelectItem>
              <SelectItem value="Anual" className="text-[11px] font-medium">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="m" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} 
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              domain={yDomain}
              allowDataOverflow={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-4 rounded-2xl shadow-2xl border border-border/50 animate-in fade-in zoom-in duration-200 min-w-[150px]">
                      <div className="space-y-3">
                        {payload.map((entry: any, index: number) => (
                          <div key={index} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="size-2 rounded-full" 
                                style={{ backgroundColor: entry.dataKey === "income" ? "#10b981" : "#f43f5e" }} 
                              />
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                {entry.dataKey === "income" ? "Entradas" : "Saídas"}
                              </span>
                            </div>
                            <span className="font-bold text-slate-900 text-sm">
                              {fmt(entry.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
            />
            <Area 
              type="monotone" 
              dataKey="income" 
              stroke="#10b981" 
              strokeWidth={2} 
              fill="url(#gradIncome)" 
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "white" }} 
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              stroke="#f43f5e" 
              strokeWidth={2} 
              fill="url(#gradExpenses)" 
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "white" }} 
              animationDuration={1500}
              animationEasing="ease-in-out"
              animationBegin={200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
