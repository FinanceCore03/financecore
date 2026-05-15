import { LayoutDashboard, LineChart, ArrowLeftRight, Tags, Target, FileBarChart, Settings, Wallet, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const location = useLocation();
  const userInitial = user?.email?.[0].toUpperCase() || "U";
  const userEmail = user?.email || "Usuário";
  
  // Log temporário para diagnóstico do usuário logado e sua relação com a tabela Usuarios
  useEffect(() => {
    async function debugUser() {
      if (!user) return;
      
      console.log("=== DIAGNÓSTICO DE USUÁRIO LOGADO ===");
      console.log("Email no Auth:", user.email);
      console.log("ID no Auth (user.id):", user.id);
      
      const { data: usuarioPorAuth, error: erroAuth } = await supabase
        .from("Usuarios")
        .select("*")
        .eq("id_auth", user.id)
        .maybeSingle();
        
      console.log("Busca por id_auth:", usuarioPorAuth || "NÃO ENCONTRADO");
      if (erroAuth) console.error("Erro busca id_auth:", erroAuth);
      
      const { data: usuarioPorEmail, error: erroEmail } = await supabase
        .from("Usuarios")
        .select("*")
        .eq("Email", user.email)
        .maybeSingle();
        
      console.log("Busca por Email:", usuarioPorEmail || "NÃO ENCONTRADO");
      if (erroEmail) console.error("Erro busca Email:", erroEmail);
      
      if (usuarioPorEmail && !usuarioPorAuth) {
        console.warn("ALERTA: O email existe na tabela Usuarios, mas o id_auth está incorreto ou vazio.");
      }
      console.log("======================================");
    }
    debugUser();
  }, [user]);

  return (
    <aside className="w-60 shrink-0 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      <div className="px-6 py-6 flex items-center gap-2">
        <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
          <Wallet className="size-4 text-primary-foreground" strokeWidth={2.2} />
        </div>
        <span className="font-semibold text-[15px] tracking-tight">MoneyFlow</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {items.map(({ label, icon: Icon, href }) => {
          const active = location.pathname === href;
          return (
            <Link
              key={label}
              to={href as any}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="size-[18px]" strokeWidth={1.7} />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
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