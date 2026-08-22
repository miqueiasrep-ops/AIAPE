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
  Sparkles,
  KeyRound,
  Key,
  Lock,
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Send,
  CreditCard,
  Camera,
  Award,
  IdCard,
  Gift,
  Heart,
  BadgePercent,
  Sparkles as SparklesIcon,
  FileSpreadsheet
} from 'lucide-react';
import { 
  Associate, 
  AssociateStatus, 
  AssociateCategory, 
  Transaction, 
  AssociationConfig, 
  AssociateRequest, 
  RequestStatus, 
  MONTH_NAMES,
  ExemptionType,
  ExemptionInfo
} from '../types';
import ReceiptExtractor from './ReceiptExtractor';
import { AssociateCard } from './AssociateCard';
import { AssociateImportModal } from './AssociateImportModal';

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
  onBatchImportAssociates?: (newAssociates: Omit<Associate, 'id'>[], updateExisting: boolean) => Promise<{ imported: number; updated: number }>;
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
  onUpdateRequestStatus,
  onBatchImportAssociates
}: AssociateManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAssociate, setEditingAssociate] = useState<Associate | null>(null);

  // Extrator AI Receipt Modal State
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);

  // Import Excel/Forms Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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

  // Carteirinha Digital Modal state for Admin
  const [cardModalAssociate, setCardModalAssociate] = useState<Associate | null>(null);

  // Admin Password Management Modal state
  const [passwordModalAssociate, setPasswordModalAssociate] = useState<Associate | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showPasswordValue, setShowPasswordValue] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [passwordSuccessToast, setPasswordSuccessToast] = useState<string | null>(null);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Exemption (Isenção de Taxa pela Diretoria) Modal State
  const [exemptionModalAssociate, setExemptionModalAssociate] = useState<Associate | null>(null);
  const [exemptionType, setExemptionType] = useState<ExemptionType>('premiacao');
  const [exemptionMonths, setExemptionMonths] = useState<number>(3);
  const [exemptionReason, setExemptionReason] = useState<string>('Premiação de Destaque / Reconhecimento AIAPE');
  const [exemptionNotes, setExemptionNotes] = useState<string>('');
  const [isExemptActive, setIsExemptActive] = useState<boolean>(true);
  const [exemptionSuccessToast, setExemptionSuccessToast] = useState<string | null>(null);

  // WhatsApp Central Modal State
  const [whatsAppModalAssociate, setWhatsAppModalAssociate] = useState<Associate | null>(null);
  const [whatsAppPhone, setWhatsAppPhone] = useState<string>('');
  const [whatsAppTemplate, setWhatsAppTemplate] = useState<'general' | 'welcome' | 'card' | 'payment_reminder' | 'password' | 'receipt' | 'exemption'>('welcome');
  const [whatsAppCustomText, setWhatsAppCustomText] = useState<string>('');
  const [whatsAppCopied, setWhatsAppCopied] = useState<boolean>(false);

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
    birthDate: '',
    password: '',
    photoUrl: '',
    senatranCredential: '',
    cnhCategory: 'AB',
    registrationNumber: '',
    validityDate: 'DEZ/2026',
    notes: ''
  });

  const openAddModal = () => {
    setEditingAssociate(null);
    setShowEditPassword(false);
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
      birthDate: '',
      password: '',
      photoUrl: '',
      senatranCredential: '',
      cnhCategory: 'AB',
      registrationNumber: `AIAPE-${Math.floor(1000 + Math.random() * 9000)}`,
      validityDate: 'DEZ/2026',
      notes: ''
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (assoc: Associate) => {
    setEditingAssociate(assoc);
    setShowEditPassword(false);
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
      birthDate: assoc.birthDate || '',
      password: assoc.password || '',
      photoUrl: assoc.photoUrl || '',
      senatranCredential: assoc.senatranCredential || '',
      cnhCategory: assoc.cnhCategory || 'AB',
      registrationNumber: assoc.registrationNumber || '',
      validityDate: assoc.validityDate || 'DEZ/2026',
      notes: assoc.notes || ''
    });
    setIsAddModalOpen(true);
  };

  const handleAdminPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 360;
        const MAX_HEIGHT = 480;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormData(prev => ({ ...prev, photoUrl: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const openPasswordModal = (assoc: Associate) => {
    setPasswordModalAssociate(assoc);
    setNewPasswordValue(assoc.password || '');
    setShowPasswordValue(false);
    setPasswordCopied(false);
    setPasswordSuccessToast(null);
  };

  const getWhatsAppTemplateMessage = (
    assoc: Associate,
    template: 'general' | 'welcome' | 'card' | 'payment_reminder' | 'password' | 'receipt' | 'exemption'
  ) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aiape.org.br';
    const validationUrl = `${origin}/?validar=${encodeURIComponent(assoc.id)}`;
    const regNumber = assoc.registrationNumber || `AIAPE-${assoc.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '2026'}`;
    const senatran = assoc.senatranCredential || 'Não informada';
    const cnh = assoc.cnhCategory || 'AB';
    const pixKey = associationConfig.pixKey || associationConfig.cnpj || '24.810.192/0001-85';

    switch (template) {
      case 'welcome':
        return `🎉 *SEJA BEM-VINDO(A) À FAMÍLIA AIAPE!*\n\n` +
          `Prezado(a) Instrutor(a) *${assoc.name}*,\n\n` +
          `É uma grande honra e alegria receber você como novo membro associado da *AIAPE (Associação dos Instrutores de Autoescolas e de Trânsito de Pernambuco)*!\n\n` +
          `Agradecemos imensamente pela sua filiação e confiança em nossa entidade. Sua participação fortalece a representatividade da nossa categoria, nos dá mais voz e nos ajuda a conquistar novos direitos para todos os instrutores do estado.\n\n` +
          `📋 *SEUS DADOS OFICIAIS:*\n` +
          `• *Registro AIAPE:* ${regNumber}\n` +
          `• *Credencial SENATRAN:* ${senatran}\n` +
          `• *Categoria CNH:* ${cnh}\n` +
          `• *Login / CPF:* ${assoc.document || 'Seu CPF'}\n` +
          `• *Senha do Portal:* ${assoc.password || '(use os 6 primeiros dígitos do CPF)'}\n\n` +
          `🪪 *Link de Validação da sua Carteira Digital com QR Code:*\n${validationUrl}\n\n` +
          `🌐 *Portal do Associado:* ${origin}\n\n` +
          `_Conte sempre com a Diretoria Executiva da AIAPE. Juntos somos mais fortes!_`;

      case 'general':
        return `Olá, Instrutor(a) *${assoc.name}*!\n\nTudo bem? Entramos em contato da *AIAPE (Associação dos Instrutores de Autoescolas de Pernambuco)*.\n\nComo podemos te ajudar hoje?`;

      case 'card':
        return `🪪 *CARTEIRA DIGITAL OFICIAL DE INSTRUTOR - AIAPE*\n\nOlá, *${assoc.name}*!\nSua Carteira Digital Oficial já está emitida e disponível para uso.\n\n📋 *Registro AIAPE:* ${regNumber}\n🚗 *Credencial SENATRAN:* ${senatran}\n📄 *Categoria CNH:* ${cnh}\n✅ *Status:* ${assoc.isExempt ? 'Ativo (Isento pela Diretoria)' : assoc.status === 'ativo' ? 'Ativo / Regular' : 'Pendente'}\n\n🔗 *Acesse sua Carteira e QR Code Oficial de Validação:*\n${validationUrl}\n\n_AIAPE - Fortalecendo os Instrutores de Trânsito de Pernambuco_`;

      case 'payment_reminder':
        return `💳 *LEMBRETE DE CONTRIBUIÇÃO ASSOCIATIVA - AIAPE*\n\nOlá, Instrutor(a) *${assoc.name}*!\n\nLembramos sobre a mensalidade associativa da AIAPE no valor de *${formatCurrency(assoc.monthlyFee || associationConfig.defaultMonthlyFee || 70)}* (Vencimento: dia ${assoc.dueDay || 30}).\n\n🔑 *Chave PIX:* ${pixKey}\n🏛️ *Favorecido:* AIAPE - Associação dos Instrutores de Trânsito PE\n\nApós realizar a transferência, por favor envie o comprovante por aqui para darmos a baixa imediata e manter sua Carteira Digital e convênios 100% ativos!\n\n_Agradecemos sua contribuição com a nossa categoria!_`;

      case 'password':
        return `🔑 *DADOS DE ACESSO AO PORTAL DO ASSOCIADO - AIAPE*\n\nOlá, *${assoc.name}*!\n\nSeus dados para login na Área do Associado AIAPE:\n\n📋 *Usuário (CPF):* ${assoc.document || 'Seu CPF cadastrado'}\n🔒 *Senha:* ${assoc.password || '(use os 6 dígitos do seu CPF ou solicite redefinição)'}\n🌐 *Link de Acesso:* ${origin}\n\nNo portal você tem acesso à sua carteirinha digital, comprovantes, pedidos de apoio e convênios exclusivos.`;

      case 'receipt':
        return `🧾 *RECIBO DE QUITAÇÃO DE MENSALIDADE - AIAPE*\n\nConfirmamos o recebimento da mensalidade associativa do(a) instrutor(a) *${assoc.name}*, CPF *${assoc.document || 'N/A'}*.\n\n💰 *Valor Pago:* ${formatCurrency(assoc.monthlyFee || 70)}\n📅 *Referência / Data:* ${assoc.lastPaymentMonth || 'Mensalidade Social'}\n✅ *Status:* Quitado com sucesso!\n\nSua filiação e carteirinha digital seguem regulares.\n_AIAPE - Diretoria e Tesouraria_`;

      case 'exemption':
        return `🎉 *COMUNICADO OFICIAL: ISENÇÃO DE TAXA AIAPE*\n\nPrezado(a) Instrutor(a) *${assoc.name}*,\n\nA Diretoria Executiva da AIAPE informa a concessão de *ISENÇÃO DE MENSALIDADE* em seu cadastro.\n\n🏆 *Motivo:* ${assoc.exemptionInfo?.reason || 'Premiação de Destaque / Reconhecimento da Categoria'}\n⏳ *Validade:* ${assoc.exemptionInfo?.endDate || 'Período Ativo'}\n💰 *Valor:* R$ 0,00\n\nSua Carteira Digital permanece *100% ATIVA* para todos os benefícios.\n\n🌐 Acesse: ${origin}`;

      default:
        return `Olá, *${assoc.name}*! Entramos em contato da AIAPE.`;
    }
  };

  const openWhatsAppModal = (
    assoc: Associate,
    template: 'general' | 'welcome' | 'card' | 'payment_reminder' | 'password' | 'receipt' | 'exemption' = 'welcome'
  ) => {
    setWhatsAppModalAssociate(assoc);
    setWhatsAppPhone(assoc.phone || '');
    setWhatsAppTemplate(template);
    setWhatsAppCustomText(getWhatsAppTemplateMessage(assoc, template));
    setWhatsAppCopied(false);
  };

  const handleSwitchWhatsAppTemplate = (template: 'general' | 'welcome' | 'card' | 'payment_reminder' | 'password' | 'receipt' | 'exemption') => {
    if (!whatsAppModalAssociate) return;
    setWhatsAppTemplate(template);
    setWhatsAppCustomText(getWhatsAppTemplateMessage(whatsAppModalAssociate, template));
    setWhatsAppCopied(false);
  };

  const handleSendWhatsAppDirect = (phoneNum: string, text: string) => {
    const cleanPhone = (phoneNum || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  const handleCopyWhatsAppMessage = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setWhatsAppCopied(true);
    setTimeout(() => setWhatsAppCopied(false), 2500);
  };

  const handleGenerateRandomPassword = (target: 'modal' | 'form') => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    if (target === 'modal') {
      setNewPasswordValue(randomPin);
      setShowPasswordValue(true);
    } else {
      setFormData(prev => ({ ...prev, password: randomPin }));
      setShowEditPassword(true);
    }
  };

  const handleCopyPassword = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2500);
  };

  const handleSaveAssociatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalAssociate) return;

    const trimmed = newPasswordValue.trim();
    const updatedAssoc: Associate = {
      ...passwordModalAssociate,
      password: trimmed
    };

    onUpdateAssociate(updatedAssoc);
    setPasswordModalAssociate(updatedAssoc);
    setPasswordSuccessToast('Senha atualizada e salva com sucesso!');
    setTimeout(() => setPasswordSuccessToast(null), 3500);
  };

  const handleSendPasswordWhatsApp = (assoc: Associate, pass: string) => {
    const cleanPhone = (assoc.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://sua-associacao.com.br';
    
    const text = `Olá, *${assoc.name}*!\n\nSua senha de acesso ao *Portal do Associado AIAPE* foi atualizada pela Diretoria.\n\n🔑 *Sua Nova Senha:* ${pass || '(sem senha - primeiro acesso)'}\n📋 *CPF / Usuário de Acesso:* ${assoc.document || 'Seu CPF'}\n\n🌐 Acesse pelo link: ${loginUrl}\n\nGuarde sua senha para acessar sua carteirinha digital, solicitar empréstimos parceiros e benefícios.`;
    
    const url = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      
    window.open(url, '_blank');
  };

  const openExemptionModal = (assoc: Associate) => {
    setExemptionModalAssociate(assoc);
    setIsExemptActive(assoc.isExempt ?? false);
    if (assoc.exemptionInfo) {
      setExemptionType(assoc.exemptionInfo.type || 'premiacao');
      setExemptionMonths(assoc.exemptionInfo.monthsTotal || 3);
      setExemptionReason(assoc.exemptionInfo.reason || 'Premiação de Destaque / Reconhecimento AIAPE');
      setExemptionNotes(assoc.exemptionInfo.notes || '');
    } else {
      setExemptionType('premiacao');
      setExemptionMonths(3);
      setExemptionReason('Premiação de Destaque / Reconhecimento AIAPE');
      setExemptionNotes('');
      setIsExemptActive(true);
    }
    setExemptionSuccessToast(null);
  };

  const handleSaveExemption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exemptionModalAssociate) return;

    if (!isExemptActive) {
      const updated: Associate = {
        ...exemptionModalAssociate,
        isExempt: false,
        exemptionInfo: undefined
      };
      onUpdateAssociate(updated);
      setExemptionModalAssociate(updated);
      setExemptionSuccessToast('Isenção revogada com sucesso. Mensalidade reativada.');
      setTimeout(() => setExemptionSuccessToast(null), 3500);
      return;
    }

    const today = new Date();
    const endDate = new Date();
    if (exemptionType === 'permanente' || exemptionType === 'diretoria') {
      endDate.setFullYear(endDate.getFullYear() + 10);
    } else {
      endDate.setMonth(endDate.getMonth() + (Number(exemptionMonths) || 1));
    }

    const endMonthName = MONTH_NAMES[endDate.getMonth()] || 'Dezembro';
    const endYear = endDate.getFullYear();
    const endDateFormatted = `${endMonthName.toUpperCase()}/${endYear}`;

    const newExemption: ExemptionInfo = {
      isExempt: true,
      type: exemptionType,
      monthsTotal: (exemptionType === 'permanente' || exemptionType === 'diretoria') ? undefined : Number(exemptionMonths),
      monthsRemaining: (exemptionType === 'permanente' || exemptionType === 'diretoria') ? undefined : Number(exemptionMonths),
      startDate: today.toISOString().split('T')[0],
      endDate: endDateFormatted,
      reason: exemptionReason.trim() || 'Concessão / Reconhecimento pela Diretoria AIAPE',
      grantedBy: 'Diretoria Executiva AIAPE',
      grantedAt: today.toISOString().split('T')[0],
      notes: exemptionNotes.trim() || undefined
    };

    const updated: Associate = {
      ...exemptionModalAssociate,
      isExempt: true,
      exemptionInfo: newExemption
    };

    onUpdateAssociate(updated);
    setExemptionModalAssociate(updated);
    setExemptionSuccessToast('Isenção concedida e salva com sucesso!');
    setTimeout(() => setExemptionSuccessToast(null), 3500);
  };

  const handleSendExemptionWhatsApp = (assoc: Associate) => {
    const cleanPhone = (assoc.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    const info = assoc.exemptionInfo;
    const reasonText = info?.reason || exemptionReason || 'Premiação de Destaque e Reconhecimento';
    
    let durationText = '';
    if (info?.type === 'permanente' || info?.type === 'diretoria') {
      durationText = 'Isenção Permanente (Membro Honorário / Diretoria)';
    } else {
      const months = info?.monthsTotal || exemptionMonths || 3;
      durationText = `${months} meses (Válido até ${info?.endDate || 'período estipulado'})`;
    }

    const text = `🎉 *COMUNICADO OFICIAL: ISENÇÃO DE TAXA AIAPE*\n\n` +
      `Prezado(a) Instrutor(a) *${assoc.name}*,\n\n` +
      `É com grande honra que a *Diretoria Executiva da AIAPE (Associação dos Instrutores de Autoescolas de Pernambuco)* informa a concessão de *ISENÇÃO DE MENSALIDADE* em seu cadastro!\n\n` +
      `🎁 *Modalidade:* ${info?.type === 'premiacao' ? 'Premiação & Reconhecimento' : info?.type === 'ajuda_social' ? 'Ajuda e Apoio Social' : info?.type === 'diretoria' ? 'Membro da Diretoria' : 'Concessão Especial'}\n` +
      `🏆 *Motivo:* ${reasonText}\n` +
      `⏳ *Duração:* ${durationText}\n` +
      `💰 *Valor Cobrado:* R$ 0,00\n\n` +
      `Sua Carteira Digital Oficial permanece *100% ATIVA e regular* para todos os convênios, parcerias e representação institucional.\n\n` +
      `🌐 Acesse sua Carteira Digital atualizada:\n` +
      `${typeof window !== 'undefined' ? window.location.origin : 'https://aiape.org.br'}\n\n` +
      `_Agradecemos sua dedicação e contribuição para a nossa categoria!_\n` +
      `*Diretoria Executiva AIAPE*`;

    const url = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
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
    const termClean = searchTerm.trim().toLowerCase();
    const termDigits = searchTerm.replace(/\D/g, '');
    const docDigits = (a.document || '').replace(/\D/g, '');
    const phoneDigits = (a.phone || '').replace(/\D/g, '');

    const matchesSearch = !termClean ||
      a.name.toLowerCase().includes(termClean) ||
      (a.document && a.document.toLowerCase().includes(termClean)) ||
      (termDigits && docDigits.includes(termDigits)) ||
      (termDigits && phoneDigits.includes(termDigits)) ||
      (a.email && a.email.toLowerCase().includes(termClean)) ||
      (a.registrationNumber && a.registrationNumber.toLowerCase().includes(termClean)) ||
      (a.senatranCredential && a.senatranCredential.toLowerCase().includes(termClean)) ||
      (a.notes && a.notes.toLowerCase().includes(termClean));

    const matchesStatus = statusFilter === 'todos' 
      ? true 
      : statusFilter === 'isentos' 
        ? Boolean(a.isExempt) 
        : a.status === statusFilter;
        
    const matchesCategory = categoryFilter === 'todas' || a.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate stats
  const totalAssociates = associates.length;
  const activeAssociates = associates.filter(a => a.status === 'ativo').length;
  const exemptAssociates = associates.filter(a => a.isExempt).length;
  const overdueAssociates = associates.filter(a => a.status === 'inadimplente').length;
  const expectedMonthlyIncome = associates
    .filter(a => a.status === 'ativo' && !a.isExempt)
    .reduce((sum, a) => sum + (a.monthlyFee || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getStatusBadge = (status: AssociateStatus, isExempt?: boolean) => {
    if (isExempt) {
      return (
        <span className="bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1">
          <Gift className="w-3 h-3 text-purple-400" />
          Ativo (Isento)
        </span>
      );
    }
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

  const handleBatchImport = async (newAssocs: Omit<Associate, 'id'>[], updateExisting: boolean) => {
    if (onBatchImportAssociates) {
      return await onBatchImportAssociates(newAssocs, updateExisting);
    }
    let imported = 0;
    let updated = 0;
    for (const assocData of newAssocs) {
      const cleanDoc = (assocData.document || '').replace(/\D/g, '');
      const existing = associates.find(a => (a.document || '').replace(/\D/g, '') === cleanDoc);
      if (existing) {
        if (updateExisting) {
          onUpdateAssociate({ ...existing, ...assocData });
          updated++;
        }
      } else {
        onAddAssociate(assocData);
        imported++;
      }
    }
    return { imported, updated };
  };

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
            Cadastro completo, controle de mensalidades, isenções da diretoria e recibos da associação
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            title="Importar planilha do Excel (.xlsx, .csv) ou respostas do Google Forms"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Importar do Excel / Forms</span>
          </button>

          <button
            onClick={() => setIsRequestsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-950/80 hover:bg-indigo-900/90 border border-indigo-700/60 text-indigo-300 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs relative"
          >
            <MessageCircle className="w-4 h-4 text-indigo-400" />
            <span>Solicitações</span>
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

      {/* Summary Cards with Exemption Tracker */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <span className="text-xs font-medium text-slate-400">Associados Ativos Pagantes</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{activeAssociates - exemptAssociates}</p>
          <p className="text-[10px] text-slate-400 mt-1">Contribuição ativa mensal</p>
        </div>

        <div className="bg-slate-800/60 border border-purple-500/30 bg-gradient-to-br from-purple-950/20 to-slate-900 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-300 flex items-center gap-1">
              <Gift className="w-3.5 h-3.5 text-purple-400" />
              Isentos pela Diretoria
            </span>
            <div className="p-2 bg-purple-500/20 text-purple-300 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-300 mt-2">{exemptAssociates}</p>
          <p className="text-[10px] text-purple-400/80 mt-1">Prêmio, Ajuda Social ou Diretoria</p>
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
            <option value="isentos">🎁 Isentos pela Diretoria</option>
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
                      <div className="flex items-center gap-3">
                        {assoc.photoUrl ? (
                          <img
                            src={assoc.photoUrl}
                            alt={assoc.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-12 rounded-lg object-cover border border-amber-400/60 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-blue-400 text-sm shrink-0 shadow-sm">
                            {assoc.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white text-xs">{assoc.name}</p>
                            {assoc.isExempt && (
                              <span 
                                title={`Isenção Concedida: ${assoc.exemptionInfo?.reason || 'Diretoria'}`}
                                className="inline-flex items-center gap-1 text-[9px] font-extrabold text-purple-300 bg-purple-950/80 border border-purple-500/40 px-1.5 py-0.2 rounded-md shadow-xs"
                              >
                                <Gift className="w-2.5 h-2.5 text-purple-400" />
                                {assoc.exemptionInfo?.type === 'premiacao' ? 'Prêmio' : assoc.exemptionInfo?.type === 'ajuda_social' ? 'Ajuda Social' : assoc.exemptionInfo?.type === 'diretoria' ? 'Diretoria' : 'Isento'}
                              </span>
                            )}
                            {assoc.password ? (
                              <span 
                                title="Senha pessoal configurada"
                                className="inline-flex items-center gap-0.5 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-md font-semibold"
                              >
                                <Lock className="w-2.5 h-2.5" />
                                Senha
                              </span>
                            ) : (
                              <span 
                                title="Sem senha personalizada (Acesso liberado/padrão)"
                                className="inline-flex items-center gap-0.5 text-[9px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded-md font-semibold"
                              >
                                <KeyRound className="w-2.5 h-2.5" />
                                Sem senha
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            {assoc.senatranCredential ? (
                              <span className="text-amber-400 font-mono font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                SENATRAN: {assoc.senatranCredential}
                              </span>
                            ) : null}
                            {assoc.document && <span>CPF: {assoc.document}</span>}
                            {assoc.phone ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openWhatsAppModal(assoc, 'general');
                                }}
                                title={`Abrir Central de WhatsApp com ${assoc.name}`}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 px-1.5 py-0.5 rounded-md transition-all cursor-pointer group shadow-2xs"
                              >
                                <MessageCircle className="w-2.5 h-2.5 text-emerald-400 group-hover:text-white shrink-0" />
                                <span>{assoc.phone}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(assoc);
                                }}
                                title="Adicionar Telefone / WhatsApp"
                                className="inline-flex items-center gap-1 text-[9px] text-slate-500 hover:text-emerald-400 transition-colors"
                              >
                                <Phone className="w-2.5 h-2.5" /> + Telefone
                              </button>
                            )}
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
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-900 text-slate-300 px-2 py-1 rounded text-[11px]">
                        {assoc.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(assoc.status, assoc.isExempt)}
                    </td>
                    <td className="px-4 py-3">
                      {assoc.isExempt ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-purple-300 text-xs">R$ 0,00</span>
                            <span className="text-[10px] text-slate-500 line-through">{formatCurrency(assoc.monthlyFee)}</span>
                          </div>
                          <span className="text-[10px] text-purple-400/90 font-medium block">
                            🎁 Isento ({assoc.exemptionInfo?.endDate || 'Ativo'})
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-white">{formatCurrency(assoc.monthlyFee)}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">Venc. Dia {assoc.dueDay}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {assoc.isExempt ? (
                        <div>
                          <p className="text-xs font-semibold text-purple-300 flex items-center gap-1">
                            <Gift className="w-3 h-3 text-purple-400" /> Isento pela Diretoria
                          </p>
                          <p className="text-[9px] text-slate-400 truncate max-w-[140px]">{assoc.exemptionInfo?.reason}</p>
                        </div>
                      ) : assoc.lastPaymentDate ? (
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
                          onClick={() => openWhatsAppModal(assoc, 'general')}
                          title={`Abrir Central de WhatsApp com ${assoc.name} (Cobrança PIX, Carteirinha, Senha, Recibo)`}
                          className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-lg transition-all cursor-pointer shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setCardModalAssociate(assoc)}
                          title="Visualizar e Imprimir Carteira Digital do Associado (AIAPE)"
                          className="p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-lg transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openExemptionModal(assoc)}
                          title={assoc.isExempt ? "Gerenciar / Alterar Isenção de Taxa" : "Conceder Isenção de Taxa (Prêmio / Ajuda Social / Diretoria)"}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            assoc.isExempt
                              ? 'bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white border-purple-500/50 shadow-xs'
                              : 'bg-purple-950/40 hover:bg-purple-600 text-purple-400 hover:text-white border-purple-800/40'
                          }`}
                        >
                          <Gift className="w-3.5 h-3.5" />
                        </button>

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
                          onClick={() => openPasswordModal(assoc)}
                          title="Alterar / Redefinir Senha de Acesso"
                          className="p-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
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
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-400" />
                    {editingAssociate ? 'Editar Associado' : 'Novo Associado'}
                  </h3>
                  {!editingAssociate && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setIsImportModalOpen(true);
                      }}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg font-semibold cursor-pointer ml-2 flex items-center gap-1"
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                      <span>Importar do Excel</span>
                    </button>
                  )}
                </div>
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-300">Telefone / WhatsApp</label>
                      {formData.phone && (
                        <button
                          type="button"
                          onClick={() => {
                            const clean = formData.phone.replace(/\D/g, '');
                            const withCountry = clean.length <= 11 ? `55${clean}` : clean;
                            const text = `Olá, *${formData.name || 'Instrutor(a)'}*! Entramos em contato da AIAPE.`;
                            window.open(`https://api.whatsapp.com/send?phone=${withCountry}&text=${encodeURIComponent(text)}`, '_blank');
                          }}
                          className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Testar / Iniciar conversa no WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Abrir WhatsApp</span>
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="(81) 98765-4321"
                          className="w-full bg-slate-800 border border-slate-700 text-xs text-white pl-3 pr-8 py-2 rounded-lg focus:outline-hidden focus:border-emerald-500"
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                      </div>
                      {formData.phone && (
                        <button
                          type="button"
                          onClick={() => {
                            const clean = formData.phone.replace(/\D/g, '');
                            const withCountry = clean.length <= 11 ? `55${clean}` : clean;
                            const text = `Olá, *${formData.name || 'Instrutor(a)'}*! Entramos em contato da AIAPE.`;
                            window.open(`https://api.whatsapp.com/send?phone=${withCountry}&text=${encodeURIComponent(text)}`, '_blank');
                          }}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                          title="Abrir WhatsApp com este número"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                      )}
                    </div>
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
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Nº da Credencial SENATRAN / DETRAN
                    </label>
                    <input
                      type="text"
                      value={formData.senatranCredential}
                      onChange={(e) => setFormData({ ...formData, senatranCredential: e.target.value })}
                      placeholder="Ex: SENATRAN/DETRAN-PE: 489210"
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Categoria CNH
                    </label>
                    <select
                      value={formData.cnhCategory}
                      onChange={(e) => setFormData({ ...formData, cnhCategory: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500 cursor-pointer"
                    >
                      <option value="AB">AB (Carro e Moto)</option>
                      <option value="B">B (Carro / Automóvel)</option>
                      <option value="A">A (Moto / Motocicleta)</option>
                      <option value="AD">AD (Ônibus / Carro e Moto)</option>
                      <option value="AE">AE (Carreta / Carro e Moto)</option>
                      <option value="D">D (Transporte Coletivo / Ônibus)</option>
                      <option value="E">E (Veículos Articulados / Carreta)</option>
                      <option value="C">C (Caminhão / Carga)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Matrícula AIAPE
                    </label>
                    <input
                      type="text"
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      placeholder="Ex: AIAPE-8421"
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Validade da Carteira
                    </label>
                    <input
                      type="text"
                      value={formData.validityDate}
                      onChange={(e) => setFormData({ ...formData, validityDate: e.target.value })}
                      placeholder="Ex: DEZ/2026"
                      className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Foto 3x4 do Associado */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      Foto 3x4 para Carteirinha Digital
                    </span>
                    {formData.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photoUrl: '' })}
                        className="text-[10px] text-rose-400 hover:underline"
                      >
                        Remover Foto
                      </button>
                    )}
                  </label>
                  <div className="flex items-center gap-4">
                    {formData.photoUrl ? (
                      <div className="relative w-14 h-18 rounded-lg overflow-hidden border-2 border-amber-400 bg-slate-900 shrink-0">
                        <img src={formData.photoUrl} alt="Foto 3x4" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-14 h-18 rounded-lg bg-slate-800 border border-slate-700 flex flex-col items-center justify-center text-slate-500 shrink-0 text-center p-1">
                        <Camera className="w-4 h-4 mb-0.5 text-slate-400" />
                        <span className="text-[9px] font-bold">Sem Foto</span>
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAdminPhotoUpload}
                        className="block w-full text-xs text-slate-400 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-400">
                        Selecione a foto de rosto do associado (JPG/PNG).
                      </p>
                    </div>
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

                {/* Senha de Acesso ao Portal do Associado */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      Senha de Acesso ao Portal (Login)
                    </label>
                    <button
                      type="button"
                      onClick={() => handleGenerateRandomPassword('form')}
                      className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Gerar Senha 6 Dígitos
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Digite ou gere a senha de acesso (ex: 123456)..."
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2 pr-10 rounded-lg focus:outline-hidden focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                      title={showEditPassword ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    O associado utilizará esta senha combinada ao CPF para acessar a Área do Associado.
                  </p>
                </div>

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

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      const assoc = receiptAssociate;
                      setReceiptAssociate(null);
                      openWhatsAppModal(assoc, 'receipt');
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-700/20"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Enviar Recibo via WhatsApp
                  </button>

                  <div className="flex items-center gap-2">
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

      {/* MODAL: ALTERAR / REDEFINIR SENHA DO ASSOCIADO (ADMINISTRADOR) */}
      <AnimatePresence>
        {passwordModalAssociate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Gerenciar Senha do Associado</h3>
                    <p className="text-xs text-slate-400">Diretoria / Painel de Acesso</p>
                  </div>
                </div>
                <button
                  onClick={() => setPasswordModalAssociate(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Associate Info Bar */}
              <div className="px-5 py-3.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-white text-sm">{passwordModalAssociate.name}</h4>
                  <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-0.5">
                    {passwordModalAssociate.document && <span>CPF: <strong>{passwordModalAssociate.document}</strong></span>}
                    {passwordModalAssociate.phone && <span>Tel: <strong>{passwordModalAssociate.phone}</strong></span>}
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold">
                  {passwordModalAssociate.category}
                </span>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveAssociatePassword} className="p-5 space-y-4">
                {passwordSuccessToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2 font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{passwordSuccessToast}</span>
                  </motion.div>
                )}

                {/* Status Box */}
                <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-300">Status atual:</span>
                  </div>
                  {passwordModalAssociate.password ? (
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                      Senha cadastrada e ativa
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-400/90 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                      Nenhuma senha definida
                    </span>
                  )}
                </div>

                {/* Input Nova Senha */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-200">
                      Nova Senha de Acesso
                    </label>
                    <button
                      type="button"
                      onClick={() => handleGenerateRandomPassword('modal')}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Gerar PIN Aleatório (6 dígitos)
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPasswordValue ? 'text' : 'password'}
                      value={newPasswordValue}
                      onChange={(e) => setNewPasswordValue(e.target.value)}
                      placeholder="Digite a nova senha do associado..."
                      className="w-full bg-slate-950 border border-slate-700 text-sm text-white px-3.5 py-2.5 pr-20 rounded-xl focus:outline-hidden focus:border-amber-500 font-mono tracking-wider"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {newPasswordValue && (
                        <button
                          type="button"
                          onClick={() => handleCopyPassword(newPasswordValue)}
                          title="Copiar Senha"
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          {passwordCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPasswordValue(!showPasswordValue)}
                        title={showPasswordValue ? 'Ocultar' : 'Visualizar'}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        {showPasswordValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {passwordCopied && (
                    <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Senha copiada para a área de transferência!
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    Dica: Você pode definir uma senha simples (ex: 6 dígitos) ou gerar um PIN aleatório e enviar diretamente pelo WhatsApp.
                  </p>
                </div>

                {/* WhatsApp Direct Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleSendPasswordWhatsApp(passwordModalAssociate, newPasswordValue)}
                    className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-500 text-emerald-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:text-white" />
                    Enviar Senha e Dados de Acesso via WhatsApp
                  </button>
                </div>

                {/* Modal Footer Buttons */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Deseja realmente remover a senha deste associado?')) {
                        setNewPasswordValue('');
                        onUpdateAssociate({ ...passwordModalAssociate, password: '' });
                        setPasswordModalAssociate({ ...passwordModalAssociate, password: '' });
                        setPasswordSuccessToast('Senha removida com sucesso!');
                      }
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                  >
                    Remover senha
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPasswordModalAssociate(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Fechar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Salvar Senha
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CARTEIRINHA DIGITAL DO ASSOCIADO (ADMIN PREVIEW / IMPRESSÃO) */}
      <AnimatePresence>
        {cardModalAssociate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl my-8"
            >
              <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Carteira Digital Oficial (AIAPE)</h3>
                    <p className="text-[11px] text-slate-400">{cardModalAssociate.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setCardModalAssociate(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <AssociateCard
                  associate={cardModalAssociate}
                  associationConfig={associationConfig}
                  onUpdateAssociate={(updated) => {
                    onUpdateAssociate(updated);
                    setCardModalAssociate(updated);
                  }}
                  isEditable={true}
                />
              </div>

              <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                <p className="text-[11px] text-slate-400">
                  O QR Code é lido por qualquer câmera e valida os dados e a credencial do associado.
                </p>
                <button
                  onClick={() => setCardModalAssociate(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ISENÇÃO DE TAXA / MENSALIDADE PELA DIRETORIA (PREMIAÇÃO / AJUDA SOCIAL) */}
      <AnimatePresence>
        {exemptionModalAssociate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-purple-500/40 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl my-8"
            >
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-purple-950/70 via-slate-900 to-slate-900 border-b border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">Isenção de Mensalidade da Diretoria</h3>
                    <p className="text-xs text-purple-300/80">Concessão de Prêmio, Ajuda Social ou Isenção Temporária</p>
                  </div>
                </div>
                <button
                  onClick={() => setExemptionModalAssociate(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Associate Details bar */}
              <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-white text-sm">{exemptionModalAssociate.name}</h4>
                  <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-0.5">
                    {exemptionModalAssociate.document && <span>CPF: <strong>{exemptionModalAssociate.document}</strong></span>}
                    {exemptionModalAssociate.phone && <span>Tel: <strong>{exemptionModalAssociate.phone}</strong></span>}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Mensalidade Padrão</span>
                  <span className="font-bold text-white">{formatCurrency(exemptionModalAssociate.monthlyFee || 70)}/mês</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveExemption} className="p-6 space-y-5">
                {exemptionSuccessToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs flex items-center gap-2 font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{exemptionSuccessToast}</span>
                  </motion.div>
                )}

                {/* Toggle: Isenção Ativa */}
                <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      Status da Isenção no Sistema
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {isExemptActive 
                        ? 'O associado não será cobrado e manterá todos os benefícios ativos' 
                        : 'Isenção inativa (o associado paga a mensalidade normalmente)'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isExemptActive}
                      onChange={(e) => setIsExemptActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {isExemptActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >
                    {/* Exemption Type Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        Tipo / Finalidade da Isenção:
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setExemptionType('premiacao');
                            setExemptionReason('Premiação de Destaque / Reconhecimento AIAPE');
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            exemptionType === 'premiacao'
                              ? 'bg-purple-950/60 border-purple-500 text-white shadow-md shadow-purple-950/30'
                              : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold text-xs">
                            <Award className="w-4 h-4 text-amber-400" />
                            Premiação / Destaque
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">Reconhecimento por engajamento ou mérito</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setExemptionType('ajuda_social');
                            setExemptionReason('Ajuda Social / Apoio Emergencial da AIAPE');
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            exemptionType === 'ajuda_social'
                              ? 'bg-purple-950/60 border-purple-500 text-white shadow-md shadow-purple-950/30'
                              : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold text-xs">
                            <Heart className="w-4 h-4 text-rose-400" />
                            Ajuda Social / Apoio
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">Auxílio solidário em momento de dificuldade</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setExemptionType('temporaria');
                            setExemptionReason('Isenção Temporária Concedida pela Diretoria');
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            exemptionType === 'temporaria'
                              ? 'bg-purple-950/60 border-purple-500 text-white shadow-md shadow-purple-950/30'
                              : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold text-xs">
                            <Clock className="w-4 h-4 text-blue-400" />
                            Temporária (Meses)
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">Período específico definido em reunião</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setExemptionType('diretoria');
                            setExemptionReason('Membro da Diretoria Executiva AIAPE');
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            exemptionType === 'diretoria'
                              ? 'bg-purple-950/60 border-purple-500 text-white shadow-md shadow-purple-950/30'
                              : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold text-xs">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Diretoria / Permanente
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">Membro honorário ou diretoria executiva</p>
                        </button>
                      </div>
                    </div>

                    {/* Duração em Meses (Se não for permanente) */}
                    {exemptionType !== 'permanente' && exemptionType !== 'diretoria' && (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-purple-400" />
                            Duração da Isenção:
                          </label>
                          <span className="px-2.5 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-extrabold rounded-lg">
                            {exemptionMonths} {exemptionMonths === 1 ? 'mês' : 'meses'} grátis
                          </span>
                        </div>

                        {/* Quick Month Selector Buttons */}
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 6, 12].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setExemptionMonths(num)}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                exemptionMonths === num
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                              }`}
                            >
                              {num} {num === 1 ? 'mês' : 'meses'}
                            </button>
                          ))}
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                          <span>Início: <strong>Hoje ({new Date().toLocaleDateString('pt-BR')})</strong></span>
                          <span>Economia gerada: <strong className="text-emerald-400">{formatCurrency((exemptionModalAssociate.monthlyFee || 70) * exemptionMonths)}</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Motivo detalhado */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Motivo / Justificativa Oficial da Isenção *
                      </label>
                      <input
                        type="text"
                        required
                        value={exemptionReason}
                        onChange={(e) => setExemptionReason(e.target.value)}
                        placeholder="Ex: Premiação de Destaque / Concessão pela Diretoria Executiva"
                        className="w-full bg-slate-950 border border-slate-700 text-xs text-white px-3 py-2.5 rounded-xl focus:outline-hidden focus:border-purple-500"
                      />
                    </div>

                    {/* Observações internas */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Observações Internas da Diretoria (Opcional)
                      </label>
                      <textarea
                        rows={2}
                        value={exemptionNotes}
                        onChange={(e) => setExemptionNotes(e.target.value)}
                        placeholder="Ex: Aprovado em reunião de diretoria realizada em 15/08..."
                        className="w-full bg-slate-950 border border-slate-700 text-xs text-white px-3 py-2 rounded-xl focus:outline-hidden focus:border-purple-500"
                      />
                    </div>
                  </motion.div>
                )}

                {/* WhatsApp Notification Button */}
                {isExemptActive && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleSendExemptionWhatsApp(exemptionModalAssociate)}
                      className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-500 text-emerald-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      Enviar Notificação de Isenção via WhatsApp
                    </button>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Deseja realmente cancelar / revogar a isenção deste associado?')) {
                        const updated = { ...exemptionModalAssociate, isExempt: false, exemptionInfo: undefined };
                        onUpdateAssociate(updated);
                        setExemptionModalAssociate(updated);
                        setIsExemptActive(false);
                        setExemptionSuccessToast('Isenção revogada com sucesso!');
                      }
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                  >
                    Revogar isenção
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExemptionModalAssociate(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Fechar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Salvar Isenção
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {/* Import Excel / Forms Modal */}
        {isImportModalOpen && (
          <AssociateImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            existingAssociates={associates}
            onBatchImport={handleBatchImport}
            associationConfig={associationConfig}
          />
        )}

        {/* Modal Central de Mensagens WhatsApp AIAPE */}
        {whatsAppModalAssociate && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative max-h-[92vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      WhatsApp Oficial AIAPE
                    </h3>
                    <p className="text-xs text-slate-400">
                      Disparo de mensagens, carteirinha, cobrança PIX e recibos
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWhatsAppModalAssociate(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Informações do Destinatário */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Destinatário / Associado
                    </span>
                    <h4 className="text-sm font-black text-white">{whatsAppModalAssociate.name}</h4>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full">
                    {whatsAppModalAssociate.category}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      Telefone / WhatsApp Destino
                    </label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        value={whatsAppPhone}
                        onChange={(e) => setWhatsAppPhone(e.target.value)}
                        placeholder="(81) 98765-4321"
                        className="bg-slate-900 border border-slate-700 text-xs font-mono text-emerald-400 px-2.5 py-1.5 rounded-lg w-full focus:outline-hidden focus:border-emerald-500 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      CPF / Documento
                    </span>
                    <span className="text-xs font-mono text-slate-300 bg-slate-900 px-2.5 py-1.5 rounded-lg block border border-slate-800">
                      {whatsAppModalAssociate.document || 'Não informado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seletor de Modelos de Mensagens */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                  <span>Escolha o Modelo de Mensagem:</span>
                  <span className="text-[10px] text-slate-400 font-normal">Pronto para 1-clique</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSwitchWhatsAppTemplate('welcome')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer border ${
                      whatsAppTemplate === 'welcome'
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-xs'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <span>🎉</span>
                    <span className="truncate">Boas-Vindas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchWhatsAppTemplate('general')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer border ${
                      whatsAppTemplate === 'general'
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-xs'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <span>💬</span>
                    <span className="truncate">Geral / Contato</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchWhatsAppTemplate('card')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer border ${
                      whatsAppTemplate === 'card'
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-xs'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <span>🪪</span>
                    <span className="truncate">Carteira Digital</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchWhatsAppTemplate('payment_reminder')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer border ${
                      whatsAppTemplate === 'payment_reminder'
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-xs'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <span>💳</span>
                    <span className="truncate">Cobrança PIX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchWhatsAppTemplate('password')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer border ${
                      whatsAppTemplate === 'password'
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-xs'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <span>🔑</span>
                    <span className="truncate">Login / Senha</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchWhatsAppTemplate('receipt')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer border ${
                      whatsAppTemplate === 'receipt'
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-xs'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <span>🧾</span>
                    <span className="truncate">Recibo Quitado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchWhatsAppTemplate('exemption')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer border ${
                      whatsAppTemplate === 'exemption'
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-xs'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <span>🎁</span>
                    <span className="truncate">Isenção Taxa</span>
                  </button>
                </div>
              </div>

              {/* Caixa de Texto Editável */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">
                    Mensagem a Enviar (Personalizável):
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {whatsAppCustomText.length} caracteres
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={whatsAppCustomText}
                  onChange={(e) => setWhatsAppCustomText(e.target.value)}
                  placeholder="Digite a mensagem personalizada..."
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-100 p-3 rounded-xl focus:outline-hidden focus:border-emerald-500 font-sans leading-relaxed resize-y"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Dica: Você pode usar *texto em negrito*, _itálico_ ou `código` no WhatsApp.
                </p>
              </div>

              {/* Rodapé e Ações */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyWhatsAppMessage(whatsAppCustomText)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {whatsAppCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-blue-400" />
                      <span>Copiar Texto</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWhatsAppModalAssociate(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppDirect(whatsAppPhone, whatsAppCustomText)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar no WhatsApp</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
