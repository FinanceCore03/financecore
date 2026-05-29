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
  const [diaVencimento, setDiaVencimento] = useState<number>(19); // Default fallback
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: usuario } = await supabase
          .from("Usuarios")
          .select("id, dia_vencimento")
          .eq("id_auth", user.id)
          .maybeSingle();

        if (usuario) {
          if (usuario.dia_vencimento) {
            setDiaVencimento(parseInt(usuario.dia_vencimento));
          }
          const { data } = await supabase
            .from("Transacoes_Credito")
            .select("*")
            .eq("id_usuario", usuario.id);
          setCreditTransactions(data || []);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const getNextInvoiceDate = () => {
    const now = new Date();
    const todayDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // If today is past the due date, look at the next month's invoice
    if (todayDay > diaVencimento) {
      const nextDate = new Date(currentYear, currentMonth + 1, 1);
      return {
        month: nextDate.getMonth(),
        year: nextDate.getFullYear()
      };
    }

    // Otherwise, it's the current month's invoice
    return {
      month: currentMonth,
      year: currentYear
    };
  };

  const invoiceTarget = getNextInvoiceDate();

  const invoiceTotal = creditTransactions.reduce((acc, ctx) => {
    if (!ctx.data_vencimento) return acc;
    const [year, month] = ctx.data_vencimento.split('-').map(Number);
    if ((month - 1) === invoiceTarget.month && year === invoiceTarget.year) {
      return acc + parseFloat(ctx.valor || "0");
    }
    return acc;
  }, 0);

  const invoiceCount = creditTransactions.filter(ctx => {
    if (!ctx.data_vencimento) return false;
    const [year, month] = ctx.data_vencimento.split('-').map(Number);
    return (month - 1) === invoiceTarget.month && year === invoiceTarget.year;
  }).length;

  if (loading) return null;

  const isNextMonth = invoiceTarget.month !== new Date().getMonth();

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="size-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-4">
        <Calendar className="size-5" />
      </div>
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Fatura</div>
      <div className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
        {formatCurrency(invoiceTotal, moeda)}
      </div>
      <div className="text-[11px] text-muted-foreground font-medium mt-2">
        {invoiceTotal > 0 
          ? `Gasto programado para a próxima fatura`
          : "Nenhuma fatura programada"}
      </div>
      {invoiceCount > 0 && (
        <div className="text-[10px] text-primary font-bold mt-1 bg-primary/5 inline-block px-2 py-0.5 rounded-md">
          {invoiceCount} {invoiceCount === 1 ? 'parcela' : 'parcelas'} {isNextMonth ? 'no próximo mês' : 'este mês'}
        </div>
      )}
    </div>
  );
}