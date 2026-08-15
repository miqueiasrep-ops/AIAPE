import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Calendar, 
  Gift, 
  Building2, 
  TrendingDown, 
  FileText, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  LogOut, 
  ChevronRight, 
  CreditCard, 
  DollarSign, 
  Heart, 
  Car, 
  Briefcase, 
  Percent, 
  Sparkles, 
  QrCode, 
  MessageSquare, 
  PhoneCall, 
  PlusCircle, 
  Award,
  Filter,
  Search,
  Check,
  Building
} from 'lucide-react';
import { 
  Associate, 
  AssociateRequest, 
  AssociationConfig, 
  BenefitPartner, 
  RequestType, 
  Transaction 
} from '../types';
import { AiapeLogo } from './AiapeLogo';
import ReceiptExtractor from './ReceiptExtractor';
import { PixPaymentCard } from './PixPaymentCard';

interface AssociatePortalProps {
  associate: Associate;
  allAssociates: Associate[];
  requests: AssociateRequest[];
  associationConfig: AssociationConfig;
  myTransactions: Transaction[];
  onLogout: () => void;
  onSubmitRequest: (newReq: Omit<AssociateRequest, 'id' | 'createdAt' | 'status'>) => void;
  onAddTransaction?: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onRegisterPayment?: (associate: Associate, month: string, value: number, date: string, bank: string, attachmentUrl?: string, attachmentName?: string) => void;
}

export function AssociatePortal({
  associate,
  allAssociates,
  requests,
  associationConfig,
  myTransactions,
  onLogout,
  onSubmitRequest,
  onAddTransaction,
  onRegisterPayment
}: AssociatePortalProps) {
  const [activeTab, setActiveTab] = useState<'inicio' | 'solicitacoes' | 'beneficios' | 'aniversariantes' | 'financeiro' | 'comprovante' | 'carteirinha'>('inicio');
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>('emprestimo');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestAmount, setRequestAmount] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState('');

  // Loan calculator state
  const [loanAmount, setLoanAmount] = useState<number>(3000);
  const [loanMonths, setLoanMonths] = useState<number>(12);

  // Filter requests for logged associate
  const myRequests = requests.filter(r => r.associateId === associate.id || r.associateDocument === associate.document);

  // Calculate birthdays of current month
  const currentMonthNum = new Date().getMonth() + 1; // 1-12
  const birthdayAssociates = allAssociates.filter(a => {
    if (!a.birthDate) return false;
    // Expected birthDate format: YYYY-MM-DD or MM-DD
    const parts = a.birthDate.split('-');
    if (parts.length === 3) {
      return parseInt(parts[1], 10) === currentMonthNum;
    } else if (parts.length === 2) {
      return parseInt(parts[0], 10) === currentMonthNum;
    }
    return false;
  });

  const isMyBirthdayMonth = associate.birthDate ? (() => {
    const parts = associate.birthDate.split('-');
    if (parts.length === 3) return parseInt(parts[1], 10) === currentMonthNum;
    if (parts.length === 2) return parseInt(parts[0], 10) === currentMonthNum;
    return false;
  })() : false;

  const currentMonthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());

  // Benefit partners default data
  const PARTNERS: BenefitPartner[] = [
    {
      id: 'p-1',
      name: 'Credi-Instrutor AIAPE (Empréstimos Parceiros)',
      category: 'emprestimo',
      discountText: 'Taxas reduzidas a partir de 1,19% a.m.',
      description: 'Crédito exclusivo para instrutores de trânsito com aprovação rápida, juros sub-mercado e parcelamento em até 48x.',
      iconName: 'TrendingDown',
      badge: 'Menor Taxa do Mercado'
    },
    {
      id: 'p-2',
      name: 'Rede Saúde & Odonto PE',
      category: 'saude',
      discountText: 'Até 45% de desconto em mensalidades',
      description: 'Planos de saúde e odontológicos coletivos por adesão para o associado AIAPE e seus dependentes diretos.',
      iconName: 'Heart',
      badge: 'Convênio Família'
    },
    {
      id: 'p-3',
      name: 'CFCs e Autoescolas Parceiras DETRAN-PE',
      category: 'educacao',
      discountText: '30% de desconto em cursos e renovações',
      description: 'Descontos especiais em cursos de reciclagem, especializações de trânsito e renovação de credenciamento instrutor.',
      iconName: 'Award',
      badge: 'Capacitação Profissional'
    },
    {
      id: 'p-4',
      name: 'Postos Combustível Mais PE',
      category: 'combustivel',
      discountText: 'Desconto de R$ 0,25/litro',
      description: 'Rede credenciada em Recife, Olinda, Jaboatão, Caruaru e Petrolina para abastecimento com valor diferenciado.',
      iconName: 'Car',
      badge: 'Economia Diária'
    },
    {
      id: 'p-5',
      name: 'Assessoria Jurídica de Trânsito & Defesa',
      category: 'juridico',
      discountText: '1ª Consultoria Gratuita + 50% de desconto',
      description: 'Suporte legal especializado em legislação de trânsito, acidentes de trabalho e recursos junto ao DETRAN/JARI.',
      iconName: 'Briefcase',
      badge: 'Proteção Legal'
    },
    {
      id: 'p-6',
      name: 'Despachante Veicular & Seguros de Frota',
      category: 'veicular',
      discountText: 'Isenção de taxa de serviço + 20% no Seguro',
      description: 'Facilidade na regularização de veículos de instrução, vistorias e apólices de proteção veicular para associados.',
      iconName: 'ShieldCheck',
      badge: 'Facilidade Veicular'
    }
  ];

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTitle.trim() || !requestDescription.trim()) return;

    onSubmitRequest({
      associateId: associate.id,
      associateName: associate.name,
      associateDocument: associate.document,
      associatePhone: associate.phone,
      type: requestType,
      title: requestTitle.trim(),
      description: requestDescription.trim(),
      amountRequested: requestAmount ? parseFloat(requestAmount) : undefined
    });

    setSuccessMsg('Sua solicitação foi enviada com sucesso para a diretoria da AIAPE!');
    setShowNewRequestModal(false);
    setRequestTitle('');
    setRequestDescription('');
    setRequestAmount('');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const openLoanRequestWithAmount = () => {
    setRequestType('emprestimo');
    setRequestTitle(`Solicitação de Empréstimo Parceiro - R$ ${loanAmount.toLocaleString('pt-BR')}`);
    setRequestDescription(`Gostaria de solicitar a simulação de empréstimo parceiro AIAPE no valor de R$ ${loanAmount.toLocaleString('pt-BR')} em ${loanMonths} parcelas.`);
    setRequestAmount(loanAmount.toString());
    setShowNewRequestModal(true);
  };

  // Calculate Loan Simulation
  // Market rate ~3.5% a.m vs Partner rate ~1.2% a.m
  const partnerMonthlyRate = 0.012; // 1.2%
  const marketMonthlyRate = 0.035; // 3.5%

  const partnerPMT = (loanAmount * partnerMonthlyRate * Math.pow(1 + partnerMonthlyRate, loanMonths)) / (Math.pow(1 + partnerMonthlyRate, loanMonths) - 1);
  const marketPMT = (loanAmount * marketMonthlyRate * Math.pow(1 + marketMonthlyRate, loanMonths)) / (Math.pow(1 + marketMonthlyRate, loanMonths) - 1);
  const totalSavings = (marketPMT * loanMonths) - (partnerPMT * loanMonths);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
      case 'concluido':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Concluído / Aprovado</span>;
      case 'em_analise':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Em Análise</span>;
      case 'recusado':
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Não Aprovado</span>;
      default:
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Pendente</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AiapeLogo variant="icon" size="sm" customLogoUrl={associationConfig.logoUrl} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-white tracking-wide">ÁREA DO ASSOCIADO</span>
                <span className="bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                  PORTAL EXCLUSIVO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold line-clamp-1">
                {associate.name} • {associate.category}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('carteirinha')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-400" />
              Carteirinha Digital
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Success Alert */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs font-semibold shadow-lg"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 border border-blue-900/40 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Bem-vindo(a), Instrutor(a) {associate.name.split(' ')[0]}!
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Seu Espaço Exclusivo na AIAPE Pernambuco
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Acesse empréstimos com juros reduzidos, faça solicitações à diretoria, confira parcerias e veja os aniversariantes do mês.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setShowNewRequestModal(true)}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Nova Solicitação
              </button>
              <button
                onClick={() => setActiveTab('beneficios')}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                Empréstimos & Benefícios
              </button>
            </div>
          </div>
        </div>

        {/* Birthday Month Special Banner if applicable */}
        {isMyBirthdayMonth && (
          <div className="bg-gradient-to-r from-amber-500/20 via-amber-900/20 to-slate-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex items-center gap-4 text-amber-200">
            <div className="w-12 h-12 bg-amber-500/20 rounded-2xl border border-amber-500/30 flex items-center justify-center shrink-0">
              <Gift className="w-6 h-6 text-amber-400 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-amber-300">🎉 Parabéns! Este é o seu mês de aniversário!</h3>
              <p className="text-xs text-amber-200/90 mt-0.5">
                A diretoria e toda a família AIAPE desejam a você muita saúde, paz e sucesso no trânsito e na vida!
              </p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('inicio')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'inicio'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            Painel Geral
          </button>

          <button
            onClick={() => setActiveTab('solicitacoes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'solicitacoes'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Minhas Solicitações ({myRequests.length})
          </button>

          <button
            onClick={() => setActiveTab('beneficios')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'beneficios'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <TrendingDown className="w-4 h-4 text-emerald-400" />
            Empresas Parceiras & Empréstimos
          </button>

          <button
            onClick={() => setActiveTab('aniversariantes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'aniversariantes'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Gift className="w-4 h-4 text-amber-400" />
            Aniversariantes ({birthdayAssociates.length})
          </button>

          <button
            onClick={() => setActiveTab('financeiro')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'financeiro'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-emerald-400 hover:text-white hover:bg-slate-800 border border-emerald-500/30'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Pagar Mensalidade (Pix QR Code)</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-bold">R$ 70,00</span>
          </button>

          <button
            onClick={() => setActiveTab('comprovante')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'comprovante'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-900 text-purple-300 hover:text-white hover:bg-slate-800 border border-purple-500/30'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            Enviar Comprovante (IA)
          </button>

          <button
            onClick={() => setActiveTab('carteirinha')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'carteirinha'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Carteirinha Digital
          </button>
        </div>

        {/* TAB 1: PAINEL GERAL / INICIO */}
        {activeTab === 'inicio' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Status Cards */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Cartão de Pagamento PIX com QR Code */}
              <PixPaymentCard
                amount={associate.monthlyFee || 70}
                associateName={associate.name}
                pixKey={associationConfig.pixKey || 'contato@aiape.org.br'}
                pixCopiaCola={associationConfig.pixCopiaCola}
                pixQrCodeImageUrl={associationConfig.pixQrCodeImageUrl}
                merchantName={associationConfig.name}
                onOpenExtractor={() => setActiveTab('comprovante')}
              />

              {/* Loan Simulator Quick Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">Simulador de Empréstimo Parceiro AIAPE</h3>
                      <p className="text-xs text-slate-400">Taxas especiais exclusivas para associados (a partir de 1,19% a.m.)</p>
                    </div>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                    Economia Garantida
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">Valor Desejado:</span>
                        <span className="text-emerald-400 font-bold">{formatCurrency(loanAmount)}</span>
                      </div>
                      <input
                        type="range"
                        min={1000}
                        max={30000}
                        step={500}
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(Number(e.target.value))}
                        className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>R$ 1.000</span>
                        <span>R$ 30.000</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">Prazo de Pagamento:</span>
                        <span className="text-blue-400 font-bold">{loanMonths} parcelas</span>
                      </div>
                      <input
                        type="range"
                        min={6}
                        max={48}
                        step={6}
                        value={loanMonths}
                        onChange={(e) => setLoanMonths(Number(e.target.value))}
                        className="w-full accent-blue-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>6 meses</span>
                        <span>48 meses</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Estimativa de Parcela Exclusiva:
                      </span>
                      <div className="text-2xl font-black text-emerald-400">
                        {formatCurrency(partnerPMT)} <span className="text-xs font-medium text-slate-400">/mês</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Taxa de mercado comum (3,5% a.m.): <span className="line-through text-slate-500">{formatCurrency(marketPMT)}/mês</span>
                      </p>
                      <div className="pt-2 border-t border-slate-800 text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Economia estimada de {formatCurrency(totalSavings)} no contrato!
                      </div>
                    </div>

                    <button
                      onClick={openLoanRequestWithAmount}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Solicitar Este Empréstimo Agora
                    </button>
                  </div>
                </div>
              </div>

              {/* My Requests Recent Activity */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Últimas Solicitações Enviadas
                  </h3>
                  <button
                    onClick={() => setActiveTab('solicitacoes')}
                    className="text-xs font-semibold text-blue-400 hover:underline"
                  >
                    Ver Todas ({myRequests.length})
                  </button>
                </div>

                {myRequests.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 space-y-2">
                    <FileText className="w-10 h-10 mx-auto stroke-1 opacity-50" />
                    <p className="text-xs font-semibold">Você ainda não fez nenhuma solicitação.</p>
                    <button
                      onClick={() => setShowNewRequestModal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Criar Primeira Solicitação
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myRequests.slice(0, 3).map((req) => (
                      <div
                        key={req.id}
                        className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{req.title}</h4>
                            {getStatusBadge(req.status)}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{req.description}</p>
                          <span className="text-[10px] text-slate-500 block">Enviado em {req.createdAt}</span>
                        </div>
                        {req.responseNote && (
                          <div className="bg-blue-950/40 border border-blue-900/50 p-2.5 rounded-xl text-[11px] text-blue-300">
                            <strong>Resposta AIAPE:</strong> {req.responseNote}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar: Digital ID Card Preview & Birthdays of the Month */}
            <div className="space-y-6">
              {/* Digital Card Preview Widget */}
              <div className="bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950 border border-blue-800/60 rounded-3xl p-6 text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-widest text-blue-300 uppercase">CARTEIRA DIGITAL AIAPE</span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                    {associate.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600/30 border border-blue-400/40 rounded-2xl flex items-center justify-center font-black text-lg text-white">
                    {associate.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{associate.name}</h4>
                    <p className="text-[11px] text-slate-300 font-semibold">{associate.category}</p>
                    <p className="text-[10px] text-slate-400">CPF: {associate.document || 'Não informado'}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
                  <span>Filiação: {associate.membershipDate}</span>
                  <button
                    onClick={() => setActiveTab('carteirinha')}
                    className="text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer"
                  >
                    Ver Versão Completa
                  </button>
                </div>
              </div>

              {/* Aniversariantes do Mês Sidebar Widget */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wide">
                    <Gift className="w-4 h-4 text-amber-400" />
                    Aniversariantes ({currentMonthName})
                  </h3>
                  <button
                    onClick={() => setActiveTab('aniversariantes')}
                    className="text-[11px] font-bold text-amber-400 hover:underline"
                  >
                    Ver Todos
                  </button>
                </div>

                {birthdayAssociates.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">Nenhum aniversariante cadastrado este mês.</p>
                ) : (
                  <div className="space-y-2.5">
                    {birthdayAssociates.slice(0, 4).map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg flex items-center justify-center font-bold text-xs">
                            🎂
                          </div>
                          <div>
                            <span className="font-bold text-white block line-clamp-1">{b.name}</span>
                            <span className="text-[10px] text-slate-400">{b.category}</span>
                          </div>
                        </div>
                        {b.phone && (
                          <a
                            href={`https://wa.me/55${b.phone.replace(/\D/g, '')}?text=Parab%C3%A9ns%20pelo%20seu%20anivers%C3%A1rio!%20Felicidades%20da%20fam%C3%ADlia%20AIAPE%20Pernambuco!`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-[10px] font-bold transition-colors shrink-0"
                            title="Enviar Parabéns no WhatsApp"
                          >
                            Parabéns 💬
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MINHAS SOLICITAÇÕES */}
        {activeTab === 'solicitacoes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Minhas Solicitações e Atendimentos
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Envie solicitações de empréstimo parceiro, declaração de filiação, atendimento jurídico e suporte direto à diretoria.
                </p>
              </div>

              <button
                onClick={() => setShowNewRequestModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Criar Nova Solicitação
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <FileText className="w-16 h-16 text-slate-600 mx-auto stroke-1" />
                <h3 className="text-base font-bold text-white">Nenhuma solicitação registrada</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Você ainda não realizou nenhuma solicitação. Clique no botão acima para pedir empréstimo parceiro, declaração de filiação ou atendimento.
                </p>
                <button
                  onClick={() => setShowNewRequestModal(true)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Criar Primeira Solicitação
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myRequests.map((req) => (
                  <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider block">
                          {req.type === 'emprestimo' && '💰 Empréstimo Parceiro'}
                          {req.type === 'declaracao' && '📄 Declaração de Filiação'}
                          {req.type === 'juridico' && '⚖️ Atendimento Jurídico'}
                          {req.type === 'carteirinha' && '🪪 2ª Via Carteirinha'}
                          {req.type === 'duvida_sugestao' && '💡 Suporte & Dúvidas'}
                          {req.type === 'outros' && '📌 Outros Serviços'}
                        </span>
                        <h3 className="text-sm font-extrabold text-white mt-0.5">{req.title}</h3>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                      {req.description}
                    </p>

                    {req.amountRequested && (
                      <div className="text-xs font-bold text-emerald-400 flex items-center justify-between bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                        <span>Valor Solicitado:</span>
                        <span>{formatCurrency(req.amountRequested)}</span>
                      </div>
                    )}

                    {req.responseNote ? (
                      <div className="bg-blue-950/60 border border-blue-800/60 p-3 rounded-xl space-y-1 text-xs text-blue-200">
                        <span className="font-bold block text-[10px] text-blue-400 uppercase">Parecer / Resposta da Diretoria AIAPE:</span>
                        <p>{req.responseNote}</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Aguardando análise da equipe administrativa da AIAPE...
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
                      <span>Código: #{req.id}</span>
                      <span>Enviado em {req.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EMPRESAS PARCEIRAS E BENEFÍCIOS */}
        {activeTab === 'beneficios' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-blue-950 border border-emerald-900/40 p-6 rounded-3xl shadow-xl space-y-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full inline-block">
                CLUBE DE VANTAGENS AIAPE
              </span>
              <h2 className="text-2xl font-black text-white">Empresas Parceiras & Benefícios Exclusivos</h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Apresente sua Carteira Digital do Associado nas empresas conveniadas para obter descontos em saúde, empréstimos com taxas reduzidas, combustíveis e assessoria.
              </p>
            </div>

            {/* Main Loan Highlight Section */}
            <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
                <div className="space-y-2">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-black px-3 py-1 rounded-full">
                    ★ PRINCIPAL BENEFÍCIO FINANCEIRO
                  </span>
                  <h3 className="text-2xl font-black text-white">Empréstimo Parceiro com Juros Sub-Mercado</h3>
                  <p className="text-xs text-slate-300 max-w-xl">
                    Consignado e crédito pessoal diferenciado para instrutores de trânsito filiados com taxas reduzidas a partir de <strong>1,19% ao mês</strong> (contra médias de mercado superiores a 3,5% a.m.).
                  </p>
                </div>
                <button
                  onClick={openLoanRequestWithAmount}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xl shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <TrendingDown className="w-4 h-4" />
                  Solicitar Simulação de Empréstimo
                </button>
              </div>

              {/* Loan Benefits List */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="font-extrabold text-emerald-400 block text-sm">✓ Aprovação Rápida</span>
                  <p className="text-slate-400">Análise desburocratizada para instrutores cadastrados na associação.</p>
                </div>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="font-extrabold text-blue-400 block text-sm">✓ Até 48 Meses</span>
                  <p className="text-slate-400">Prazos flexíveis para pagar com parcelas que cabem no bolso.</p>
                </div>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="font-extrabold text-amber-400 block text-sm">✓ Sem Pegadinhas</span>
                  <p className="text-slate-400">Contratação 100% transparente com auxílio da diretoria AIAPE.</p>
                </div>
              </div>
            </div>

            {/* Other Partners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PARTNERS.map((partner) => (
                <div key={partner.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="bg-blue-600/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        {partner.badge}
                      </span>
                      <Building2 className="w-5 h-5 text-slate-500" />
                    </div>

                    <h3 className="text-base font-extrabold text-white leading-snug">{partner.name}</h3>
                    
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold p-2.5 rounded-xl">
                      🎁 {partner.discountText}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{partner.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      setRequestType(partner.category === 'emprestimo' ? 'emprestimo' : 'outros');
                      setRequestTitle(`Solicitação de Convênio - ${partner.name}`);
                      setRequestDescription(`Gostaria de obter mais detalhes sobre o convênio da AIAPE com ${partner.name}.`);
                      setShowNewRequestModal(true);
                    }}
                    className="w-full mt-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Usar Este Benefício
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ANIVERSARIANTES DO MÊS */}
        {activeTab === 'aniversariantes' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 border border-amber-900/40 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full inline-block">
                  CELEBRAÇÃO AIAPE
                </span>
                <h2 className="text-2xl font-black text-white">Aniversariantes do Mês de {currentMonthName}</h2>
                <p className="text-xs text-slate-300">
                  Parabenize os colegas e membros associados que estão comemorando aniversário este mês!
                </p>
              </div>
              <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center text-3xl shrink-0">
                🎂
              </div>
            </div>

            {birthdayAssociates.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <Gift className="w-12 h-12 text-slate-600 mx-auto stroke-1" />
                <h3 className="text-base font-bold text-white">Nenhum aniversariante registrado neste mês</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Não há registros de associados com data de aniversário para o mês de {currentMonthName}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {birthdayAssociates.map((b) => (
                  <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/30 rounded-2xl flex items-center justify-center text-xl font-black text-amber-300">
                        🎉
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-white">{b.name}</h4>
                        <p className="text-xs text-slate-400">{b.category}</p>
                        <span className="text-[10px] text-amber-400 font-bold block mt-0.5">
                          Aniversário em {currentMonthName}
                        </span>
                      </div>
                    </div>

                    {b.phone && (
                      <a
                        href={`https://wa.me/55${b.phone.replace(/\D/g, '')}?text=Parab%C3%A9ns%20pelo%20seu%20anivers%C3%A1rio!%20Felicidades%20da%20fam%C3%ADlia%20AIAPE%20Pernambuco!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5 shrink-0"
                        title="Enviar Parabéns no WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Parabéns
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: MINHAS MENSALIDADES */}
        {activeTab === 'financeiro' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-2">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Situação Financeira & Mensalidades
              </h2>
              <p className="text-xs text-slate-400">
                Acompanhe o pagamento de suas contribuições para manter seu status de associado ativo e desfrutar dos benefícios.
              </p>
            </div>

            {/* Cartão de Pagamento Pix QR Code Oficial */}
            <PixPaymentCard
              amount={associate.monthlyFee || 70}
              associateName={associate.name}
              pixKey={associationConfig.pixKey || 'contato@aiape.org.br'}
              pixCopiaCola={associationConfig.pixCopiaCola}
              pixQrCodeImageUrl={associationConfig.pixQrCodeImageUrl}
              merchantName={associationConfig.name}
              onOpenExtractor={() => setActiveTab('comprovante')}
            />

            {/* Banner Chamada Extrator IA */}
            <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-slate-900 border border-purple-500/30 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Leitor Inteligente de Comprovantes
                </span>
                <h3 className="text-sm font-extrabold text-white">Envie seu comprovante PIX com Leitura por Inteligência Artificial</h3>
                <p className="text-xs text-slate-300">
                  Suba a foto do recibo de pagamento da sua mensalidade. A IA lê os dados e registra sua quitação na hora.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('comprovante')}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Escanear Comprovante Agora</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 shadow-xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Status do Associado</span>
                <div className="text-2xl font-black text-white capitalize flex items-center gap-2">
                  {associate.status === 'ativo' ? (
                    <span className="text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-6 h-6" /> Ativo & Regular</span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1.5"><AlertCircle className="w-6 h-6" /> {associate.status}</span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Mensalidade: <strong>{formatCurrency(associate.monthlyFee || 70)}</strong> (Vencimento todo dia {associate.dueDay || 30})
                </p>
              </div>

              <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                <h3 className="text-sm font-extrabold text-white">Dados da Associação para Pagamento da Mensalidade</h3>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
                  <p>• <strong>Favorecido:</strong> {associationConfig.name}</p>
                  <p>• <strong>Status Jurídico:</strong> Em processo de formalização e abertura</p>
                  <p>• <strong>Banco:</strong> {associationConfig.primaryBank || 'Banco do Brasil'}</p>
                  <p>• <strong>Valor da Mensalidade:</strong> {formatCurrency(associate.monthlyFee || 70)}</p>
                </div>
                <p className="text-[11px] text-slate-400">
                  Após o pagamento via Pix ou transferência, o comprovante é registrado automaticamente ou você pode enviar para a diretoria através das solicitações.
                </p>
              </div>
            </div>

            {/* Transaction History for this associate */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
              <h3 className="text-sm font-extrabold text-white">Histórico de Pagamentos Confirmados</h3>
              {myTransactions.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">Nenhum pagamento registrado no sistema ainda.</p>
              ) : (
                <div className="space-y-2">
                  {myTransactions.map(tx => (
                    <div key={tx.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">{tx.description}</span>
                        <span className="text-[10px] text-slate-400">Data: {tx.date} • Ref: {tx.month}</span>
                      </div>
                      <span className="font-extrabold text-emerald-400">{formatCurrency(tx.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: ENVIAR COMPROVANTE (IA) */}
        {activeTab === 'comprovante' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-slate-900 via-purple-950/60 to-slate-900 border border-purple-500/30 p-6 rounded-3xl shadow-xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[11px] font-bold rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Extrator Inteligente de Comprovantes PIX
              </div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                Envio do Comprovante de Pagamento da Mensalidade
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tire uma foto ou suba a imagem/PDF do seu comprovante de PIX ou transferência. A nossa Inteligência Artificial lerá o recibo, extrairá o valor, a data e a referência, dando baixa automática na sua mensalidade!
              </p>
            </div>

            <ReceiptExtractor 
              onAddTransaction={onAddTransaction || (() => {})}
              associates={allAssociates}
              onRegisterPayment={onRegisterPayment}
            />
          </div>
        )}

        {/* TAB 7: CARTEIRINHA DIGITAL */}
        {activeTab === 'carteirinha' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 border border-blue-600/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col items-center gap-2">
                <AiapeLogo variant="icon" size="lg" customLogoUrl={associationConfig.logoUrl} />
                <h2 className="text-lg font-black tracking-tight mt-2">{associationConfig.name}</h2>
                <span className="bg-blue-600/30 text-blue-300 border border-blue-400/30 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  CARTEIRA IDENTIFICADORA DE INSTRUTOR DE TRÂNSITO
                </span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Nome do Instrutor:</span>
                    <span className="font-extrabold text-white text-sm">{associate.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">CPF / Documento:</span>
                    <span className="font-extrabold text-blue-400 text-sm">{associate.document || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Categoria:</span>
                    <span className="font-semibold text-slate-200">{associate.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Status da Filiação:</span>
                    <span className="font-extrabold text-emerald-400 uppercase">{associate.status}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Data de Filiação:</span>
                    <span className="font-semibold text-slate-200">{associate.membershipDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Código do Matrícula:</span>
                    <span className="font-mono font-bold text-slate-300">#{associate.id.toUpperCase()}</span>
                  </div>
                </div>

                {/* Simulated QR Code for Validation */}
                <div className="pt-4 border-t border-slate-800 flex flex-col items-center justify-center gap-2 text-center">
                  <div className="p-3 bg-white rounded-xl shadow-md">
                    <QrCode className="w-24 h-24 text-slate-900" />
                  </div>
                  <span className="text-[10px] text-slate-400">QR Code de Validação Oficial AIAPE Pernambuco</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                Apresente esta carteira digital para usufruir dos descontos e empréstimos nas empresas parceiras credenciadas.
              </p>

              {/* Documentos Anexados do Instrutor */}
              {associate.documents && (
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3 text-left">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Documentos de Habilitação Anexados (PDF)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {associate.documents.cnhUrl && (
                      <a
                        href={associate.documents.cnhUrl}
                        download={associate.documents.cnhName || 'CNH.pdf'}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-blue-400 font-semibold flex items-center gap-2 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                        <div className="truncate">
                          <span className="block text-[10px] text-slate-400 font-normal">1. CNH (PDF):</span>
                          <span className="truncate block text-xs">{associate.documents.cnhName || 'CNH.pdf'}</span>
                        </div>
                      </a>
                    )}
                    {associate.documents.crlvUrl && (
                      <a
                        href={associate.documents.crlvUrl}
                        download={associate.documents.crlvName || 'CRLV.pdf'}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-blue-400 font-semibold flex items-center gap-2 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                        <div className="truncate">
                          <span className="block text-[10px] text-slate-400 font-normal">2. CRLV Veículo:</span>
                          <span className="truncate block text-xs">{associate.documents.crlvName || 'CRLV.pdf'}</span>
                        </div>
                      </a>
                    )}
                    {associate.documents.senatranUrl && (
                      <a
                        href={associate.documents.senatranUrl}
                        download={associate.documents.senatranName || 'Credencial_SENATRAN.pdf'}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-blue-400 font-semibold flex items-center gap-2 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                        <div className="truncate">
                          <span className="block text-[10px] text-slate-400 font-normal">3. SENATRAN:</span>
                          <span className="truncate block text-xs">{associate.documents.senatranName || 'Credencial_SENATRAN.pdf'}</span>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* NEW REQUEST MODAL */}
      <AnimatePresence>
        {showNewRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-blue-400" />
                  Nova Solicitação para a AIAPE
                </h3>
                <button
                  onClick={() => setShowNewRequestModal(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕ Fechar
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tipo de Solicitação</label>
                  <select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value as RequestType)}
                    className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-xl focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="emprestimo">💰 Solicitação de Empréstimo Parceiro (Juros Reduzidos)</option>
                    <option value="declaracao">📄 Declaração de Filiação / Comprovante AIAPE</option>
                    <option value="juridico">⚖️ Atendimento e Consultoria Jurídica</option>
                    <option value="carteirinha">🪪 2ª Via da Carteirinha de Instrutor</option>
                    <option value="duvida_sugestao">💡 Dúvidas, Sugestões e Suporte</option>
                    <option value="outros">📌 Outros Serviços</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Título / Assunto *</label>
                  <input
                    type="text"
                    required
                    value={requestTitle}
                    onChange={(e) => setRequestTitle(e.target.value)}
                    placeholder="Ex: Empréstimo parceiro R$ 5.000 ou Declaração de filiação"
                    className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-xl focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {requestType === 'emprestimo' && (
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Valor Desejado (R$)</label>
                    <input
                      type="number"
                      step="100"
                      value={requestAmount}
                      onChange={(e) => setRequestAmount(e.target.value)}
                      placeholder="Ex: 5000"
                      className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-xl focus:outline-hidden focus:border-blue-500 font-bold text-emerald-400"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Descrição Detalhada *</label>
                  <textarea
                    rows={4}
                    required
                    value={requestDescription}
                    onChange={(e) => setRequestDescription(e.target.value)}
                    placeholder="Descreva detalhadamente o que você precisa para que a diretoria possa te atender melhor..."
                    className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-xl focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewRequestModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Enviar Solicitação
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
