import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  CheckCircle, 
  Clock, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronDown,
  X,
  AlertTriangle,
  RotateCcw,
  Eye,
  FileText,
  Maximize2
} from 'lucide-react';
import { Transaction, MONTH_NAMES, CATEGORIES, BANKS, TransactionType, TransactionStatus } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  onToggleStatus: (id: string) => void;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onExportBackup?: () => void;
  onImportBackup?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearAll?: () => void;
}

export default function TransactionTable({
  transactions,
  onToggleStatus,
  onDeleteTransaction,
  onEditTransaction = () => {},
  onExportBackup = () => {},
  onImportBackup = () => {},
  onClearAll = () => {}
}: TransactionTableProps) {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('todos');
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  
  // Sort states
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'payer'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Backup confirmation state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit transaction modal states
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // View receipt modal state
  const [viewingReceiptTx, setViewingReceiptTx] = useState<Transaction | null>(null);

  // Export excel state message
  const [exportMessage, setExportMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = 
      t.payer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.bank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMonth = selectedMonth === 'todos' || t.month === selectedMonth;
    const matchesType = selectedType === 'todos' || t.type === selectedType;
    const matchesCategory = selectedCategory === 'todos' || t.category === selectedCategory;

    return matchesSearch && matchesMonth && matchesType && matchesCategory;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortBy === 'value') {
      comparison = a.value - b.value;
    } else if (sortBy === 'payer') {
      comparison = a.payer.localeCompare(b.payer);
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const toggleSort = (field: 'date' | 'value' | 'payer') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Handle manual editing submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransaction) {
      onEditTransaction(editingTransaction);
      setEditingTransaction(null);
    }
  };

  // Export paid transactions to Excel format (CSV with semicolons and BOM for UTF-8 compatibility)
  const handleExportExcelPaid = () => {
    const paidTransactions = transactions.filter(t => t.status === 'pago');
    
    if (paidTransactions.length === 0) {
      setExportMessage({
        text: 'Nenhum lançamento marcado como "Pago" foi encontrado para exportar.',
        type: 'error'
      });
      setTimeout(() => setExportMessage(null), 5000);
      return;
    }

    try {
      // Create headers (Portuguese Excel uses semicolon as standard column separator)
      const headers = [
        'Data', 
        'Mês', 
        'Pagador / Recebedor', 
        'Banco', 
        'Valor (R$)', 
        'Tipo', 
        'Categoria', 
        'Descrição', 
        'Status'
      ];
      
      const rows = paidTransactions.map(t => {
        const formattedDate = formatDate(t.date);
        const escapedPayer = t.payer.replace(/"/g, '""');
        const escapedBank = t.bank.replace(/"/g, '""');
        // Format value with comma for decimal separator to open correctly as number in Excel PT-BR
        const formattedValue = Number(t.value || 0).toFixed(2).replace('.', ',');
        const formattedType = t.type === 'receita' ? 'Receita' : 'Despesa';
        const escapedCategory = t.category.replace(/"/g, '""');
        const escapedDesc = (t.description || '').replace(/"/g, '""');
        const formattedStatus = 'Pago';

        return [
          formattedDate,
          t.month,
          `"${escapedPayer}"`,
          `"${escapedBank}"`,
          formattedValue,
          formattedType,
          `"${escapedCategory}"`,
          `"${escapedDesc}"`,
          formattedStatus
        ].join(';');
      });

      // Include UTF-8 BOM (\uFEFF) to make Excel display Portuguese accentuation properly
      const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `lancamentos_pagos_${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportMessage({
        text: `Exportação concluída! Baixado ${paidTransactions.length} lançamentos pagos com sucesso.`,
        type: 'success'
      });
      setTimeout(() => setExportMessage(null), 5000);
    } catch (err) {
      console.error('Erro ao exportar pagamentos:', err);
      setExportMessage({
        text: 'Falha ao processar e baixar o arquivo Excel.',
        type: 'error'
      });
      setTimeout(() => setExportMessage(null), 5000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
      {exportMessage && (
        <div className={`mb-4 p-3 rounded-lg border text-xs flex items-center justify-between font-medium animate-fade-in ${
          exportMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-150 text-emerald-800' 
            : 'bg-rose-50 border-rose-150 text-rose-800'
        }`}>
          <span>{exportMessage.text}</span>
          <button onClick={() => setExportMessage(null)} className="hover:opacity-75 cursor-pointer">
            <X className="w-4 h-4 shrink-0" />
          </button>
        </div>
      )}

      {/* Table actions bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">Histórico do Fluxo de Caixa</h3>
          <p className="text-xs text-slate-400 mt-0.5">Filtre, ordene e exporte as transações e pagamentos</p>
        </div>

        {/* Backup and restore actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportExcelPaid}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Exportar lista de lançamentos pagos para o Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
            Baixar Pagos (Excel)
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={onImportBackup}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors"
            title="Importar Backup do Fluxo de Caixa"
          >
            <Upload className="w-3.5 h-3.5" />
            Importar JSON
          </button>
          
          <button
            onClick={onExportBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors"
            title="Exportar Backup do Fluxo de Caixa"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar JSON
          </button>

          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 hover:border-rose-200 text-xs font-semibold text-rose-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar Tudo
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 animate-bounce" /> Tem certeza?
              </span>
              <button
                onClick={() => {
                  onClearAll();
                  setShowClearConfirm(false);
                }}
                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold uppercase transition-colors"
              >
                Sim
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold uppercase transition-colors"
              >
                Não
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Advanced search and filter panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Pesquisar pagador, banco, desc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all bg-slate-50/50"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Month select */}
        <div className="flex items-center gap-1 bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-transparent border-0 focus:outline-hidden focus:ring-0 text-xs font-medium text-slate-700"
          >
            <option value="todos">Todos os Meses</option>
            {MONTH_NAMES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Type select */}
        <div className="flex items-center gap-1 bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-transparent border-0 focus:outline-hidden focus:ring-0 text-xs font-medium text-slate-700"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="receita">Receitas (Entradas)</option>
            <option value="despesa">Despesas (Saídas)</option>
          </select>
        </div>

        {/* Category select */}
        <div className="flex items-center gap-1 bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-transparent border-0 focus:outline-hidden focus:ring-0 text-xs font-medium text-slate-700"
          >
            <option value="todos">Todas Categorias</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table element */}
      <div className="overflow-x-auto -mx-5 md:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50/80 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 rounded-l-xl cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('date')}>
                  <div className="flex items-center gap-1">
                    Data {sortBy === 'date' && (sortOrder === 'desc' ? '▼' : '▲')}
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('payer')}>
                  <div className="flex items-center gap-1">
                    Pagador / Beneficiário {sortBy === 'payer' && (sortOrder === 'desc' ? '▼' : '▲')}
                  </div>
                </th>
                <th className="py-3 px-4">Banco</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('value')}>
                  <div className="flex items-center gap-1">
                    Valor {sortBy === 'value' && (sortOrder === 'desc' ? '▼' : '▲')}
                  </div>
                </th>
                <th className="py-3 px-4">Mês</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 rounded-r-xl text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              <AnimatePresence initial={false}>
                {sortedTransactions.length > 0 ? (
                  sortedTransactions.map((t) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-3 px-4 font-medium whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>
                      
                      {/* Payer & description */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col max-w-[200px]">
                           <span className="font-semibold text-slate-900 truncate flex items-center gap-1">
                            {t.payer}
                            {t.attachmentName && (
                              <span 
                                className="inline-flex items-center px-1 py-0.5 rounded-sm bg-blue-50 text-blue-600 text-[9px] font-semibold"
                                title={`Documento: ${t.attachmentName}`}
                              >
                                <Sparkles className="w-2.5 h-2.5 mr-0.5 shrink-0" />
                                AI
                              </span>
                            )}
                          </span>
                          <span className="text-slate-400 text-[10px] truncate" title={t.description}>
                            {t.description || 'Sem descrição'}
                          </span>
                        </div>
                      </td>

                      {/* Bank */}
                      <td className="py-3 px-4 font-medium whitespace-nowrap">
                        {t.bank}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[10px]">
                          {t.category}
                        </span>
                      </td>

                      {/* Value and Type Indicator */}
                      <td className="py-3 px-4 font-semibold font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {t.type === 'receita' ? (
                            <span className="text-emerald-600 flex items-center">
                              <ArrowUpRight className="w-3 h-3 shrink-0 mr-0.5" />
                              {formatCurrency(t.value)}
                            </span>
                          ) : (
                            <span className="text-rose-500 flex items-center">
                              <ArrowDownRight className="w-3 h-3 shrink-0 mr-0.5" />
                              -{formatCurrency(t.value)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Month */}
                      <td className="py-3 px-4 font-semibold text-slate-500 whitespace-nowrap">
                        {t.month}
                      </td>

                      {/* Status quick toggle */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => onToggleStatus(t.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] cursor-pointer transition-all hover:scale-105 ${
                            t.status === 'pago'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                          title="Clique para alternar o status"
                        >
                          {t.status === 'pago' ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Pago
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-500" />
                              Pendente
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {(t.attachmentUrl || t.attachmentName) && (
                            <button
                              onClick={() => setViewingReceiptTx(t)}
                              className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-all flex items-center gap-1 text-[10px] font-bold border border-purple-200 px-1.5"
                              title="Visualizar Comprovante do Pagamento"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Comprovante</span>
                            </button>
                          )}
                          <button
                            onClick={() => setEditingTransaction(t)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-all"
                            title="Editar Transação"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(t.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-all"
                            title="Excluir Transação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-slate-500">Nenhum lançamento encontrado</p>
                        <p className="text-[11px] text-slate-400">Adicione manualmente ou arraste um comprovante de banco à esquerda</p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual edit modal */}
      <AnimatePresence>
        {editingTransaction && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-slate-800 text-base">Editar Lançamento</h3>
                <button
                  onClick={() => setEditingTransaction(null)}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Fluxo</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTransaction({ ...editingTransaction, type: 'receita' })}
                      className={`py-1.5 px-3 rounded-lg border font-semibold text-center transition-all ${
                        editingTransaction.type === 'receita'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Receita (Entrada)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTransaction({ ...editingTransaction, type: 'despesa' })}
                      className={`py-1.5 px-3 rounded-lg border font-semibold text-center transition-all ${
                        editingTransaction.type === 'despesa'
                          ? 'bg-rose-50 border-rose-400 text-rose-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Despesa (Saída)
                    </button>
                  </div>
                </div>

                {/* Pagador */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {editingTransaction.type === 'receita' ? 'Pagador / Origem' : 'Beneficiário / Destinatário'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTransaction.payer}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, payer: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 transition-colors bg-white text-xs"
                  />
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingTransaction.value || ''}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, value: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 transition-colors font-mono font-medium text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Banco */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Banco</label>
                    <select
                      value={editingTransaction.bank}
                      onChange={(e) => setEditingTransaction({ ...editingTransaction, bank: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white text-xs"
                    >
                      {BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                      {!BANKS.includes(editingTransaction.bank as any) && (
                        <option value={editingTransaction.bank}>{editingTransaction.bank}</option>
                      )}
                    </select>
                  </div>

                  {/* Categoria */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria</label>
                    <select
                      value={editingTransaction.category}
                      onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white text-xs"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Data */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Data</label>
                    <input
                      type="date"
                      required
                      value={editingTransaction.date}
                      onChange={(e) => {
                        const dateVal = e.target.value;
                        const dateObj = new Date(dateVal + 'T12:00:00');
                        const updatedMonth = !isNaN(dateObj.getTime()) ? MONTH_NAMES[dateObj.getMonth()] : editingTransaction.month;
                        setEditingTransaction({ 
                          ...editingTransaction, 
                          date: dateVal,
                          month: updatedMonth
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 transition-colors text-xs"
                    />
                  </div>

                  {/* Month */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Mês Contábil</label>
                    <select
                      value={editingTransaction.month}
                      onChange={(e) => setEditingTransaction({ ...editingTransaction, month: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden bg-white focus:border-blue-500 transition-colors text-xs"
                    >
                      {MONTH_NAMES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status de Pagamento</label>
                  <select
                    value={editingTransaction.status}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, status: e.target.value as TransactionStatus })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden bg-white focus:border-blue-500 transition-colors text-xs"
                  >
                    <option value="pago">Pago / Liquidado</option>
                    <option value="pendente">Pendente</option>
                  </select>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição</label>
                  <input
                    type="text"
                    value={editingTransaction.description}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 transition-colors text-xs"
                  />
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingTransaction(null)}
                    className="flex-1 py-2 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-medium transition-colors text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-colors text-xs"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW RECEIPT MODAL */}
      <AnimatePresence>
        {viewingReceiptTx && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-400" />
                  <div>
                    <h3 className="font-bold text-sm">Comprovante de Pagamento</h3>
                    <p className="text-[11px] text-slate-400">
                      {viewingReceiptTx.payer} • {formatCurrency(viewingReceiptTx.value)} ({viewingReceiptTx.month})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingReceiptTx(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 flex-1 overflow-auto flex flex-col items-center justify-center min-h-[300px]">
                {viewingReceiptTx.attachmentUrl ? (
                  <img
                    src={viewingReceiptTx.attachmentUrl}
                    alt={`Comprovante de ${viewingReceiptTx.payer}`}
                    className="max-w-full max-h-[65vh] object-contain rounded-xl border border-slate-200 shadow-md"
                  />
                ) : (
                  <div className="text-center py-12 px-4">
                    <FileText className="w-16 h-16 text-purple-500 mx-auto mb-3 opacity-80" />
                    <p className="font-bold text-slate-800 text-sm">{viewingReceiptTx.attachmentName || 'Comprovante Bancário Anexo'}</p>
                    <p className="text-xs text-slate-500 mt-1">O arquivo em formato PDF foi registrado junto à transação.</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-500 space-y-0.5">
                  <p><strong>Banco:</strong> {viewingReceiptTx.bank} | <strong>Data:</strong> {formatDate(viewingReceiptTx.date)}</p>
                  <p><strong>Descrição:</strong> {viewingReceiptTx.description}</p>
                </div>
                <button
                  onClick={() => setViewingReceiptTx(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
