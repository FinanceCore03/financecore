import { Menu, Bell, Settings, FileDown, Wallet } from "lucide-react";
import { useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { SidebarNav, SidebarFooter } from "@/components/dashboard/Sidebar";

export function MobileTopBar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const isTransactions = location.pathname === "/transactions";

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="md:hidden flex items-center justify-between gap-3 px-4 py-4 border-b border-border bg-background/60 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button aria-label="Abrir menu de navegação" className="size-9 shrink-0 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition motion-reduce:transition-none">
              <Menu className="size-4" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 flex flex-col motion-reduce:duration-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>Navegação principal do Finance Core</SheetDescription>
            </SheetHeader>
            <div className="px-6 py-8 flex items-center gap-3">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                <Wallet className="size-4 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground">Finance Core</span>
            </div>
            <SidebarNav isCollapsed={false} onNavigate={() => setOpen(false)} />
            <div className="px-3 pb-6">
              <SidebarFooter isCollapsed={false} user={user} onSignOut={signOut} />
            </div>
          </SheetContent>
        </Sheet>
        <span className="font-bold text-base tracking-tight text-foreground truncate">Finance Core</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isTransactions && (
          <button className="px-3 py-2 bg-card border border-border rounded-full text-xs font-medium hover:bg-muted transition flex items-center gap-1.5">
            <FileDown className="size-3.5" />
            Exportar
          </button>
        )}
        <button aria-label="Notificações" className="size-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition">
          <Bell className="size-4" />
        </button>
        <button aria-label="Configurações" className="size-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition">
          <Settings className="size-4" />
        </button>
      </div>
    </div>
  );
}
