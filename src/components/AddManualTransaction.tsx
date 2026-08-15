import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, DollarSign, Calendar, Tag, Building2, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Transaction, MONTH_NAMES, CATEGORIES, BANKS, TransactionType, TransactionStatus } from '../types';

interface AddManualTransactionProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

export default function AddManualTransaction({ onAddTransaction }: AddManualTransactionProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Form states
  const [type, setType] = useState<TransactionType>('despesa');
  const [payer, setPayer] = useState('');
  const [value, setValue] = useState<string>('');
  const [bank, setBank] = useState<string>('Nubank');
  const [category, setCategory] = useState<string>('Outros');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState<string>(MONTH_NAMES[new Date().getMonth()]);
  const [status, setStatus] = useState<TransactionStatus>('pago');
  const [description, setDescription] = useState('');

  const handleDateChange = (dateVal: string) => {
    setDate(dateVal);
    const dateObj = new Date(dateVal + 'T12:00:00');
    if (!isNaN(dateObj.getTime())) {
      setMonth(MONTH_NAMES[dateObj.getMonth()]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payer || !value || Number(value) <= 0) return;

    onAddTransaction({
      date,
      month,
      payer,
      bank,
      value: Number(value),
      type,
      category,
      description: description || (type === 'receita' ? 'Receita Manual' : 'Despesa Manual'),
      status
    });

    // Reset Form
    setPayer('');
    setValue('');
    setDescription('');
    setStatus('pago');
    setIsOpen(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Header Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 font-semibold text-slate-800 text-sm hover:bg-slate-50/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Plus className="w-4 h-4" />
          </div>
          <span>Adicionar Lançamento Manual</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {/* Collapsed Form Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 bg-slate-50/30 overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {/* Type toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tipo de Movimentação</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('receita')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                      type === 'receita'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Receita (Entrada / Ganho)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('despesa')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                      type === 'despesa'
                        ? 'bg-rose-50 border-rose-400 text-rose-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Despesa (Saída / Pagamento)
                  </button>
                </div>
              </div>

              {/* Pagador / Beneficiario */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {type === 'receita' ? 'Pagador / Origem da Receita' : 'Beneficiário / Nome do Estabelecimento'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={type === 'receita' ? "Ex: Cliente Miqueias, Salário..." : "Ex: Supermercado Silva, Aluguel..."}
                  value={payer}
                  onChange={(e) => setPayer(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Valor & Banco */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 transition-colors font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Banco
                  </label>
                  <select
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 transition-colors"
                  >
                    {BANKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data, Month, Category, Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Mês Contábil
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 transition-colors font-semibold text-slate-700"
                  >
                    {MONTH_NAMES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 transition-colors"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-slate-400" />
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 transition-colors font-semibold text-slate-700"
                  >
                    <option value="pago">Pago / Liquidado</option>
                    <option value="pendente">Pendente</option>
                  </select>
                </div>
              </div>

              {/* Descricao */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição Adicional</label>
                <input
                  type="text"
                  placeholder="Ex: Transferência pix referente ao serviço de consultoria"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
