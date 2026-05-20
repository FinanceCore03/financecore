import { ShoppingCart, Wallet, Car, Tv, Utensils, HelpCircle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface TransactionsProps {
  transactions: any[];
  moeda: string;
}

const getIcon = (categoria: string) => {
  const c = categoria.toLowerCase();
  if (c.includes("alimento") || c.includes("restaurante")) return Utensils;
  if (c.includes("transporte") || c.includes("uber")) return Car;
  if (c.includes("assinatura") || c.includes("netflix")) return Tv;
  if (c.includes("salário") || c.includes("receita")) return Wallet;
  if (c.includes("mercado") || c.includes("compra")) return ShoppingCart;
  return HelpCircle;
};

const getBg = (tipo: string, categoria: string) => {
  if (tipo === "entrada") return "bg-success-soft text-success";
  const c = categoria.toLowerCase();
  if (c.includes("alimento")) return "bg-warning-soft text-warning";
  if (c.includes("transporte")) return "bg-info-soft text-info";
  if (c.includes("assinatura")) return "bg-danger-soft text-danger";
  return "bg-primary-soft text-primary";
};

export function Transactions({ transactions, moeda }: TransactionsProps) {
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
        {transactions.length === 0 ? (
          <div className="py-4 text-center text-xs text-muted-foreground">Nenhuma transação recente.</div>
        ) : (
          transactions.map((t) => {
            const Icon = getIcon(t.categoria || "");
            const bg = getBg(t.tipo, t.categoria || "");
            const isEntrada = t.tipo === "entrada";
            
            return (
              <div key={t.id} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center py-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className={`size-8 rounded-full flex items-center justify-center ${bg}`}>
                    <Icon className="size-4" />
                  </div>
                  <span className="font-medium truncate max-w-[120px]">{t.descricao || t.categoria || "Sem descrição"}</span>
                </div>
                <span className={`text-xs font-semibold ${isEntrada ? "text-success" : "text-danger"}`}>
                  {isEntrada ? "Entrada" : "Gasto"}
                </span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(t.valor, moeda)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
