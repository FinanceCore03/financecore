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

    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    let totalBalance = 0;
    let monthIncome = 0;
    let monthExpenses = 0;
    let prevMonthIncome = 0;
    let prevMonthExpenses = 0;

    // Sparklines data (last 6 months)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(currentYear, currentMonth - (5 - i), 1);
      return {
        month: d.getMonth(),
        year: d.getFullYear(),
        income: 0,
        expenses: 0,
        balance: 0,
        label: d.toLocaleString('default', { month: 'short' })
      };
    });

    // Helper for sparklines
    const updateSparkline = (date: Date, val: number, isEntrada: boolean) => {
      const m = date.getMonth();
      const y = date.getFullYear();
      const idx = last6Months.findIndex(item => item.month === m && item.year === y);
      if (idx !== -1) {
        if (isEntrada) last6Months[idx].income += val;
        else last6Months[idx].expenses += val;
      }
    };

    transactions.forEach(tx => {
      const val = parseFloat(tx.valor || "0");
      const isEntrada = tx.tipo === "entrada";
      
      if (isEntrada) totalBalance += val;
      else totalBalance -= val;

      if (tx.data) {
        // Safe date parsing to avoid timezone shifts for comparison
        const [year, month, day] = tx.data.split('-').map(Number);
        const txDate = new Date(year, month - 1, day);
        const txMonth = txDate.getMonth();
        const txYear = txDate.getFullYear();

        updateSparkline(txDate, val, isEntrada);

        if (txMonth === currentMonth && txYear === currentYear) {
          if (isEntrada) monthIncome += val;
          else monthExpenses += val;
        } else if (txMonth === lastMonth && txYear === lastMonthYear) {
          if (isEntrada) prevMonthIncome += val;
          else prevMonthExpenses += val;
        }
      }
    });

    // Calculate cumulative balance for sparkline
    let runningBalance = totalBalance;
    // This is tricky because sparkline is last 6 months but total balance is all time.
    // Let's just use monthly net for the balance sparkline to show trend.
    last6Months.forEach(m => {
      m.balance = m.income - m.expenses;
    });

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const incomeChange = calculateChange(monthIncome, prevMonthIncome);
    const expensesChange = calculateChange(monthExpenses, prevMonthExpenses);

    console.log("Usuário logado:", user);
    console.log("Transações carregadas:", transactions);
    console.log("Saldo geral:", totalBalance);
    console.log("Entradas do mês:", monthIncome);
    console.log("Gastos do mês:", monthExpenses);
    console.log("Disponível do mês:", monthIncome - monthExpenses);

    return {
      totalBalance,
      monthIncome,
      monthExpenses,
      availableToSpend: monthIncome - monthExpenses,
      prevMonthIncome,
      prevMonthExpenses,
      incomeChange,
      expensesChange,
      sparklines: {
        balance: last6Months.map(m => ({ value: m.balance })),
        income: last6Months.map(m => ({ value: m.income })),
        expenses: last6Months.map(m => ({ value: m.expenses })),
        available: last6Months.map(m => ({ value: m.income - m.expenses }))
      }
    };
  }, [transactions, user]);

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
