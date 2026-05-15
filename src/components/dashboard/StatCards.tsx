import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";

interface StatCardsProps {
  stats: {
    totalBalance: number;
    monthIncome: number;
    monthExpenses: number;
    availableToSpend: number;
  };
}

interface CardProps {
  title: string;
  value: string;
  helper: string;
  badge?: { text: string; tone: "success" | "danger" | "primary" };
  icon: React.ReactNode;
  iconBg: string;
}

const toneStyles: Record<string, string> = {
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  primary: "bg-primary-soft text-primary",
};

function StatCard({ title, value, helper, badge, icon, iconBg }: CardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-start justify-between mb-4">
        <div className={`size-10 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${toneStyles[badge.tone]}`}>
            {badge.text}
          </span>
        )}
      </div>
      <div className="text-xs text-muted-foreground mb-1">{title}</div>
      <div className="text-2xl font-semibold tracking-tight mb-2">{value}</div>
      <div className="text-xs text-muted-foreground">{helper}</div>
    </div>
  );
}

export function StatCards({ stats }: StatCardsProps) {
  const formatBRL = (val: number) => `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Saldo Geral"
        value={formatBRL(stats.totalBalance)}
        helper="Total acumulado em todas as contas"
        badge={{ text: stats.totalBalance >= 0 ? "Positivo" : "Negativo", tone: stats.totalBalance >= 0 ? "success" : "danger" }}
        icon={<Wallet className="size-5" />}
        iconBg="bg-primary-soft text-primary"
      />
      <StatCard
        title="Entradas (Mês)"
        value={formatBRL(stats.monthIncome)}
        helper="Total recebido este mês"
        badge={{ text: "Mensal", tone: "success" }}
        icon={<TrendingUp className="size-5" />}
        iconBg="bg-success-soft text-success"
      />
      <StatCard
        title="Gasto (Mês)"
        value={formatBRL(stats.monthExpenses)}
        helper="Total de despesas este mês"
        badge={{ text: `${((stats.monthExpenses / (stats.monthIncome || 1)) * 100).toFixed(0)}% da renda`, tone: "danger" }}
        icon={<TrendingDown className="size-5" />}
        iconBg="bg-danger-soft text-danger"
      />
      <StatCard
        title="Disponível"
        value={formatBRL(stats.availableToSpend)}
        helper="Saldo restante do mês"
        badge={{ text: stats.availableToSpend >= 0 ? "Economizando" : "No vermelho", tone: stats.availableToSpend >= 0 ? "success" : "danger" }}
        icon={<PiggyBank className="size-5" />}
        iconBg="bg-success-soft text-success"
      />
    </div>
  );
}
