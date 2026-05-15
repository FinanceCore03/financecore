import { LayoutDashboard, LineChart, ArrowLeftRight, Tags, Target, FileBarChart, Settings, Wallet } from "lucide-react";

const items = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Gráfico de Gastos", icon: LineChart },
  { label: "Transações", icon: ArrowLeftRight },
  { label: "Categorias", icon: Tags },
  { label: "Planejamento", icon: Target },
  { label: "Relatórios", icon: FileBarChart },
  { label: "Configurações", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      <div className="px-6 py-6 flex items-center gap-2">
        <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
          <Wallet className="size-4 text-primary-foreground" strokeWidth={2.2} />
        </div>
        <span className="font-semibold text-[15px] tracking-tight">MoneyFlow</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {items.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="size-[18px]" strokeWidth={1.7} />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-border mx-3 mb-4 mt-3 pt-4 flex items-center gap-3">
        <div className="size-9 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-primary-foreground text-sm font-semibold">
          U
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">Usuário</div>
          <div className="text-xs text-muted-foreground truncate">Conta pessoal</div>
        </div>
      </div>
    </aside>
  );
}
