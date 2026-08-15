import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Plus, 
  Target, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  X, 
  MapPin, 
  FileText, 
  TrendingUp,
  Edit2,
  Trash2
} from 'lucide-react';
import { AssociationEvent, Transaction } from '../types';

interface AssociationEventsProps {
  events: AssociationEvent[];
  transactions: Transaction[];
  onAddEvent: (event: Omit<AssociationEvent, 'id'>) => void;
  onUpdateEvent: (event: AssociationEvent) => void;
  onDeleteEvent: (id: string) => void;
}

export function AssociationEvents({
  events,
  transactions,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent
}: AssociationEventsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AssociationEvent | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    targetAmount: 0,
    status: 'planejado' as AssociationEvent['status']
  });

  const openAddModal = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      location: '',
      targetAmount: 0,
      status: 'planejado'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (event: AssociationEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location || '',
      targetAmount: event.targetAmount,
      status: event.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingEvent) {
      onUpdateEvent({
        ...editingEvent,
        ...formData
      });
    } else {
      onAddEvent(formData);
    }

    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Calculate financials for each event based on linked transactions
  const getEventFinancials = (eventId: string) => {
    const linked = transactions.filter(t => t.eventId === eventId);
    const totalIncome = linked.filter(t => t.type === 'receita').reduce((sum, t) => sum + (t.value || 0), 0);
    const totalExpense = linked.filter(t => t.type === 'despesa').reduce((sum, t) => sum + (t.value || 0), 0);
    const balance = totalIncome - totalExpense;
    return { totalIncome, totalExpense, balance, count: linked.length };
  };

  const getStatusBadge = (status: AssociationEvent['status']) => {
    switch (status) {
      case 'em_andamento':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">Em Andamento</span>;
      case 'concluido':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">Concluído</span>;
      case 'cancelado':
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">Cancelado</span>;
      case 'planejado':
      default:
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">Planejado</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-400" />
            Eventos e Projetos da Associação
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestão de assembléias, bazares, campanhas de arrecadação e ações sociais
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Evento / Projeto
        </button>
      </div>

      {/* Grid of Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.length === 0 ? (
          <div className="col-span-full bg-slate-800/40 border border-slate-700/60 rounded-xl p-8 text-center text-slate-400">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">Nenhum evento ou projeto cadastrado.</p>
            <p className="text-xs mt-1">Crie eventos como Assembléias, Campanhas ou Bazares para acompanhar receitas e despesas específicas.</p>
          </div>
        ) : (
          events.map((ev) => {
            const financials = getEventFinancials(ev.id);
            const progressPercent = ev.targetAmount > 0 
              ? Math.min(100, (financials.totalIncome / ev.targetAmount) * 100)
              : 100;

            return (
              <div key={ev.id} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-600 transition-all shadow-xl">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-white text-sm line-clamp-1">{ev.title}</h3>
                    {getStatusBadge(ev.status)}
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 mb-4">
                    {ev.description || 'Sem descrição cadastrada.'}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>{ev.date}</span>
                    </div>
                    {ev.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Financials Progress Bar */}
                  {ev.targetAmount > 0 && (
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2 mb-4">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">Meta do Projeto</span>
                        <span className="text-purple-300">{formatCurrency(financials.totalIncome)} / {formatCurrency(ev.targetAmount)}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-right text-slate-400">{progressPercent.toFixed(0)}% alcançado</p>
                    </div>
                  )}

                  {/* Financial Summary */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/40 p-2.5 rounded-lg text-xs">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-semibold block">Arrecadado</span>
                      <span className="font-bold text-white">{formatCurrency(financials.totalIncome)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-400 font-semibold block">Custos / Despesas</span>
                      <span className="font-bold text-white">{formatCurrency(financials.totalExpense)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-700/60 pt-3 mt-4">
                  <span className="text-[10px] text-slate-500 font-medium">{financials.count} lançamentos vinculados</span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(ev)}
                      className="p-1.5 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors cursor-pointer"
                      title="Editar Evento"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir evento "${ev.title}"?`)) {
                          onDeleteEvent(ev.id);
                        }
                      }}
                      className="p-1.5 hover:bg-rose-900/50 text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Evento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add / Edit Event */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  {editingEvent ? 'Editar Evento / Projeto' : 'Novo Evento / Projeto'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Título do Evento ou Projeto *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Assembléia Geral Ordinária / Bazar de Natal"
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Pauta da assembléia ou objetivo da arrecadação..."
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Data</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AssociationEvent['status'] })}
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-purple-500 cursor-pointer"
                    >
                      <option value="planejado">Planejado</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="concluido">Concluído</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Local</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Sede Social / Auditório"
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Meta de Arrecadação (R$)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData({ ...formData, targetAmount: Number(e.target.value) })}
                      placeholder="0.00"
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    {editingEvent ? 'Salvar Evento' : 'Criar Evento'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
