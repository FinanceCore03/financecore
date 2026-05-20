import { formatCurrency } from "@/lib/currency";

interface TopExpensesProps {
  categories: {
    name: string;
    value: number;
    pct: number;
    color: string;
    bg: string;
  }[];
  moeda: string;
}

export function TopExpenses({ categories, moeda }: TopExpensesProps) {
  const displayCategories = categories.slice(0, 5);

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
        {displayCategories.length === 0 ? (
          <div className="py-4 text-center text-xs text-muted-foreground">Sem despesas registradas.</div>
        ) : (
          displayCategories.map((r) => (
            <div key={r.name} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center py-3 text-sm">
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Gasto acumulado</div>
              </div>
              <div className="font-semibold tabular-nums">
                {formatCurrency(r.value, moeda)}
              </div>
              <div className={`text-xs font-semibold`} style={{ color: r.color }}>{r.pct}%</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
