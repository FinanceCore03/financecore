import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useDashboardData() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 1. Get the internal ID from "Usuarios" table
        const { data: usuario, error: usuarioError } = await supabase
          .from("Usuarios")
          .select("id")
          .eq("id_auth", user.id)
          .maybeSingle();

        if (usuarioError) throw usuarioError;

        if (usuario) {
          setUsuarioId(usuario.id);
          // 2. Fetch all transactions for this user
          const { data, error: transacoesError } = await supabase
            .from("Transacoes")
            .select("*")
            .eq("id_usuario", usuario.id)
            .order("data", { ascending: false });

          if (transacoesError) throw transacoesError;
          setTransactions(data || []);
        } else {
          console.warn("Usuário não encontrado na tabela Usuarios para id_auth:", user.id);
        }
      } catch (err) {
        console.error("Erro ao buscar dados do dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalBalance = 0;
    let monthIncome = 0;
    let monthExpenses = 0;

    transactions.forEach(tx => {
      const val = parseFloat(tx.valor || "0");
      const isEntrada = tx.tipo === "entrada";
      
      if (isEntrada) totalBalance += val;
      else totalBalance -= val;

      if (tx.data) {
        const txDate = new Date(tx.data);
        if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
          if (isEntrada) monthIncome += val;
          else monthExpenses += val;
        }
      }
    });

    return {
      totalBalance,
      monthIncome,
      monthExpenses,
      availableToSpend: monthIncome - monthExpenses
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const now = new Date();
    const currentYear = now.getFullYear();
    
    const monthlyData = months.map((m, i) => {
      const monthExpenses = transactions
        .filter(tx => {
          if (!tx.data || tx.tipo !== "saida") return false;
          const d = new Date(tx.data);
          return d.getMonth() === i && d.getFullYear() === currentYear;
        })
        .reduce((sum, tx) => sum + parseFloat(tx.valor || "0"), 0);
      
      return { m, v: monthExpenses };
    });

    return monthlyData;
  }, [transactions]);

  const categoriesData = useMemo(() => {
    const categoriesMap: Record<string, number> = {};
    let totalExps = 0;

    transactions
      .filter(tx => tx.tipo === "saida")
      .forEach(tx => {
        const cat = tx.categoria || "Outros";
        const val = parseFloat(tx.valor || "0");
        categoriesMap[cat] = (categoriesMap[cat] || 0) + val;
        totalExps += val;
      });

    const colors = [
      "oklch(0.62 0.18 290)", // primary
      "oklch(0.72 0.14 340)", 
      "oklch(0.72 0.13 220)", 
      "oklch(0.78 0.13 80)", 
      "oklch(0.72 0.14 155)"
    ];

    const sortedCats = Object.entries(categoriesMap)
      .map(([name, value], i) => ({
        name,
        value: Number(value.toFixed(2)),
        pct: totalExps > 0 ? Math.round((value / totalExps) * 100) : 0,
        color: colors[i % colors.length],
        bg: i === 0 ? "bg-primary" : `bg-chart-${(i % 5) + 1}`
      }))
      .sort((a, b) => b.value - a.value);

    return {
      list: sortedCats,
      total: totalExps
    };
  }, [transactions]);

  return {
    transactions,
    loading,
    stats,
    chartData,
    categoriesData,
    usuarioId
  };
}
