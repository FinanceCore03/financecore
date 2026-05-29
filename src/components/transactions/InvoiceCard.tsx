import { Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface InvoiceCardProps {
  transactions: any[];
  creditTransactions?: any[];
  subscriptions?: any[];
  moeda: string;
}

export function InvoiceCard({ transactions, moeda }: InvoiceCardProps) {
  const [creditTransactions, setCreditTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredit = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: usuario } = await supabase
          .from("Usuarios")
          .select("id")
          .eq("id_auth", user.id)
          .maybeSingle();

        if (usuario) {
          const { data } = await supabase
            .from("Transacoes_Credito")
            .select("*")
            .eq("id_usuario", usuario.id);
          setCreditTransactions(data || []);
        }
      }
      setLoading(false);
    };
    fetchCredit();
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Fatura card should show sum of installments FOR THE CURRENT MONTH from Transacoes_Credito
  const currentMonthTotal = creditTransactions.reduce((acc, ctx) => {
    if (!ctx.data_vencimento) return acc;
    const [year, month] = ctx.data_vencimento.split('-').map(Number);
    // ctx.data_vencimento is YYYY-MM-DD
    if ((month - 1) === currentMonth && year === currentYear) {
      return acc + parseFloat(ctx.valor || "0");
    }
    return acc;
  }, 0);

  const currentMonthCount = creditTransactions.filter(ctx => {
    if (!ctx.data_vencimento) return false;
    const [year, month] = ctx.data_vencimento.split('-').map(Number);
    return (month - 1) === currentMonth && year === currentYear;
  }).length;

  if (loading) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="size-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-4">
        <Calendar className="size-5" />
      </div>
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Fatura</div>
      <div className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
        {formatCurrency(currentMonthTotal, moeda)}
      </div>
      <div className="text-[11px] text-muted-foreground font-medium mt-2">
        {currentMonthTotal > 0 
          ? `Total de faturas para este mês`
          : "Nenhuma fatura para este mês"}
      </div>
      {currentMonthCount > 0 && (
        <div className="text-[10px] text-primary font-bold mt-1 bg-primary/5 inline-block px-2 py-0.5 rounded-md">
          {currentMonthCount} {currentMonthCount === 1 ? 'parcela' : 'parcelas'} este mês
        </div>
      )}
    </div>
  );
}