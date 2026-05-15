import { ShoppingCart, Wallet, Car, Tv, Utensils } from "lucide-react";

const tx = [
  { name: "Supermercado", type: "Gasto", value: "R$ 320,00", icon: ShoppingCart, bg: "bg-primary-soft text-primary" },
  { name: "Salário", type: "Entrada", value: "R$ 5.000,00", icon: Wallet, bg: "bg-success-soft text-success" },
  { name: "Uber", type: "Gasto", value: "R$ 48,00", icon: Car, bg: "bg-info-soft text-info" },
  { name: "Netflix", type: "Gasto", value: "R$ 39,90", icon: Tv, bg: "bg-danger-soft text-danger" },
  { name: "Restaurante", type: "Gasto", value: "R$ 120,00", icon: Utensils, bg: "bg-warning-soft text-warning" },
];

export function Transactions() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold tracking-tight">Transações Recentes</h3>
        <button className="text-xs text-primary font-medium hover:underline">Ver todas</button>
      </div>

      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 text-[11px] text-muted-foreground uppercase tracking-wide pb-2 border-b border-border">
        <span>Transação</span><span>Tipo</span><span>Valor</span>
      </div>

      <div className="divide-y divide-border">
        {tx.map((t) => (
          <div key={t.name} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center py-3 text-sm">
            <div className="flex items-center gap-3">
              <div className={`size-8 rounded-full flex items-center justify-center ${t.bg}`}>
                <t.icon className="size-4" />
              </div>
              <span className="font-medium">{t.name}</span>
            </div>
            <span className={`text-xs font-semibold ${t.type === "Entrada" ? "text-success" : "text-danger"}`}>{t.type}</span>
            <span className="font-semibold tabular-nums">{t.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
