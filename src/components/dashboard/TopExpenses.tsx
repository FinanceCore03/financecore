const rows = [
  { cat: "Moradia", val: "R$ 1.200,00", pct: "42%", tone: "text-primary" },
  { cat: "Alimentação", val: "R$ 680,00", pct: "24%", tone: "text-chart-2" },
  { cat: "Transporte", val: "R$ 360,00", pct: "13%", tone: "text-chart-4" },
  { cat: "Lazer", val: "R$ 300,00", pct: "11%", tone: "text-chart-3" },
  { cat: "Assinaturas", val: "R$ 180,00", pct: "6%", tone: "text-chart-5" },
];

export function TopExpenses() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold tracking-tight">Principais Gastos</h3>
        <button className="text-xs text-primary font-medium hover:underline">Ver todos</button>
      </div>

      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 text-[11px] text-muted-foreground uppercase tracking-wide pb-2 border-b border-border">
        <span>Categoria</span><span>Valor</span><span>%</span>
      </div>

      <div className="divide-y divide-border">
        {rows.map((r) => (
          <div key={r.cat} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center py-3 text-sm">
            <div>
              <div className="font-medium">{r.cat}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Despesa fixa</div>
            </div>
            <div className="font-semibold tabular-nums">{r.val}</div>
            <div className={`text-xs font-semibold ${r.tone}`}>{r.pct}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
