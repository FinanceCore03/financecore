import { LayoutDashboard, ArrowLeftRight, Target, Settings, LogOut, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Transações", icon: ArrowLeftRight, href: "/transactions" },
  { label: "Planejamento", icon: Target, href: "/planning" },
  { label: "Configurações", icon: Settings, href: "/personalization" },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const userInitial = user?.email?.[0].toUpperCase() || "U";
  const userEmail = user?.email || "Usuário";

  return (
    <aside 
      className={cn(
        "shrink-0 bg-transparent flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className={cn(
        "px-6 py-8 flex items-center justify-between",
        isCollapsed && "px-4 justify-center"
      )}>
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <Wallet className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg tracking-tight text-foreground">Finance Core</span>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1.5 mt-2">
        {items.map(({ label, icon: Icon, href }) => {
          const active = location.pathname === href;
          return (
            <Link
              key={label}
              to={href as any}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200",
                active
                  ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                  : "text-muted-foreground hover:bg-white/50 hover:text-foreground",
                isCollapsed && "justify-center px-0"
              )}
              title={isCollapsed ? label : ""}
            >
              {active && (
                <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
              )}
              <Icon 
                className={cn(
                  "size-[20px] shrink-0 transition-colors",
                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} 
                strokeWidth={active ? 2.2 : 1.8} 
              />
              {!isCollapsed && <span className={cn("font-semibold", active ? "text-foreground" : "text-muted-foreground")}>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6 space-y-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl border border-border/50 bg-white/30 text-muted-foreground hover:bg-white/80 hover:text-foreground transition-all duration-200"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <div className="flex items-center gap-2"><ChevronLeft size={18} /><span className="text-xs font-bold uppercase tracking-wider">Recolher Menu</span></div>}
        </button>

        <div className={cn(
          "p-3 rounded-2xl bg-white border border-border/50 shadow-sm flex items-center gap-3",
          isCollapsed && "flex-col p-2"
        )}>
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0 shadow-inner">
            {userInitial}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold truncate text-foreground">{userEmail.split('@')[0]}</div>
              <div className="text-[10px] text-muted-foreground truncate font-medium">{userEmail}</div>
            </div>
          )}
          <button 
            onClick={() => signOut()}
            className={cn(
              "p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors",
              isCollapsed && "w-full flex justify-center"
            )}
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}