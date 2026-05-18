import { Search, Bell, Settings, FileDown, Plus } from "lucide-react";
import { useLocation } from "@tanstack/react-router";

export function TopBar() {
  const location = useLocation();
  const isTransactions = location.pathname === "/transactions";

  return (
    <div className="flex items-center justify-end gap-4 px-8 py-5 border-b border-border bg-background/60 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {isTransactions && (
          <div className="flex items-center gap-2 mr-2">
            <button className="px-4 py-2 bg-card border border-border rounded-full text-xs font-medium hover:bg-muted transition flex items-center gap-2">
              <FileDown className="size-3.5" />
              Exportar
            </button>
          </div>
        )}
        <button className="size-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition">
          <Bell className="size-4" />
        </button>
        <button className="size-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition">
          <Settings className="size-4" />
        </button>
      </div>
    </div>
  );
}