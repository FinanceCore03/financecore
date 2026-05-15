const cats = [
  { name: "Moradia", value: "R$ 1.200,00", pct: 42, color: "bg-primary" },
  { name: "Alimentação", value: "R$ 680,00", pct: 24, color: "bg-chart-2" },
  { name: "Transporte", value: "R$ 360,00", pct: 13, color: "bg-chart-4" },
  { name: "Lazer", value: "R$ 300,00", pct: 11, color: "bg-chart-3" },
  { name: "Assinaturas", value: "R$ 180,00", pct: 6, color: "bg-chart-5" },
];

export function CategoryBars() {
  const total = cats.reduce((s, c) => s + c.pct, 0);
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold tracking-tight">Gastos por Categoria</h3>
        <button className="text-xs text-primary font-medium hover:underline">Ver todos</button>
      </div>

      <div className="flex h-2 w-full rounded-full overflow-hidden mb-5">
        {cats.map((c) => (
          <div key={c.name} className={c.color} style={{ width: `${(c.pct / total) * 100}%` }} />
        ))}
      </div>

      <div className="space-y-3">
        {cats.map((c) => (
          <div key={c.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2.5">
              <span className={`size-2 rounded-full ${c.color}`} />
              <span>{c.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold tabular-nums">{c.value}</span>
              <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">({c.pct}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
