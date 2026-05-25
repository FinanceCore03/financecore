import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useDashboardData() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [moeda, setMoeda] = useState<string>("Real");

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log("Auth user:", user);
        
        // 1. Get the internal ID and currency from "Usuarios" table
        const { data: usuario, error: usuarioError } = await supabase
          .from("Usuarios")
          .select("id, Moeda")
          .eq("id_auth", user.id)
          .maybeSingle();

        if (usuarioError) {
          console.log("Erro ao buscar dados do dashboard:", usuarioError);
          throw usuarioError;
        }

        console.log("Usuário interno (dashboard):", usuario);
        console.log("Moeda do usuário (dashboard):", usuario?.Moeda);

        if (usuario) {
          setUsuarioId(usuario.id);
          setMoeda(usuario.Moeda || "Real");

          // 2. Fetch all transactions and subscriptions for this user
          const [transacoesRes, assinaturasRes, creditoRes] = await Promise.all([
            supabase
              .from("Transacoes")
              .select("*")
              .eq("id_usuario", usuario.id)
              .order("data_inicio", { ascending: false }),
            supabase
              .from("Assinaturas")
              .select("*")
              .eq("id_usuario", usuario.id),
            supabase
              .from("Transacoes_Credito")
              .select("*")
              .eq("id_usuario", usuario.id)
          ]);

          if (transacoesRes.error) {
            console.log("Erro ao buscar transações:", transacoesRes.error);
            throw transacoesRes.error;
          }
          
          console.log("Transações do dashboard:", transacoesRes.data);
          
          // Map and normalize transactions
          const normalized = (transacoesRes.data || []).map(tx => {
            const rawTipo = (tx.tipo || "").toLowerCase();
            const normalizedTipo = rawTipo.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return {
              ...tx,
              tipo: normalizedTipo // Normalize to "entrada" or "saida"
            };
          });
          
          setTransactions(normalized);
          setCreditTransactions(creditoRes.data || []);
          setSubscriptions(assinaturasRes.data || []);
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

    const activeSubscriptions = subscriptions.filter(sub => sub.status !== false);
    
    // Normalize string to avoid accent issues
    const normalizeStr = (str: string) => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    transactions.forEach(tx => {
      const val = parseFloat(tx.valor || "0");
      
      // Normalize tipo
      const rawTipo = (tx.tipo || "").toLowerCase();
      const normalizedTipo = rawTipo.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // "saída" -> "saida"
      
      const isEntrada = normalizedTipo === "entrada";
      const isSaida = normalizedTipo === "saida";
      
      const metodo = normalizeStr(tx.metodo_pagamento);
      const isCreditMethod = metodo.includes("credito à vista") || metodo.includes("crédito à vista") || metodo.includes("credito parcelado") || metodo.includes("crédito parcelado");

      // Only count in balance/expenses if it's NOT a credit transaction
      if (!isCreditMethod) {
        if (isEntrada) totalBalance += val;
        else if (isSaida) totalBalance -= val;
      }

      const dateStr = tx.data_inicio;
      if (dateStr) {
        // Safe date parsing to avoid timezone shifts for comparison
        const [year, month, day] = dateStr.split('-').map(Number);
        const txDate = new Date(year, month - 1, day);
        const txMonth = txDate.getMonth();
        const txYear = txDate.getFullYear();

        // Only count in monthly/sparkline if it's NOT a credit transaction
        if (!isCreditMethod) {
          updateSparkline(txDate, val, isEntrada);

          if (txMonth === currentMonth && txYear === currentYear) {
            if (isEntrada) monthIncome += val;
            else if (isSaida) monthExpenses += val;
          } else if (txMonth === lastMonth && txYear === lastMonthYear) {
            if (isEntrada) prevMonthIncome += val;
            else if (isSaida) prevMonthExpenses += val;
          }
        }
      }
    });

    // Add Credit Transactions from Transacoes_Credito
    creditTransactions.forEach(ctx => {
      const val = parseFloat(ctx.valor || "0");
      const dateStr = ctx.data_vencimento;
      if (dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const ctxDate = new Date(year, month - 1, day);
        const ctxMonth = ctxDate.getMonth();
        const ctxYear = ctxDate.getFullYear();

        // Credit transactions are always expenses (saida)
        totalBalance -= val;
        updateSparkline(ctxDate, val, false);

        if (ctxMonth === currentMonth && ctxYear === currentYear) {
          monthExpenses += val;
        } else if (ctxMonth === lastMonth && ctxYear === lastMonthYear) {
          prevMonthExpenses += val;
        }
      }
    });

    // Include active subscriptions in current month expenses
    activeSubscriptions.forEach(sub => {
      const val = parseFloat(sub.valor || "0");
      totalBalance -= val; // Subscriptions are always expenses

      // For month calculations, assuming they occur every month if active
      monthExpenses += val;
      
      // Update sparklines for current month
      const currentMonthIdx = last6Months.findIndex(item => item.month === currentMonth && item.year === currentYear);
      if (currentMonthIdx !== -1) {
        last6Months[currentMonthIdx].expenses += val;
      }
      
      // Also update previous month for comparison
      prevMonthExpenses += val;
      const prevMonthIdx = last6Months.findIndex(item => item.month === lastMonth && item.year === lastMonthYear);
      if (prevMonthIdx !== -1) {
        last6Months[prevMonthIdx].expenses += val;
      }
    });

    // Calculate cumulative balance for sparkline
    last6Months.forEach(m => {
      m.balance = m.income - m.expenses;
    });

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const incomeChange = calculateChange(monthIncome, prevMonthIncome);
    const expensesChange = calculateChange(monthExpenses, prevMonthExpenses);

    console.log("Saldo geral calculado:", totalBalance);
    console.log("Entradas calculadas:", monthIncome);
    console.log("Gastos calculadas:", monthExpenses);
    console.log("Disponível calculado:", monthIncome - monthExpenses);

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
  }, [transactions, creditTransactions, user]);

  const chartData = useMemo(() => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Fetch subscriptions once to include in expenses
    // We already have transactions, but subscriptions are recurring.
    // However, the request says "include subscriptions in total expenses"
    // Usually this means if they are in transactions, they are already there.
    // If not, we might need to fetch them.
    // Looking at Transactions component, it seems subscriptions are a category in transactions.
    
    const normalizeStr = (str: string) => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return months.map((m, i) => {
      const monthTransactions = transactions.filter(tx => {
        if (!tx.data_inicio) return false;
        const [year, month] = tx.data_inicio.split('-').map(Number);
        const metodo = normalizeStr(tx.metodo_pagamento);
        const isCreditMethod = metodo.includes("credito à vista") || metodo.includes("crédito à vista") || metodo.includes("credito parcelado") || metodo.includes("crédito parcelado");
        return (month - 1) === i && year === currentYear && !isCreditMethod;
      });

      const monthCreditTransactions = creditTransactions.filter(ctx => {
        if (!ctx.data_vencimento) return false;
        const [year, month] = ctx.data_vencimento.split('-').map(Number);
        return (month - 1) === i && year === currentYear;
      });

      const income = monthTransactions
        .filter(tx => {
          const rawTipo = (tx.tipo || "").toLowerCase();
          const normalizedTipo = rawTipo.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return normalizedTipo === "entrada";
        })
        .reduce((sum, tx) => sum + parseFloat(tx.valor || "0"), 0);

      const expenses = monthTransactions
        .filter(tx => {
          const rawTipo = (tx.tipo || "").toLowerCase();
          const normalizedTipo = rawTipo.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return normalizedTipo === "saida";
        })
        .reduce((sum, tx) => sum + parseFloat(tx.valor || "0"), 0);

      const creditExpenses = monthCreditTransactions
        .reduce((sum, ctx) => sum + parseFloat(ctx.valor || "0"), 0);

      // Include subscriptions in expenses for chart
      const subscriptionTotal = subscriptions
        .filter(sub => sub.status !== false)
        .reduce((sum, sub) => sum + parseFloat(sub.valor || "0"), 0);

      return { m, income, expenses: expenses + creditExpenses + subscriptionTotal };
    });
  }, [transactions, creditTransactions, subscriptions]);

  const categoriesData = useMemo(() => {
    const categoriesMap: Record<string, number> = {};
    let totalExps = 0;

    const normalizeStr = (str: string) => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    transactions
      .filter(tx => {
        const rawTipo = (tx.tipo || "").toLowerCase();
        const normalizedTipo = rawTipo.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const metodo = normalizeStr(tx.metodo_pagamento);
        const isCreditMethod = metodo.includes("credito à vista") || metodo.includes("crédito à vista") || metodo.includes("credito parcelado") || metodo.includes("crédito parcelado");
        return normalizedTipo === "saida" && !isCreditMethod;
      })
      .forEach(tx => {
        const cat = tx.categoria || "Outros";
        const val = parseFloat(tx.valor || "0");
        categoriesMap[cat] = (categoriesMap[cat] || 0) + val;
        totalExps += val;
      });

    creditTransactions.forEach(ctx => {
      const cat = ctx.categoria || "Outros";
      const val = parseFloat(ctx.valor || "0");
      categoriesMap[cat] = (categoriesMap[cat] || 0) + val;
      totalExps += val;
    });

    // Include subscriptions as "Assinatura" category
    const subscriptionTotal = subscriptions
      .filter(sub => sub.status !== false)
      .reduce((sum, sub) => sum + parseFloat(sub.valor || "0"), 0);
    
    if (subscriptionTotal > 0) {
      const cat = "Assinatura";
      categoriesMap[cat] = (categoriesMap[cat] || 0) + subscriptionTotal;
      totalExps += subscriptionTotal;
    }

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
  }, [transactions, creditTransactions, subscriptions]);

  return {
    transactions,
    creditTransactions,
    loading,
    stats,
    chartData,
    categoriesData,
    usuarioId,
    moeda,
    user,
    subscriptions
  };
}
