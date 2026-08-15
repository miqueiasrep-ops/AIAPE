import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Building,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Transaction, Associate, AssociationConfig, MONTH_NAMES } from '../types';

interface AssociationReportsProps {
  transactions: Transaction[];
  associates: Associate[];
  associationConfig: AssociationConfig;
  selectedCompetence: string;
}

export function AssociationReports({
  transactions,
  associates,
  associationConfig,
  selectedCompetence
}: AssociationReportsProps) {
  const [reportType, setReportType] = useState<'dre' | 'inadimplencia' | 'balancete'>('dre');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Financial Calculations
  const totalReceitas = transactions
    .filter(t => t.type === 'receita')
    .reduce((sum, t) => sum + (t.value || 0), 0);

  const totalDespesas = transactions
    .filter(t => t.type === 'despesa')
    .reduce((sum, t) => sum + (t.value || 0), 0);

  const superavitDeficit = totalReceitas - totalDespesas;

  // Breakdown by category
  const categoriesMap: { [key: string]: { receita: number; despesa: number } } = {};
  transactions.forEach(t => {
    const cat = t.category || 'Outros';
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = { receita: 0, despesa: 0 };
    }
    if (t.type === 'receita') {
      categoriesMap[cat].receita += (t.value || 0);
    } else {
      categoriesMap[cat].despesa += (t.value || 0);
    }
  });

  // Associate Inadimplência Stats
  const totalAssociados = associates.length;
  const inativos = associates.filter(a => a.status === 'inativo').length;
  const inadimplentes = associates.filter(a => a.status === 'inadimplente').length;
  const ativos = associates.filter(a => a.status === 'ativo').length;

  const totalPendingDuesAmount = associates
    .filter(a => a.status === 'inadimplente')
    .reduce((sum, a) => sum + (a.monthlyFee || 0), 0);

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'PRESTAÇÃO DE CONTAS DA ASSOCIAÇÃO\n';
    csvContent += `Associação:;${associationConfig.name}\n`;
    csvContent += `Status Jurídico:;Em processo de formalização e abertura\n`;
    csvContent += `Data de Emissão:;${new Date().toLocaleDateString('pt-BR')}\n\n`;

    csvContent += 'DEMONSTRATIVO FINANCEIRO\n';
    csvContent += `Total de Receitas (Arrecadação);${totalReceitas.toFixed(2)}\n`;
    csvContent += `Total de Despesas (Custos);${totalDespesas.toFixed(2)}\n`;
    csvContent += `Resultado (Superávit / Déficit);${superavitDeficit.toFixed(2)}\n\n`;

    csvContent += 'DETALHAMENTO POR CATEGORIA\nCategoria;Receitas (R$);Despesas (R$)\n';
    Object.entries(categoriesMap).forEach(([cat, val]) => {
      csvContent += `${cat};${val.receita.toFixed(2)};${val.despesa.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Balancete_Associacao_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            Prestação de Contas & Relatórios da Associação
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Relatório gerencial para apresentação em Assembléias e Conselho Fiscal
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Exportar CSV
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Tabs for Reports */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setReportType('dre')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            reportType === 'dre'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          Balancete & DRE da Associação
        </button>

        <button
          onClick={() => setReportType('inadimplencia')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            reportType === 'inadimplencia'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          Relatório de Inadimplência
        </button>
      </div>

      {reportType === 'dre' && (
        <div className="space-y-6">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-400 block mb-1">Total Entradas (Receitas)</span>
              <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalReceitas)}</p>
              <p className="text-[10px] text-slate-400 mt-1">Mensalidades, doações e eventos</p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-400 block mb-1">Total Saídas (Despesas)</span>
              <p className="text-2xl font-bold text-rose-400">{formatCurrency(totalDespesas)}</p>
              <p className="text-[10px] text-slate-400 mt-1">Custos da sede, projetos e manutenção</p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-400 block mb-1">Resultado (Superávit / Déficit)</span>
              <p className={`text-2xl font-bold ${superavitDeficit >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                {formatCurrency(superavitDeficit)}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {superavitDeficit >= 0 ? '✓ Superávit acumulado no período' : '⚠ Déficit no período - Requer atenção'}
              </p>
            </div>
          </div>

          {/* Detailed DRE Table */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 space-y-6">
            <div className="border-b border-slate-700/60 pb-4">
              <h3 className="text-base font-bold text-white uppercase">{associationConfig.name || 'Demonstrativo do Resultado do Exercício - DRE'}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Entidade Sem Fins Lucrativos | CNPJ: {associationConfig.cnpj || '24.810.192/0001-85'}</p>
            </div>

            <div className="space-y-4">
              {/* Section 1: Income */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                  <span>1. RECEITAS OPERACIONAIS E ARRECADAÇÃO</span>
                  <span>{formatCurrency(totalReceitas)}</span>
                </div>

                <div className="pl-4 space-y-1.5">
                  {Object.entries(categoriesMap)
                    .filter(([_, val]) => val.receita > 0)
                    .map(([cat, val]) => (
                      <div key={cat} className="flex justify-between text-xs text-slate-300 border-b border-slate-800/60 py-1">
                        <span>• {cat}</span>
                        <span className="font-semibold text-white">{formatCurrency(val.receita)}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Section 2: Expenses */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs font-bold text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                  <span>2. DESPESAS E CUSTOS OPERACIONAIS</span>
                  <span>-{formatCurrency(totalDespesas)}</span>
                </div>

                <div className="pl-4 space-y-1.5">
                  {Object.entries(categoriesMap)
                    .filter(([_, val]) => val.despesa > 0)
                    .map(([cat, val]) => (
                      <div key={cat} className="flex justify-between text-xs text-slate-300 border-b border-slate-800/60 py-1">
                        <span>• {cat}</span>
                        <span className="font-semibold text-rose-300">-{formatCurrency(val.despesa)}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Final Result */}
              <div className="pt-4 border-t-2 border-slate-700 flex justify-between items-center text-sm font-bold bg-slate-900 p-4 rounded-xl">
                <span className="text-slate-200">SUPERÁVIT (DÉFICIT) LÍQUIDO DO PERÍODO:</span>
                <span className={superavitDeficit >= 0 ? 'text-emerald-400 text-lg' : 'text-rose-400 text-lg'}>
                  {formatCurrency(superavitDeficit)}
                </span>
              </div>
            </div>

            {/* Signatures placeholder for Assembly */}
            <div className="pt-8 border-t border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-6 text-center text-xs text-slate-400">
              <div>
                <div className="border-t border-slate-600 pt-2 mx-8">
                  <p className="font-bold text-slate-200">{associationConfig.president || 'Presidente'}</p>
                  <p className="text-[10px]">Presidente do Conselho Diretor</p>
                </div>
              </div>
              <div>
                <div className="border-t border-slate-600 pt-2 mx-8">
                  <p className="font-bold text-slate-200">{associationConfig.treasurer || 'Tesoureiro'}</p>
                  <p className="text-[10px]">Tesoureiro Geral / Conselho Fiscal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'inadimplencia' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-400 block mb-1">Membros Inadimplentes</span>
              <p className="text-2xl font-bold text-rose-400">{inadimplentes}</p>
              <p className="text-[10px] text-slate-400 mt-1">de {totalAssociados} associados registrados</p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-400 block mb-1">Taxa de Inadimplência</span>
              <p className="text-2xl font-bold text-amber-400">
                {((inadimplentes / (totalAssociados || 1)) * 100).toFixed(1)}%
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Percentual de atraso em mensalidades</p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-400 block mb-1">Total a Receber Atrasado</span>
              <p className="text-2xl font-bold text-rose-300">{formatCurrency(totalPendingDuesAmount)}</p>
              <p className="text-[10px] text-slate-400 mt-1">Estimativa de repasse pendente</p>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4">Lista de Associados com Mensalidades Pendentes</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-2.5">Associado</th>
                    <th className="px-4 py-2.5">Contato</th>
                    <th className="px-4 py-2.5">Categoria</th>
                    <th className="px-4 py-2.5">Valor da Mensalidade</th>
                    <th className="px-4 py-2.5">Dia de Vencimento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40 text-slate-300">
                  {associates.filter(a => a.status === 'inadimplente').length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400">
                        Nenhum associado inadimplente registrado. Parabéns!
                      </td>
                    </tr>
                  ) : (
                    associates
                      .filter(a => a.status === 'inadimplente')
                      .map(a => (
                        <tr key={a.id} className="hover:bg-slate-700/30">
                          <td className="px-4 py-3 font-bold text-white">{a.name}</td>
                          <td className="px-4 py-3 text-slate-400">{a.phone || a.email || 'Não informado'}</td>
                          <td className="px-4 py-3">{a.category}</td>
                          <td className="px-4 py-3 font-semibold text-rose-400">{formatCurrency(a.monthlyFee)}</td>
                          <td className="px-4 py-3">Dia {a.dueDay}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
