import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ChevronDown } from "lucide-react";

interface SpendingChartProps {
  data: { m: string; v: number }[];
}

const fmt = (n: number) => `R$ ${n.toLocaleString("pt-BR")}`;

export function SpendingChart({ data }: SpendingChartProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold tracking-tight">Gastos ao Longo dos Meses</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Evolução mensal das despesas</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-background border border-border rounded-full px-3 py-1.5 text-xs">
          Mensal <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="gradLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.62 0.18 290)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="oklch(0.62 0.18 290)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="oklch(0.93 0.008 270)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "oklch(0.55 0.02 270)" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "oklch(0.55 0.02 270)" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.93 0.008 270)", fontSize: 12, boxShadow: "0 4px 16px rgba(16,24,40,0.08)" }}
              formatter={(v: any) => [fmt(v as number), "Gasto"]}
              labelStyle={{ color: "oklch(0.55 0.02 270)", fontSize: 11 }}
            />
            <Area type="monotone" dataKey="v" stroke="oklch(0.62 0.18 290)" strokeWidth={2.5} fill="url(#gradLine)" dot={{ r: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: "white" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
