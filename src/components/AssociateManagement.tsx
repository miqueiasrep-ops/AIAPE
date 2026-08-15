import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  X, 
  FileText, 
  Edit2, 
  Trash2, 
  Download, 
  Receipt,
  Phone,
  Mail,
  Building,
  Calendar,
  UserCheck,
  Link2,
  Share2,
  Copy,
  ExternalLink,
  MessageCircle,
  Check,
  QrCode,
  Sparkles
} from 'lucide-react';
import { Associate, AssociateStatus, AssociateCategory, Transaction, AssociationConfig, AssociateRequest, RequestStatus, MONTH_NAMES } from '../types';
import ReceiptExtractor from './ReceiptExtractor';

interface AssociateManagementProps {
  associates: Associate[];
  onAddAssociate: (associate: Omit<Associate, 'id'>) => void;
  onUpdateAssociate: (associate: Associate) => void;
  onDeleteAssociate: (id: string) => void;
  onRegisterPayment: (associate: Associate, month: string, value: number, date: string, bank: string, attachmentUrl?: string, attachmentName?: string) => void;
  onAddTransaction?: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  associationConfig: AssociationConfig;
  onOpenPublicRegister?: () => void;
  requests?: AssociateRequest[];
  onUpdateRequestStatus?: (id: string, status: RequestStatus, note?: string) => void;
}

export function AssociateManagement({
  associates,
  onAddAssociate,
  onUpdateAssociate,
  onDeleteAssociate,
  onRegisterPayment,
  onAddTransaction,
  associationConfig,
  onOpenPublicRegister,
  requests = [],
  onUpdateRequestStatus
}: AssociateManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAssociate, setEditingAssociate] = useState<Associate | null>(null);

  // Extrator AI Receipt Modal State
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);

  // Requests Modal State
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);

  // Link Auto-Cadastro Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Payment Modal state
  const [paymentModalAssociate, setPaymentModalAssociate] = useState<Associate | null>(null);
  const [paymentMonth, setPaymentMonth] = useState<string>('Julho');
  const [paymentValue, setPaymentValue] = useState<number>(associationConfig.defaultMonthlyFee);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentBank, setPaymentBank] = useState<string>(associationConfig.primaryBank || 'Itaú');

  // Receipt Modal state
  const [receiptAssociate, setReceiptAssociate] = useState<Associate | null>(null);

  // Form State for Adding / Editing
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
    address: '',
    category: 'Membro Efetivo' as AssociateCategory,
    status: 'ativo' as AssociateStatus,
    monthlyFee: associationConfig.defaultMonthlyFee,
    dueDay: associationConfig.defaultDueDay,
    membershipDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const openAddModal = () => {
    setEditingAssociate(null);
    setFormData({
      name: '',
      document: '',
      email: '',
      phone: '',
      address: '',
      category: 'Membro Efetivo',
      status: 'ativo',
      monthlyFee: associationConfig.defaultMonthlyFee || 70,
      dueDay: associationConfig.defaultDueDay || 30,
      membershipDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (assoc: Associate) => {
    setEditingAssociate(assoc);
    setFormData({
      name: assoc.name,
      document: assoc.document,
      email: assoc.email,
      phone: assoc.phone,
      address: assoc.address || '',
      category: assoc.category,
      status: assoc.status,
      monthlyFee: assoc.monthlyFee,
      dueDay: assoc.dueDay,
      membershipDate: assoc.membershipDate,
      notes: assoc.notes || ''
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingAssociate) {
      onUpdateAssociate({
        ...editingAssociate,
        ...formData
      });
    } else {
      onAddAssociate(formData);
    }

    setIsAddModalOpen(false);
  };

  const openPaymentModal = (assoc: Associate) => {
    setPaymentModalAssociate(assoc);
    setPaymentValue(assoc.monthlyFee || associationConfig.defaultMonthlyFee || 70);
    const currentMonthIndex = new Date().getMonth();
    setPaymentMonth(MONTH_NAMES[currentMonthIndex] || 'Julho');
    setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalAssociate) return;

    onRegisterPayment(
      paymentModalAssociate,
      paymentMonth,
      Number(paymentValue),
      paymentDate,
      paymentBank
    );

    setPaymentModalAssociate(null);
  };

  // Filtered associates
  const filteredAssociates = associates.filter((a) => {
    const matchesSearch = 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.document.includes(searchTerm) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || a.status === statusFilter;
    const matchesCategory = categoryFilter === 'todas' || a.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate stats
  const totalAssociates = associates.length;
  const activeAssociates = associates.filter(a => a.status === 'ativo').length;
  const overdueAssociates = associates.filter(a => a.status === 'inadimplente').length;
  const expectedMonthlyIncome = associates
    .filter(a => a.status === 'ativo')
    .reduce((sum, a) => sum + (a.monthlyFee || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getStatusBadge = (status: AssociateStatus) => {
    switch (status) {
      case 'ativo':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Ativo</span>;
      case 'inadimplente':
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Inadimplente</span>;
      case 'pendente':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Pendente</span>;
      case 'inativo':
      default:
        return <span className="bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full text-[10px] font-bold">Inativo</span>;
    }
  };

  const pendingAssociates = associates.filter(a => a.status === 'pendente');

  const getPublicLink = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${window.location.pathname}?autocadastro=true`;
    }
    return 'https://sua-associacao.com.br/?autocadastro=true';
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getPublicLink());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsapp = () => {
    const text = `Olá! Venha fazer parte da ${associationConfig.name || 'nossa Associação'}. Faça seu auto-cadastro de novo membro pelo link: ${getPublicLink()}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            Gestão de Associados
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastro completo, controle de mensalidades e recibos da associação
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsRequestsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-950/80 hover:bg-indigo-900/90 border border-indigo-700/60 text-indigo-300 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs relative"
          >
            <MessageCircle className="w-4 h-4 text-indigo-400" />
            <span>Solicitações dos Associados</span>
            {requests.length > 0 && (
              <span className="bg-indigo-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {requests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsExtractModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Baixa Automática (PIX)</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Associado</span>
          </button>
        </div>
      </div>

      {/* Pending Auto-Registration Alert Banner */}
      {pendingAssociates.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-300">
                {pendingAssociates.length} {pendingAssociates.length === 1 ? 'novo associado aguardando' : 'novos associados aguardando'} aprovação de auto-cadastro!
              </p>
              <p className="text-[11px] text-amber-200/80">
                Pessoas que se cadastraram via link público e necessitam de validação no sistema.
              </p>
            </div>
          </div>

          <button
            onClick={() => setStatusFilter('pendente')}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer whitespace-nowrap self-end sm:self-auto"
          >
            Ver Cadastros Pendentes
          </button>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total de Associados</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalAssociates}</p>
          <p className="text-[10px] text-slate-400 mt-1">Membros cadastrados no sistema</p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Associados Ativos</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{activeAssociates}</p>
          <p className="text-[10px] text-slate-400 mt-1">{((activeAssociates / (totalAssociates || 1)) * 100).toFixed(0)}% do quadro de membros</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-xs text-white pl-9 pr-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-300 px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500 cursor-pointer"
          >
            <option value="todos">Todos os Status</option>
            <option value="ativo">Ativo</option>
            <option value="inadimplente">Inadimplente</option>
            <option value="pendente">Pendente</option>
            <option value="inativo">Inativo</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-300 px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500 cursor-pointer"
          >
            <option value="todas">Todas as Categorias</option>
            <option value="Membro Efetivo">Membro Efetivo</option>
            <option value="Membro Doador">Membro Doador</option>
            <option value="Membro Honorário">Membro Honorário</option>
            <option value="Estudante / Especial">Estudante / Especial</option>
            <option value="Voluntário">Voluntário</option>
          </select>
        </div>
      </div>

      {/* Associates Table */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-700/60">
              <tr>
                <th className="px-4 py-3">Associado</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Mensalidade</th>
                <th className="px-4 py-3">Último Pagamento</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40 text-slate-300">
              {filteredAssociates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Nenhum associado encontrado.
                  </td>
                </tr>
              ) : (
                filteredAssociates.map((assoc) => (
                  <tr key={assoc.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-bold text-white text-xs">{assoc.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          {assoc.document && <span>Doc: {assoc.document}</span>}
                          {assoc.phone && <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" /> {assoc.phone}</span>}
                        </div>
                        {assoc.documents && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[9px] font-bold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <FileText className="w-2.5 h-2.5 text-amber-400" />
                              3 PDFs Anexados (CNH, CRLV, SENATRAN)
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-900 text-slate-300 px-2 py-1 rounded text-[11px]">
                        {assoc.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(assoc.status)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {formatCurrency(assoc.monthlyFee)}
                      <span className="text-[10px] text-slate-400 block font-normal">Venc. Dia {assoc.dueDay}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {assoc.lastPaymentDate ? (
                        <div>
                          <p className="text-xs font-medium text-emerald-400">{assoc.lastPaymentMonth || assoc.lastPaymentDate}</p>
                          <p className="text-[9px] text-slate-500">{assoc.lastPaymentDate}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Sem registros</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openPaymentModal(assoc)}
                          title="Dar Baixa em Mensalidade"
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <DollarSign className="w-3 h-3" />
                          Baixa
                        </button>

                        <button
                          onClick={() => setReceiptAssociate(assoc)}
                          title="Emitir Recibo de Quitação"
                          className="p-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openEditModal(assoc)}
                          title="Editar Cadastro"
                          className="p-1.5 bg-slate-700/60 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Deseja realmente excluir o associado ${assoc.name}?`)) {
                              onDeleteAssociate(assoc.id);
                            }
                          }}
                          title="Excluir"
                          className="p-1.5 bg-slate-700/60 hover:bg-rose-900/50 text-rose-400 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT ASSOCIATE */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-400" />
                  {editingAssociate ? 'Editar Associado' : 'Novo Associado'}
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Maria das Graças Silva"
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">CPF ou CNPJ</label>
                    <input
                      type="text"
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                      placeholder="000.000.000-00"
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 98765-4321"
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="associado@email.com"
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria de Associado</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as AssociateCategory })}
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Membro Efetivo">Membro Efetivo</option>
                      <option value="Membro Doador">Membro Doador</option>
                      <option value="Membro Honorário">Membro Honorário</option>
                      <option value="Estudante / Especial">Estudante / Especial</option>
                      <option value="Voluntário">Voluntário</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Status do Membro</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AssociateStatus })}
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500 cursor-pointer"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inadimplente">Inadimplente</option>
                      <option value="pendente">Pendente</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Valor Mensalidade (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.monthlyFee}
                      onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Dia de Vencimento</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.dueDay}
                      onChange={(e) => setFormData({ ...formData, dueDay: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                {editingAssociate?.documents && (
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-400" />
                      Documentos Obrigatórios Anexados (PDFs)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      {editingAssociate.documents.cnhUrl && (
                        <a
                          href={editingAssociate.documents.cnhUrl}
                          download={editingAssociate.documents.cnhName || 'CNH.pdf'}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-blue-400 font-medium truncate flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate">1. CNH.pdf</span>
                        </a>
                      )}
                      {editingAssociate.documents.crlvUrl && (
                        <a
                          href={editingAssociate.documents.crlvUrl}
                          download={editingAssociate.documents.crlvName || 'CRLV.pdf'}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-blue-400 font-medium truncate flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate">2. CRLV.pdf</span>
                        </a>
                      )}
                      {editingAssociate.documents.senatranUrl && (
                        <a
                          href={editingAssociate.documents.senatranUrl}
                          download={editingAssociate.documents.senatranName || 'Credencial_SENATRAN.pdf'}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-blue-400 font-medium truncate flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate">3. SENATRAN.pdf</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    {editingAssociate ? 'Salvar Alterações' : 'Cadastrar Associado'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: REGISTER PAYMENT (BAIXA DE MENSALIDADE) */}
      <AnimatePresence>
        {paymentModalAssociate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Baixa de Mensalidade
                </h3>
                <button
                  onClick={() => setPaymentModalAssociate(null)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                  <p className="text-xs font-bold text-white">{paymentModalAssociate.name}</p>
                  <p className="text-[10px] text-slate-400">Doc: {paymentModalAssociate.document || 'Não informado'} | {paymentModalAssociate.category}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mês de Referência</label>
                  <select
                    value={paymentMonth}
                    onChange={(e) => setPaymentMonth(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    {MONTH_NAMES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Valor Recebido (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={paymentValue}
                      onChange={(e) => setPaymentValue(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Data do Pagamento</label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Conta Bancária de Destino</label>
                  <select
                    value={paymentBank}
                    onChange={(e) => setPaymentBank(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Itaú">Itaú</option>
                    <option value="Banco do Brasil">Banco do Brasil</option>
                    <option value="Bradesco">Bradesco</option>
                    <option value="Caixa Econômica">Caixa Econômica</option>
                    <option value="Nubank">Nubank</option>
                    <option value="Sicoob">Sicoob</option>
                    <option value="Sicredi">Sicredi</option>
                    <option value="Inter">Inter</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <p className="text-[11px] text-emerald-400/90 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                  ✓ Esta baixa registrará automaticamente uma **Receita** na categoria &quot;Mensalidades de Associados&quot; no seu Fluxo de Caixa.
                </p>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentModalAssociate(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Confirmar e Lançar no Caixa
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: PRINTABLE RECEIPT (RECIBO DE QUITAÇÃO DE MENSALIDADE) */}
      <AnimatePresence>
        {receiptAssociate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white text-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-300"
            >
              <div className="p-6 space-y-6">
                <div className="text-center border-b border-slate-200 pb-4">
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">{associationConfig.name || 'AIAPE - Instrutores de Trânsito PE'}</h2>
                  <p className="text-xs text-slate-600 font-medium mt-1">CNPJ: {associationConfig.cnpj || '24.810.192/0001-85'}</p>
                  <p className="text-[11px] text-slate-500">{associationConfig.address || 'Sede Social'}</p>
                </div>

                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                    <span>RECIBO DE QUITAÇÃO DE MENSALIDADE</span>
                    <span className="text-blue-700">{formatCurrency(receiptAssociate.monthlyFee)}</span>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-700 pt-1">
                    Recebemos do(a) associado(a) <strong className="text-slate-900">{receiptAssociate.name}</strong>, inscrito(a) no CPF/CNPJ <strong className="text-slate-900">{receiptAssociate.document || 'N/A'}</strong>, a quantia de <strong className="text-slate-900">{formatCurrency(receiptAssociate.monthlyFee)}</strong> referente ao pagamento da contribuição associativa / mensalidade social.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Categoria</span>
                    <span className="font-semibold text-slate-800">{receiptAssociate.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Data de Emissão</span>
                    <span className="font-semibold text-slate-800">{new Date().toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-6 text-center text-xs">
                  <div>
                    <div className="border-t border-slate-400 pt-1 mx-4">
                      <p className="font-bold text-slate-800">{associationConfig.president || 'Presidente'}</p>
                      <p className="text-[10px] text-slate-500">Presidente da Associação</p>
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-slate-400 pt-1 mx-4">
                      <p className="font-bold text-slate-800">{associationConfig.treasurer || 'Tesoureiro'}</p>
                      <p className="text-[10px] text-slate-500">Tesouraria / Finanças</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setReceiptAssociate(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Imprimir Recibo
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal Extrator Inteligente de Comprovantes */}
        {isExtractModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto relative shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-bold text-white">Extrator de Comprovante de Pagamento de Mensalidade</h3>
                </div>
                <button
                  onClick={() => setIsExtractModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ReceiptExtractor
                associates={associates}
                onRegisterPayment={onRegisterPayment}
                onAddTransaction={onAddTransaction || (() => {})}
              />
            </motion.div>
          </div>
        )}

        {/* Modal de Gerenciamento de Solicitações dos Associados */}
        {isRequestsModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto relative shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Central de Solicitações dos Associados</h3>
                    <p className="text-xs text-slate-400">Atenda pedidos de empréstimos parceiros, declarações, benefícios e suporte.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRequestsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {requests.length === 0 ? (
                <div className="py-12 text-center space-y-2 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                  <MessageCircle className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">Nenhuma solicitação pendente no momento.</p>
                  <p className="text-[11px] text-slate-500">As solicitações enviadas pelos associados através do portal aparecerão aqui.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map(req => (
                    <div key={req.id} className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 space-y-3 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-2.5">
                        <div>
                          <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider block">
                            {req.type}
                          </span>
                          <h4 className="text-sm font-bold text-white">{req.title}</h4>
                          <p className="text-[11px] text-slate-400 font-medium">
                            Solicitado por: <strong className="text-slate-200">{req.associateName}</strong> • Data: {req.date}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold self-start sm:self-center ${
                          req.status === 'concluido' || req.status === 'aprovado' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          req.status === 'em_analise' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          req.status === 'recusado' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {req.status === 'concluido' || req.status === 'aprovado' ? '✓ Concluído / Aprovado' :
                           req.status === 'em_analise' ? '⏳ Em Análise' :
                           req.status === 'recusado' ? '✕ Recusado' : '● Pendente'}
                        </span>
                      </div>

                      <p className="text-slate-300 text-xs bg-slate-900/60 p-3 rounded-xl leading-relaxed border border-slate-800">
                        {req.description}
                      </p>

                      {req.responseNote && (
                        <div className="p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-xl text-[11px] text-indigo-200">
                          <strong>Resposta da Diretoria:</strong> {req.responseNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 text-right">
                <button
                  onClick={() => setIsRequestsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
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
