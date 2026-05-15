import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: "Moradia", value: 42, color: "oklch(0.62 0.18 290)" },
  { name: "Alimentação", value: 24, color: "oklch(0.72 0.14 340)" },
  { name: "Transporte", value: 13, color: "oklch(0.72 0.13 220)" },
  { name: "Lazer", value: 11, color: "oklch(0.78 0.13 80)" },
  { name: "Outros", value: 10, color: "oklch(0.72 0.14 155)" },
];

export function DistributionDonut() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold tracking-tight">Distribuição dos Gastos</h3>
        <button className="text-xs text-primary font-medium hover:underline">Ver detalhes</button>
      </div>

      <div className="relative h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2} stroke="none">
              {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-[11px] text-muted-foreground">Total</div>
          <div className="text-lg font-semibold tracking-tight">R$ 2.840</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: d.color }} />
              <span className="text-muted-foreground">{d.name}</span>
            </div>
            <span className="font-semibold tabular-nums">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
