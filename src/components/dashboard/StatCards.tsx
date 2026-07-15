import React from "react";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight, Eye, EyeOff } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { usePrivacy } from "@/contexts/PrivacyContext";

interface StatCardsProps {
  stats: {
    totalBalance: number;
    monthIncome: number;
    monthExpenses: number;
    availableToSpend: number;
    incomeChange: number;
    expensesChange: number;
    sparklines: {
      balance: { value: number }[];
      income: { value: number }[];
      expenses: { value: number }[];
      available: { value: number }[];
    };
  };
  moeda: string;
}

interface CardProps {
  title: string;
  value: string;
  change?: { value: number; label: string; inverse?: boolean };
  icon: React.ReactNode;
  sparklineData: { value: number }[];
  color: string;
  infoText?: string;
  showPrivacyToggle?: boolean;
  moeda: string;
}

function MiniChart({ data, color }: { data: any[]; color: string }) {
  return (
    <div className="h-10 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#gradient-${color})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatCard({ title, value, change, icon, sparklineData, color, infoText, showPrivacyToggle, moeda }: CardProps) {
  const { isPrivate, togglePrivacy } = usePrivacy();
  const isPositive = change ? change.value >= 0 : true;
  const isGood = change?.inverse ? !isPositive : isPositive;

  const currencySymbol = getCurrencySymbol(moeda);
  const displayValue = isPrivate ? `${currencySymbol} - - - - - -` : value;

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-border/70 transition-all duration-300 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-medium text-muted-foreground">{title}</span>
        <div className="p-2 rounded-lg bg-slate-50 text-slate-400">
          {icon}
        </div>
      </div>
      
      <div>
        <div className="flex items-baseline gap-2 group">
          <div className="text-2xl font-bold tracking-tight text-slate-900">{displayValue}</div>
          {showPrivacyToggle && (
            <button 
              onClick={togglePrivacy}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:opacity-100"
              title={isPrivate ? "Mostrar valores" : "Ocultar valores"}
            >
              {isPrivate ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          )}
        </div>
        
        <MiniChart data={sparklineData} color={color} />
        
        <div className="flex items-center gap-2 mt-2">
          {change && (
            <div className={`flex items-center gap-0.5 text-xs font-medium ${isGood ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {Math.abs(change.value).toFixed(1)}%
            </div>
          )}
          <span className="text-[11px] text-muted-foreground">
            {change ? change.label : infoText}
          </span>
        </div>
      </div>
    </div>
  );
}

export function StatCards({ stats, moeda }: StatCardsProps) {
  const formatVal = (val: number) => formatCurrency(val, moeda);

  const incomePct = stats.monthIncome > 0 
    ? Math.round((stats.availableToSpend / stats.monthIncome) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Saldo Geral"
        value={formatVal(stats.totalBalance)}
        icon={<Wallet className="size-4" />}
        sparklineData={stats.sparklines.balance}
        color="#7c3aed"
        infoText="saldo acumulado"
        showPrivacyToggle={true}
        moeda={moeda}
      />
      <StatCard
        title="Entradas do Mês"
        value={formatVal(stats.monthIncome)}
        change={{ value: stats.incomeChange, label: "vs mês passado" }}
        icon={<TrendingUp className="size-4" />}
        sparklineData={stats.sparklines.income}
        color="#10b981"
        moeda={moeda}
      />
      <StatCard
        title="Gastos do Mês"
        value={formatVal(stats.monthExpenses)}
        change={{ value: stats.expensesChange, label: "vs mês passado", inverse: true }}
        icon={<TrendingDown className="size-4" />}
        sparklineData={stats.sparklines.expenses}
        color="#f43f5e"
        moeda={moeda}
      />
      <StatCard
        title="Disponível no Mês"
        value={formatVal(stats.availableToSpend)}
        icon={<PiggyBank className="size-4" />}
        sparklineData={stats.sparklines.available}
        color="#0ea5e9"
        infoText={stats.monthIncome > 0 ? `${incomePct}% disponível` : "Sem entradas no mês"}
        moeda={moeda}
      />
    </div>
  );
}
