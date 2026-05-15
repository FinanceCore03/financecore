import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface CategoryData {
  name: string;
  pct: number;
  color: string;
}

interface ExpenseDoughnutChartProps {
  data: CategoryData[];
}

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];

export function ExpenseDoughnutChart({ data }: ExpenseDoughnutChartProps) {
  // Convert Tailwind bg classes to hex for Recharts if needed, 
  // but we'll use a constant color array for better control.
  
  const chartData = data.map((item, index) => ({
    name: item.name,
    value: item.pct,
    color: COLORS[index % COLORS.length]
  }));

  const total = 2356.00; // Mock total from the page

  return (
    <div className="flex flex-col items-center">
      <div className="h-48 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0',
                fontSize: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-muted-foreground uppercase font-medium">Total</span>
          <span className="text-sm font-bold tracking-tight">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
      
      <div className="w-full mt-6 grid grid-cols-2 gap-x-4 gap-y-2">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
            <div className="flex-1 flex items-center justify-between min-w-0">
              <span className="text-[10px] text-muted-foreground truncate">{item.name}</span>
              <span className="text-[10px] font-semibold">{item.value}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
