import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/currency";

interface DistributionDonutProps {
  data: {
    name: string;
    value: number;
    pct: number;
    color: string;
    bg: string;
  }[];
  total: number;
  moeda: string;
}

export function DistributionDonut({ data, total, moeda }: DistributionDonutProps) {
  const displayData = data.slice(0, 5);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold tracking-tight">Distribuição dos Gastos</h3>
        <button className="text-xs text-primary font-medium hover:underline">Ver detalhes</button>
      </div>

      <div className="relative h-[180px]">
        {displayData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground italic">
            Sem dados
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={displayData} 
                  dataKey="value" 
                  innerRadius={55} 
                  outerRadius={80} 
                  paddingAngle={2} 
                  stroke="none"
                >
                  {displayData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-[11px] text-muted-foreground">Total Gasto</div>
              <div className="text-lg font-semibold tracking-tight">
                {formatCurrency(total, moeda)}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
        {displayData.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: d.color }} />
              <span className="text-muted-foreground truncate max-w-[80px]">{d.name}</span>
            </div>
            <span className="font-semibold tabular-nums">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
