import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface SpendingChartProps {
  data: { m: string; income: number; expenses: number }[];
  moeda: string;
}

export function SpendingChart({ data, moeda }: SpendingChartProps) {
  const fmt = (n: number) => formatCurrency(n, moeda);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-slate-900">Fluxo de Caixa</h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Entradas vs Saídas no último ano</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-border rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors">
          Este Ano <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="h-[300px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
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
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ top: -45, right: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
              formatter={(value) => <span className="text-slate-500 ml-1">{value === "income" ? "Entradas" : "Saídas"}</span>}
            />
            <Area 
              type="monotone" 
              dataKey="income" 
              name="income"
              stroke="#10b981" 
              strokeWidth={3} 
              fill="url(#gradIncome)" 
              dot={false}
              activeDot={{ r: 6, strokeWidth: 3, stroke: "white" }} 
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              name="expenses"
              stroke="#f43f5e" 
              strokeWidth={3} 
              fill="url(#gradExpenses)" 
              dot={false}
              activeDot={{ r: 6, strokeWidth: 3, stroke: "white" }} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
