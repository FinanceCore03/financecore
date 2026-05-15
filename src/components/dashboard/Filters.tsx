import { ChevronDown, Calendar } from "lucide-react";

const Pill = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <button className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-3.5 py-2 text-xs text-foreground hover:border-ring/40 transition">
    {icon}
    <span className="text-muted-foreground">{label}:</span>
    <span className="font-medium">{value}</span>
    <ChevronDown className="size-3.5 text-muted-foreground" />
  </button>
);

export function Filters() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Pill label="Moeda" value="BRL" />
      <Pill label="Período" value="Últimos 30 dias" />
      <Pill label="Categoria" value="Todas" />
      <Pill label="Data" value="Nov 2025" icon={<Calendar className="size-3.5 text-muted-foreground" />} />
    </div>
  );
}
