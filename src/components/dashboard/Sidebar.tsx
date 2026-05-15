import { LayoutDashboard, LineChart, ArrowLeftRight, Tags, Target, FileBarChart, Settings, Wallet, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const items = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Gráfico de Gastos", icon: LineChart, href: "#" },
  { label: "Transações", icon: ArrowLeftRight, href: "/transactions" },
  { label: "Categorias", icon: Tags, href: "#" },
  { label: "Planejamento", icon: Target, href: "#" },
  { label: "Relatórios", icon: FileBarChart, href: "#" },
  { label: "Configurações", icon: Settings, href: "#" },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const userInitial = user?.email?.[0].toUpperCase() || "U";
  const userEmail = user?.email || "Usuário";
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

      <div className="p-3 border-t border-border mx-3 mb-4 mt-3 pt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-primary-foreground text-sm font-semibold shrink-0">
            {userInitial}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{userEmail.split('@')[0]}</div>
            <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
          </div>
        </div>
        <button 
          onClick={() => signOut()}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors shrink-0"
          title="Sair"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
