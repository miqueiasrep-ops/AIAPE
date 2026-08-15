import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { BarChart3, PieChartIcon, Info, Sparkles } from 'lucide-react';
import { Transaction, MONTH_NAMES } from '../types';

interface DashboardChartsProps {
  transactions: Transaction[];
}

const COLORS = [
  '#2563eb', // Blue-600
  '#3b82f6', // Blue-500
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#f43f5e', // Rose
  '#06b6d4', // Cyan
  '#64748b'  // Slate
];

export default function DashboardCharts({ transactions }: DashboardChartsProps) {
  const [activeTab, setActiveTab] = useState<'mensal' | 'categoria'>('mensal');

  // 1. Process Monthly Cash Flow data
  const monthlyData = MONTH_NAMES.map((month) => {
    const monthTransactions = transactions.filter((t) => t.month === month);
    const receitas = monthTransactions
      .filter((t) => t.type === 'receita')
      .reduce((sum, t) => sum + Number(t.value || 0), 0);
    const despesas = monthTransactions
      .filter((t) => t.type === 'despesa')
      .reduce((sum, t) => sum + Number(t.value || 0), 0);

    return {
      name: month.substring(0, 3), // Three-letter abbreviation
      fullName: month,
      Receitas: Number(receitas.toFixed(2)),
      Despesas: Number(despesas.toFixed(2)),
      Saldo: Number((receitas - despesas).toFixed(2)),
    };
  }).filter(m => m.Receitas > 0 || m.Despesas > 0); // Only show months with activity

  // 2. Process Expenses by Category
  const expenseTransactions = transactions.filter((t) => t.type === 'despesa');
  const categoryMap: { [key: string]: number } = {};
  
  expenseTransactions.forEach((t) => {
    const categoryName = t.category || 'Outros';
    categoryMap[categoryName] = (categoryMap[categoryName] || 0) + Number(t.value || 0);
  });

  const categoryData = Object.keys(categoryMap).map((cat) => ({
    name: cat,
    value: Number(categoryMap[cat].toFixed(2))
  })).sort((a, b) => b.value - a.value);

  const totalExpense = categoryData.reduce((sum, item) => sum + item.value, 0);

  const formatBRL = (val: number | undefined | null) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(Number(val || 0));
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-semibold text-slate-800 text-base">Análise Gráfica</h3>
          <p className="text-xs text-slate-400 mt-0.5">Visão visual de saldos e distribuição das despesas</p>
        </div>
        
        {/* Tab triggers */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start">
          <button
            onClick={() => setActiveTab('mensal')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'mensal'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Fluxo Mensal
          </button>
          <button
            onClick={() => setActiveTab('categoria')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'categoria'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            Despesas por Categoria
          </button>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="h-[260px] flex flex-col items-center justify-center text-slate-400 text-xs">
          <Info className="w-8 h-8 text-slate-300 mb-2" />
          <p className="font-medium text-slate-500">Aguardando lançamentos para gerar os gráficos</p>
          <p className="text-slate-400 text-[10px] mt-0.5">Insira transações manualmente ou via extrator inteligente</p>
        </div>
      ) : (
        <div className="h-[260px] w-full">
          {activeTab === 'mensal' ? (
            monthlyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                <p>Nenhuma transação com valores no momento.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <BarChart
                  data={monthlyData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `R$${val}`}
                  />
                  <Tooltip 
                    formatter={(val: number) => [formatBRL(val), '']}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '12px', 
                      borderColor: '#f1f5f9',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '11px'
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconSize={8}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }}
                  />
                  <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )
          ) : (
            categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs text-center">
                <Info className="w-6 h-6 text-slate-300 mb-1" />
                <p>Não há despesas registradas ainda.</p>
                <p className="text-[10px] opacity-80 mt-0.5">Apenas saídas (despesas) são demonstradas aqui.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full items-center">
                {/* Visual Chart */}
                <div className="h-full max-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: number) => [formatBRL(val), '']}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          borderRadius: '12px', 
                          borderColor: '#f1f5f9',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '11px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Categories legends listing as progress indicators */}
                <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1 scrollbar-thin">
                  {categoryData.slice(0, 5).map((item, index) => {
                    const percentage = totalExpense > 0 ? (item.value / totalExpense) * 100 : 0;
                    return (
                      <div key={item.name} className="text-xs">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5 truncate">
                            <span 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                            />
                            {item.name}
                          </span>
                          <span className="font-mono font-medium text-slate-500">
                            {formatBRL(item.value)} ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length] 
                            }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                  {categoryData.length > 5 && (
                    <p className="text-[10px] text-slate-400 text-center italic pt-1">
                      + {categoryData.length - 5} outras categorias de despesas
                    </p>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
