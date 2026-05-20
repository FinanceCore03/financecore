import { formatCurrency } from "@/lib/currency";

interface CategoryBarsProps {
  categories: {
    name: string;
    value: number;
    pct: number;
    color: string;
    bg: string;
  }[];
  total: number;
  moeda: string;
}

export function CategoryBars({ categories, total, moeda }: CategoryBarsProps) {
  const displayCategories = categories.slice(0, 5);
  const totalPercentage = displayCategories.reduce((s, c) => s + c.pct, 0);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold tracking-tight">Gastos por Categoria</h3>
        <button className="text-xs text-primary font-medium hover:underline">Ver todos</button>
      </div>

      {displayCategories.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">Ainda não há gastos registrados.</div>
      ) : (
        <>
          <div className="flex h-2 w-full rounded-full overflow-hidden mb-5 bg-muted/50">
            {displayCategories.map((c) => (
              <div 
                key={c.name} 
                className={c.bg} 
                style={{ width: `${(c.pct / (totalPercentage || 1)) * 100}%` }} 
              />
            ))}
          </div>

          <div className="space-y-3">
            {displayCategories.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <span className={`size-2 rounded-full ${c.bg}`} />
                  <span className="truncate max-w-[120px]">{c.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(c.value, moeda)}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">({c.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
