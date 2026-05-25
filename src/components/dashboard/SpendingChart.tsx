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

  const chartData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const normalizeStr = (str: string) => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (period === "Anual") {
      return annualData;
    }

    if (period === "3 meses") {
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const last3 = [];
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mIdx = d.getMonth();
        const year = d.getFullYear();
        
        const monthTransactions = transactions.filter(tx => {
          if (!tx.data_inicio) return false;
          const [txYear, txMonth] = tx.data_inicio.split('-').map(Number);
          const metodo = normalizeStr(tx.metodo_pagamento);
          const isCredit = metodo.includes("credito à vista") || metodo.includes("crédito à vista") || metodo.includes("credito parcelado") || metodo.includes("crédito parcelado");
          return (txMonth - 1) === mIdx && txYear === year && !isCredit;
        });

        const monthCreditTransactions = creditTransactions.filter(ctx => {
          if (!ctx.data_vencimento) return false;
          const [ctxYear, ctxMonth] = ctx.data_vencimento.split('-').map(Number);
          return (ctxMonth - 1) === mIdx && ctxYear === year;
        });

        const income = monthTransactions
          .filter(tx => tx.tipo === "entrada")
          .reduce((sum, tx) => sum + parseFloat(tx.valor || "0"), 0);

        const commonExpenses = monthTransactions
          .filter(tx => tx.tipo === "saida")
          .reduce((sum, tx) => sum + parseFloat(tx.valor || "0"), 0);

        const creditExpenses = monthCreditTransactions
          .reduce((sum, ctx) => sum + parseFloat(ctx.valor || "0"), 0);

        last3.push({ m: months[mIdx], income, expenses: commonExpenses + creditExpenses });
      }
      return last3;
    }

    if (period === "Mês") {
      // Group by week of the current month
      const weeks = [];
      for (let i = 0; i < 4; i++) {
        const startDay = i * 7 + 1;
        const endDay = (i + 1) * 7;
        
        const weekTransactions = transactions.filter(tx => {
          if (!tx.data_inicio) return false;
          const [year, month, day] = tx.data_inicio.split('-').map(Number);
          const metodo = normalizeStr(tx.metodo_pagamento);
          const isCredit = metodo.includes("credito à vista") || metodo.includes("crédito à vista") || metodo.includes("credito parcelado") || metodo.includes("crédito parcelado");
          return (month - 1) === currentMonth && year === currentYear && day >= startDay && day <= endDay && !isCredit;
        });

        const weekCreditTransactions = creditTransactions.filter(ctx => {
          if (!ctx.data_vencimento) return false;
          const [year, month, day] = ctx.data_vencimento.split('-').map(Number);
          return (month - 1) === currentMonth && year === currentYear && day >= startDay && day <= endDay;
        });

        const income = weekTransactions
          .filter(tx => tx.tipo === "entrada")
          .reduce((sum, tx) => sum + parseFloat(tx.valor || "0"), 0);

        const commonExpenses = weekTransactions
          .filter(tx => tx.tipo === "saida")
          .reduce((sum, tx) => sum + parseFloat(tx.valor || "0"), 0);

        const creditExpenses = weekCreditTransactions
          .reduce((sum, ctx) => sum + parseFloat(ctx.valor || "0"), 0);

        weeks.push({ m: `Semana ${i + 1}`, income, expenses: commonExpenses + creditExpenses });
      }
      return weeks;
    }

    if (period === "Semana") {
      // Last 7 days
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const dayTransactions = transactions.filter(tx => {
          const metodo = normalizeStr(tx.metodo_pagamento);
          const isCredit = metodo.includes("credito à vista") || metodo.includes("crédito à vista") || metodo.includes("credito parcelado") || metodo.includes("crédito parcelado");
          return tx.data_inicio === dateStr && !isCredit;
        });

        const dayCreditTransactions = creditTransactions.filter(ctx => ctx.data_vencimento === dateStr);

        const income = dayTransactions
          .filter(tx => tx.tipo === "entrada")
          .reduce((sum, tx) => sum + parseFloat(tx.valor || "0"), 0);

        const commonExpenses = dayTransactions
          .filter(tx => tx.tipo === "saida")
          .reduce((sum, tx) => sum + parseFloat(tx.valor || "0"), 0);

        const creditExpenses = dayCreditTransactions
          .reduce((sum, ctx) => sum + parseFloat(ctx.valor || "0"), 0);

        last7Days.push({ 
          m: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''), 
          income, 
          expenses: commonExpenses + creditExpenses
        });
      }
      return last7Days;
    }

    return annualData;
  }, [period, annualData, transactions, creditTransactions]);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] h-full flex flex-col">
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

      <div className="h-[300px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
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
            />
            <Tooltip
              contentStyle={{ 
                borderRadius: 16, 
                border: "none", 
                backgroundColor: "white",
                boxShadow: "0 10px 30px -5px rgba(0,0,0,0.1)",
                padding: "12px 16px"
              }}
              cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
              formatter={(v: any, name: any) => [
                <span className="font-bold text-slate-900" key="val">{fmt(v as number)}</span>, 
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider" key="name">{name === "income" ? "Entradas" : "Saídas"}</span>
              ]}
              labelStyle={{ display: 'none' }}
              itemStyle={{ padding: '4px 0' }}
            />
            <Area 
              type="monotone" 
              dataKey="income" 
              name="income"
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
              name="expenses"
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