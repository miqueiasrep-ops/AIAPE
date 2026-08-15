import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, DollarSign, Clock, Wallet } from 'lucide-react';
import { Transaction } from '../types';

interface DashboardCardsProps {
  transactions: Transaction[];
}

export default function DashboardCards({ transactions }: DashboardCardsProps) {
  // Calculate stats
  const totalReceitas = transactions
    .filter((t) => t.type === 'receita')
    .reduce((sum, t) => sum + Number(t.value || 0), 0);

  const totalDespesas = transactions
    .filter((t) => t.type === 'despesa')
    .reduce((sum, t) => sum + Number(t.value || 0), 0);

  const saldoLiquido = totalReceitas - totalDespesas;

  const totalPendentes = transactions
    .filter((t) => t.status === 'pendente')
    .reduce((sum, t) => sum + Number(t.value || 0), 0);

  const formatCurrency = (val: number | undefined | null) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(val || 0));
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Saldo Líquido */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between relative overflow-hidden transition-all duration-200 hover:shadow-sm"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-40 z-0" />
        <div className="z-10">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Saldo Total</p>
          <h3 className={`text-2xl font-bold tracking-tight mt-1 ${saldoLiquido >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {formatCurrency(saldoLiquido)}
          </h3>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
            <Wallet className="w-3.5 h-3.5 text-blue-500" /> Receitas menos despesas
          </p>
        </div>
        <div className={`p-3 rounded-lg z-10 ${saldoLiquido >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          <DollarSign className="w-5 h-5" />
        </div>
      </motion.div>

      {/* Total Receitas */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.05 }}
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between relative overflow-hidden transition-all duration-200 hover:shadow-sm"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/40 rounded-full -mr-16 -mt-16 opacity-30 z-0" />
        <div className="z-10">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Receitas</p>
          <h3 className="text-2xl font-bold tracking-tight text-emerald-600 mt-1">
            {formatCurrency(totalReceitas)}
          </h3>
          <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> +{transactions.filter(t => t.type === 'receita').length} lançamentos
          </p>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg z-10">
          <TrendingUp className="w-5 h-5" />
        </div>
      </motion.div>

      {/* Total Despesas */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between relative overflow-hidden transition-all duration-200 hover:shadow-sm"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50/40 rounded-full -mr-16 -mt-16 opacity-30 z-0" />
        <div className="z-10">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Despesas</p>
          <h3 className="text-2xl font-bold tracking-tight text-rose-600 mt-1">
            {formatCurrency(totalDespesas)}
          </h3>
          <p className="text-xs text-rose-500 mt-2 flex items-center gap-1 font-semibold">
            <TrendingDown className="w-3.5 h-3.5" /> -{transactions.filter(t => t.type === 'despesa').length} lançamentos
          </p>
        </div>
        <div className="p-3 bg-rose-50 text-rose-600 rounded-lg z-10">
          <TrendingDown className="w-5 h-5" />
        </div>
      </motion.div>

      {/* Total Pendentes */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.15 }}
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between relative overflow-hidden transition-all duration-200 hover:shadow-sm"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/40 rounded-full -mr-16 -mt-16 opacity-30 z-0" />
        <div className="z-10">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Pendente</p>
          <h3 className="text-2xl font-bold tracking-tight text-amber-600 mt-1">
            {formatCurrency(totalPendentes)}
          </h3>
          <p className="text-xs text-amber-700 mt-2 flex items-center gap-1 font-semibold">
            <Clock className="w-3.5 h-3.5" /> Aguardando liquidação
          </p>
        </div>
        <div className="p-3 bg-amber-50 text-amber-600 rounded-lg z-10">
          <Clock className="w-5 h-5" />
        </div>
      </motion.div>
    </div>
  );
}
