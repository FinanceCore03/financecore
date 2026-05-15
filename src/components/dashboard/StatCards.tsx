import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";

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

export function StatCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Saldo Inicial"
        value="R$ 3.500,00"
        helper="Valor disponível no início do mês"
        badge={{ text: "Estável", tone: "primary" }}
        icon={<Wallet className="size-5" />}
        iconBg="bg-primary-soft text-primary"
      />
      <StatCard
        title="Salário Recebido"
        value="R$ 5.000,00"
        helper="Entrada principal do mês"
        badge={{ text: "+100%", tone: "success" }}
        icon={<TrendingUp className="size-5" />}
        iconBg="bg-success-soft text-success"
      />
      <StatCard
        title="Gasto no Mês"
        value="R$ 2.840,00"
        helper="Total de despesas até hoje"
        badge={{ text: "56,8% do salário", tone: "danger" }}
        icon={<TrendingDown className="size-5" />}
        iconBg="bg-danger-soft text-danger"
      />
      <StatCard
        title="Disponível para Gastar"
        value="R$ 2.160,00"
        helper="Saldo restante do salário mensal"
        badge={{ text: "43,2% restante", tone: "success" }}
        icon={<PiggyBank className="size-5" />}
        iconBg="bg-success-soft text-success"
      />
    </div>
  );
}
